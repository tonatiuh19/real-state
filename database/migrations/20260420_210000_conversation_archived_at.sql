-- Add archived_at timestamp to conversation_threads
-- Archived conversations are auto-deleted after 7 days via scheduled cleanup.
ALTER TABLE `conversation_threads`
  ADD COLUMN `archived_at` DATETIME DEFAULT NULL
    COMMENT 'Set when status is changed to archived; used by the 7-day auto-delete job'
  AFTER `status`;

-- Index so the cleanup query is fast
CREATE INDEX `idx_conversation_threads_archived_at`
  ON `conversation_threads` (`archived_at`);
