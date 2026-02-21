-- Migration: Add pipeline_step_templates table
-- Date: 2026-02-20
-- Description: Supports assigning communication templates (email/sms/whatsapp)
--              to specific loan pipeline steps so they can be triggered
--              automatically when a loan transitions to that step.

-- --------------------------------------------------------
-- Table: pipeline_step_templates
-- Maps a communication template to a pipeline step + channel combination
-- --------------------------------------------------------

CREATE TABLE IF NOT EXISTS `pipeline_step_templates` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) NOT NULL DEFAULT '1',
  `pipeline_step` enum(
    'draft',
    'submitted',
    'under_review',
    'documents_pending',
    'underwriting',
    'conditional_approval',
    'approved',
    'denied',
    'closed',
    'cancelled'
  ) COLLATE utf8mb4_unicode_ci NOT NULL,
  `communication_type` enum('email','sms','whatsapp')
    COLLATE utf8mb4_unicode_ci NOT NULL,
  `template_id` int(11) NOT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_by_broker_id` int(11) DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  -- Only one active mapping per tenant + step + channel
  UNIQUE KEY `unique_tenant_step_channel` (`tenant_id`, `pipeline_step`, `communication_type`),
  KEY `idx_pipeline_step_templates_tenant` (`tenant_id`),
  KEY `idx_pipeline_step_templates_step` (`pipeline_step`),
  KEY `fk_pst_template` (`template_id`),
  CONSTRAINT `fk_pst_template`
    FOREIGN KEY (`template_id`) REFERENCES `templates` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Audit log entry for this migration
INSERT IGNORE INTO `audit_logs`
  (`tenant_id`, `user_id`, `broker_id`, `actor_type`, `action`, `entity_type`, `changes`, `status`, `created_at`)
VALUES
  (1, NULL, 1, 'broker', 'schema_migration', 'pipeline_step_templates',
   JSON_OBJECT('migration', '20260220_add_pipeline_step_templates', 'action', 'create_table'),
   'success', NOW());
