-- ============================================================
-- Migration: Conversation ↔ Reminder Flow Synchronization
-- Date: 2026-03-24
-- ============================================================
--
-- Goals:
--   1. Add `conversation_id` column to `reminder_flow_executions` so inbound
--      email/SMS handlers can look up active executions by conversation_id
--      directly (fast indexed lookup) instead of recomputing it from JSON.
--   2. Backfill existing executions whose context_data has loan_id/client_id.
--   3. Add `source_execution_id` column to `communications` to track which
--      reminder flow execution produced a sent message (aids audit/debugging).
--   4. Update the `update_conversation_thread` trigger to correctly handle the
--      case where broker_id is NULL (inbound-only threads).
-- ============================================================

-- ----------------------------------------------------------------
-- 1. Add conversation_id to reminder_flow_executions
-- ----------------------------------------------------------------
ALTER TABLE `reminder_flow_executions`
  ADD COLUMN `conversation_id` VARCHAR(100) NULL
    COMMENT 'Conversation thread tied to this execution — conv_client_{clientId}_loan_{loanId}_flow_{flowId}'
    AFTER `client_id`;

ALTER TABLE `reminder_flow_executions`
  ADD INDEX `idx_rfe_conv_id` (`tenant_id`, `conversation_id`);

-- ----------------------------------------------------------------
-- 2. Backfill conversation_id for existing executions that have
--    loan_id and client_id in context_data
-- ----------------------------------------------------------------
UPDATE `reminder_flow_executions`
SET `conversation_id` = CONCAT(
      'conv_client_',
      JSON_UNQUOTE(JSON_EXTRACT(context_data, '$.client_id')),
      '_loan_',
      JSON_UNQUOTE(JSON_EXTRACT(context_data, '$.loan_id')),
      '_flow_',
      flow_id
    ),
    `updated_at` = NOW()
WHERE `conversation_id` IS NULL
  AND `context_data` IS NOT NULL
  AND JSON_EXTRACT(context_data, '$.client_id') IS NOT NULL
  AND JSON_EXTRACT(context_data, '$.loan_id') IS NOT NULL;

-- ----------------------------------------------------------------
-- 3. Add source_execution_id to communications to link outbound
--    messages sent by the flow engine back to their execution
-- ----------------------------------------------------------------
ALTER TABLE `communications`
  ADD COLUMN `source_execution_id` INT NULL
    COMMENT 'reminder_flow_executions.id that produced this message (NULL = manual send)'
    AFTER `conversation_id`;

ALTER TABLE `communications`
  ADD INDEX `idx_comm_source_exec` (`source_execution_id`);

-- ----------------------------------------------------------------
-- 4. Replace the update_conversation_thread trigger to handle the
--    case where both from_broker_id and to_broker_id are NULL
--    (edge case for purely system-generated or inbound orphan messages).
--    Also ensure broker_id is never NULL in the upsert (falls back
--    to the existing value so the NOT NULL constraint is satisfied).
-- ----------------------------------------------------------------
DELIMITER $$

DROP TRIGGER IF EXISTS `update_conversation_thread` $$

CREATE TRIGGER `update_conversation_thread`
AFTER INSERT ON `communications`
FOR EACH ROW
BEGIN
    DECLARE client_name_var  VARCHAR(255) DEFAULT NULL;
    DECLARE client_phone_var VARCHAR(20)  DEFAULT NULL;
    DECLARE client_email_var VARCHAR(255) DEFAULT NULL;
    DECLARE resolved_client_id INT DEFAULT NULL;
    DECLARE resolved_broker_id INT DEFAULT NULL;

    -- Resolve the client (prefer to_user_id for outbound, from_user_id for inbound)
    SET resolved_client_id = COALESCE(NEW.to_user_id, NEW.from_user_id);
    SET resolved_broker_id = COALESCE(NEW.from_broker_id, NEW.to_broker_id);

    -- Get client info when available
    IF resolved_client_id IS NOT NULL THEN
        SELECT CONCAT(first_name, ' ', last_name), phone, email
        INTO   client_name_var, client_phone_var, client_email_var
        FROM   clients
        WHERE  id = resolved_client_id
        LIMIT  1;
    END IF;

    -- Only upsert when we have a valid broker (required column) or the thread already exists
    IF resolved_broker_id IS NOT NULL THEN
        INSERT INTO conversation_threads (
            tenant_id, conversation_id, application_id, lead_id, client_id, broker_id,
            client_name, client_phone, client_email,
            last_message_at, last_message_preview, last_message_type,
            message_count, unread_count
        ) VALUES (
            NEW.tenant_id,
            COALESCE(NEW.conversation_id, CONCAT('conv_auto_', NEW.id)),
            NEW.application_id,
            NEW.lead_id,
            resolved_client_id,
            resolved_broker_id,
            client_name_var,
            client_phone_var,
            client_email_var,
            NEW.created_at,
            LEFT(NEW.body, 200),
            NEW.communication_type,
            1,
            CASE WHEN NEW.direction = 'inbound' THEN 1 ELSE 0 END
        ) ON DUPLICATE KEY UPDATE
            last_message_at      = IF(NEW.created_at > last_message_at, NEW.created_at, last_message_at),
            last_message_preview = IF(NEW.created_at > last_message_at, LEFT(NEW.body, 200), last_message_preview),
            last_message_type    = IF(NEW.created_at > last_message_at, NEW.communication_type, last_message_type),
            message_count        = message_count + 1,
            unread_count         = unread_count + CASE WHEN NEW.direction = 'inbound' THEN 1 ELSE 0 END,
            client_name          = COALESCE(client_name, client_name_var),
            client_phone         = COALESCE(client_phone, client_phone_var),
            client_email         = COALESCE(client_email, client_email_var),
            updated_at           = NOW();
    ELSE
        -- broker_id unknown: just update an existing thread if the conversation_id matches
        UPDATE conversation_threads
        SET last_message_at      = IF(NEW.created_at > last_message_at, NEW.created_at, last_message_at),
            last_message_preview = IF(NEW.created_at > last_message_at, LEFT(NEW.body, 200), last_message_preview),
            last_message_type    = IF(NEW.created_at > last_message_at, NEW.communication_type, last_message_type),
            message_count        = message_count + 1,
            unread_count         = unread_count + CASE WHEN NEW.direction = 'inbound' THEN 1 ELSE 0 END,
            client_name          = COALESCE(client_name, client_name_var),
            client_phone         = COALESCE(client_phone, client_phone_var),
            updated_at           = NOW()
        WHERE conversation_id = COALESCE(NEW.conversation_id, CONCAT('conv_auto_', NEW.id))
          AND tenant_id = NEW.tenant_id;
    END IF;
END $$

DELIMITER ;
