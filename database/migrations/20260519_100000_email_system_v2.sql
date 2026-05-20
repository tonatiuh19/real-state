-- =============================================================================
-- MIGRATION: Email System V2 — New dedicated email tables + schema cleanup
-- Date: 2026-05-19
-- Depends-on: 20260519_000000_enforce_mailbox_ownership_level2.sql (must run first)
-- =============================================================================
--
-- Changes:
--   1. ALTER conversation_email_mailboxes:
--        - DROP is_shared column (always 0 after Level 2 migration)
--        - Enforce NOT NULL + CASCADE on assigned_broker_id
--   2. CREATE email_drafts  — per-broker email drafts
--   3. CREATE email_signatures — per-broker HTML signature
--   4. CREATE email_attachment_cache — Graph API attachment metadata cache
--   5. CREATE email_sync_log — per-sync-run audit trail
--
-- Safe to run: Level 2 migration wiped all mailbox rows, so NO existing data
-- in conversation_email_mailboxes is affected by the schema alterations.
-- =============================================================================

-- ─── 1. Alter conversation_email_mailboxes ────────────────────────────────────

-- Drop the is_shared column — ownership is always strict (broker_id = assigned_broker_id).
-- The Level 2 wipe guarantees no rows exist, so this is safe.
ALTER TABLE `conversation_email_mailboxes`
  DROP COLUMN `is_shared`;

-- Drop the old nullable FK and replace with NOT NULL + CASCADE.
ALTER TABLE `conversation_email_mailboxes`
  DROP FOREIGN KEY `fk_conversation_email_mailboxes_assigned_broker`;

ALTER TABLE `conversation_email_mailboxes`
  MODIFY COLUMN `assigned_broker_id` int NOT NULL,
  ADD CONSTRAINT `fk_email_mailboxes_broker`
    FOREIGN KEY (`assigned_broker_id`) REFERENCES `brokers` (`id`) ON DELETE CASCADE;

-- ─── 2. email_drafts ──────────────────────────────────────────────────────────
-- Stores unsent draft emails composed by brokers.
-- Drafts are local-only (not synced to the mail provider).

DROP TABLE IF EXISTS `email_drafts`;
CREATE TABLE `email_drafts` (
  `id`                  int            NOT NULL AUTO_INCREMENT,
  `tenant_id`           int            NOT NULL DEFAULT '1',
  `mailbox_id`          int            NOT NULL,
  `broker_id`           int            NOT NULL,
  `subject`             varchar(512)   COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `body_html`           mediumtext     COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `to_emails`           json           DEFAULT NULL COMMENT 'Array of {email, name} objects',
  `cc_emails`           json           DEFAULT NULL COMMENT 'Array of {email, name} objects',
  `bcc_emails`          json           DEFAULT NULL COMMENT 'Array of {email, name} objects',
  `reply_to_comm_id`    int            DEFAULT NULL COMMENT 'communications.id being replied to',
  `conversation_id`     varchar(100)   COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at`          datetime       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`          datetime       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_email_drafts_broker` (`tenant_id`, `broker_id`),
  KEY `idx_email_drafts_mailbox` (`mailbox_id`),
  CONSTRAINT `fk_email_drafts_tenant`   FOREIGN KEY (`tenant_id`)  REFERENCES `tenants` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_email_drafts_mailbox`  FOREIGN KEY (`mailbox_id`) REFERENCES `conversation_email_mailboxes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_email_drafts_broker`   FOREIGN KEY (`broker_id`)  REFERENCES `brokers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── 3. email_signatures ─────────────────────────────────────────────────────
-- One or more named HTML signatures per broker. One can be marked as default.

DROP TABLE IF EXISTS `email_signatures`;
CREATE TABLE `email_signatures` (
  `id`         int            NOT NULL AUTO_INCREMENT,
  `tenant_id`  int            NOT NULL DEFAULT '1',
  `broker_id`  int            NOT NULL,
  `name`       varchar(100)   COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Default',
  `html`       mediumtext     COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_default` tinyint(1)     NOT NULL DEFAULT '0',
  `created_at` datetime       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_email_signatures_broker` (`tenant_id`, `broker_id`),
  CONSTRAINT `fk_email_signatures_tenant`  FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_email_signatures_broker`  FOREIGN KEY (`broker_id`) REFERENCES `brokers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── 4. email_attachment_cache ───────────────────────────────────────────────
-- Caches Graph API attachment metadata to avoid re-fetching on every message load.
-- cdn_url is populated when the attachment is downloaded and stored in CDN.

DROP TABLE IF EXISTS `email_attachment_cache`;
CREATE TABLE `email_attachment_cache` (
  `id`                   int            NOT NULL AUTO_INCREMENT,
  `tenant_id`            int            NOT NULL DEFAULT '1',
  `mailbox_id`           int            NOT NULL,
  `graph_message_id`     varchar(512)   COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Graph API message ID',
  `graph_attachment_id`  varchar(512)   COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Graph API attachment ID',
  `comm_id`              int            DEFAULT NULL COMMENT 'communications.id that owns this attachment',
  `name`                 varchar(512)   COLLATE utf8mb4_unicode_ci NOT NULL,
  `content_type`         varchar(100)   COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `size_bytes`           int            DEFAULT NULL,
  `cdn_url`              varchar(2048)  COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'CDN URL if already downloaded',
  `created_at`           datetime       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_email_attachment` (`mailbox_id`, `graph_message_id`(200), `graph_attachment_id`(200)),
  KEY `idx_email_attachment_comm` (`comm_id`),
  CONSTRAINT `fk_email_attachment_tenant`  FOREIGN KEY (`tenant_id`)  REFERENCES `tenants` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_email_attachment_mailbox` FOREIGN KEY (`mailbox_id`) REFERENCES `conversation_email_mailboxes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── 5. email_sync_log ───────────────────────────────────────────────────────
-- Audit trail for each sync run (cron or manual). Useful for debugging missed
-- emails and understanding sync performance per mailbox.

DROP TABLE IF EXISTS `email_sync_log`;
CREATE TABLE `email_sync_log` (
  `id`              int      NOT NULL AUTO_INCREMENT,
  `tenant_id`       int      NOT NULL DEFAULT '1',
  `mailbox_id`      int      NOT NULL,
  `trigger`         enum('cron','manual') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'cron',
  `started_at`      datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `finished_at`     datetime DEFAULT NULL,
  `messages_synced` int      NOT NULL DEFAULT '0',
  `errors`          int      NOT NULL DEFAULT '0',
  `status`          enum('running','ok','error','partial') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'running',
  `error_detail`    text     COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_email_sync_log_mailbox` (`mailbox_id`, `started_at`),
  CONSTRAINT `fk_email_sync_log_tenant`  FOREIGN KEY (`tenant_id`)  REFERENCES `tenants` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_email_sync_log_mailbox` FOREIGN KEY (`mailbox_id`) REFERENCES `conversation_email_mailboxes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── Verify ───────────────────────────────────────────────────────────────────
SELECT 'email_drafts'           AS `tbl`, COUNT(*) AS `cnt` FROM `email_drafts`
UNION ALL
SELECT 'email_signatures',       COUNT(*) FROM `email_signatures`
UNION ALL
SELECT 'email_attachment_cache', COUNT(*) FROM `email_attachment_cache`
UNION ALL
SELECT 'email_sync_log',         COUNT(*) FROM `email_sync_log`;

-- Confirm is_shared column is gone
SELECT COUNT(*) AS is_shared_gone
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME   = 'conversation_email_mailboxes'
  AND COLUMN_NAME  = 'is_shared';
-- Should return 0
