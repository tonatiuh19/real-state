-- ============================================================================
-- Migration: Realtor Broadcast Center
-- Date: 2026-05-28
-- Description: Adds tables for realtor blast email/SMS feature.
--              Includes ALTER TABLE for sms_blast_opted_in on brokers.
-- Compatible: TiDB Cloud Serverless (MySQL 8.0)
-- ============================================================================

-- Broadcast campaign header
CREATE TABLE IF NOT EXISTS realtor_broadcasts (
  id              INT NOT NULL AUTO_INCREMENT,
  tenant_id       INT NOT NULL,
  created_by      INT NOT NULL,                          -- broker id (platform owner)
  title           VARCHAR(255) NOT NULL,                 -- internal campaign name
  channel         ENUM('email','sms','both') NOT NULL,
  subject         VARCHAR(500) DEFAULT NULL,             -- email only
  body_email      LONGTEXT DEFAULT NULL,                 -- HTML email body
  body_sms        TEXT DEFAULT NULL,                     -- SMS body
  audience_filter JSON NOT NULL,                         -- filter config + excluded_ids
  recipient_count INT NOT NULL DEFAULT 0,
  sent_count      INT NOT NULL DEFAULT 0,
  failed_count    INT NOT NULL DEFAULT 0,
  status          ENUM('draft','scheduled','sending','sent','failed','cancelled') NOT NULL DEFAULT 'draft',
  is_cancelled    TINYINT(1) NOT NULL DEFAULT 0,         -- checked each loop iteration
  scheduled_at    DATETIME DEFAULT NULL,                 -- UTC; wizard converts from brokers.timezone
  started_at      DATETIME DEFAULT NULL,
  completed_at    DATETIME DEFAULT NULL,
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_tenant_status (tenant_id, status),
  KEY idx_scheduled_at (scheduled_at),
  CONSTRAINT fk_rb_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  CONSTRAINT fk_rb_broker FOREIGN KEY (created_by) REFERENCES brokers(id)
);

-- Per-recipient delivery log
CREATE TABLE IF NOT EXISTS realtor_broadcast_recipients (
  id                INT NOT NULL AUTO_INCREMENT,
  broadcast_id      INT NOT NULL,
  tenant_id         INT NOT NULL,
  broker_id         INT DEFAULT NULL,                    -- registered realtor
  prospect_id       INT DEFAULT NULL,                    -- realtor prospect
  recipient_name    VARCHAR(255) DEFAULT NULL,
  recipient_email   VARCHAR(255) DEFAULT NULL,
  recipient_phone   VARCHAR(30) DEFAULT NULL,
  email_status      ENUM('pending','sent','failed','bounced','unsubscribed','skipped_no_contact') DEFAULT NULL,
  sms_status        ENUM('pending','sent','failed','undelivered','opted_out','skipped_no_contact') DEFAULT NULL,
  email_ext_id      VARCHAR(255) DEFAULT NULL,           -- Resend message ID
  sms_ext_id        VARCHAR(255) DEFAULT NULL,           -- Twilio SID
  unsubscribe_token VARCHAR(64) DEFAULT NULL,            -- crypto.randomUUID() per recipient
  conversation_id   VARCHAR(255) DEFAULT NULL,           -- thread created during send
  error_message     TEXT DEFAULT NULL,
  sent_at           DATETIME DEFAULT NULL,
  created_at        DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_broadcast_id (broadcast_id),
  KEY idx_tenant (tenant_id),
  KEY idx_unsubscribe_token (unsubscribe_token),
  CONSTRAINT fk_rbr_broadcast FOREIGN KEY (broadcast_id) REFERENCES realtor_broadcasts(id) ON DELETE CASCADE
);

-- Permanent email opt-out list (CAN-SPAM)
CREATE TABLE IF NOT EXISTS realtor_email_unsubscribes (
  id              INT NOT NULL AUTO_INCREMENT,
  tenant_id       INT NOT NULL,
  email           VARCHAR(255) NOT NULL,
  unsubscribed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_tenant_email (tenant_id, email)
);

-- SMS broadcast opt-in flag on brokers table.
-- NULL = not yet collected, 1 = opted in, 0 = opted out (STOP reply received).
-- ALTER TABLE ... ADD COLUMN IF NOT EXISTS is TiDB/MySQL 8.0 compatible.
ALTER TABLE brokers
  ADD COLUMN IF NOT EXISTS sms_blast_opted_in TINYINT(1) DEFAULT NULL
    COMMENT 'NULL=unknown, 1=opted in, 0=opted out via STOP reply';
