-- Remove duplicate outbound broadcast SMS rows from communications.
--
-- Root cause: concurrent broadcast send workers inserted multiple rows with the
-- same conversation_id (broadcast-{broadcastId}-sms-r{recipientId}) and body.
-- The inbox renders every row in communications for that conversation_id.
--
-- Strategy: per (tenant_id, conversation_id, body), keep the earliest row (MIN id)
-- and delete the rest. Safe to re-run (idempotent).

CREATE TEMPORARY TABLE _broadcast_sms_dupe_delete (
  comm_id INT NOT NULL,
  PRIMARY KEY (comm_id)
);

INSERT INTO _broadcast_sms_dupe_delete (comm_id)
SELECT c.id
FROM communications c
INNER JOIN (
  SELECT
    tenant_id,
    conversation_id,
    body,
    MIN(id) AS keep_id
  FROM communications
  WHERE communication_type = 'sms'
    AND direction = 'outbound'
    AND conversation_id LIKE 'broadcast-%-sms-r%'
  GROUP BY tenant_id, conversation_id, body
  HAVING COUNT(*) > 1
) k
  ON c.tenant_id = k.tenant_id
 AND c.conversation_id = k.conversation_id
 AND c.body <=> k.body
 AND c.id <> k.keep_id
WHERE c.communication_type = 'sms'
  AND c.direction = 'outbound';

DELETE FROM communications
WHERE id IN (SELECT comm_id FROM _broadcast_sms_dupe_delete);

-- Reconcile denormalized thread stats for broadcast delivery threads.
UPDATE conversation_threads ct
SET
  message_count = (
    SELECT COUNT(*)
    FROM communications c
    WHERE c.tenant_id = ct.tenant_id
      AND c.conversation_id = ct.conversation_id
  ),
  last_message_at = COALESCE(
    (
      SELECT MAX(COALESCE(c.sent_at, c.created_at))
      FROM communications c
      WHERE c.tenant_id = ct.tenant_id
        AND c.conversation_id = ct.conversation_id
    ),
    ct.last_message_at
  ),
  last_message_preview = COALESCE(
    (
      SELECT LEFT(c.body, 200)
      FROM communications c
      WHERE c.tenant_id = ct.tenant_id
        AND c.conversation_id = ct.conversation_id
      ORDER BY COALESCE(c.sent_at, c.created_at) DESC, c.id DESC
      LIMIT 1
    ),
    ct.last_message_preview
  ),
  updated_at = NOW()
WHERE ct.conversation_id LIKE 'broadcast-%';

DROP TEMPORARY TABLE _broadcast_sms_dupe_delete;
