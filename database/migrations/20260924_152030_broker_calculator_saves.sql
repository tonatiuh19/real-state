-- Broker calculator saves: CRM-linked loan/income worksheet snapshots (server-backed).
-- client_id required; loan_application_id optional.
-- Apply-to-loan appends a formatted snapshot to loan_applications.notes only.

CREATE TABLE IF NOT EXISTS `broker_calculator_saves` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `tenant_id` INT NOT NULL,
  `broker_id` INT NOT NULL COMMENT 'Creator broker',
  `client_id` INT NOT NULL,
  `loan_application_id` INT DEFAULT NULL,
  `kind` ENUM(
    'fha',
    'va',
    'conventional',
    'investment',
    'mobile_home',
    'income'
  ) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `summary_json` JSON DEFAULT NULL COMMENT 'Grid preview: payment, household_total, etc.',
  `payload_json` JSON NOT NULL COMMENT 'Full worksheet / loan calc inputs',
  `borrower_client_ids` JSON DEFAULT NULL COMMENT 'Wage earner: [id|null x4]',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_bcs_tenant_broker` (`tenant_id`, `broker_id`),
  KEY `idx_bcs_tenant_client` (`tenant_id`, `client_id`),
  KEY `idx_bcs_tenant_kind` (`tenant_id`, `kind`),
  KEY `idx_bcs_loan` (`loan_application_id`),
  CONSTRAINT `fk_bcs_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_bcs_broker` FOREIGN KEY (`broker_id`) REFERENCES `brokers` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_bcs_client` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_bcs_loan` FOREIGN KEY (`loan_application_id`) REFERENCES `loan_applications` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
