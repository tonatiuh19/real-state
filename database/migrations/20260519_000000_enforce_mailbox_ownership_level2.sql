-- =============================================================================
-- MIGRATION: Enforce strict mailbox ownership — Level 2 full email wipe
-- Date: 2026-05-19
-- =============================================================================
--
-- PROBLEM: conversation_email_mailboxes had is_shared=1 rows (e.g. teamdc@)
-- that were visible to ALL brokers, causing privacy violations. Email threads
-- synced from wrong mailboxes were visible across broker accounts.
--
-- FIX: Clean slate. Delete all email synced data so every broker reconnects
-- their own mailbox fresh. The application code is also fixed to enforce
-- assigned_broker_id ownership strictly — no is_shared bypass for any role.
--
-- FK behavior:
--   communications.mailbox_id        ON DELETE SET NULL
--   conversation_threads.mailbox_id  ON DELETE SET NULL
-- So deleting mailbox rows auto-nullifies those FK columns.
--
-- IMPORTANT: Run this AFTER deploying the application code changes.
-- =============================================================================

SET FOREIGN_KEY_CHECKS = 0;

-- Step 1: Delete all email communications (messages synced from mailboxes).
--         Only removes rows where communication_type = 'email' to preserve
--         SMS, WhatsApp, call, and internal note records.
DELETE FROM communications
WHERE tenant_id = 1
  AND communication_type = 'email';

-- Step 2: Delete email-only conversation threads — those whose ONLY channel
--         was email (no SMS/WhatsApp/call messages in the same thread).
--         Threads that mixed channels keep their non-email history.
DELETE FROM conversation_threads
WHERE tenant_id = 1
  AND last_message_type = 'email'
  AND NOT EXISTS (
    SELECT 1 FROM communications c
    WHERE c.conversation_id = conversation_threads.conversation_id
      AND c.tenant_id = 1
      AND c.communication_type != 'email'
  );

-- Step 3: Delete ALL mailbox credential/config records.
--         This forces every broker to reconnect their own mailbox.
--         The fixed application code will create new rows with:
--           is_shared = 0, assigned_broker_id = connecting_broker_id
DELETE FROM conversation_email_mailboxes
WHERE tenant_id = 1;

SET FOREIGN_KEY_CHECKS = 1;

-- Verify: all three tables should be empty for email-related rows
SELECT 'mailboxes remaining' AS check_name, COUNT(*) AS count
FROM conversation_email_mailboxes WHERE tenant_id = 1
UNION ALL
SELECT 'email communications remaining', COUNT(*)
FROM communications WHERE tenant_id = 1 AND communication_type = 'email'
UNION ALL
SELECT 'email-only threads remaining', COUNT(*)
FROM conversation_threads
WHERE tenant_id = 1
  AND last_message_type = 'email'
  AND NOT EXISTS (
    SELECT 1 FROM communications c
    WHERE c.conversation_id = conversation_threads.conversation_id
      AND c.tenant_id = 1 AND c.communication_type != 'email'
  );
