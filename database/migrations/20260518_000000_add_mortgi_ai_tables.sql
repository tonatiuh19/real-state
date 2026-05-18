-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: Add Mortgi AI assistant tables
-- Date: 2026-05-18
-- ─────────────────────────────────────────────────────────────────────────────

-- AI chat sessions (stores full message history per session)
CREATE TABLE IF NOT EXISTS `ai_chat_sessions` (
  `id`           INT           NOT NULL AUTO_INCREMENT,
  `tenant_id`    INT           NOT NULL DEFAULT 1,
  `user_type`    ENUM('broker','client') NOT NULL,
  `user_id`      INT           NOT NULL,
  `session_key`  VARCHAR(64)   NOT NULL COMMENT 'Unique per browser tab/day',
  `messages`     LONGTEXT      NOT NULL COMMENT 'JSON array of {role, content} objects',
  `tokens_used`  INT           NOT NULL DEFAULT 0,
  `created_at`   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_session_key` (`session_key`),
  INDEX `idx_user`   (`user_type`, `user_id`),
  INDEX `idx_tenant` (`tenant_id`),
  CONSTRAINT `fk_ai_sessions_tenant`
    FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Mortgi AI assistant chat sessions';

-- Mortgi configuration stored in system_settings (no new table needed)
-- Keys used:
--   mortgi_enabled                → boolean  (master switch)
--   mortgi_client_enabled         → boolean  (enable for client portal)
--   mortgi_broker_enabled         → boolean  (enable for admin/broker portal)
--   mortgi_system_prompt          → string   (custom system prompt override)
--   mortgi_broker_tools           → json     (array of enabled tool ids for brokers)
--   mortgi_client_tools           → json     (array of enabled tool ids for clients)
--   mortgi_daily_message_limit    → number   (per-user daily message cap)

INSERT IGNORE INTO `system_settings`
  (`tenant_id`, `setting_key`, `setting_value`, `setting_type`, `description`)
VALUES
  (1, 'mortgi_enabled',             'true',  'boolean', 'Master switch for Mortgi AI assistant'),
  (1, 'mortgi_client_enabled',      'true',  'boolean', 'Enable Mortgi for client portal'),
  (1, 'mortgi_broker_enabled',      'true',  'boolean', 'Enable Mortgi for admin/broker portal'),
  (1, 'mortgi_system_prompt',       '',      'string',  'Custom system prompt override (leave empty for default)'),
  (1, 'mortgi_daily_message_limit', '50',    'number',  'Max messages per user per day'),
  (1, 'mortgi_broker_tools',
      '["get_pipeline_summary","get_overdue_tasks","get_client_list","get_monthly_metrics","get_recent_leads","get_communication_activity","get_realtor_prospects"]',
      'json',    'Enabled broker tools'),
  (1, 'mortgi_client_tools',
      '["get_my_loan_status","get_my_pending_tasks","get_my_documents","get_my_next_meeting","get_pre_approval_info"]',
      'json',    'Enabled client tools');
