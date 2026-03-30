-- Migration: Reset failed reminder flow executions for retry
-- Date: 2026-03-25
-- Description:
--   Executions #3 and #4 failed on 2026-03-17 because the `source_execution_id`
--   column did not yet exist in `communications` (added by 20260324_180000_conversation_reminder_sync.sql).
--   Now that the column exists and executeFlowSendStep has a try/catch wrapper,
--   these executions can be safely retried from their trigger step.

UPDATE `reminder_flow_executions`
SET
  status            = 'active',
  current_step_key  = 'trigger',
  completed_steps   = '[]',
  next_execution_at = NOW(),
  completed_at      = NULL,
  updated_at        = NOW()
WHERE id IN (3, 4)
  AND status = 'failed';

-- Log the migration
INSERT INTO `audit_logs`
  (`tenant_id`, `broker_id`, `client_id`, `loan_application_id`,
   `actor_type`, `action`, `resource_type`, `resource_id`,
   `metadata`, `status`, `created_at`)
VALUES (
  1, NULL, NULL, NULL,
  'user', 'schema_migration', 'reminder_flow_executions', NULL,
  '{"migration":"20260325_180000_reset_failed_flow_executions","description":"Reset failed executions #3 and #4 to active for retry after source_execution_id column was added"}',
  'success', NOW()
);
