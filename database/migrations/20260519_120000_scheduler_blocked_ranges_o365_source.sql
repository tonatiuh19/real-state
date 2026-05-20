-- Migration: Add source and external_id to scheduler_blocked_ranges
-- Supports O365 calendar sync

ALTER TABLE `scheduler_blocked_ranges` ADD COLUMN `source` ENUM('manual', 'o365') NOT NULL DEFAULT 'manual' AFTER `label`;
ALTER TABLE `scheduler_blocked_ranges` ADD COLUMN `external_id` VARCHAR(500) NULL DEFAULT NULL AFTER `source`;

CREATE INDEX `idx_sbr_source_broker` ON `scheduler_blocked_ranges` (`broker_id`, `source`);
