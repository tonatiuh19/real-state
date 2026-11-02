#!/usr/bin/env bash
# Apply Free Analysis migration (credit_analyses + free-analysis section seeds).
# Usage (from repo root):
#   bash scripts/apply-free-analysis-migration.sh
set -euo pipefail
cd "$(dirname "$0")/.."

if [[ ! -f .env ]]; then
  echo "Missing .env in project root" >&2
  exit 1
fi

DB_PASS=$(grep "^DB_PASSWORD" .env | cut -d'=' -f2-)
DB_HOST=$(grep "^DB_HOST" .env | cut -d'=' -f2-)
DB_PORT=$(grep "^DB_PORT" .env | cut -d'=' -f2-)
DB_USER=$(grep "^DB_USER" .env | cut -d'=' -f2-)
DB_NAME=$(grep "^DB_NAME" .env | cut -d'=' -f2-)
MIG=database/migrations/20260924_160000_credit_analyses_and_free_analysis_section.sql

if [[ ! -f "$MIG" ]]; then
  echo "Missing migration: $MIG" >&2
  exit 1
fi

echo "→ Host: $DB_HOST:$DB_PORT  DB: $DB_NAME  User: $DB_USER"
echo "→ Applying $MIG"

mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" \
  --ssl-mode=REQUIRED --protocol=TCP \
  < "$MIG"

echo "→ Verifying…"
mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" \
  --ssl-mode=REQUIRED --protocol=TCP \
  -e "
SHOW TABLES LIKE 'credit_analyses';
DESCRIBE credit_analyses;
SELECT broker_role, is_visible, COUNT(*) AS n
FROM broker_role_section_permissions
WHERE section_id = 'free-analysis'
GROUP BY broker_role, is_visible;
"

echo "✅ Free Analysis migration applied."
