-- Office 365 mailbox support for Conversations (additive, backward-compatible)
-- TiDB Cloud / MySQL 8.0 compatible

CREATE TABLE IF NOT EXISTS conversation_email_mailboxes (
  id INT NOT NULL AUTO_INCREMENT,
  tenant_id INT NOT NULL DEFAULT 1,
  provider ENUM('office365','imap') NOT NULL DEFAULT 'office365',
  mailbox_email VARCHAR(255) NOT NULL,
  display_name VARCHAR(255) DEFAULT NULL,
  is_shared TINYINT(1) NOT NULL DEFAULT 1,
  assigned_broker_id INT DEFAULT NULL,
  status ENUM('pending','active','disabled','error') NOT NULL DEFAULT 'pending',
  is_default TINYINT(1) NOT NULL DEFAULT 0,

  -- Office 365 OAuth fields
  office365_tenant_id VARCHAR(120) DEFAULT NULL,
  office365_client_id VARCHAR(120) DEFAULT NULL,
  oauth_access_token MEDIUMTEXT DEFAULT NULL,
  oauth_refresh_token MEDIUMTEXT DEFAULT NULL,
  oauth_expires_at DATETIME DEFAULT NULL,

  -- Sync state
  last_sync_at DATETIME DEFAULT NULL,
  last_sync_status ENUM('ok','error') DEFAULT NULL,
  last_sync_error TEXT DEFAULT NULL,
  last_graph_delta_link TEXT DEFAULT NULL,

  created_by_broker_id INT DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_conversation_email_mailboxes (tenant_id, provider, mailbox_email),
  KEY idx_conversation_email_mailboxes_tenant_status (tenant_id, status),
  KEY idx_conversation_email_mailboxes_assigned (assigned_broker_id),
  KEY idx_conversation_email_mailboxes_default (tenant_id, is_default),

  CONSTRAINT fk_conversation_email_mailboxes_tenant
    FOREIGN KEY (tenant_id) REFERENCES tenants (id) ON DELETE CASCADE,
  CONSTRAINT fk_conversation_email_mailboxes_assigned_broker
    FOREIGN KEY (assigned_broker_id) REFERENCES brokers (id) ON DELETE SET NULL,
  CONSTRAINT fk_conversation_email_mailboxes_created_by
    FOREIGN KEY (created_by_broker_id) REFERENCES brokers (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Optional linkage columns for message/thread mailbox attribution
ALTER TABLE communications
  ADD COLUMN mailbox_id INT NULL AFTER conversation_id,
  ADD KEY idx_communications_mailbox_id (mailbox_id),
  ADD CONSTRAINT fk_communications_mailbox_id
    FOREIGN KEY (mailbox_id) REFERENCES conversation_email_mailboxes (id) ON DELETE SET NULL;

ALTER TABLE conversation_threads
  ADD COLUMN mailbox_id INT NULL AFTER broker_id,
  ADD KEY idx_conversation_threads_mailbox_id (mailbox_id),
  ADD CONSTRAINT fk_conversation_threads_mailbox_id
    FOREIGN KEY (mailbox_id) REFERENCES conversation_email_mailboxes (id) ON DELETE SET NULL;
