-- Migration: Add scheduler_blocked_ranges table
-- Allows brokers/partners to block specific date/time ranges
-- so clients cannot book during those periods.
-- Created: 2026-04-17

CREATE TABLE IF NOT EXISTS `scheduler_blocked_ranges` (
  `id`             int(11)      NOT NULL AUTO_INCREMENT,
  `tenant_id`      int(11)      NOT NULL DEFAULT '1',
  `broker_id`      int(11)      NOT NULL,
  `start_datetime` datetime     NOT NULL COMMENT 'Inclusive start of blocked window',
  `end_datetime`   datetime     NOT NULL COMMENT 'Inclusive end of blocked window',
  `label`          varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Optional display label e.g. Vacation',
  `created_at`     timestamp    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_sbr_broker_range` (`broker_id`, `start_datetime`, `end_datetime`),
  CONSTRAINT `fk_sbr_broker` FOREIGN KEY (`broker_id`) REFERENCES `brokers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
