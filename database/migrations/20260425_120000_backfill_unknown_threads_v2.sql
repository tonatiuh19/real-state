-- Migration: Backfill unknown conversation_threads (v2)
-- Date: 2026-04-25
-- Purpose: Extend 20260424_120000_fix_unknown_conversation_threads.sql to also:
--   1. Populate ct.client_phone from conversation_id digits when missing
--   2. Match unlinked threads by client_email against clients.email
--   3. Match unlinked threads by phone against brokers.phone (set contact_broker_id)
--   4. Match unlinked threads by client_email against brokers.email (set contact_broker_id)
--   5. Re-run the phone-based client match (idempotent) so threads created
--      after the previous migration are also linked.
-- Note: This migration is idempotent and safe to run multiple times.

-- ──────────────────────────────────────────────────────────────────────────
-- Step 1: For threads with conv_unknown_<digits> / conv_phone_<digits> but
-- empty client_phone, hydrate client_phone from the conversation_id so all
-- subsequent joins can use a single column.
-- ──────────────────────────────────────────────────────────────────────────
UPDATE conversation_threads ct
SET
  ct.client_phone = CONCAT('+', REGEXP_REPLACE(ct.conversation_id, '^conv_(phone|unknown)_', '')),
  ct.updated_at   = NOW()
WHERE
  (ct.client_phone IS NULL OR ct.client_phone = '')
  AND (ct.conversation_id LIKE 'conv_phone_%' OR ct.conversation_id LIKE 'conv_unknown_%')
  AND REGEXP_REPLACE(ct.conversation_id, '^conv_(phone|unknown)_', '') REGEXP '^[0-9]+$';

-- ──────────────────────────────────────────────────────────────────────────
-- Step 2: Match unlinked threads to clients by phone (last 10 digits).
-- Same logic as the prior migration — repeated here so newly-created
-- "unknown" threads get linked.
-- ──────────────────────────────────────────────────────────────────────────
UPDATE conversation_threads ct
JOIN clients c ON (
  c.tenant_id = ct.tenant_id
  AND c.phone IS NOT NULL
  AND c.phone <> ''
  AND RIGHT(REGEXP_REPLACE(ct.client_phone, '[^0-9]', ''), 10)
      = RIGHT(REGEXP_REPLACE(c.phone, '[^0-9]', ''), 10)
  AND CHAR_LENGTH(REGEXP_REPLACE(c.phone, '[^0-9]', '')) >= 10
)
SET
  ct.client_id    = c.id,
  ct.client_name  = CONCAT(c.first_name, ' ', c.last_name),
  ct.client_email = COALESCE(ct.client_email, c.email),
  ct.broker_id    = COALESCE(ct.broker_id, c.assigned_broker_id),
  ct.updated_at   = NOW()
WHERE
  ct.client_id IS NULL
  AND ct.client_phone IS NOT NULL
  AND ct.client_phone <> '';

-- ──────────────────────────────────────────────────────────────────────────
-- Step 3: Match unlinked threads to clients by email (case-insensitive),
-- skipping placeholder addresses that look like noemail_*@noemail.placeholder.
-- ──────────────────────────────────────────────────────────────────────────
UPDATE conversation_threads ct
JOIN clients c ON (
  c.tenant_id = ct.tenant_id
  AND c.email IS NOT NULL
  AND c.email <> ''
  AND LOWER(c.email) = LOWER(ct.client_email)
  AND c.email NOT LIKE 'noemail_%@noemail.placeholder'
)
SET
  ct.client_id    = c.id,
  ct.client_name  = CONCAT(c.first_name, ' ', c.last_name),
  ct.client_phone = COALESCE(ct.client_phone, c.phone),
  ct.broker_id    = COALESCE(ct.broker_id, c.assigned_broker_id),
  ct.updated_at   = NOW()
WHERE
  ct.client_id IS NULL
  AND ct.client_email IS NOT NULL
  AND ct.client_email <> ''
  AND ct.client_email NOT LIKE 'noemail_%@noemail.placeholder';

-- ──────────────────────────────────────────────────────────────────────────
-- Step 4: For threads still without client_id, attempt to match the contact
-- against a broker (partner realtor / mortgage banker) by phone. When matched,
-- populate contact_broker_id and the displayed client_name so the thread
-- shows the broker's name instead of "Unknown Client".
-- ──────────────────────────────────────────────────────────────────────────
UPDATE conversation_threads ct
JOIN brokers b ON (
  b.tenant_id = ct.tenant_id
  AND b.phone IS NOT NULL
  AND b.phone <> ''
  AND RIGHT(REGEXP_REPLACE(ct.client_phone, '[^0-9]', ''), 10)
      = RIGHT(REGEXP_REPLACE(b.phone, '[^0-9]', ''), 10)
  AND CHAR_LENGTH(REGEXP_REPLACE(b.phone, '[^0-9]', '')) >= 10
)
SET
  ct.contact_broker_id = b.id,
  ct.client_name       = CONCAT(b.first_name, ' ', b.last_name),
  ct.client_email      = COALESCE(ct.client_email, b.email),
  ct.updated_at        = NOW()
WHERE
  ct.client_id IS NULL
  AND ct.contact_broker_id IS NULL
  AND ct.client_phone IS NOT NULL
  AND ct.client_phone <> '';

-- ──────────────────────────────────────────────────────────────────────────
-- Step 5: Match remaining unlinked threads to brokers by email.
-- ──────────────────────────────────────────────────────────────────────────
UPDATE conversation_threads ct
JOIN brokers b ON (
  b.tenant_id = ct.tenant_id
  AND b.email IS NOT NULL
  AND b.email <> ''
  AND LOWER(b.email) = LOWER(ct.client_email)
)
SET
  ct.contact_broker_id = b.id,
  ct.client_name       = CONCAT(b.first_name, ' ', b.last_name),
  ct.client_phone      = COALESCE(ct.client_phone, b.phone),
  ct.updated_at        = NOW()
WHERE
  ct.client_id IS NULL
  AND ct.contact_broker_id IS NULL
  AND ct.client_email IS NOT NULL
  AND ct.client_email <> ''
  AND ct.client_email NOT LIKE 'noemail_%@noemail.placeholder';

-- ──────────────────────────────────────────────────────────────────────────
-- Step 6: Sanitize any stored client_email that is the noemail_* placeholder
-- so it doesn't surface in the UI.
-- ──────────────────────────────────────────────────────────────────────────
UPDATE conversation_threads
SET client_email = NULL, updated_at = NOW()
WHERE client_email LIKE 'noemail_%@noemail.placeholder';

-- ──────────────────────────────────────────────────────────────────────────
-- Verification queries (run after applying to verify):
--   SELECT COUNT(*) AS still_unknown
--   FROM conversation_threads
--   WHERE client_id IS NULL AND contact_broker_id IS NULL;
--
--   SELECT COUNT(*) AS resolved_via_broker
--   FROM conversation_threads
--   WHERE client_id IS NULL AND contact_broker_id IS NOT NULL;
-- ──────────────────────────────────────────────────────────────────────────
