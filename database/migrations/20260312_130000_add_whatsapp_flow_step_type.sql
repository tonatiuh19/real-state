-- Migration: Add send_whatsapp to reminder_flow_steps.step_type enum
-- Date: 2026-03-12
-- Compatible with MySQL 8.0 (HostGator)
-- Description: Adds 'send_whatsapp' as a valid step_type in reminder_flow_steps

ALTER TABLE `reminder_flow_steps`
  MODIFY COLUMN `step_type` enum(
    'trigger',
    'wait',
    'send_notification',
    'send_email',
    'send_sms',
    'send_whatsapp',
    'condition',
    'branch',
    'wait_for_response',
    'end'
  ) COLLATE utf8mb4_unicode_ci NOT NULL;

INSERT INTO `audit_logs` (
  `tenant_id`, `user_id`, `broker_id`, `actor_type`, `action`,
  `entity_type`, `entity_id`, `changes`, `status`, `created_at`
) VALUES (
  1, NULL, NULL, 'user', 'schema_migration',
  'reminder_flow_steps', NULL,
  '{"migration":"20260312_130000_add_whatsapp_flow_step_type","changes":["added send_whatsapp to reminder_flow_steps.step_type enum"]}',
  'success', NOW()
);
