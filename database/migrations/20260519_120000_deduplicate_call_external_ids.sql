-- ============================================================================
-- 20260519_120000_deduplicate_call_external_ids.sql
--
-- Removes duplicate call communications that share the same external_id
-- (CallSid). Keeps the oldest record (lowest id) for each duplicate group.
--
-- Root cause: handleVoiceLog was not idempotent — the frontend could call it
-- twice for the same call (once on 'disconnect', once on 'ended'), creating
-- two DB rows. The API-level fix (idempotency guard) prevents future duplicates;
-- this migration cleans up the 7 historical ones found in production.
--
-- Safe to re-run: if no duplicates exist, the DELETE is a no-op.
-- ============================================================================

-- Step 1: Show duplicates before deletion (informational — returns 0 rows on clean DB)
SELECT external_id, COUNT(*) AS duplicate_count
FROM communications
WHERE tenant_id = 1
  AND communication_type = 'call'
  AND external_id IS NOT NULL
GROUP BY external_id
HAVING COUNT(*) > 1;

-- Step 2: Delete all but the oldest record for each duplicate external_id
DELETE c2
FROM communications c2
JOIN (
  SELECT external_id, MIN(id) AS keep_id
  FROM communications
  WHERE tenant_id = 1
    AND communication_type = 'call'
    AND external_id IS NOT NULL
  GROUP BY external_id
  HAVING COUNT(*) > 1
) dupes
  ON c2.external_id = dupes.external_id
 AND c2.id > dupes.keep_id   -- delete all except the oldest (lowest id)
WHERE c2.tenant_id = 1
  AND c2.communication_type = 'call';

-- Step 3: Verify — should return 0 rows after migration
SELECT external_id, COUNT(*) AS remaining_duplicates
FROM communications
WHERE tenant_id = 1
  AND communication_type = 'call'
  AND external_id IS NOT NULL
GROUP BY external_id
HAVING COUNT(*) > 1;
