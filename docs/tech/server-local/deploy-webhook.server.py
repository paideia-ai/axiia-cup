#!/usr/bin/env python3
"""
Server-local deploy webhook snapshot for Axiia Cup split CD.

This file is a manual backup/reference copy of the live server-local webhook.
It is not automatically deployed by GitHub Actions.
"""

from __future__ import annotations

import json
import os
import secrets
import subprocess
import threading
import time
from dataclasses import dataclass
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse

import jwt

LISTEN_HOST = "127.0.0.1"
LISTEN_PORT = 9900

REGISTRY = "second-acr-registry.cn-hangzhou.cr.aliyuncs.com"
ACR_INSTANCE_ID = "cri-qvdxmkdj3dh8s2oe"
DEPLOYMENT_TTL_SECONDS = 3600

WEBHOOK_SECRET_FILE = os.environ.get(
    "WEBHOOK_SECRET_FILE",
    "/srv/axiia-cup/shared/config/deploy-webhook.env",
)
SYNC_DEV_DB_SCRIPT = "/srv/axiia-cup/current/deploy/sync-prod-db-to-dev.sh"
COMPOSE_FILE = "/srv/axiia-cup/current/deploy/docker-compose.acr.yml"


@dataclass(frozen=True)
class TargetConfig:
    env_file: str
    refresh_dev_db: bool = False


TARGETS = {
    "prod": TargetConfig(
        env_file="/srv/axiia-cup/shared/config/production.env",
        refresh_dev_db=False,
    ),
    "dev": TargetConfig(
        env_file="/srv/axiia-cup/shared/config/development.env",
        refresh_dev_db=True,
    ),
}

SECRET: str | None = None
DEPLOYMENTS: dict[str, dict[str, object | None]] = {}
ACTIVE_DEPLOYMENTS_BY_TARGET: dict[str, str] = {}
DEPLOYMENTS_LOCK = threading.Lock()


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def load_secret() -> str:
    path = Path(WEBHOOK_SECRET_FILE)
    for raw_line in path.read_text().splitlines():
        line = raw_line.strip()
        if line.startswith("WEBHOOK_SECRET="):
            return line.split("=", 1)[1]
    raise RuntimeError(f"WEBHOOK_SECRET not found in {path}")


def verify_jwt(token: str) -> dict:
    global SECRET
    if SECRET is None:
        SECRET = load_secret()
    return jwt.decode(token, SECRET, algorithms=["HS256"])


def load_env_file(path: str) -> dict[str, str]:
    env: dict[str, str] = {}
    for raw_line in Path(path).read_text().splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        env[key] = value
    return env


def acr_login() -> None:
    result = subprocess.run(
        ["aliyun", "cr", "GetAuthorizationToken", "--InstanceId", ACR_INSTANCE_ID],
        capture_output=True,
        text=True,
        check=True,
    )
    auth = json.loads(result.stdout)
    username = auth["TempUsername"]
    password = auth["AuthorizationToken"]
    subprocess.run(
        ["docker", "login", "--username", username, "--password-stdin", REGISTRY],
        input=password,
        text=True,
        check=True,
    )


def pull_images(tag: str) -> None:
    images = [
        f"{REGISTRY}/apps/axiia-cup-api:{tag}",
        f"{REGISTRY}/apps/axiia-cup-web:{tag}",
    ]
    for image in images:
        print(f"Pulling {image}")
        subprocess.run(["docker", "pull", image], check=True)


def compose_command(env_file: str, project_name: str | None) -> list[str]:
    command = ["docker", "compose"]
    if project_name:
        command.extend(["-p", project_name])
    command.extend(["-f", COMPOSE_FILE, "--env-file", env_file])
    return command


