#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage:
  deploy/bootstrap-ubuntu-host.sh [app-root]

Prepares a fresh Ubuntu host for Axiia Cup by:
1. installing Docker Engine, Docker Compose v2, and nginx
2. enabling docker and nginx services
3. adding the current user to the docker group
4. creating the standard /srv/axiia-cup directory layout

Defaults:
  app-root: /srv/axiia-cup

This script is intended to run on the remote Ubuntu server before
bootstrap-server.sh. It does not copy the repo or upload production.env.
EOF
}

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  usage
  exit 0
fi

APP_ROOT="${1:-/srv/axiia-cup}"

if ! command -v apt-get >/dev/null 2>&1; then
  printf '[bootstrap-host] error: this script currently supports Ubuntu/Debian hosts with apt-get\n' >&2
  exit 1
fi

if ! command -v sudo >/dev/null 2>&1; then
  printf '[bootstrap-host] error: sudo is required\n' >&2
  exit 1
fi

export DEBIAN_FRONTEND=noninteractive

printf '[bootstrap-host] installing packages\n'
sudo apt-get update
sudo apt-get install -y docker.io docker-compose-v2 nginx

printf '[bootstrap-host] enabling services\n'
sudo systemctl enable --now docker nginx

printf '[bootstrap-host] adding %s to docker group\n' "${USER}"
sudo usermod -aG docker "${USER}"

printf '[bootstrap-host] creating directories under %s\n' "${APP_ROOT}"
sudo mkdir -p \
  "${APP_ROOT}/current" \
  "${APP_ROOT}/shared/config" \
  "${APP_ROOT}/shared/data/api"
sudo chown -R "${USER}:${USER}" "${APP_ROOT}"

cat <<EOF
[bootstrap-host] host bootstrap complete
[bootstrap-host] repo checkout target: ${APP_ROOT}/current
[bootstrap-host] env file target: ${APP_ROOT}/shared/config/production.env
[bootstrap-host] data dir target: ${APP_ROOT}/shared/data/api
[bootstrap-host] note: log out and back in if docker group membership does not apply immediately
EOF
