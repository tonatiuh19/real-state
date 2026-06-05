-- Broadcast-only tenant credit wallet and ledger
-- Scope: Broadcast Center send/retry actions only

CREATE TABLE IF NOT EXISTS tenant_broadcast_credits (
  tenant_id INT NOT NULL,
  available_balance_usd DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  reserved_balance_usd DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  total_spent_usd DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  currency CHAR(3) NOT NULL DEFAULT 'USD',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (tenant_id),
  CONSTRAINT fk_tenant_broadcast_credits_tenant
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS tenant_broadcast_credit_ledger (
  id BIGINT NOT NULL AUTO_INCREMENT,
  tenant_id INT NOT NULL,
  broadcast_id INT NULL,
  action ENUM('seed','reserve','capture','release','adjustment') NOT NULL,
  amount_usd DECIMAL(12,2) NOT NULL,
  note VARCHAR(255) NULL,
  metadata_json JSON NULL,
  created_by_broker_id INT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_tbcl_tenant_created (tenant_id, created_at),
  KEY idx_tbcl_tenant_broadcast (tenant_id, broadcast_id),
  KEY idx_tbcl_tenant_action (tenant_id, action),
  CONSTRAINT fk_tbcl_tenant
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  CONSTRAINT fk_tbcl_broadcast
    FOREIGN KEY (broadcast_id) REFERENCES realtor_broadcasts(id) ON DELETE SET NULL,
  CONSTRAINT fk_tbcl_broker
    FOREIGN KEY (created_by_broker_id) REFERENCES brokers(id) ON DELETE SET NULL
);

-- Seed current tenant with $20.00 available broadcast credits (one-time).
INSERT INTO tenant_broadcast_credits (
  tenant_id,
  available_balance_usd,
  reserved_balance_usd,
  total_spent_usd,
  currency
)
SELECT 1, 20.00, 0.00, 0.00, 'USD'
WHERE NOT EXISTS (
  SELECT 1 FROM tenant_broadcast_credits WHERE tenant_id = 1
);

INSERT INTO tenant_broadcast_credit_ledger (
  tenant_id,
  broadcast_id,
  action,
  amount_usd,
  note,
  metadata_json,
  created_by_broker_id
)
SELECT
  1,
  NULL,
  'seed',
  20.00,
  'Initial broadcast credits seed',
  JSON_OBJECT('seed_reason', 'tenant bootstrap', 'scope', 'broadcast_only'),
  NULL
WHERE NOT EXISTS (
  SELECT 1
  FROM tenant_broadcast_credit_ledger
  WHERE tenant_id = 1 AND action = 'seed' AND amount_usd = 20.00
);
