# Platform Audit — P0–P5 Findings (April 30, 2026)

Comprehensive audit covering security, database, API, frontend, performance, type safety, UX/mobile, and dead code.

> **Status (this PR):** All **P0** items fixed, plus **P1-1** (all 6 components migrated), **P1-3** (JWT revocation), P1-5, P2-6, P3-1, P3-4, P3-8.
> Remaining items are tracked below as backlog.

## Priority legend

- **P0** — Critical / security / data loss. Fix immediately.
- **P1** — High. Broken feature or major bug.
- **P2** — Medium. Degraded UX or perf.
- **P3** — Low. Minor bug or polish.
- **P4** — Nice-to-have / refactor.
- **P5** — Cosmetic / docs.

## Baseline

- TypeScript: `npm run typecheck` passes with **0 errors**.
- LoC: ~105k across `client/`, `api/`, `shared/`.
- API: 204 unique routes registered; `api/index.ts` is **25,632 lines** (single file).
- Swagger: 183 documented routes.
- Migrations: 110+ applied.

---

## P0 — Critical

### P0-1. Insecure default `JWT_SECRET` fallback

- **File:** [api/index.ts](api/index.ts#L32-L38)
- **Issue:** `JWT_SECRET` falls back to the literal string `"default-jwt-secret-CHANGE-THIS-IN-PRODUCTION"` with only a `console.warn`. If the env var is missing in any environment (incl. Vercel preview/production), all client and broker JWTs are forged-able by anyone reading this repo.
- **Fix:** Throw on startup when `JWT_SECRET` is unset (same pattern as DB env validation at [api/index.ts](api/index.ts#L19-L28)). Require minimum length (≥ 32 chars).

### P0-2. OTP code is **not invalidated** after successful verification

- **Files:** [api/index.ts](api/index.ts#L2747-L2820) (broker), [api/index.ts](api/index.ts#L3104-L3190) (client).
- **Issue:** After a successful login, the matching row in `broker_sessions` / `user_sessions` is **never marked `is_active = FALSE`**. The same code remains valid for its entire TTL (10 min). An attacker who shoulder-surfs, intercepts, or phishes a code can still log in even after the legitimate user has used it.
- **Fix:** Inside the success branch, `UPDATE broker_sessions SET is_active = FALSE WHERE id = ?` (and same for `user_sessions`).

### P0-3. No rate limiting anywhere

- **Files:** [api/index.ts](api/index.ts#L21223) (`expressApp.use(cors())`), all login/OTP/contact/apply routes.
- **Issue:** No `express-rate-limit`, `helmet`, or any throttling. Concrete impacts:
  - **OTP brute-force**: 6-digit numeric codes (1M space) are guessable in seconds at unlimited request rate. Combined with P0-2, a single guess that lands grants login.
  - **Email/SMS bombing**: `/api/admin/auth/send-code` and `/api/client/auth/send-code` send a real Resend email and Twilio SMS per call → cost amplification & abuse vector.
  - **Public form spam**: `/api/contact` and `/api/apply` are unauthenticated and persist directly to DB.
- **Fix:** Add `express-rate-limit` per-route (e.g., 5 send-code/15 min/IP+email; 10 verify/15 min/IP+email; 20/min on `/api/contact` and `/api/apply`). Add `helmet()` for security headers.

### P0-4. CORS wide-open (`*`)

- **File:** [api/index.ts](api/index.ts#L21223)
- **Issue:** `expressApp.use(cors());` accepts every origin. Combined with the JWT being kept in `localStorage` (not httpOnly cookies), this is workable today only because the browser doesn't auto-attach Authorization headers; however CSRF-by-bearer is still possible from any origin that gains access to a token via a vulnerable third-party script.
- **Fix:** Allowlist `BASE_URL`, `CLIENT_URL`, and known partner domains. Reject unknown origins.

---

## P1 — High

### P1-1. Direct `axios` calls in components (rule violation)

**Project rule:** _"NEVER fetch data directly in components with axios or fetch. ALL data fetching MUST be done in Redux store."_

Violators:

- [client/components/LoanOverlay.tsx](client/components/LoanOverlay.tsx#L281) — 10 calls (`patch`, `post`, `get`).
- [client/components/PreApprovalLetterModal.tsx](client/components/PreApprovalLetterModal.tsx#L344)
- [client/components/TaskWizard.tsx](client/components/TaskWizard.tsx#L1473)
- [client/components/VoiceCallPanel.tsx](client/components/VoiceCallPanel.tsx#L321) — 2 calls.
- [client/pages/Contact.tsx](client/pages/Contact.tsx#L65)
- [client/pages/SchedulerReschedule.tsx](client/pages/SchedulerReschedule.tsx#L98)

**Fix:** Move each call into a `createAsyncThunk` in the appropriate slice; expose loading/error state via the store.

### P1-2. Swagger drift — 21 routes undocumented

**Project rule:** _"if any update is made to api/index.ts, update swagger.yaml accordingly"_.

Missing from [api/swagger.yaml](api/swagger.yaml):

| Verb   | Path                                                                                             |
| ------ | ------------------------------------------------------------------------------------------------ |
| DELETE | `/conversations/{conversationId}`                                                                |
| DELETE | `/conversations/{conversationId}/messages/{messageId}`                                           |
| GET    | `/client/meetings`                                                                               |
| GET    | `/conversations/check-whatsapp`                                                                  |
| GET    | `/conversations/mailboxes/office365/callback`                                                    |
| GET    | `/cron/sync-office365-mailboxes`                                                                 |
| GET    | `/reminder-flows/{flowId}/trace`                                                                 |
| GET    | `/scheduler/settings/{brokerId}`                                                                 |
| GET    | `/sms/media`, POST `/sms/media/upload`                                                           |
| GET    | `/voice/call-forwarding`, PUT `/voice/call-forwarding`                                           |
| GET    | `/voice/recording-check/{callSid}`, GET `/voice/recording/{callSid}`                             |
| POST   | `/brokers/{brokerId}/convert-to-client`, `/clients/{clientId}/convert-to-broker`                 |
| POST   | `/voice/call-answered`, `/voice/dial-status`, `/voice/fix-call-setup`, `/voice/recording-status` |
| POST   | `/webhooks/sms-status`                                                                           |

### P1-3. No JWT revocation on logout

- **Files:** [api/index.ts](api/index.ts#L3288-L3360) (`handleClientLogout`, `handleAdminLogout`).
- **Issue:** Logout only deletes the session-code row (which is irrelevant after first verify). The issued JWT remains valid for 7 days (broker) or **30 days** (client). A stolen token cannot be invalidated.
- **Fix:** Add a `revoked_tokens` table or a `token_jti` column tracked per-session, and check it inside `verifyClientSession` / `verifyBrokerSession`. Cheap variant: store `jti` on session and validate.

### P1-4. Massive God-file: `api/index.ts` is 25,632 lines

- **Issue:** Single file holds all routes, DB queries, OAuth, Twilio voice/SMS, IMAP, Office365, email templates, cron, etc. Risks: editor performance, merge conflicts, hard reviews, accidental cross-dependency, hot-reload pain.
- **Fix:** Split into `api/routes/<domain>.ts` (auth, brokers, clients, loans, conversations, voice, scheduler, reminder-flows, webhooks, public). Move the `expressApp` builder to `api/server.ts`. This is a multi-PR refactor — record as tech-debt.

### P1-5. PII / OTP code logged to console

- **Files:** [api/index.ts](api/index.ts#L2750), [api/index.ts](api/index.ts#L3120), and many `console.log("📊 Sessions found:", …)` lines around OTP flows.
- **Issue:** The verification code itself is logged in plaintext (`{ email, code }`) on every verify attempt. In Vercel/production logs this is a credential leak.
- **Fix:** Remove the code from log payloads; log only `email` + `success/failure`.

---

## P2 — Medium

### P2-1. JWT TTLs are very long

- Broker token: 7d. Client token: **30d** ([api/index.ts](api/index.ts#L3179-L3187)).
- Combined with no revocation list (P1-3), a stolen client token grants 30 days of access.
- **Fix:** Reduce client TTL to ≤ 7d; introduce silent refresh.

### P2-2. Broad `any` usage in slices and components

- 100+ matches of `: any`, `as any`, `Record<string, any>` across 30+ files (`tasksSlice.ts`, `communicationTemplatesSlice.ts`, `reminderFlowsSlice.ts`, `dashboardSlice.ts`, `TaskCompletionModal.tsx`, `LoanOverlay.tsx`, `BrokerWizard.tsx`, etc.).
- Most are `catch (error: any)` — replace with `catch (error)` + `error instanceof Error` narrowing or a shared `getAxiosError(err)` helper. Several are real type holes (e.g., `BrokerWizard` casts `selectedBrokerProfile as any` for fields like `facebook_url` that should be on the type).
- **Fix:** Add a `getErrorMessage(err: unknown): string` util in `client/lib/utils.ts`; sweep slices. Add `social_networks` typed fields to `BrokerProfile`.

### P2-3. `dangerouslySetInnerHTML` on broker-controlled HTML

- [client/components/PreApprovalLetterModal.tsx](client/components/PreApprovalLetterModal.tsx#L1119), [client/pages/admin/CommunicationTemplates.tsx](client/pages/admin/CommunicationTemplates.tsx#L760).
- Risk is limited to authenticated brokers, but stored XSS could still hit other brokers viewing the same template/letter.
- **Fix:** Sanitize with `DOMPurify` before injection, or render via a controlled rich-text component.

### P2-4. Public token paths use sequential IDs / weak tokens

- `/api/public/broker/:token` and `/api/public/scheduler/:token` rely on `public_token` (UUID) generated only on _broker_ login ([api/index.ts](api/index.ts#L2837)). If `public_token` is `NULL` for legacy brokers, route resolution may behave inconsistently. Verify backfill migration exists.

### P2-5. Email body uses unescaped `${process.env.CLIENT_URL || …}`

- ~6 hard-coded fallbacks pointing at `https://portal.encoremortgage.org` in HTML email templates ([api/index.ts](api/index.ts#L1444), [api/index.ts](api/index.ts#L1571), etc.).
- Tenant-aware multi-domain deploys would break. Centralize into a single `getClientUrl()` helper next to `getBaseUrl()`.

### P2-6. `console.error("PDF generation failed:", err)` in component

- [client/pages/admin/IncomeCalculator.tsx](client/pages/admin/IncomeCalculator.tsx#L1665) — should use `client/lib/logger.ts` per project rule.

### P2-7. Single mortgage tenant hard-coded

- `const MORTGAGE_TENANT_ID = 1;` ([api/index.ts](api/index.ts#L42)) is referenced 80+ times. The schema is multi-tenant but the runtime is hard-bound to tenant 1. New tenants require redeploy.
- **Fix:** Resolve `tenant_id` from `Host`/`subdomain` (already mentioned in `docs/SUBDOMAIN_SETUP_GUIDE.md`).

---

## P3 — Low

### P3-1. Dead file in repo

- `client/pages/admin/Scheduler.tsx.bak` (58 KB, dated Mar 20). **Delete.**

### P3-2. No `helmet` security headers

- Missing CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, etc.

### P3-3. `cors()` should at minimum honor credentials only for known origins.

(Subset of P0-4.)

### P3-4. JWT verify without algorithm pinning

- `jwt.verify(sessionToken, JWT_SECRET) as any` ([api/index.ts](api/index.ts#L2282), [api/index.ts](api/index.ts#L2350)) does not specify `{ algorithms: ['HS256'] }`. Defense-in-depth against algorithm-confusion.

### P3-5. Reminder flow seed migrations are duplicated/idempotency unclear

- Many files of shape `20260312_*_seed_*_reminder_flow.sql` with no obvious guard. If re-run by a fresh tenant boot, they may double-insert. Confirm each contains `INSERT … ON DUPLICATE KEY UPDATE` or `WHERE NOT EXISTS`.

### P3-6. `req.body` is not validated against a schema

- Most handlers do ad-hoc field checks (`if (!email || !code)`). Inconsistent + error-prone. The project already depends on `zod` and `yup` — adopt one for boundary validation.

### P3-7. `mmsUpload` is the only multer with `fileSize` & `fileFilter` ([api/index.ts](api/index.ts#L18265)). Other upload paths (avatars, documents, signatures) should also enforce size + MIME limits.

### P3-8. `parseInt(code)` on OTP

- `parseInt("0123abc")` → `123`. Use strict numeric regex before parsing.

---

## P4 — Refactor / nice-to-have

### P4-1. Split slices by domain — `tasksSlice.ts` (467 lines) and `communicationTemplatesSlice.ts` (~360 lines) handle multiple resources; same for `conversationsSlice.ts` (1097 lines).

### P4-2. Several slices have ~25 near-identical `catch (error: any)` blocks. Extract a `rejectFromAxios(err)` helper.

### P4-3. Magic numbers: 7d, 30d, 10-min OTP, 15-min OAuth state. Centralize in a `constants.ts`.

### P4-4. Many migrations that backfill data should live in a `seeds/` folder (or be marked idempotent in the README) — they're not schema changes.

### P4-5. Component file sizes — heavy candidates for split:

- `client/pages/admin/Conversations.tsx` (4481 LoC), `Calendar.tsx` (3651), `LoanOverlay.tsx` (3350), `ReminderFlows.tsx` (3054), `ApplicationWizard.tsx` (2352), `TaskWizard.tsx` (2073).

### P4-6. `shared/api.ts` is **2,518 lines** — split per domain (auth, loans, brokers, conversations…).

---

## P5 — Cosmetic / docs

- Default `console.warn(…)` startup banner uses emojis and is fine, but mixing `⚠️` and `❌` and plain text is inconsistent.
- Migration filenames: some use `YYYYMMDD_HHMMSS_…` and some `YYYYMMDD_…` (no time). Pick one (the rule already says timestamp prefix).
- `docs/DESIGN_SYSTEM.md` mentioned in copilot-instructions but not verified up-to-date.

---

## Summary table

| Priority  | Count  |
| --------- | ------ |
| P0        | 4      |
| P1        | 5      |
| P2        | 7      |
| P3        | 8      |
| P4        | 6      |
| P5        | 3      |
| **Total** | **33** |

## Recommended fix order

1. **P0-1** JWT_SECRET hardening (5 min)
2. **P0-2** OTP single-use invalidation (10 min)
3. **P0-4** CORS allowlist (10 min)
4. **P0-3** Rate limiting + helmet (30 min)
5. **P1-5** Strip OTP from logs (5 min)
6. **P3-4** JWT algorithm pinning (5 min)
7. **P3-1** Delete `.bak` file (1 min)
8. **P1-2** Swagger drift (15 min)
9. **P1-1** Component → Redux migration (per file, several hours)
10. **P1-3** JWT revocation (medium task)
11. Remaining P2/P3/P4 as backlog.

---

## Applied in this PR

| Item                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | Where                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **P0-1** Fail-fast on missing/short `JWT_SECRET`, no default fallback                                                                                                                                                                                                                                                                                                                                                                                                                                         | [api/index.ts](api/index.ts#L19-L33)                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| **P0-2** OTP session row marked `is_active = FALSE` immediately after success (broker + client)                                                                                                                                                                                                                                                                                                                                                                                                               | [api/index.ts](api/index.ts#L2747), [api/index.ts](api/index.ts#L3104)                                                                                                                                                                                                                                                                                                                                                                                                               |
| **P0-3** `helmet`, `express-rate-limit` (otpSend / otpVerify / publicForm / general) installed and applied to `/api/admin/auth/*`, `/api/client/auth/*`, `/api/apply`, `/api/apply/draft`, `/api/contact`, plus a global `/api` ceiling                                                                                                                                                                                                                                                                       | [api/index.ts](api/index.ts#L21219)                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| **P0-4** CORS origin allowlist (`BASE_URL`, `CLIENT_URL`, `PUBLIC_URL`, `CORS_ALLOWED_ORIGINS`, Vercel preview URL, localhost dev)                                                                                                                                                                                                                                                                                                                                                                            | [api/index.ts](api/index.ts#L21240)                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| **P1-5** OTP verification logs no longer print the code or session debug data                                                                                                                                                                                                                                                                                                                                                                                                                                 | [api/index.ts](api/index.ts#L2747), [api/index.ts](api/index.ts#L3104)                                                                                                                                                                                                                                                                                                                                                                                                               |
| **P1-1** Migrated direct `axios` calls to Redux thunks in `Contact.tsx`, `SchedulerReschedule.tsx`, `VoiceCallPanel.tsx`, `LoanOverlay.tsx` (10 calls), `PreApprovalLetterModal.tsx`, `TaskWizard.tsx` (CDN PDF upload moved to `cdn-upload.ts` helper). New thunks: `updateLoanDetails`, `updateLoanSource`, `assignLoanBroker`, `assignLoanPartner`, `exportLoanMismo`, `fetchTaskFormResponses`, `approveTask`, `reopenTask`, `sendPreApprovalEmail`. No remaining `import axios` in `client/components/`. | [client/store/slices/pipelineSlice.ts](client/store/slices/pipelineSlice.ts), [client/store/slices/tasksSlice.ts](client/store/slices/tasksSlice.ts), [client/store/slices/preApprovalSlice.ts](client/store/slices/preApprovalSlice.ts), [client/components/LoanOverlay.tsx](client/components/LoanOverlay.tsx), [client/components/PreApprovalLetterModal.tsx](client/components/PreApprovalLetterModal.tsx), [client/components/TaskWizard.tsx](client/components/TaskWizard.tsx) |
| **P1-3** JWT `jti` claim added to all signed tokens; new `revoked_tokens` table; logout revokes the current `jti`; `verifyClientSession`, `verifyBrokerSession`, and both validate-session handlers reject revoked jtis                                                                                                                                                                                                                                                                                       | [api/index.ts](api/index.ts), [database/migrations/20260430_120000_add_revoked_tokens.sql](database/migrations/20260430_120000_add_revoked_tokens.sql)                                                                                                                                                                                                                                                                                                                               |
| **P2-6** `console.error` → `logger.error` in IncomeCalculator                                                                                                                                                                                                                                                                                                                                                                                                                                                 | [client/pages/admin/IncomeCalculator.tsx](client/pages/admin/IncomeCalculator.tsx#L1665)                                                                                                                                                                                                                                                                                                                                                                                             |
| **P3-1** Removed `client/pages/admin/Scheduler.tsx.bak`                                                                                                                                                                                                                                                                                                                                                                                                                                                       | (deleted)                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| **P3-4** `jwt.verify(..., { algorithms: ["HS256"] })` pinned in 7 places                                                                                                                                                                                                                                                                                                                                                                                                                                      | [api/index.ts](api/index.ts)                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| **P3-8** Strict regex (`/^\d{4,8}$/`) before `parseInt` on OTP codes                                                                                                                                                                                                                                                                                                                                                                                                                                          | [api/index.ts](api/index.ts#L2747), [api/index.ts](api/index.ts#L3104)                                                                                                                                                                                                                                                                                                                                                                                                               |
| Trust proxy enabled for accurate `req.ip` / IPv6-safe rate-limit keying                                                                                                                                                                                                                                                                                                                                                                                                                                       | [api/index.ts](api/index.ts#L21219)                                                                                                                                                                                                                                                                                                                                                                                                                                                  |

### New dependencies

- `helmet@8`
- `express-rate-limit@8`
- `isomorphic-dompurify` (installed for the planned P2-3 sanitizer; not yet wired up)

### New required env vars

- `JWT_SECRET` — **must** be set; minimum 32 chars. App now refuses to start otherwise.
- Optional: `CORS_ALLOWED_ORIGINS` — comma-separated allowlist of additional origins. `BASE_URL`, `CLIENT_URL`, `PUBLIC_URL`, `VERCEL_URL` are auto-allowed if set.

> **Deployment note:** confirm `JWT_SECRET` is set in Vercel (production + preview) before deploying this change, or boot will fail. Generate with `openssl rand -hex 32`.

## Verified

- `npm run typecheck` → 0 errors.
- `npm test` → 5/5 pass.

## Backlog (unfixed in this PR)

- **P1-2** Swagger drift (21 routes). Mechanical but bulky; do per-domain.
- **P1-4** Split `api/index.ts` into per-domain modules.
- **P2-1** Reduce client JWT TTL to ≤ 7d + refresh.
- **P2-2** Sweep `: any` patterns; introduce `getErrorMessage(err: unknown)`.
- **P2-3** Wrap `dangerouslySetInnerHTML` with `DOMPurify`.
- **P2-4** Verify `public_token` backfill for legacy brokers.
- **P2-5** Centralize `getClientUrl()`.
- **P2-7** Resolve `tenant_id` from request host / subdomain.
- **P3-2** Author CSP for `helmet` (currently disabled).
- **P3-5** Audit reminder-flow seed migrations for idempotency.
- **P3-6** Adopt `zod`/`yup` validation at API boundary.
- **P3-7** Apply size + MIME limits to all `multer` upload routes (currently only `mmsUpload`).
- **P4-1..6** Modularization / large-file splits.
- **P5** Migration filename normalization, README touch-ups.
