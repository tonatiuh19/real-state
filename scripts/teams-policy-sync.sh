#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if [[ -f ".env" ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

required_vars=(DB_HOST DB_PORT DB_USER DB_PASSWORD DB_NAME OFFICE365_CLIENT_ID)
for var in "${required_vars[@]}"; do
  if [[ -z "${!var:-}" ]]; then
    echo "[teams-policy-sync] Missing required env var: $var"
    exit 1
  fi
done

if ! command -v mysql >/dev/null 2>&1; then
  echo "[teams-policy-sync] mysql client is required but not found."
  exit 1
fi

if ! command -v pwsh >/dev/null 2>&1; then
  echo "[teams-policy-sync] pwsh is required but not found. Install PowerShell + MicrosoftTeams module."
  exit 1
fi

TENANT_ID="${MORTGAGE_TENANT_ID:-1}"
POLICY_NAME="${TEAMS_APP_POLICY_NAME:-GraphOnlineMeetingsPolicy}"
APP_ID="${OFFICE365_CLIENT_ID}"

EMAILS_FILE="$(mktemp)"
trap 'rm -f "$EMAILS_FILE"' EXIT

mysql \
  -h "$DB_HOST" \
  -P "$DB_PORT" \
  -u "$DB_USER" \
  -p"$DB_PASSWORD" \
  "$DB_NAME" \
  --ssl-mode=REQUIRED \
  --protocol=TCP \
  -N -B \
  -e "SELECT DISTINCT LOWER(TRIM(b.email))
      FROM brokers b
      JOIN scheduler_settings ss ON ss.broker_id = b.id AND ss.tenant_id = b.tenant_id
      WHERE b.tenant_id = ${TENANT_ID}
        AND b.status = 'active'
        AND ss.allow_teams = 1
        AND b.email IS NOT NULL
        AND TRIM(b.email) <> ''
      ORDER BY b.id;" > "$EMAILS_FILE"

if [[ ! -s "$EMAILS_FILE" ]]; then
  echo "[teams-policy-sync] No active teams-enabled users found."
  exit 0
fi

echo "[teams-policy-sync] Ensuring Teams policy '$POLICY_NAME' is granted for teams-enabled users..."

export TEAMS_POLICY_NAME="$POLICY_NAME"
export TEAMS_POLICY_APP_ID="$APP_ID"
export TEAMS_EMAILS_FILE="$EMAILS_FILE"

pwsh -NoProfile -Command '
  $ErrorActionPreference = "Stop"
  Import-Module MicrosoftTeams
  Connect-MicrosoftTeams | Out-Null

  $policyName = $env:TEAMS_POLICY_NAME
  $appId = $env:TEAMS_POLICY_APP_ID
  $emailsFile = $env:TEAMS_EMAILS_FILE

  $policy = Get-CsApplicationAccessPolicy -Identity $policyName -ErrorAction SilentlyContinue
  if (-not $policy) {
    New-CsApplicationAccessPolicy -Identity $policyName -AppIds $appId -Description "Auto-managed policy for scheduler Teams meetings" | Out-Null
    Write-Host "[teams-policy-sync] Created policy $policyName"
  }

  $emails = Get-Content -Path $emailsFile | Where-Object { $_ -and $_.Trim().Length -gt 0 }
  foreach ($email in $emails) {
    try {
      Grant-CsApplicationAccessPolicy -PolicyName $policyName -Identity $email -ErrorAction Stop
      Write-Host "[teams-policy-sync] Granted policy for $email"
    }
    catch {
      Write-Host "[teams-policy-sync] Failed for $email :: $($_.Exception.Message)"
    }
  }
'

echo "[teams-policy-sync] Done."
