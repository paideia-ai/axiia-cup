#!/usr/bin/env bash
set -euo pipefail

note() {
  printf '[tunnel] %s\n' "$*"
}

die() {
  printf '[tunnel] error: %s\n' "$*" >&2
  exit 1
}

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || die "Missing required command: $1"
}

resolve_bind_host() {
  if [[ -n "${AXIIA_US_GATEWAY_BIND_HOST:-}" ]]; then
    printf '%s\n' "${AXIIA_US_GATEWAY_BIND_HOST}"
    return
  fi

  if command -v docker >/dev/null 2>&1; then
    local docker_bridge_ip
    docker_bridge_ip="$(
      docker network inspect bridge \
      --format '{{(index .IPAM.Config 0).Gateway}}' 2>/dev/null |
      awk 'NF && $1 != "<no" { print $1; exit }'
    )"

    if [[ -n "${docker_bridge_ip}" ]]; then
      printf '%s\n' "${docker_bridge_ip}"
      return
    fi
  fi

  if command -v ip >/dev/null 2>&1; then
    ip -4 addr show docker0 2>/dev/null |
      awk '/inet / { sub(/\/.*/, "", $2); print $2; exit }'
  fi
}

require_cmd ssh

AXIIA_US_GATEWAY_HOST="${AXIIA_US_GATEWAY_HOST:-}"
AXIIA_US_GATEWAY_LOCAL_PORT="${AXIIA_US_GATEWAY_LOCAL_PORT:-33100}"
AXIIA_US_GATEWAY_REMOTE_HOST="${AXIIA_US_GATEWAY_REMOTE_HOST:-127.0.0.1}"
AXIIA_US_GATEWAY_REMOTE_PORT="${AXIIA_US_GATEWAY_REMOTE_PORT:-3100}"
AXIIA_US_GATEWAY_SSH_PORT="${AXIIA_US_GATEWAY_SSH_PORT:-22}"

[[ -n "${AXIIA_US_GATEWAY_HOST}" ]] ||
  die "AXIIA_US_GATEWAY_HOST must be set (for example anna@reliablesite.tuna-miaplacidus.ts.net)"
[[ "${AXIIA_US_GATEWAY_LOCAL_PORT}" =~ ^[0-9]+$ ]] ||
  die "AXIIA_US_GATEWAY_LOCAL_PORT must be numeric"
[[ "${AXIIA_US_GATEWAY_REMOTE_PORT}" =~ ^[0-9]+$ ]] ||
  die "AXIIA_US_GATEWAY_REMOTE_PORT must be numeric"
[[ "${AXIIA_US_GATEWAY_SSH_PORT}" =~ ^[0-9]+$ ]] ||
  die "AXIIA_US_GATEWAY_SSH_PORT must be numeric"

AXIIA_US_GATEWAY_BIND_HOST="$(resolve_bind_host)"
[[ -n "${AXIIA_US_GATEWAY_BIND_HOST}" ]] ||
  die "Failed to determine Docker host gateway IP. Set AXIIA_US_GATEWAY_BIND_HOST explicitly."

note "Binding tunnel on ${AXIIA_US_GATEWAY_BIND_HOST}:${AXIIA_US_GATEWAY_LOCAL_PORT}"
note "Forwarding to ${AXIIA_US_GATEWAY_REMOTE_HOST}:${AXIIA_US_GATEWAY_REMOTE_PORT} via ${AXIIA_US_GATEWAY_HOST}"

exec ssh -NT \
  -o BatchMode=yes \
  -o ExitOnForwardFailure=yes \
  -o ServerAliveInterval=30 \
  -o ServerAliveCountMax=3 \
  -o TCPKeepAlive=yes \
  -p "${AXIIA_US_GATEWAY_SSH_PORT}" \
  -L "${AXIIA_US_GATEWAY_BIND_HOST}:${AXIIA_US_GATEWAY_LOCAL_PORT}:${AXIIA_US_GATEWAY_REMOTE_HOST}:${AXIIA_US_GATEWAY_REMOTE_PORT}" \
  "${AXIIA_US_GATEWAY_HOST}"
