-- Merge duplicate test client Lionel Messias (480015) into Xavi Hernandez (420017).
-- Lionel was created from the same test phone (3234756240) and should not exist as a separate person.
-- Safe to re-run only before Lionel is deleted (no-op once client 480015 is gone).

SET @tenant_id = 1;
SET @source_client_id = 480015;
SET @target_client_id = 420017;
SET @canonical_conv = CONVERT('conv_client_420017' USING utf8mb4) COLLATE utf8mb4_unicode_ci;
SET @source_conv = CONVERT('conv_client_480015' USING utf8mb4) COLLATE utf8mb4_unicode_ci;

-- Abort early if already merged
SET @lionel_exists = (
  SELECT COUNT(*) FROM clients WHERE id = @source_client_id AND tenant_id = @tenant_id
);

-- 1) Move SMS thread messages into Xavi's canonical thread
UPDATE communications
SET conversation_id = @canonical_conv
WHERE tenant_id = @tenant_id
  AND conversation_id = @source_conv;

-- 2) Repoint reminder flows
UPDATE reminder_flow_executions
SET
  client_id = @target_client_id,
  conversation_id = @canonical_conv,
  context_data = REPLACE(
    REPLACE(context_data, CONCAT('"client_id": ', @source_client_id), CONCAT('"client_id": ', @target_client_id)),
    '"client_name": "Lionel Messias"',
    '"client_name": "Xavi Hernandez"'
  ),
  updated_at = NOW()
WHERE tenant_id = @tenant_id
  AND client_id = @source_client_id;

-- 3) Move loan + task ownership
UPDATE loan_applications
SET client_user_id = @target_client_id, updated_at = NOW()
WHERE tenant_id = @tenant_id AND client_user_id = @source_client_id;

UPDATE tasks
SET assigned_to_user_id = @target_client_id, updated_at = NOW()
WHERE assigned_to_user_id = @source_client_id;

-- 4) Repoint inbound/outbound client FK on communications
UPDATE communications
SET from_user_id = @target_client_id
WHERE tenant_id = @tenant_id AND from_user_id = @source_client_id;

UPDATE communications
SET to_user_id = @target_client_id
WHERE tenant_id = @tenant_id AND to_user_id = @source_client_id;

-- 5) Email threads: keep as separate O365 threads but under Xavi
UPDATE conversation_threads
SET
  client_id = @target_client_id,
  client_name = 'Xavi Hernandez',
  updated_at = NOW()
WHERE tenant_id = @tenant_id
  AND client_id = @source_client_id
  AND conversation_id <> @source_conv;

-- 6) Audit note on canonical SMS thread
INSERT INTO communications (
  tenant_id, from_broker_id, communication_type, direction, body, status,
  conversation_id, message_type, delivery_status, created_at
)
SELECT
  @tenant_id,
  NULL,
  'system_event',
  'outbound',
  'Merged duplicate client Lionel Messias into this conversation',
  'delivered',
  @canonical_conv,
  'text',
  'delivered',
  NOW()
FROM DUAL
WHERE @lionel_exists > 0
  AND NOT EXISTS (
    SELECT 1 FROM communications
    WHERE tenant_id = @tenant_id
      AND conversation_id = @canonical_conv
      AND communication_type = 'system_event'
      AND body = 'Merged duplicate client Lionel Messias into this conversation'
  );

-- 7) Remove Lionel SMS thread row (messages already moved)
DELETE FROM conversation_threads
WHERE tenant_id = @tenant_id
  AND conversation_id = @source_conv;

-- 8) Recompute canonical thread stats from communications
UPDATE conversation_threads ct
SET
  ct.message_count = (
    SELECT COUNT(*)
    FROM communications c
    WHERE c.tenant_id = @tenant_id
      AND c.conversation_id = @canonical_conv
      AND c.communication_type NOT IN ('system_event')
  ),
  ct.unread_count = (
    SELECT COALESCE(SUM(CASE WHEN c.direction = 'inbound' AND c.status <> 'read' THEN 1 ELSE 0 END), 0)
    FROM communications c
    WHERE c.tenant_id = @tenant_id
      AND c.conversation_id = @canonical_conv
      AND c.communication_type NOT IN ('system_event')
  ),
  ct.last_message_at = (
    SELECT MAX(COALESCE(c.sent_at, c.created_at))
    FROM communications c
    WHERE c.tenant_id = @tenant_id
      AND c.conversation_id = @canonical_conv
      AND c.communication_type NOT IN ('system_event')
  ),
  ct.last_message_preview = LEFT(COALESCE((
    SELECT c.body
    FROM communications c
    WHERE c.tenant_id = @tenant_id
      AND c.conversation_id = @canonical_conv
      AND c.communication_type NOT IN ('system_event')
    ORDER BY COALESCE(c.sent_at, c.created_at) DESC
    LIMIT 1
  ), ct.last_message_preview), 200),
  ct.last_message_type = COALESCE((
    SELECT c.communication_type
    FROM communications c
    WHERE c.tenant_id = @tenant_id
      AND c.conversation_id = @canonical_conv
      AND c.communication_type NOT IN ('system_event')
    ORDER BY COALESCE(c.sent_at, c.created_at) DESC
    LIMIT 1
  ), ct.last_message_type),
  ct.status = 'active',
  ct.archived_at = NULL,
  ct.updated_at = NOW()
WHERE ct.tenant_id = @tenant_id
  AND ct.conversation_id = @canonical_conv;

-- 9) Delete Lionel client (CASCADE cleans any remaining FK rows)
DELETE FROM clients
WHERE tenant_id = @tenant_id AND id = @source_client_id;
