-- Prevent re-run of broadcast tag backfill from leaving tags=[] (breaks thread list JSON parse).
-- Idempotent: only touches rows that still have empty JSON arrays.

UPDATE conversation_threads
SET tags = NULL,
    updated_at = NOW()
WHERE tags IS NOT NULL
  AND JSON_LENGTH(tags) = 0;
