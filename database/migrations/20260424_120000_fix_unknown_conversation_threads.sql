-- Migration: Fix unknown conversation_threads by linking them to known clients
-- Date: 2026-04-24
-- Purpose: Match conversations that have no client_id but have a client_phone
--          to existing clients by normalizing phone numbers. Once matched,
--          set client_id, client_name, client_email, and broker_id from the client record.

-- Step 1: Update conversations where client_phone matches clients.phone (E.164 or raw 10-digit)
UPDATE conversation_threads ct
JOIN clients c ON (
  -- normalize both sides: strip leading '+1' or '+' and compare 10-digit tails
  RIGHT(REPLACE(REPLACE(ct.client_phone, '+1', ''), '+', ''), 10)
    = RIGHT(REPLACE(REPLACE(c.phone, '+1', ''), '+', ''), 10)
  AND c.phone IS NOT NULL
  AND c.phone <> ''
)
SET
  ct.client_id    = c.id,
  ct.client_name  = CONCAT(c.first_name, ' ', c.last_name),
  ct.client_email = c.email,
  ct.broker_id    = COALESCE(c.assigned_broker_id, ct.broker_id),
  ct.updated_at   = NOW()
WHERE
  ct.client_id IS NULL
  AND ct.client_phone IS NOT NULL
  AND ct.client_phone <> ''
  AND ct.tenant_id = c.tenant_id;

-- Step 2: Also match by the phone embedded in the conversation_id for
--         conversations of the form conv_phone_<digits> or conv_unknown_<digits>
--         that still have no client_id after Step 1.
UPDATE conversation_threads ct
JOIN clients c ON (
  RIGHT(REPLACE(REPLACE(
    REGEXP_REPLACE(ct.conversation_id, '^conv_(phone|unknown)_1?', ''),
    '+1', ''), '+', ''), 10)
    = RIGHT(REPLACE(REPLACE(c.phone, '+1', ''), '+', ''), 10)
  AND c.phone IS NOT NULL
  AND c.phone <> ''
)
SET
  ct.client_id    = c.id,
  ct.client_name  = CONCAT(c.first_name, ' ', c.last_name),
  ct.client_email = c.email,
  ct.broker_id    = COALESCE(c.assigned_broker_id, ct.broker_id),
  ct.updated_at   = NOW()
WHERE
  ct.client_id IS NULL
  AND (ct.conversation_id LIKE 'conv_phone_%' OR ct.conversation_id LIKE 'conv_unknown_%')
  AND (ct.client_phone IS NULL OR ct.client_phone = '')
  AND ct.tenant_id = c.tenant_id;

-- Step 3: Also try matching by alternate_phone for any still-unmatched conversations
UPDATE conversation_threads ct
JOIN clients c ON (
  RIGHT(REPLACE(REPLACE(ct.client_phone, '+1', ''), '+', ''), 10)
    = RIGHT(REPLACE(REPLACE(c.alternate_phone, '+1', ''), '+', ''), 10)
  AND c.alternate_phone IS NOT NULL
  AND c.alternate_phone <> ''
)
SET
  ct.client_id    = c.id,
  ct.client_name  = CONCAT(c.first_name, ' ', c.last_name),
  ct.client_email = c.email,
  ct.broker_id    = COALESCE(c.assigned_broker_id, ct.broker_id),
  ct.updated_at   = NOW()
WHERE
  ct.client_id IS NULL
  AND ct.client_phone IS NOT NULL
  AND ct.client_phone <> ''
  AND ct.tenant_id = c.tenant_id;

-- Verification query (run after applying to see how many threads were linked):
-- SELECT
--   COUNT(*) AS total_unlinked_after_fix
-- FROM conversation_threads
-- WHERE client_id IS NULL
--   AND (client_phone IS NOT NULL AND client_phone <> '');
