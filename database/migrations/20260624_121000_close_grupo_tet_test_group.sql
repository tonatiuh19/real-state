-- Close test group "Grupo tet" so it leaves the active Conversations list.

SET @tenant_id = 1;
SET @conv = CONVERT('conv_group_1087978d18614ca4' USING utf8mb4) COLLATE utf8mb4_unicode_ci;

UPDATE conversation_threads
SET
  status = 'closed',
  archived_at = NOW(),
  updated_at = NOW()
WHERE tenant_id = @tenant_id
  AND conversation_id = @conv
  AND status = 'active';

INSERT INTO communications (
  tenant_id, communication_type, direction, body, status,
  conversation_id, message_type, delivery_status, created_at
)
SELECT
  @tenant_id,
  'system_event',
  'outbound',
  'closed',
  'delivered',
  @conv,
  'text',
  'delivered',
  NOW()
FROM DUAL
WHERE EXISTS (
  SELECT 1 FROM conversation_threads
  WHERE tenant_id = @tenant_id AND conversation_id = @conv AND status = 'closed'
);
