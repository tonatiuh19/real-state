-- Migration: Normalize legacy 'archived' status on conversation_threads to 'closed'
-- Date: 2026-04-24
-- Reason: The status enum in schema.sql is ('active','closed') but historical
--         rows were inserted with status='archived' under a relaxed sql_mode.
--         This caused them to leak into the active inbox view.
--         Going forward only 'active' and 'closed' are valid.

UPDATE conversation_threads
SET status      = 'closed',
    archived_at = COALESCE(archived_at, NOW()),
    updated_at  = NOW()
WHERE status = 'archived';

-- Verification:
-- SELECT status, COUNT(*) FROM conversation_threads GROUP BY status;
