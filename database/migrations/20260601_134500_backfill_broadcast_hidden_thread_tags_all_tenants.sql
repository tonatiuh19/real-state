-- Tenant-agnostic follow-up for broadcast hidden tags.
-- Safe to run after the tenant_id=1 migration; it only updates rows that do
-- not already contain/remove the marker as required.

-- 1) Mark legacy broadcast-created threads as hidden by default across tenants.
UPDATE conversation_threads ct
SET ct.tags = CASE
  WHEN ct.tags IS NULL THEN JSON_ARRAY('broadcast_hidden')
  WHEN JSON_CONTAINS(ct.tags, JSON_QUOTE('broadcast_hidden')) = 1 THEN ct.tags
  ELSE JSON_ARRAY_APPEND(ct.tags, '$', 'broadcast_hidden')
END,
ct.updated_at = NOW()
WHERE ct.conversation_id LIKE 'broadcast-%';

-- 2) Promote threads that already have inbound replies by removing the hidden marker.
UPDATE conversation_threads ct
SET ct.tags = CASE
  WHEN ct.tags IS NULL THEN NULL
  ELSE JSON_REMOVE(
    ct.tags,
    JSON_UNQUOTE(JSON_SEARCH(ct.tags, 'one', 'broadcast_hidden'))
  )
END,
ct.updated_at = NOW()
WHERE ct.conversation_id LIKE 'broadcast-%'
  AND JSON_SEARCH(ct.tags, 'one', 'broadcast_hidden') IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM communications c
    WHERE c.tenant_id = ct.tenant_id
      AND c.conversation_id = ct.conversation_id
      AND c.direction = 'inbound'
  );
