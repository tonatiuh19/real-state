-- Migration: clean all messages from Hebert Test's conversation thread
-- Date: 2026-04-20
-- Purpose: reset thread for testing from scratch

-- Delete all communications in Hebert Test's thread
DELETE FROM communications
WHERE conversation_id = 'conv_client_270015';

-- Reset thread stats
UPDATE conversation_threads
SET
  message_count        = 0,
  last_message_at      = created_at,
  last_message_preview = NULL,
  updated_at           = NOW()
WHERE conversation_id = 'conv_client_270015';

-- Verify
SELECT conversation_id, client_name, message_count, last_message_at
FROM conversation_threads
WHERE conversation_id = 'conv_client_270015';
