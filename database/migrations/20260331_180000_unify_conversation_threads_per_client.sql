-- Migration: Unify conversation threads per client
-- Root cause: different channels (SMS, email, voice, pipeline, flows) were generating
-- different conversation_id patterns for the same client, creating duplicate threads.
-- Fix: all channels now use conv_client_{client_id} as the single canonical thread per client.
-- This migration normalizes existing data to match the new canonical format.

-- ─────────────────────────────────────────────────────────────────────────────
-- Step 1: Normalize communications.conversation_id to canonical format
-- ─────────────────────────────────────────────────────────────────────────────

-- Outbound (broker → client): to_user_id is the client
UPDATE communications
SET conversation_id = CONCAT('conv_client_', to_user_id)
WHERE tenant_id = 1
  AND to_user_id IS NOT NULL
  AND to_user_id > 0
  AND conversation_id != CONCAT('conv_client_', to_user_id);

-- Inbound (client → broker): from_user_id is the client
UPDATE communications
SET conversation_id = CONCAT('conv_client_', from_user_id)
WHERE tenant_id = 1
  AND from_user_id IS NOT NULL
  AND from_user_id > 0
  AND direction = 'inbound'
  AND conversation_id != CONCAT('conv_client_', from_user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- Step 2: Normalize reminder_flow_executions.conversation_id
-- ─────────────────────────────────────────────────────────────────────────────

UPDATE reminder_flow_executions
SET conversation_id = CONCAT('conv_client_', client_id)
WHERE client_id IS NOT NULL
  AND conversation_id != CONCAT('conv_client_', client_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- Step 3: Merge conversation_threads — one canonical thread per (client, broker)
-- ─────────────────────────────────────────────────────────────────────────────

-- Build merged stats per (tenant_id, client_id, broker_id)
CREATE TEMPORARY TABLE IF NOT EXISTS _merged_threads AS
SELECT
  ct.tenant_id,
  ct.client_id,
  ct.broker_id,
  CONCAT('conv_client_', ct.client_id)                       AS canonical_conv_id,
  MAX(ct.application_id)                                     AS application_id,
  MAX(ct.lead_id)                                            AS lead_id,
  MAX(ct.client_name)                                        AS client_name,
  MAX(ct.client_phone)                                       AS client_phone,
  MAX(ct.client_email)                                       AS client_email,
  MAX(ct.last_message_at)                                    AS last_message_at,
  -- Pull preview + type from the most recently active thread
  (SELECT t2.last_message_preview
   FROM conversation_threads t2
   WHERE t2.tenant_id = ct.tenant_id
     AND t2.client_id = ct.client_id
     AND t2.broker_id = ct.broker_id
   ORDER BY t2.last_message_at DESC
   LIMIT 1)                                                  AS last_message_preview,
  (SELECT t2.last_message_type
   FROM conversation_threads t2
   WHERE t2.tenant_id = ct.tenant_id
     AND t2.client_id = ct.client_id
     AND t2.broker_id = ct.broker_id
   ORDER BY t2.last_message_at DESC
   LIMIT 1)                                                  AS last_message_type,
  SUM(ct.message_count)                                      AS message_count,
  SUM(ct.unread_count)                                       AS unread_count,
  MIN(ct.created_at)                                         AS created_at
FROM conversation_threads ct
WHERE ct.client_id IS NOT NULL
  AND ct.tenant_id = 1
GROUP BY ct.tenant_id, ct.client_id, ct.broker_id;

-- Remove all existing threads for known clients (will be replaced with canonical rows)
DELETE FROM conversation_threads
WHERE client_id IS NOT NULL
  AND tenant_id = 1;

-- Re-insert one canonical thread per (client, broker)
INSERT INTO conversation_threads
  (tenant_id, conversation_id, application_id, lead_id, client_id, broker_id,
   client_name, client_phone, client_email,
   last_message_at, last_message_preview, last_message_type,
   message_count, unread_count, priority, status, created_at, updated_at)
SELECT
  tenant_id,
  canonical_conv_id,
  application_id,
  lead_id,
  client_id,
  broker_id,
  client_name,
  client_phone,
  client_email,
  last_message_at,
  last_message_preview,
  last_message_type,
  message_count,
  unread_count,
  'normal',
  'active',
  created_at,
  NOW()
FROM _merged_threads;

DROP TEMPORARY TABLE IF EXISTS _merged_threads;
