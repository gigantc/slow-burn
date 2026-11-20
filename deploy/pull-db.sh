#!/usr/bin/env bash
#////////////////////////////////////
# Pull production data down to local: the SQLite DB and the photos, replacing data/.
# Read-only on the server apart from a temp snapshot it removes. The local DB and any local
# photos that would be replaced or deleted are kept in data/backups/ first.
# Config comes from the environment or a gitignored deploy/.deploy.env (same as deploy.sh).
set -euo pipefail

cd "$(dirname "$0")/.."

if [[ -f deploy/.deploy.env ]]; then
  # shellcheck disable=SC1091
  source deploy/.deploy.env
fi

DEPLOY_HOST="${DEPLOY_HOST:-root@slowburn.gigantc.com}"
DEPLOY_PATH="${DEPLOY_PATH:-/opt/slow-burn}"
LOCAL_DB="data/slowburn.db"
LOCAL_PHOTOS="data/photos"
REMOTE_SNAPSHOT="/tmp/slowburn-pull.db"
STAMP="$(date +%Y%m%d-%H%M%S)"
BACKUP_DIR="data/backups/${STAMP}"

#////////////////////////////////////
# Preflight

# The dev server holds the DB open (WAL), so swapping the file under it would corrupt the copy
if lsof -iTCP:3100 -sTCP:LISTEN >/dev/null 2>&1; then
  echo "The dev server is running (port 3100). Stop npm run dev first." >&2
  exit 1
fi

command -v sqlite3 >/dev/null || { echo "Needs sqlite3 locally." >&2; exit 1; }

echo "==> Pulling ${DEPLOY_HOST}:${DEPLOY_PATH}/data into ./data"

#////////////////////////////////////
# Database

# SQLite's online backup gives a consistent snapshot while the app keeps running
echo "==> Snapshot on the server"
ssh "${DEPLOY_HOST}" \
  "sqlite3 '${DEPLOY_PATH}/data/slowburn.db' \".backup ${REMOTE_SNAPSHOT}\""

echo "==> Download"
mkdir -p data "${BACKUP_DIR}"
scp -q "${DEPLOY_HOST}:${REMOTE_SNAPSHOT}" "${LOCAL_DB}.pulled"
ssh "${DEPLOY_HOST}" "rm -f '${REMOTE_SNAPSHOT}'"

if [[ -f "${LOCAL_DB}" ]]; then
  echo "==> Back up the local DB to ${BACKUP_DIR}"
  sqlite3 "${LOCAL_DB}" ".backup ${BACKUP_DIR}/slowburn.db"
fi

rm -f "${LOCAL_DB}" "${LOCAL_DB}-wal" "${LOCAL_DB}-shm"
mv "${LOCAL_DB}.pulled" "${LOCAL_DB}"

#////////////////////////////////////
# Photos

# Mirror production; anything local that gets replaced or deleted lands in the backup folder
echo "==> Photos"
mkdir -p "${LOCAL_PHOTOS}"
rsync -az --delete --backup --backup-dir="$(pwd)/${BACKUP_DIR}/photos" \
  "${DEPLOY_HOST}:${DEPLOY_PATH}/data/photos/" "${LOCAL_PHOTOS}/"

echo
echo "==> Pulled. Local backup: ${BACKUP_DIR}"
echo "    Before npm run dev: clear localhost:5173's site data in the browser, or its cached"
echo "    entries and unsynced outbox will sync old dev edits over the pulled data."
