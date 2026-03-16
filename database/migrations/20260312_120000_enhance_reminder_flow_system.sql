-- Migration: Enhance Reminder Flow System
-- Date: 2026-03-12
-- Compatible with MySQL 8.0 (HostGator)
-- Description:
--   1. Expand reminder_flows.trigger_event to cover all current pipeline status values
--   2. Add loan_type_filter column to reminder_flows (all | purchase | refinance)
--   3. Expand reminder_flow_steps.step_type: add wait_for_response, branch
--   4. Expand reminder_flow_connections.edge_type: add loan_type_purchase,
--      loan_type_refinance, no_response, responded
--   5. Add context_data, last_step_started_at, responded_at to reminder_flow_executions
--   6. Fix pipeline_step_templates.pipeline_step enum to match current
--      loan_applications.status values

-- ============================================================
-- 1. Update reminder_flows.trigger_event
--    Old values: application_created | task_pending | task_in_progress |
--                task_overdue | no_activity | loan_approved |
--                loan_documents_pending | manual
--    New values: all current pipeline statuses + generic events + manual
-- ============================================================
ALTER TABLE `reminder_flows`
  MODIFY COLUMN `trigger_event` enum(
    'app_sent',
    'application_received',
    'prequalified',
    'preapproved',
    'under_contract_loan_setup',
    'submitted_to_underwriting',
    'approved_with_conditions',
    'clear_to_close',
    'docs_out',
    'loan_funded',
    'task_pending',
    'task_in_progress',
    'task_overdue',
    'no_activity',
    'manual'
  ) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'app_sent';

-- Migrate legacy trigger event values to new equivalents
UPDATE `reminder_flows` SET `trigger_event` = 'app_sent'              WHERE `trigger_event` = 'application_created';
UPDATE `reminder_flows` SET `trigger_event` = 'approved_with_conditions' WHERE `trigger_event` = 'loan_approved';
UPDATE `reminder_flows` SET `trigger_event` = 'docs_out'              WHERE `trigger_event` = 'loan_documents_pending';

-- ============================================================
-- 2. Add loan_type_filter to reminder_flows
--    Controls which loan types this flow runs for
-- ============================================================
ALTER TABLE `reminder_flows`
  ADD COLUMN `loan_type_filter`
    enum('all','purchase','refinance')
    COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'all'
    COMMENT 'Restrict this flow to a specific loan type or all'
    AFTER `apply_to_all_loans`;

-- Index for efficient cron filtering by loan_type + trigger_event
ALTER TABLE `reminder_flows`
  ADD INDEX `idx_reminder_flows_trigger_loantype` (`trigger_event`, `loan_type_filter`, `is_active`);

-- ============================================================
-- 3. Expand reminder_flow_steps.step_type
--    Add: wait_for_response, branch
-- ============================================================
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

-- ============================================================
-- 4. Expand reminder_flow_connections.edge_type
--    Add: loan_type_purchase, loan_type_refinance, no_response, responded
-- ============================================================
ALTER TABLE `reminder_flow_connections`
  MODIFY COLUMN `edge_type` enum(
    'default',
    'condition_yes',
    'condition_no',
    'loan_type_purchase',
    'loan_type_refinance',
    'no_response',
    'responded'
  ) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'default';

-- ============================================================
-- 5. Enhance reminder_flow_executions
--    Add: context_data, last_step_started_at, responded_at
-- ============================================================
ALTER TABLE `reminder_flow_executions`
  ADD COLUMN `context_data` json DEFAULT NULL
    COMMENT 'Runtime context: loan_type, client info, application status, etc.'
    AFTER `completed_steps`,
  ADD COLUMN `last_step_started_at` datetime DEFAULT NULL
    COMMENT 'Timestamp when current step execution began (used for no_response timeout)'
    AFTER `context_data`,
  ADD COLUMN `responded_at` datetime DEFAULT NULL
    COMMENT 'Set when client responds; triggers responded edge on wait_for_response steps'
    AFTER `last_step_started_at`;

-- Index to quickly find executions waiting for response
ALTER TABLE `reminder_flow_executions`
  ADD INDEX `idx_executions_responded` (`responded_at`);

-- ============================================================
-- 6. Fix pipeline_step_templates.pipeline_step enum
--    Align with current loan_applications.status values
--    (the old enum used draft/submitted/etc; now app_sent/application_received/etc)
-- ============================================================

-- First drop rows that reference old-enum values that no longer exist in the
-- new set, to avoid FK / enum constraint violations during ALTER.
DELETE FROM `pipeline_step_templates`
WHERE `pipeline_step` NOT IN (
  'app_sent',
  'application_received',
  'prequalified',
  'preapproved',
  'under_contract_loan_setup',
  'submitted_to_underwriting',
  'approved_with_conditions',
  'clear_to_close',
  'docs_out',
  'loan_funded'
);

ALTER TABLE `pipeline_step_templates`
  MODIFY COLUMN `pipeline_step` enum(
    'app_sent',
    'application_received',
    'prequalified',
    'preapproved',
    'under_contract_loan_setup',
    'submitted_to_underwriting',
    'approved_with_conditions',
    'clear_to_close',
    'docs_out',
    'loan_funded'
  ) COLLATE utf8mb4_unicode_ci NOT NULL;

-- ============================================================
-- 7. ReminderFlowStep config JSON schema reference (comment only)
--    The `config` JSON column in reminder_flow_steps accepts these keys
--    depending on step_type:
--
--    wait:
--      { "delay_days": 3, "delay_hours": 0, "delay_minutes": 10 }
--
--    wait_for_response:
--      { "response_timeout_hours": 3, "response_timeout_minutes": 0 }
--
--    send_email / send_sms / send_notification:
--      { "message": "...", "subject": "...", "template_id": 1 }
--
--    condition / branch:
--      {
--        "condition_type": "loan_type" | "loan_status" | "task_completed" | "inactivity_days",
--        "condition_value": "purchase"   -- compared against context_data
--      }
--      For loan_type branch, leave condition_value empty — the engine
--      follows loan_type_purchase or loan_type_refinance edges automatically.
-- ============================================================

-- ============================================================
-- 8. Audit log
-- ============================================================
INSERT INTO `audit_logs` (
  `tenant_id`, `user_id`, `broker_id`, `actor_type`, `action`,
  `entity_type`, `entity_id`, `changes`, `status`, `created_at`
) VALUES (
  1, NULL, NULL, 'user', 'schema_migration',
  'reminder_flows_system', NULL,
  '{"migration":"20260312_120000_enhance_reminder_flow_system","changes":["trigger_event expanded to pipeline statuses","loan_type_filter added","step_type: wait_for_response + branch","edge_type: loan_type_purchase/refinance/no_response/responded","executions: context_data/last_step_started_at/responded_at","pipeline_step_templates enum aligned"]}',
  'success', NOW()
);
