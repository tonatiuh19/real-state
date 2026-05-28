-- Migration: 20260521_120000_backfill_conv_phone_client_links.sql
-- Root Cause: When a client is added AFTER their first inbound call, the
-- conv_phone_* thread already exists with client_id=NULL and there is no
-- mechanism to retroactively link it. This migration closes that gap for
-- all current orphans and is safe to run again (COALESCE guards).
--
-- Only updates threads where:
--   • conversation_id LIKE 'conv_phone_%' (inbound call threads)
--   • client_id IS NULL (not yet linked)
--   • A client in the SAME tenant has a phone whose last 10 digits match
--     the last 10 digits of the conversation_id digits
--
-- Safe: COALESCE(ct.client_id, c.id) ensures we never overwrite an
-- already-linked thread even if this runs twice.

UPDATE conversation_threads ct
JOIN clients c
  ON  c.tenant_id = ct.tenant_id
  AND RIGHT(REGEXP_REPLACE(c.phone, '[^0-9]', ''), 10)
      = RIGHT(REGEXP_REPLACE(ct.conversation_id, '[^0-9]', ''), 10)
SET
  ct.client_id    = COALESCE(ct.client_id, c.id),
  ct.client_name  = COALESCE(ct.client_name, CONCAT(c.first_name, ' ', c.last_name)),
  ct.client_email = COALESCE(ct.client_email, c.email),
  ct.updated_at   = NOW()
WHERE ct.tenant_id  = 1
  AND ct.client_id  IS NULL
  AND ct.conversation_id LIKE 'conv_phone_%';

-- Also fix conv_unknown_* threads where an SMS arrived from an unknown number
-- that was later added to the CRM as a client.
UPDATE conversation_threads ct
JOIN clients c
  ON  c.tenant_id = ct.tenant_id
  AND ct.client_phone IS NOT NULL
  AND RIGHT(REGEXP_REPLACE(c.phone, '[^0-9]', ''), 10)
      = RIGHT(REGEXP_REPLACE(ct.client_phone, '[^0-9]', ''), 10)
SET
  ct.client_id    = COALESCE(ct.client_id, c.id),
  ct.client_name  = COALESCE(ct.client_name, CONCAT(c.first_name, ' ', c.last_name)),
  ct.client_email = COALESCE(ct.client_email, c.email),
  ct.updated_at   = NOW()
WHERE ct.tenant_id = 1
  AND ct.client_id IS NULL
  AND ct.conversation_id LIKE 'conv_unknown_%';
