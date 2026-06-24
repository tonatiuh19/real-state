-- Group conversations: thread metadata + participants table
-- TiDB Cloud Serverless (MySQL 8.0 compatible)

ALTER TABLE conversation_threads
  ADD COLUMN thread_type ENUM('direct','group') NOT NULL DEFAULT 'direct',
  ADD COLUMN title VARCHAR(255) NULL COMMENT 'Group display name; API fills display_title if NULL',
  ADD COLUMN participant_fingerprint CHAR(64) NULL COMMENT 'SHA256 — group threads only',
  ADD COLUMN channel ENUM('sms','whatsapp','internal') NOT NULL DEFAULT 'sms',
  ADD COLUMN creation_source ENUM('encore','phone_synced') NOT NULL DEFAULT 'encore'
    COMMENT 'phone_synced = auto-created from inbound Group MMS';

CREATE UNIQUE INDEX idx_ct_tenant_fingerprint
  ON conversation_threads (tenant_id, participant_fingerprint);

CREATE TABLE IF NOT EXISTS conversation_participants (
  id INT NOT NULL AUTO_INCREMENT,
  tenant_id INT NOT NULL,
  conversation_id VARCHAR(100) NOT NULL,
  participant_type ENUM('client','broker','lead','external_phone') NOT NULL,
  client_id INT NULL,
  broker_id INT NULL,
  lead_id INT NULL,
  phone_e164 VARCHAR(20) NULL,
  display_name VARCHAR(255) NULL,
  role ENUM('owner','member') NOT NULL DEFAULT 'member',
  joined_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  left_at DATETIME NULL,
  PRIMARY KEY (id),
  KEY idx_cp_conversation (tenant_id, conversation_id),
  KEY idx_cp_client (tenant_id, client_id),
  KEY idx_cp_broker (tenant_id, broker_id),
  KEY idx_cp_phone (tenant_id, phone_e164),
  CONSTRAINT fk_cp_tenant FOREIGN KEY (tenant_id) REFERENCES tenants (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
