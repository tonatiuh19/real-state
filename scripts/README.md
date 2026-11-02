# Scripts

## Production deploy (`npm run deploy:prod`)

Same gate pattern as optimum-credit, plus mortgage-domain smokes:

1. **`check:api-inline`** — refuse relative runtime imports from `api/index.ts` (Vercel `ERR_MODULE_NOT_FOUND`)
2. **`validate:all`** — typecheck, unit tests, Application Received preflight, loan/realtor/pipeline/CRM/docs/billing/broadcast/comms smokes, build
3. Prompt / CLI version → `npx vercel --prod`
4. Short-lived TiDB write of tenant-scoped `app_version` (connection not held across Vercel)

```bash
npm run deploy:prod
# or non-interactive:
npm run deploy:prod -- 1.2.3
# emergency only:
npm run deploy:prod -- --skip-checks 1.2.3
# or SKIP_DEPLOY_CHECKS=1
```

## Validation

| Script | Purpose |
|--------|---------|
| `npm run check:api-inline` | Vercel monolith import gate |
| `npm run test:integration` | Live HTTP via createServer + supertest (TiDB) |
| `npm run test:cleanup-fixtures` | Purge leftover @example.test fixtures |
| `npm run validate:broadcast-short-links` | Short-link helpers + api/vercel drift gate |
| `npm run validate:all` | Full pre-deploy suite (also run by deploy) |
| `npm run validate:per-owner-crm-all` | CRM phases + deep + audit + unit |
| `npm run validate:crm-docs-edge` | Cross-owner email/realtor + doc slots for all MBs |
| `npm run validate:task-documents` | Upload/submit guards incl. bank Month 1+2 |

CI (`.github/workflows/ci.yml`) runs api-inline + typecheck + unit specs (no live TiDB).

---

# Sync from partner repo

Pull **new** shared product files from the other client repo (Encore Mortgage / real-state) without overwriting anything in this repo.

- **Only copies files that don’t exist here** – existing files (e.g. TaskWizard, your pages) are never changed.
- New features in the partner repo (e.g. Conversations page, new migrations) are added as new files.

**Run from repo root:**

```bash
./scripts/sync-from-partner.sh
```

**Preview (no writes):**

```bash
DRY_RUN=1 ./scripts/sync-from-partner.sh
```

Config: `scripts/sync-config.env` (partner URL, branch, and this repo’s tenant ID). Client-identity files (Index, Header, Footer, global.css, .env, logos) are never copied.

## Teams Policy Sync (Daily Automation)

Use this to automatically grant the Teams application access policy to active users who have Teams enabled in Scheduler settings.

Script:

```bash
./scripts/teams-policy-sync.sh
```

What it does:

- Reads active users with `allow_teams = 1` from DB.
- Ensures policy `GraphOnlineMeetingsPolicy` exists (or `TEAMS_APP_POLICY_NAME` if set).
- Grants that policy to each user email through Microsoft Teams PowerShell.

Requirements:

- `pwsh` installed on the host.
- PowerShell module `MicrosoftTeams` installed.
- DB and Office 365 env vars available in root `.env`.

### cPanel Cron (every 24h)

Example cron command:

```bash
cd /home/USERNAME/path-to-project && /bin/bash ./scripts/teams-policy-sync.sh >> /home/USERNAME/teams-policy-sync.log 2>&1
```

Cron schedule (daily at 2:10 AM):

```cron
10 2 * * *
```

### URL Cron (same pattern as reminder flows)

If you prefer cron-to-endpoint (instead of shell on the host), use:

```bash
curl -s "https://yourdomain.com/api/cron/sync-teams-policy?secret=CRON_SECRET"
```

This endpoint triggers the same `scripts/teams-policy-sync.sh` logic server-side.

## Application Received flow backfill

When Flow #3 was inactive, loans in `application_received` may have no welcome execution.

```bash
# Audit gap loans (dry run)
npx tsx scripts/backfill-application-received-flows.ts

# Status nudge backfill (sends real welcome SMS/email via cron)
npx tsx scripts/backfill-application-received-flows.ts --execute

# Edge-case smoke tests (synthetic data, rolled back)
npm run validate:application-received-automation

# Production preflight (read-only — fails if Flow #3 inactive or misconfigured)
npm run preflight:application-received

# Task document upload + submission guard, ownership, reopen migration (synthetic, rolled back)
npm run validate:task-documents

# Per-owner CRM Phase 0 foundation (tables, columns, flags OFF — synthetic, rolled back)
npm run validate:per-owner-crm-phase0

# Per-owner CRM Phase 1 per-owner phone UNIQUE (synthetic, rolled back)
npm run validate:per-owner-crm-phase1
```

