-- Migration: add 'auth_required' to conversation_email_mailboxes.status ENUM
-- Purpose: distinguish mailboxes whose OAuth refresh token is revoked/expired
--          (needs user re-authorization) from generic 'error' (transient network
--          issues that the cron retries automatically).
--
-- Before: enum('pending','active','disabled','error')
-- After:  enum('pending','active','disabled','error','auth_required')

ALTER TABLE `conversation_email_mailboxes`
  MODIFY COLUMN `status`
    ENUM('pending','active','disabled','error','auth_required')
    COLLATE utf8mb4_unicode_ci
    NOT NULL
    DEFAULT 'pending';
