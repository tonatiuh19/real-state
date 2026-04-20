-- Migration: fix conversation thread linking and merge orphan threads
-- Date: 2026-04-20
-- Issues fixed:
--   1. Merge 2 orphan Daniel Carrillo SMS threads into his canonical thread
--   2. Link any remaining unlinked SMS threads that match a client by phone

-- ─── 1. Merge orphan Daniel Carrillo threads into conv_client_150015 ──────────

-- Move their communications to the canonical thread
UPDATE communications
SET conversation_id = 'conv_client_150015'
WHERE conversation_id IN (
  'conv_1776696569871_4mjrc5hsj',
  'conv_1776696541630_u90nnh4xn'
);

-- Recount messages on canonical thread
UPDATE conversation_threads ct
SET
  message_count = (
    SELECT COUNT(*) FROM communications c
    WHERE c.conversation_id = ct.conversation_id AND c.tenant_id = ct.tenant_id
  ),
  last_message_at = (
    SELECT MAX(c.created_at) FROM communications c
    WHERE c.conversation_id = ct.conversation_id AND c.tenant_id = ct.tenant_id
  ),
  last_message_preview = (
    SELECT c.body FROM communications c
    WHERE c.conversation_id = ct.conversation_id AND c.tenant_id = ct.tenant_id
    ORDER BY c.created_at DESC LIMIT 1
  ),
  updated_at = NOW()
WHERE ct.conversation_id = 'conv_client_150015';

-- Delete the now-empty orphan threads
DELETE FROM conversation_threads
WHERE conversation_id IN (
  'conv_1776696569871_4mjrc5hsj',
  'conv_1776696541630_u90nnh4xn'
);

-- ─── 2. Link all unlinked SMS threads where phone matches a client ─────────────
-- Uses RIGHT(..., 10) so +1XXXXXXXXXX, 1XXXXXXXXXX, and XXXXXXXXXX all match

UPDATE conversation_threads ct
JOIN (
  SELECT ct2.conversation_id, c.id AS client_id, 
         CONCAT(c.first_name,' ',c.last_name) AS client_name,
         c.phone AS client_phone,
         c.email AS client_email,
         COALESCE(c.assigned_broker_id, ct2.broker_id) AS broker_id
  FROM conversation_threads ct2
  JOIN clients c ON (
    ct2.client_id IS NULL
    AND ct2.client_phone IS NOT NULL
    AND REGEXP_REPLACE(c.phone, '[^0-9]', '') = RIGHT(REGEXP_REPLACE(ct2.client_phone, '[^0-9]', ''), 10)
    AND c.tenant_id = ct2.tenant_id
  )
) AS matches ON ct.conversation_id = matches.conversation_id
SET
  ct.client_id     = matches.client_id,
  ct.client_name   = matches.client_name,
  ct.client_email  = COALESCE(ct.client_email, matches.client_email),
  ct.broker_id     = COALESCE(ct.broker_id, matches.broker_id),
  ct.updated_at    = NOW();

-- Verify results
SELECT conversation_id, client_id, client_name, client_phone, broker_id, message_count
FROM conversation_threads
ORDER BY last_message_at DESC
LIMIT 20;
