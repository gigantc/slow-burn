#!/usr/bin/env bash
#////////////////////////////////////
# Deploy Slow Burn: typecheck, build, rsync, install, restart, health check.
# Config comes from the environment or a gitignored deploy/.deploy.env
# (copy deploy/.deploy.env.example). Never copies .env, data/, node_modules or src.
set -euo pipefail

cd "$(dirname "$0")/.."

if [[ -f deploy/.deploy.env ]]; then
  # shellcheck disable=SC1091
  source deploy/.deploy.env
fi

DEPLOY_HOST="${DEPLOY_HOST:-root@slowburn.gigantc.com}"
DEPLOY_PATH="${DEPLOY_PATH:-/opt/slow-burn}"
SERVICE="slow-burn"
HEALTH_URL="${HEALTH_URL:-http://127.0.0.1:3100/api/health}"

echo "==> Deploying to ${DEPLOY_HOST}:${DEPLOY_PATH}"

[[ -d node_modules ]] || npm ci

echo "==> Typecheck"
npm run typecheck

echo "==> Build"
npm run build

echo "==> Sync"
rsync -az --delete \
  dist/ "${DEPLOY_HOST}:${DEPLOY_PATH}/dist/"
rsync -az --delete \
  drizzle/ "${DEPLOY_HOST}:${DEPLOY_PATH}/drizzle/"
rsync -az \
  package.json package-lock.json .nvmrc "${DEPLOY_HOST}:${DEPLOY_PATH}/"

echo "==> Install and restart"
ssh "${DEPLOY_HOST}" "cd '${DEPLOY_PATH}' && npm ci --omit=dev && systemctl restart ${SERVICE}"

echo "==> Health check"
for attempt in 1 2 3 4 5; do
  if ssh "${DEPLOY_HOST}" "curl -fsS '${HEALTH_URL}'"; then
    echo
    echo "==> Deployed"
    exit 0
  fi
  sleep 2
done

echo "Health check failed. Run: ssh ${DEPLOY_HOST} journalctl -u ${SERVICE} -n 50" >&2
exit 1
