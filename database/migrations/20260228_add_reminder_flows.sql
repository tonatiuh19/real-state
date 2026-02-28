-- Migration: Add Reminder Flows System
-- Date: 2026-02-28
-- Description: Creates tables for automated client reminder flow builder
-- Compatible with MySQL 8.0 (HostGator)

-- --------------------------------------------------------
-- Table: reminder_flows
-- Description: Stores reminder flow templates (not linked to any specific loan)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `reminder_flows` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) NOT NULL DEFAULT 1,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `trigger_event` enum(
    'application_created',
    'task_pending',
    'task_in_progress',
    'task_overdue',
    'no_activity',
    'loan_approved',
    'loan_documents_pending',
    'manual'
  ) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'application_created',
  `trigger_delay_days` int(11) NOT NULL DEFAULT 0 COMMENT 'Days after trigger event to start flow',
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `apply_to_all_loans` tinyint(1) NOT NULL DEFAULT 1 COMMENT 'When true, applies to all current and future loans',
  `created_by_broker_id` int(11) DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_reminder_flows_tenant` (`tenant_id`),
  KEY `idx_reminder_flows_active` (`is_active`),
  KEY `fk_reminder_flows_broker` (`created_by_broker_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table: reminder_flow_steps
-- Description: Individual steps (nodes) in a reminder flow
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `reminder_flow_steps` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `flow_id` int(11) NOT NULL,
  `step_key` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Unique key within flow for React Flow node id',
  `step_type` enum(
    'trigger',
    'wait',
    'send_notification',
    'send_email',
    'send_sms',
    'condition',
    'end'
  ) COLLATE utf8mb4_unicode_ci NOT NULL,
  `label` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `config` json DEFAULT NULL COMMENT 'Step-specific configuration (message, delay hours/days, condition type, etc.)',
  `position_x` float NOT NULL DEFAULT 0 COMMENT 'X position on the flow canvas',
  `position_y` float NOT NULL DEFAULT 0 COMMENT 'Y position on the flow canvas',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_flow_steps_flow` (`flow_id`),
  CONSTRAINT `fk_flow_steps_flow` FOREIGN KEY (`flow_id`) REFERENCES `reminder_flows` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table: reminder_flow_connections
-- Description: Edges/connections between steps in a flow
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `reminder_flow_connections` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `flow_id` int(11) NOT NULL,
  `edge_key` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Unique key within flow for React Flow edge id',
  `source_step_key` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `target_step_key` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `label` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Edge label e.g. Yes / No for conditions',
  `edge_type` enum('default','condition_yes','condition_no') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'default',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_flow_connections_flow` (`flow_id`),
  CONSTRAINT `fk_flow_connections_flow` FOREIGN KEY (`flow_id`) REFERENCES `reminder_flows` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table: reminder_flow_executions
-- Description: Tracks active flow executions per loan/client
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `reminder_flow_executions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) NOT NULL DEFAULT 1,
  `flow_id` int(11) NOT NULL,
  `loan_application_id` int(11) DEFAULT NULL,
  `client_id` int(11) DEFAULT NULL,
  `current_step_key` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('active','paused','completed','cancelled','failed') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `next_execution_at` datetime DEFAULT NULL COMMENT 'When the next step should execute',
  `completed_steps` json DEFAULT NULL COMMENT 'Array of completed step keys',
  `started_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `completed_at` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_executions_flow` (`flow_id`),
  KEY `idx_executions_loan` (`loan_application_id`),
  KEY `idx_executions_client` (`client_id`),
  KEY `idx_executions_status` (`status`),
  KEY `idx_executions_next_exec` (`next_execution_at`),
  CONSTRAINT `fk_executions_flow` FOREIGN KEY (`flow_id`) REFERENCES `reminder_flows` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Log audit entry for this migration
-- --------------------------------------------------------
INSERT INTO `audit_logs` (
  `tenant_id`, `user_id`, `broker_id`, `actor_type`, `action`,
  `entity_type`, `entity_id`, `changes`, `status`, `created_at`
) VALUES (
  1, NULL, NULL, 'user', 'schema_migration',
  'reminder_flows_system', NULL,
  '{"migration": "20260228_add_reminder_flows", "tables_created": ["reminder_flows", "reminder_flow_steps", "reminder_flow_connections", "reminder_flow_executions"]}',
  'success', NOW()
);
