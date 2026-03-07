-- Migration: Create contact_submissions table
-- Date: 2026-03-06
-- MySQL 8.0 compatible (HostGator)

CREATE TABLE IF NOT EXISTS `contact_submissions` (
  `id`                  INT(11)       NOT NULL AUTO_INCREMENT,
  `tenant_id`           INT(11)       NOT NULL DEFAULT 1,
  `name`                VARCHAR(255)  NOT NULL,
  `email`               VARCHAR(255)  NOT NULL,
  `phone`               VARCHAR(30)   DEFAULT NULL,
  `subject`             VARCHAR(255)  NOT NULL,
  `message`             TEXT          NOT NULL,
  `is_read`             TINYINT(1)    NOT NULL DEFAULT 0,
  `read_by_broker_id`   INT(11)       DEFAULT NULL,
  `read_at`             DATETIME      DEFAULT NULL,
  `created_at`          DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_contact_tenant` (`tenant_id`),
  INDEX `idx_contact_is_read` (`is_read`),
  INDEX `idx_contact_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
