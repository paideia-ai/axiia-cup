#!/usr/bin/env python3
"""
Server-local deploy webhook snapshot for Axiia Cup split CD.

This file is a manual backup/reference copy of the live server-local webhook.
It is not automatically deployed by GitHub Actions.
"""

from __future__ import annotations

import json
import os
import subprocess
import time
from dataclasses import dataclass
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path

import jwt

LISTEN_HOST = "127.0.0.1"
LISTEN_PORT = 9900

REGISTRY = "second-acr-registry.cn-hangzhou.cr.aliyuncs.com"
ACR_INSTANCE_ID = "cri-qvdxmkdj3dh8s2oe"

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


def load_secret() -> str:
    path = Path(WEBHOOK_SECRET_FILE)
    for raw_line in path.read_text().splitlines():
        line = raw_line.strip()
        if line.startswith("WEBHOOK_SECRET="):
            return line.split("=", 1)[1]
    raise RuntimeError(f"WEBHOOK_SECRET not found in {path}")


SECRET: str | None = None


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

    def do_GET(self):
        if self.path == "/health":
            self.send_json(200, {"status": "ok"})
        else:
            self.send_json(404, {"error": "not found"})

    def do_POST(self):
        if self.path != "/_deploy":
            self.send_json(404, {"error": "not found"})
            return

        auth = self.headers.get("Authorization", "")
        if not auth.startswith("Bearer "):
            self.send_json(401, {"error": "missing bearer token"})
            return

        try:
            payload = verify_jwt(auth[7:])
        except jwt.ExpiredSignatureError:
            self.send_json(401, {"error": "token expired"})
            return
        except jwt.InvalidTokenError as error:
            self.send_json(401, {"error": f"invalid token: {error}"})
            return

        tag = payload.get("tag")
        target = payload.get("target", "prod")

        if not tag:
            self.send_json(400, {"error": "missing tag in token"})
            return
        if not tag.isalnum() or len(tag) < 7:
            self.send_json(400, {"error": "invalid tag format"})
            return
        if target not in TARGETS:
            self.send_json(400, {"error": f"invalid target: {target}"})
            return

        print(f"Deploy requested for target={target} tag={tag}")

        try:
            acr_login()
            pull_images(tag)
            deploy_target(target, tag)
            self.send_json(200, {"status": "deployed", "target": target, "tag": tag})
        except subprocess.CalledProcessError as error:
            print(f"Deploy failed: {error}")
            self.send_json(500, {"error": f"deploy failed: {error}"})
        except Exception as error:  # noqa: BLE001
            print(f"Deploy error: {error}")
            self.send_json(500, {"error": str(error)})


def main() -> None:
    print(f"Starting deploy webhook on {LISTEN_HOST}:{LISTEN_PORT}")
    server = HTTPServer((LISTEN_HOST, LISTEN_PORT), DeployHandler)
    server.serve_forever()


if __name__ == "__main__":
    main()
