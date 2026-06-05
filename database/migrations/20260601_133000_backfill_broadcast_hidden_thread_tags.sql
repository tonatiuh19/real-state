-- Phase B backfill: persist broadcast visibility on conversation_threads.tags
-- without schema changes.

-- 1) Mark all legacy broadcast-created threads as hidden by default.
UPDATE conversation_threads ct
SET ct.tags = CASE
  WHEN ct.tags IS NULL THEN JSON_ARRAY('broadcast_hidden')
  WHEN JSON_CONTAINS(ct.tags, JSON_QUOTE('broadcast_hidden')) = 1 THEN ct.tags
  ELSE JSON_ARRAY_APPEND(ct.tags, '$', 'broadcast_hidden')
END,
ct.updated_at = NOW()
WHERE ct.tenant_id = 1
  AND ct.conversation_id LIKE 'broadcast-%';

-- 2) Promote threads that already have an inbound reply by removing
-- broadcast_hidden, so they appear in normal inbox views by default.
UPDATE conversation_threads ct
SET ct.tags = CASE
  WHEN ct.tags IS NULL THEN NULL
  ELSE JSON_REMOVE(
    ct.tags,
    JSON_UNQUOTE(JSON_SEARCH(ct.tags, 'one', 'broadcast_hidden'))
  )
END,
ct.updated_at = NOW()
WHERE ct.tenant_id = 1
  AND ct.conversation_id LIKE 'broadcast-%'
  AND JSON_SEARCH(ct.tags, 'one', 'broadcast_hidden') IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM communications c
    WHERE c.tenant_id = ct.tenant_id
      AND c.conversation_id = ct.conversation_id
      AND c.direction = 'inbound'
  );
