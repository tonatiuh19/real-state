-- Empty JSON array tags break thread list when mysql2 returns [] as a JS array
-- and the API double-parses with JSON.parse([]). Normalize to NULL.

UPDATE conversation_threads
SET tags = NULL,
    updated_at = NOW()
WHERE tags IS NOT NULL
  AND JSON_LENGTH(tags) = 0;
