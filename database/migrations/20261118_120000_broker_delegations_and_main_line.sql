-- Migration: 20261118_120000_broker_delegations_and_main_line
-- 1) broker_delegations: an owner broker grants a delegate (assistant/admin)
--    scoped access to their book of business and/or their personal Twilio line.
-- 2) Shared main line settings (main_line_number + ring group).
-- TiDB Cloud Serverless (MySQL 8.0 compatible). Non-breaking / idempotent.

CREATE TABLE IF NOT EXISTS `broker_delegations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tenant_id` int NOT NULL,
  `owner_broker_id` int NOT NULL COMMENT 'Broker whose data/line is shared',
  `delegate_broker_id` int NOT NULL COMMENT 'Broker who receives access',
  `can_view_clients` tinyint(1) NOT NULL DEFAULT 1,
  `can_view_realtors` tinyint(1) NOT NULL DEFAULT 1,
  `can_view_conversations` tinyint(1) NOT NULL DEFAULT 1,
  `can_send_from_line` tinyint(1) NOT NULL DEFAULT 0 COMMENT '1 = delegate may send SMS / call from owner twilio_caller_id',
  `created_by_broker_id` int DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `revoked_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_broker_delegation_pair` (`tenant_id`, `owner_broker_id`, `delegate_broker_id`),
  KEY `idx_broker_delegations_delegate` (`tenant_id`, `delegate_broker_id`, `revoked_at`),
  CONSTRAINT `fk_broker_delegations_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_broker_delegations_owner` FOREIGN KEY (`owner_broker_id`) REFERENCES `brokers` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_broker_delegations_delegate` FOREIGN KEY (`delegate_broker_id`) REFERENCES `brokers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `system_settings` (`tenant_id`, `setting_key`, `setting_value`, `setting_type`, `description`)
VALUES
  (1, 'main_line_number', '', 'string', 'E.164 company main line (shared). Default outbound caller ID / SMS line; inbound rings the main line ring group.'),
  (1, 'main_line_ring_broker_ids', '', 'json', 'JSON array of broker ids that always ring for main-line calls (in addition to available brokers).')
ON DUPLICATE KEY UPDATE `setting_key` = `setting_key`;
