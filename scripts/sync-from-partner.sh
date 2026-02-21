#!/usr/bin/env bash
#
# Pull shared product changes from the partner repo.
# Only copies files that DON'T exist here (new files only). Never overwrites.
#
# Usage: ./scripts/sync-from-partner.sh
#        DRY_RUN=1 ./scripts/sync-from-partner.sh  # preview only
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
CONFIG_FILE="$SCRIPT_DIR/sync-config.env"
TEMP_CLONE="${TMPDIR:-/tmp}/sync-partner-$$"

# ---------- Load config ----------
if [[ ! -f "$CONFIG_FILE" ]]; then
  echo "Error: $CONFIG_FILE not found. Create it with PARTNER_REPO_URL, PARTNER_BRANCH, MORTGAGE_TENANT_ID."
  exit 1
fi
# shellcheck source=scripts/sync-config.env
source "$CONFIG_FILE"

if [[ -z "${PARTNER_REPO_URL:-}" || -z "${PARTNER_BRANCH:-}" ]]; then
  echo "Error: PARTNER_REPO_URL and PARTNER_BRANCH must be set in $CONFIG_FILE"
  exit 1
fi

# ---------- Exclusions: client identity + logos (never overwrite; we also skip copying these if partner has them and we don't, to avoid pulling their branding) ----------
EXCLUDES=(
  --exclude="client/pages/Index.tsx"
  --exclude="client/components/layout/Header.tsx"
  --exclude="client/components/layout/Footer.tsx"
  --exclude="client/global.css"
  --exclude=".env"
  --exclude=".env.*"
  --exclude=".git/"
  --exclude="node_modules/"
  --exclude="scripts/sync-config.env"
  --exclude=".sync-backups/"
  --exclude=".vercel/"
  --exclude="dist/"
  --exclude="*.log"
  --exclude="*logo*"
  --exclude="*Logo*"
  --exclude="favicon.ico"
  --exclude="**/favicon*"
)

echo "=============================================="
echo "Sync from partner (new files only, no overwrite)"
echo "=============================================="
echo "Partner:    $PARTNER_REPO_URL (branch: $PARTNER_BRANCH)"
echo "This repo:  $REPO_ROOT"
echo "Mode:       Only copy when file does NOT exist here"
echo ""

# ---------- Clone partner repo ----------
echo "Cloning partner repo..."
git clone --depth 1 --branch "$PARTNER_BRANCH" "$PARTNER_REPO_URL" "$TEMP_CLONE"
cleanup() { rm -rf "$TEMP_CLONE"; }
trap cleanup EXIT

# ---------- Copy only files that don't exist in this repo (--ignore-existing) ----------
if [[ -n "${DRY_RUN:-}" ]]; then
  echo "DRY RUN: would copy only missing files from partner"
  rsync -avn --ignore-existing "${EXCLUDES[@]}" "$TEMP_CLONE/" "$REPO_ROOT/"
  echo "Run without DRY_RUN=1 to apply."
  exit 0
fi

rsync -av --ignore-existing "${EXCLUDES[@]}" "$TEMP_CLONE/" "$REPO_ROOT/"

echo ""
echo "Done. Only new/missing files were copied; existing files were not changed."
echo "Review: git status && git diff"
echo ""
