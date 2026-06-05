-- Reopen conversation threads that stayed closed after an inbound SMS reply.
-- Caused by the former 5-minute post-close guard (removed for SMS in api/index.ts).

UPDATE conversation_threads ct
SET
  status = 'active',
  archived_at = NULL,
  tags = CASE
    WHEN ct.tags IS NOT NULL
      AND JSON_CONTAINS(ct.tags, JSON_QUOTE('broadcast_hidden')) = 1
    THEN JSON_REMOVE(
      ct.tags,
      JSON_UNQUOTE(JSON_SEARCH(ct.tags, 'one', 'broadcast_hidden'))
    )
    ELSE ct.tags
  END,
  updated_at = NOW()
WHERE ct.status = 'closed'
  AND ct.archived_at IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM communications c
    WHERE c.conversation_id = ct.conversation_id
      AND c.tenant_id = ct.tenant_id
      AND c.direction = 'inbound'
      AND c.communication_type = 'sms'
      AND c.created_at > ct.archived_at
  );