def wait_for_http_health(port: str, attempts: int = 30, delay: int = 2) -> None:
    url = f"http://127.0.0.1:{port}/health"
    for _ in range(attempts):
        result = subprocess.run(
            ["curl", "-fsS", url],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        if result.returncode == 0:
            return
        time.sleep(delay)
    raise RuntimeError(f"Timed out waiting for {url}")


def sync_prod_db_to_dev(prod_env_file: str, dev_env_file: str) -> None:
    subprocess.run(
        [
            SYNC_DEV_DB_SCRIPT,
            "--prod-env",
            prod_env_file,
            "--dev-env",
            dev_env_file,
        ],
        check=True,
    )


def deploy_target(target: str, tag: str) -> None:
    if target not in TARGETS:
        raise RuntimeError(f"Unsupported deploy target: {target}")

    target_config = TARGETS[target]
    runtime_env = load_env_file(target_config.env_file)
    process_env = os.environ.copy()
    process_env.update(runtime_env)
    process_env["API_IMAGE"] = f"{REGISTRY}/apps/axiia-cup-api:{tag}"
    process_env["WEB_IMAGE"] = f"{REGISTRY}/apps/axiia-cup-web:{tag}"

    project_name = runtime_env.get("COMPOSE_PROJECT_NAME") or None
    compose = compose_command(target_config.env_file, project_name)

    if target_config.refresh_dev_db:
        print("Stopping dev stack before DB refresh")
        subprocess.run(compose + ["down"], env=process_env, check=True)
        print("Refreshing dev DB from production snapshot")
        sync_prod_db_to_dev(TARGETS["prod"].env_file, target_config.env_file)

    print(f"Starting {target} stack with tag {tag}")
    subprocess.run(compose + ["up", "-d", "--remove-orphans"], env=process_env, check=True)
    wait_for_http_health(runtime_env.get("WEB_HOST_PORT", "8200"))


def deployment_public_view(record: dict[str, object | None]) -> dict[str, object | None]:
    return {
        key: value
        for key, value in record.items()
        if not key.startswith("_")
    }


def prune_old_deployments_locked() -> None:
    cutoff = time.time() - DEPLOYMENT_TTL_SECONDS
    for deployment_id, record in list(DEPLOYMENTS.items()):
        updated_at = float(record.get("_updatedAtEpoch", 0) or 0)
        status = record.get("status")
        if updated_at < cutoff and status in {"success", "failed"}:
            DEPLOYMENTS.pop(deployment_id, None)


def active_deployment_for_target_locked(target: str) -> dict[str, object | None] | None:
    deployment_id = ACTIVE_DEPLOYMENTS_BY_TARGET.get(target)
    if not deployment_id:
        return None
    record = DEPLOYMENTS.get(deployment_id)
    if record is None or record.get("status") not in {"accepted", "running"}:
        ACTIVE_DEPLOYMENTS_BY_TARGET.pop(target, None)
        return None
    return record


def update_deployment(
    deployment_id: str,
    *,
    status: str,
    error: str | None = None,
    mark_started: bool = False,
    mark_finished: bool = False,
) -> None:
    with DEPLOYMENTS_LOCK:
        record = DEPLOYMENTS[deployment_id]
        record["status"] = status
        if mark_started and record.get("startedAt") is None:
            record["startedAt"] = now_iso()
        if mark_finished:
            record["finishedAt"] = now_iso()
        if error is not None:
            record["error"] = error
        record["_updatedAtEpoch"] = time.time()


def run_deployment(deployment_id: str) -> None:
    with DEPLOYMENTS_LOCK:
        record = DEPLOYMENTS[deployment_id]
        target = str(record["target"])
        tag = str(record["tag"])

    update_deployment(deployment_id, status="running", mark_started=True)
    print(f"Deploy started deployment_id={deployment_id} target={target} tag={tag}")

    try:
        acr_login()
        pull_images(tag)
        deploy_target(target, tag)
    except subprocess.CalledProcessError as error:
        message = f"deploy failed: {error}"
        print(f"Deploy failed deployment_id={deployment_id}: {message}")
        update_deployment(
            deployment_id,
            status="failed",
            error=message,
            mark_finished=True,
        )
    except Exception as error:  # noqa: BLE001
        message = str(error)
        print(f"Deploy error deployment_id={deployment_id}: {message}")
        update_deployment(
            deployment_id,
            status="failed",
            error=message,
            mark_finished=True,
        )
    else:
        print(f"Deploy succeeded deployment_id={deployment_id} target={target} tag={tag}")
        update_deployment(deployment_id, status="success", mark_finished=True)
    finally:
        with DEPLOYMENTS_LOCK:
            if ACTIVE_DEPLOYMENTS_BY_TARGET.get(target) == deployment_id:
                ACTIVE_DEPLOYMENTS_BY_TARGET.pop(target, None)
            prune_old_deployments_locked()


class DeployHandler(BaseHTTPRequestHandler):
    def log_message(self, format: str, *args):
        print(f"[{self.log_date_time_string()}] {format % args}")

    def send_json(self, status: int, data: dict):
        body = json.dumps(data).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def require_auth(self) -> dict | None:
        auth = self.headers.get("Authorization", "")
        if not auth.startswith("Bearer "):
            self.send_json(401, {"error": "missing bearer token"})
            return None

        try:
            return verify_jwt(auth[7:])
        except jwt.ExpiredSignatureError:
            self.send_json(401, {"error": "token expired"})
        except jwt.InvalidTokenError as error:
            self.send_json(401, {"error": f"invalid token: {error}"})
        return None

    def do_GET(self):
        parsed = urlparse(self.path)

        if parsed.path == "/health":
            self.send_json(200, {"status": "ok"})
            return

        if parsed.path != "/_deploy/status":
            self.send_json(404, {"error": "not found"})
            return

        if self.require_auth() is None:
            return

        deployment_id = parse_qs(parsed.query).get("id", [""])[0].strip()
        if not deployment_id:
            self.send_json(400, {"error": "missing deployment id"})
            return

        with DEPLOYMENTS_LOCK:
            prune_old_deployments_locked()
            record = DEPLOYMENTS.get(deployment_id)
            if record is None:
                self.send_json(404, {"error": "deployment not found", "deploymentId": deployment_id})
                return
            body = deployment_public_view(record)

        self.send_json(200, body)

    def do_POST(self):
        parsed = urlparse(self.path)
        if parsed.path != "/_deploy":
            self.send_json(404, {"error": "not found"})
            return

        payload = self.require_auth()
        if payload is None:
            return

        tag = payload.get("tag")
        target = payload.get("target", "prod")

        if not tag:
            self.send_json(400, {"error": "missing tag in token"})
            return
        if not isinstance(tag, str) or not tag.isalnum() or len(tag) < 7:
            self.send_json(400, {"error": "invalid tag format"})
            return
        if target not in TARGETS:
            self.send_json(400, {"error": f"invalid target: {target}"})
            return

        with DEPLOYMENTS_LOCK:
            prune_old_deployments_locked()
            active_record = active_deployment_for_target_locked(target)
            if active_record is not None:
                self.send_json(
                    409,
                    {
                        "error": f"deploy already running for target {target}",
                        "deploymentId": active_record["deploymentId"],
                        "status": active_record["status"],
                        "target": active_record["target"],
                        "tag": active_record["tag"],
                    },
                )
                return

            deployment_id = secrets.token_urlsafe(12)
            record: dict[str, object | None] = {
                "deploymentId": deployment_id,
                "status": "accepted",
                "target": target,
                "tag": tag,
                "error": None,
                "createdAt": now_iso(),
                "startedAt": None,
                "finishedAt": None,
                "_updatedAtEpoch": time.time(),
            }
            DEPLOYMENTS[deployment_id] = record
            ACTIVE_DEPLOYMENTS_BY_TARGET[target] = deployment_id
            body = deployment_public_view(record)

        print(f"Deploy accepted deployment_id={deployment_id} target={target} tag={tag}")
        thread = threading.Thread(
            target=run_deployment,
            args=(deployment_id,),
            daemon=True,
            name=f"deploy-{target}-{deployment_id}",
        )
        thread.start()
        self.send_json(202, body)


def main() -> None:
    print(f"Starting deploy webhook on {LISTEN_HOST}:{LISTEN_PORT}")
    server = ThreadingHTTPServer((LISTEN_HOST, LISTEN_PORT), DeployHandler)
    server.serve_forever()


if __name__ == "__main__":
    main()
