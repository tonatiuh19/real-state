-- Consolidate duplicate test clients on phone 9095279692 into Hebert Medina (750015).
-- Avila Test (180015) and Hebert Test (270015) are orphan duplicates; only 750015 owns the number.

SET @tenant_id = 1;
SET @target_client_id = 750015;
SET @canonical_conv = CONVERT('conv_client_750015' USING utf8mb4) COLLATE utf8mb4_unicode_ci;

CREATE TEMPORARY TABLE _hebert_merge_sources (client_id INT NOT NULL PRIMARY KEY);
INSERT INTO _hebert_merge_sources (client_id) VALUES (180015), (270015);

-- 1) Move all messages from duplicate threads into Hebert's canonical SMS thread
UPDATE communications comm
JOIN conversation_threads ct
  ON ct.conversation_id = comm.conversation_id
 AND ct.tenant_id = comm.tenant_id
JOIN _hebert_merge_sources src ON src.client_id = ct.client_id
SET comm.conversation_id = @canonical_conv
WHERE comm.tenant_id = @tenant_id
  AND comm.conversation_id <> @canonical_conv;

UPDATE communications
SET from_user_id = @target_client_id
WHERE tenant_id = @tenant_id AND from_user_id IN (180015, 270015);

UPDATE communications
SET to_user_id = @target_client_id
WHERE tenant_id = @tenant_id AND to_user_id IN (180015, 270015);

-- 2) Reassign CRM assets
UPDATE loan_applications
SET client_user_id = @target_client_id, updated_at = NOW()
WHERE tenant_id = @tenant_id AND client_user_id IN (180015, 270015);

UPDATE tasks
SET assigned_to_user_id = @target_client_id, updated_at = NOW()
WHERE assigned_to_user_id IN (180015, 270015);

UPDATE reminder_flow_executions
SET
  client_id = @target_client_id,
  conversation_id = @canonical_conv,
  updated_at = NOW()
WHERE tenant_id = @tenant_id AND client_id IN (180015, 270015);

-- 3) Remove duplicate thread rows (messages already moved)
DELETE ct FROM conversation_threads ct
JOIN _hebert_merge_sources src ON src.client_id = ct.client_id
WHERE ct.tenant_id = @tenant_id;

-- 4) Audit note
INSERT INTO communications (
  tenant_id, communication_type, direction, body, status,
  conversation_id, message_type, delivery_status, created_at
)
SELECT
  @tenant_id,
  'system_event',
  'outbound',
  'Merged duplicate clients Avila Test and Hebert Test into this conversation (phone 9095279692)',
  'delivered',
  @canonical_conv,
  'text',
  'delivered',
  NOW()
FROM DUAL
WHERE NOT EXISTS (
  SELECT 1 FROM communications
  WHERE tenant_id = @tenant_id
    AND conversation_id = @canonical_conv
    AND communication_type = 'system_event'
    AND body LIKE 'Merged duplicate clients Avila Test and Hebert Test%'
);

-- 5) Recompute canonical thread stats
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
  ct.client_phone = (SELECT phone FROM clients WHERE id = @target_client_id AND tenant_id = @tenant_id),
  ct.normalized_client_phone = (SELECT normalized_phone FROM clients WHERE id = @target_client_id AND tenant_id = @tenant_id),
  ct.status = 'active',
  ct.archived_at = NULL,
  ct.updated_at = NOW()
WHERE ct.tenant_id = @tenant_id
  AND ct.conversation_id = @canonical_conv;

-- 6) Delete duplicate client records
DELETE FROM clients
WHERE tenant_id = @tenant_id AND id IN (180015, 270015);

DROP TEMPORARY TABLE _hebert_merge_sources;
