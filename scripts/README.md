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
