-- Migration: Remove 'archived' status from conversation_threads
-- 'closed' now serves as the single non-active status
-- Date: 2026-04-24

-- Step 1: Migrate all existing archived threads to closed
UPDATE conversation_threads
SET status = 'closed',
    archived_at = COALESCE(archived_at, NOW())
WHERE status = 'archived';

-- Step 2: Update the enum to remove 'archived'
ALTER TABLE conversation_threads
  MODIFY COLUMN `status` ENUM('active','closed') COLLATE utf8mb4_unicode_ci DEFAULT 'active';
