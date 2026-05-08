-- Migration: 20260508_000000_cleanup_office365_orphaned_data
-- Purpose: Clean up orphaned Office365 email data caused by a wrong-account OAuth
--          token being stored (broker A's token saved under broker B's mailbox).
--          Also resets any mailbox whose token identity cannot be trusted so the
--          broker is forced to re-authorize cleanly.
--
-- Safe to re-run: all operations are idempotent.

-- 1. Delete conversation_threads that have no client or lead association
--    and were created by the Office365 sync (conversation_id pattern: conv_o365_*).
DELETE FROM conversation_threads
WHERE tenant_id = 1
  AND client_id IS NULL
  AND lead_id IS NULL
  AND conversation_id LIKE 'conv_o365_%';

-- 2. Delete communications that have no client/lead/broker sender association
--    and came from the Office365 email sync.
DELETE FROM communications
WHERE tenant_id = 1
  AND from_user_id IS NULL
  AND lead_id IS NULL
  AND communication_type = 'email'
  AND JSON_UNQUOTE(JSON_EXTRACT(metadata, '$.provider')) = 'office365';

-- 3. Mark all unread notifications as read (clears leftover badge counts from
--    the bad-import notifications).
UPDATE notifications
SET is_read = 1, read_at = NOW()
WHERE tenant_id = 1 AND is_read = 0;

-- 4. Reset OAuth tokens and delta link for any mailbox that still holds a token
--    so that the assigned broker is forced to re-authorize.
--    This prevents the wrong account from being re-synced before a clean re-auth.
--    Status is set to 'pending' so the UI prompts the broker to reconnect.
UPDATE conversation_email_mailboxes
SET
  oauth_access_token    = NULL,
  oauth_refresh_token   = NULL,
  oauth_expires_at      = NULL,
  last_graph_delta_link = NULL,
  status                = 'pending',
  last_sync_status      = NULL,
  last_sync_error       = NULL,
  updated_at            = NOW()
WHERE tenant_id = 1
  AND provider = 'office365'
  AND oauth_access_token IS NOT NULL;
