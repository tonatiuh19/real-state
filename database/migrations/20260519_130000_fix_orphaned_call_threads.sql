-- ============================================================================
-- 20260519_130000_fix_orphaned_call_threads.sql
--
-- Fixes conversation_threads where last_message_type = 'call' but no
-- communications record with communication_type = 'call' exists.
--
-- Two sub-cases:
--   A. Thread has OTHER communications — update last_message_type to latest.
--   B. Thread has NO communications at all — delete the empty shell thread.
-- ============================================================================

-- Step 1: Show affected threads (informational)
SELECT ct.conversation_id, ct.last_message_type,
  (SELECT communication_type FROM communications
   WHERE conversation_id = ct.conversation_id AND tenant_id = ct.tenant_id
   ORDER BY created_at DESC LIMIT 1) AS actual_latest_type
FROM conversation_threads ct
WHERE ct.tenant_id = 1
  AND ct.last_message_type = 'call'
  AND NOT EXISTS (
    SELECT 1 FROM communications c
    WHERE c.conversation_id = ct.conversation_id AND c.tenant_id = ct.tenant_id
      AND c.communication_type = 'call'
  );

-- Step 2a: Delete threads that have NO communications at all (empty shells)
DELETE FROM conversation_threads
WHERE tenant_id = 1
  AND last_message_type = 'call'
  AND NOT EXISTS (
    SELECT 1 FROM communications c
    WHERE c.conversation_id = conversation_threads.conversation_id
      AND c.tenant_id = conversation_threads.tenant_id
  );

-- Step 2b: Update last_message_type for threads that have other communications
UPDATE conversation_threads ct
SET ct.last_message_type = (
  SELECT c.communication_type FROM communications c
  WHERE c.conversation_id = ct.conversation_id AND c.tenant_id = ct.tenant_id
  ORDER BY c.created_at DESC, c.id DESC
  LIMIT 1
)
WHERE ct.tenant_id = 1
  AND ct.last_message_type = 'call'
  AND NOT EXISTS (
    SELECT 1 FROM communications c2
    WHERE c2.conversation_id = ct.conversation_id AND c2.tenant_id = ct.tenant_id
      AND c2.communication_type = 'call'
  )
  AND EXISTS (
    SELECT 1 FROM communications c3
    WHERE c3.conversation_id = ct.conversation_id AND c3.tenant_id = ct.tenant_id
  );

-- Step 3: Verify — should return 0 rows after fix
SELECT COUNT(*) AS still_orphaned
FROM conversation_threads ct
WHERE ct.tenant_id = 1
  AND ct.last_message_type = 'call'
  AND NOT EXISTS (
    SELECT 1 FROM communications c
    WHERE c.conversation_id = ct.conversation_id AND c.tenant_id = ct.tenant_id
      AND c.communication_type = 'call'
  );
