-- Migration: Backfill missing conversation_threads for reminder flow communications
-- Root cause: executeFlowSendStep was passing from_broker_id=NULL to upsertConversationThread,
--             causing the INSERT branch to be skipped (only UPDATE ran, no thread was ever created).
-- This migration creates the missing conversation_thread rows from existing communications
-- that were sent via reminder flows (source_execution_id IS NOT NULL).

INSERT INTO conversation_threads
  (tenant_id, conversation_id, application_id, client_id, broker_id,
   client_name, client_phone, client_email,
   last_message_at, last_message_preview, last_message_type,
   message_count, unread_count, status, created_at, updated_at)
SELECT
  c.tenant_id,
  c.conversation_id,
  c.application_id,
  c.to_user_id            AS client_id,
  la.broker_user_id       AS broker_id,
  CONCAT(cl.first_name, ' ', cl.last_name) AS client_name,
  cl.phone                AS client_phone,
  cl.email                AS client_email,
  MAX(c.sent_at)          AS last_message_at,
  SUBSTRING(
    (SELECT body FROM communications c2
     WHERE c2.conversation_id = c.conversation_id AND c2.tenant_id = c.tenant_id
     ORDER BY c2.sent_at DESC LIMIT 1),
    1, 200
  )                       AS last_message_preview,
  (SELECT communication_type FROM communications c3
   WHERE c3.conversation_id = c.conversation_id AND c3.tenant_id = c.tenant_id
   ORDER BY c3.sent_at DESC LIMIT 1
  )                       AS last_message_type,
  COUNT(*)                AS message_count,
  0                       AS unread_count,
  'active'                AS status,
  MIN(c.sent_at)          AS created_at,
  MAX(c.sent_at)          AS updated_at
FROM communications c
INNER JOIN loan_applications la ON c.application_id = la.id
INNER JOIN clients cl ON c.to_user_id = cl.id
WHERE c.source_execution_id IS NOT NULL
  AND c.conversation_id IS NOT NULL
  AND c.direction = 'outbound'
  AND la.broker_user_id IS NOT NULL
  -- Only insert if the thread doesn't already exist
  AND NOT EXISTS (
    SELECT 1 FROM conversation_threads ct
    WHERE ct.conversation_id = c.conversation_id
      AND ct.tenant_id = c.tenant_id
  )
GROUP BY
  c.tenant_id,
  c.conversation_id,
  c.application_id,
  c.to_user_id,
  la.broker_user_id,
  cl.first_name,
  cl.last_name,
  cl.phone,
  cl.email;
