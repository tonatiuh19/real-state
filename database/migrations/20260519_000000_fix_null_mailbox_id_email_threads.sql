-- Migration: Fix email threads and communications with NULL mailbox_id
-- Use SUBSTRING_INDEX for better compatibility with TiDB/MySQL 8.0 versions

-- 1. Fix conversation_threads
UPDATE conversation_threads
SET mailbox_id = CAST(
  SUBSTRING_INDEX(SUBSTRING_INDEX(conversation_id, '_', 3), '_', -1) AS UNSIGNED
)
WHERE mailbox_id IS NULL
  AND conversation_id REGEXP '^conv_o365_[0-9]+_';

-- 2. Fix communications (email only)
UPDATE communications
SET mailbox_id = CAST(
  SUBSTRING_INDEX(SUBSTRING_INDEX(conversation_id, '_', 3), '_', -1) AS UNSIGNED
)
WHERE mailbox_id IS NULL
  AND communication_type = 'email'
  AND conversation_id REGEXP '^conv_o365_[0-9]+_';
