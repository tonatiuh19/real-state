-- Free Analysis (OFG-compatible PDF credit analysis) for Encore Mortgage
-- TiDB / MySQL 8 compatible

CREATE TABLE IF NOT EXISTS `credit_analyses` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `tenant_id` INT NOT NULL DEFAULT 1,
  `client_id` INT NOT NULL,
  `broker_user_id` INT NULL COMMENT 'Broker who ran the analysis (NULL for portal self-upload)',
  `mode` ENUM('client','agent') NOT NULL DEFAULT 'client',
  `language` ENUM('en','es') NOT NULL DEFAULT 'en',
  `goal` VARCHAR(255) NULL,
  `provider_detected` VARCHAR(40) NULL,
  `extraction_status` ENUM('ok','empty','parse_failed','unsupported_type') NOT NULL DEFAULT 'ok',
  `chars_extracted` INT NOT NULL DEFAULT 0,
  `scores_json` JSON NULL,
  `negatives_json` JSON NULL,
  `labels_suggested_json` JSON NULL,
  `analyst_json` JSON NULL,
  `analysis_html` MEDIUMTEXT NULL,
  `analysis_text` MEDIUMTEXT NULL,
  `email_opt_in` TINYINT(1) NOT NULL DEFAULT 0,
  `email_sent_at` DATETIME NULL,
  `generated_at` DATETIME NULL,
  `report_storage_key` VARCHAR(500) NULL,
  `report_file_name` VARCHAR(255) NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_credit_analyses_tenant_client` (`tenant_id`, `client_id`),
  KEY `idx_credit_analyses_client` (`client_id`),
  KEY `idx_credit_analyses_broker` (`broker_user_id`),
  KEY `idx_credit_analyses_generated` (`generated_at`),
  CONSTRAINT `fk_credit_analyses_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_credit_analyses_client` FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_credit_analyses_broker` FOREIGN KEY (`broker_user_id`) REFERENCES `brokers`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed free-analysis section visibility for admin + broker on all tenants
-- (same visibility pattern as income-calculator)
INSERT INTO broker_role_section_permissions (tenant_id, broker_role, section_id, is_visible)
SELECT t.id, 'admin', 'free-analysis', 1
FROM tenants t
WHERE NOT EXISTS (
  SELECT 1 FROM broker_role_section_permissions p
  WHERE p.tenant_id = t.id AND p.broker_role = 'admin' AND p.section_id = 'free-analysis'
);

INSERT INTO broker_role_section_permissions (tenant_id, broker_role, section_id, is_visible)
SELECT t.id, 'broker', 'free-analysis', 1
FROM tenants t
WHERE NOT EXISTS (
  SELECT 1 FROM broker_role_section_permissions p
  WHERE p.tenant_id = t.id AND p.broker_role = 'broker' AND p.section_id = 'free-analysis'
);
