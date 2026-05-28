-- ============================================================
-- Migration: Delete ALL data for tenant_id = 2
-- Date: 2026-05-26
-- ⚠️  DESTRUCTIVE — REVIEW CAREFULLY BEFORE APPLYING
-- ⚠️  This does NOT delete the tenants row itself (id = 2)
-- ⚠️  This CANNOT be undone. Take a snapshot/backup first.
-- ============================================================
--
-- TENANT 1 SAFETY ANALYSIS
-- ─────────────────────────────────────────────────────────────
-- Every DELETE in this file is isolated to tenant 2 in one of
-- two ways:
--
--   A) Direct scope:   WHERE tenant_id = 2
--      Applied to all 38 tables that carry a tenant_id column.
--
--   B) Subquery scope: WHERE <fk_col> IN
--                        (SELECT id FROM <parent> WHERE tenant_id = 2)
--      Applied to 13 child tables that have no tenant_id column
--      themselves but are owned by a tenant-2 parent row.
--      Since parent IDs for tenant 2 cannot overlap with tenant 1
--      parent IDs (auto-increment PKs are unique across all tenants),
--      these subqueries are 100% tenant-1-safe.
--
-- RECOMMENDED WORKFLOW
-- ─────────────────────────────────────────────────────────────
--   1. Run STEP 0 (dry-run counts) first — review the numbers.
--   2. Run the full file inside a transaction.
--   3. Check STEP 4 verification: all tenant-2 counts must be 0.
--   4. Check STEP 5 verification: all tenant-1 counts must be > 0.
--   5. COMMIT if clean, ROLLBACK otherwise.
-- ============================================================

-- ──────────────────────────────────────────────────────────
-- STEP 0: DRY-RUN — rows that WILL be deleted for tenant 2
--         Run this SELECT independently before starting the
--         transaction to confirm the scope.
-- ──────────────────────────────────────────────────────────
/*
SELECT 'admin_section_controls'        AS tbl, COUNT(*) AS to_delete FROM admin_section_controls        WHERE tenant_id = 2
UNION ALL SELECT 'ai_chat_sessions',             COUNT(*) FROM ai_chat_sessions             WHERE tenant_id = 2
UNION ALL SELECT 'application_status_history',   COUNT(*) FROM application_status_history   WHERE tenant_id = 2
UNION ALL SELECT 'audit_logs',                   COUNT(*) FROM audit_logs                   WHERE tenant_id = 2
UNION ALL SELECT 'broker_monthly_metrics',       COUNT(*) FROM broker_monthly_metrics       WHERE tenant_id = 2
UNION ALL SELECT 'brokers',                      COUNT(*) FROM brokers                      WHERE tenant_id = 2
UNION ALL SELECT 'calendar_events',              COUNT(*) FROM calendar_events              WHERE tenant_id = 2
UNION ALL SELECT 'campaigns',                    COUNT(*) FROM campaigns                    WHERE tenant_id = 2
UNION ALL SELECT 'clients',                      COUNT(*) FROM clients                      WHERE tenant_id = 2
UNION ALL SELECT 'communications',               COUNT(*) FROM communications               WHERE tenant_id = 2
UNION ALL SELECT 'compliance_checklists',        COUNT(*) FROM compliance_checklists        WHERE tenant_id = 2
UNION ALL SELECT 'contact_submissions',          COUNT(*) FROM contact_submissions          WHERE tenant_id = 2
UNION ALL SELECT 'conversation_email_mailboxes', COUNT(*) FROM conversation_email_mailboxes WHERE tenant_id = 2
UNION ALL SELECT 'conversation_threads',         COUNT(*) FROM conversation_threads         WHERE tenant_id = 2
UNION ALL SELECT 'documents',                    COUNT(*) FROM documents                    WHERE tenant_id = 2
UNION ALL SELECT 'email_attachment_cache',       COUNT(*) FROM email_attachment_cache       WHERE tenant_id = 2
UNION ALL SELECT 'email_drafts',                 COUNT(*) FROM email_drafts                 WHERE tenant_id = 2
UNION ALL SELECT 'email_signatures',             COUNT(*) FROM email_signatures             WHERE tenant_id = 2
UNION ALL SELECT 'email_sync_log',               COUNT(*) FROM email_sync_log               WHERE tenant_id = 2
UNION ALL SELECT 'leads',                        COUNT(*) FROM leads                        WHERE tenant_id = 2
UNION ALL SELECT 'loan_applications',            COUNT(*) FROM loan_applications            WHERE tenant_id = 2
UNION ALL SELECT 'notifications',                COUNT(*) FROM notifications                WHERE tenant_id = 2
UNION ALL SELECT 'pipeline_step_templates',      COUNT(*) FROM pipeline_step_templates      WHERE tenant_id = 2
UNION ALL SELECT 'pre_approval_letters',         COUNT(*) FROM pre_approval_letters         WHERE tenant_id = 2
UNION ALL SELECT 'realtor_prospects',            COUNT(*) FROM realtor_prospects            WHERE tenant_id = 2
UNION ALL SELECT 'reminder_flow_executions',     COUNT(*) FROM reminder_flow_executions     WHERE tenant_id = 2
UNION ALL SELECT 'reminder_flow_step_logs',      COUNT(*) FROM reminder_flow_step_logs      WHERE tenant_id = 2
UNION ALL SELECT 'reminder_flows',               COUNT(*) FROM reminder_flows               WHERE tenant_id = 2
UNION ALL SELECT 'scheduled_meetings',           COUNT(*) FROM scheduled_meetings           WHERE tenant_id = 2
UNION ALL SELECT 'scheduler_availability',       COUNT(*) FROM scheduler_availability       WHERE tenant_id = 2
UNION ALL SELECT 'scheduler_blocked_ranges',     COUNT(*) FROM scheduler_blocked_ranges     WHERE tenant_id = 2
UNION ALL SELECT 'scheduler_settings',           COUNT(*) FROM scheduler_settings           WHERE tenant_id = 2
UNION ALL SELECT 'system_settings',              COUNT(*) FROM system_settings              WHERE tenant_id = 2
UNION ALL SELECT 'task_sign_documents',          COUNT(*) FROM task_sign_documents          WHERE tenant_id = 2
UNION ALL SELECT 'task_signatures',              COUNT(*) FROM task_signatures              WHERE tenant_id = 2
UNION ALL SELECT 'task_templates',               COUNT(*) FROM task_templates               WHERE tenant_id = 2
UNION ALL SELECT 'tasks',                        COUNT(*) FROM tasks                        WHERE tenant_id = 2
UNION ALL SELECT 'templates',                    COUNT(*) FROM templates                    WHERE tenant_id = 2;
*/

START TRANSACTION;

SET FOREIGN_KEY_CHECKS = 0;

-- ──────────────────────────────────────────────────────────
-- STEP 1: Child tables with NO direct tenant_id
--         Must be deleted explicitly (not auto-cascaded when
--         FK checks are disabled)
-- ──────────────────────────────────────────────────────────

-- reminder_flow_step_logs  →  reminder_flow_executions (CASCADE)
DELETE FROM reminder_flow_step_logs
WHERE execution_id IN (
    SELECT id FROM reminder_flow_executions WHERE tenant_id = 2
);

-- reminder_flow_connections  →  reminder_flows (CASCADE)
DELETE FROM reminder_flow_connections
WHERE flow_id IN (
    SELECT id FROM reminder_flows WHERE tenant_id = 2
);

-- reminder_flow_steps  →  reminder_flows (CASCADE)
DELETE FROM reminder_flow_steps
WHERE flow_id IN (
    SELECT id FROM reminder_flows WHERE tenant_id = 2
);

-- task_form_responses  →  tasks (CASCADE) + task_form_fields (CASCADE)
DELETE FROM task_form_responses
WHERE task_id IN (
    SELECT id FROM tasks WHERE tenant_id = 2
);

-- task_documents  →  tasks (CASCADE)
DELETE FROM task_documents
WHERE task_id IN (
    SELECT id FROM tasks WHERE tenant_id = 2
);

-- task_form_fields  →  task_templates (CASCADE)
--   (task_form_responses already cleared above)
DELETE FROM task_form_fields
WHERE task_template_id IN (
    SELECT id FROM task_templates WHERE tenant_id = 2
);

-- compliance_checklist_items  →  compliance_checklists (CASCADE)
DELETE FROM compliance_checklist_items
WHERE checklist_id IN (
    SELECT id FROM compliance_checklists WHERE tenant_id = 2
);

-- campaign_recipients  →  campaigns (CASCADE)
DELETE FROM campaign_recipients
WHERE campaign_id IN (
    SELECT id FROM campaigns WHERE tenant_id = 2
);

-- lead_activities  →  leads (CASCADE)
DELETE FROM lead_activities
WHERE lead_id IN (
    SELECT id FROM leads WHERE tenant_id = 2
);

-- user_sessions  →  clients (CASCADE)
DELETE FROM user_sessions
WHERE user_id IN (
    SELECT id FROM clients WHERE tenant_id = 2
);

-- user_profiles  →  clients (CASCADE)
DELETE FROM user_profiles
WHERE user_id IN (
    SELECT id FROM clients WHERE tenant_id = 2
);

-- broker_sessions  →  brokers (CASCADE)
DELETE FROM broker_sessions
WHERE broker_id IN (
    SELECT id FROM brokers WHERE tenant_id = 2
);

-- broker_profiles  →  brokers (CASCADE)
DELETE FROM broker_profiles
WHERE broker_id IN (
    SELECT id FROM brokers WHERE tenant_id = 2
);

-- ──────────────────────────────────────────────────────────
-- STEP 2: Tables with a direct tenant_id = 2 column
--         Ordered logically (deepest dependents first)
-- ──────────────────────────────────────────────────────────

-- Audit / logging
DELETE FROM audit_logs                WHERE tenant_id = 2;
DELETE FROM broker_monthly_metrics    WHERE tenant_id = 2;

-- AI
DELETE FROM ai_chat_sessions          WHERE tenant_id = 2;

-- Reminder flows
DELETE FROM reminder_flow_step_logs   WHERE tenant_id = 2;  -- belt-and-suspenders
DELETE FROM reminder_flow_executions  WHERE tenant_id = 2;
DELETE FROM reminder_flows            WHERE tenant_id = 2;

-- Tasks
DELETE FROM task_sign_documents       WHERE tenant_id = 2;
DELETE FROM task_signatures           WHERE tenant_id = 2;
-- task_form_responses has no tenant_id column; already cleared in STEP 1 via task_id subquery
DELETE FROM tasks                     WHERE tenant_id = 2;
DELETE FROM task_templates            WHERE tenant_id = 2;

-- Applications and related
DELETE FROM application_status_history WHERE tenant_id = 2;
DELETE FROM compliance_checklists      WHERE tenant_id = 2;
DELETE FROM documents                  WHERE tenant_id = 2;
DELETE FROM pre_approval_letters       WHERE tenant_id = 2;
DELETE FROM pipeline_step_templates    WHERE tenant_id = 2;
DELETE FROM loan_applications          WHERE tenant_id = 2;

-- Communications
DELETE FROM email_sync_log             WHERE tenant_id = 2;
DELETE FROM email_attachment_cache     WHERE tenant_id = 2;
DELETE FROM email_drafts               WHERE tenant_id = 2;
DELETE FROM email_signatures           WHERE tenant_id = 2;
DELETE FROM communications             WHERE tenant_id = 2;
DELETE FROM conversation_threads       WHERE tenant_id = 2;
DELETE FROM conversation_email_mailboxes WHERE tenant_id = 2;

-- Campaigns / leads
DELETE FROM campaigns                  WHERE tenant_id = 2;
DELETE FROM leads                      WHERE tenant_id = 2;

-- Notifications / settings
DELETE FROM notifications              WHERE tenant_id = 2;
DELETE FROM system_settings            WHERE tenant_id = 2;
DELETE FROM admin_section_controls     WHERE tenant_id = 2;

-- Scheduler
DELETE FROM scheduler_availability     WHERE tenant_id = 2;
DELETE FROM scheduler_blocked_ranges   WHERE tenant_id = 2;
DELETE FROM scheduler_settings         WHERE tenant_id = 2;
DELETE FROM scheduled_meetings         WHERE tenant_id = 2;
DELETE FROM calendar_events            WHERE tenant_id = 2;

-- Realtor prospects
DELETE FROM realtor_prospects          WHERE tenant_id = 2;

-- Contact form
DELETE FROM contact_submissions        WHERE tenant_id = 2;

-- Templates (after pipeline_step_templates is cleared)
DELETE FROM templates                  WHERE tenant_id = 2;

-- Clients (user_profiles / user_sessions already cleared above)
DELETE FROM clients                    WHERE tenant_id = 2;

-- Brokers (broker_profiles / broker_sessions already cleared above)
DELETE FROM brokers                    WHERE tenant_id = 2;

-- ──────────────────────────────────────────────────────────
-- STEP 3: Re-enable FK checks
-- ──────────────────────────────────────────────────────────

SET FOREIGN_KEY_CHECKS = 1;

-- ──────────────────────────────────────────────────────────
-- STEP 4: Verification — all counts must be 0
-- ──────────────────────────────────────────────────────────

SELECT 'admin_section_controls'      AS tbl, COUNT(*) AS remaining FROM admin_section_controls      WHERE tenant_id = 2
UNION ALL
SELECT 'ai_chat_sessions',                    COUNT(*) FROM ai_chat_sessions                    WHERE tenant_id = 2
UNION ALL
SELECT 'application_status_history',          COUNT(*) FROM application_status_history          WHERE tenant_id = 2
UNION ALL
SELECT 'audit_logs',                          COUNT(*) FROM audit_logs                          WHERE tenant_id = 2
UNION ALL
SELECT 'broker_monthly_metrics',              COUNT(*) FROM broker_monthly_metrics              WHERE tenant_id = 2
UNION ALL
SELECT 'brokers',                             COUNT(*) FROM brokers                             WHERE tenant_id = 2
UNION ALL
SELECT 'calendar_events',                     COUNT(*) FROM calendar_events                     WHERE tenant_id = 2
UNION ALL
SELECT 'campaigns',                           COUNT(*) FROM campaigns                           WHERE tenant_id = 2
UNION ALL
SELECT 'clients',                             COUNT(*) FROM clients                             WHERE tenant_id = 2
UNION ALL
SELECT 'communications',                      COUNT(*) FROM communications                      WHERE tenant_id = 2
UNION ALL
SELECT 'compliance_checklists',               COUNT(*) FROM compliance_checklists               WHERE tenant_id = 2
UNION ALL
SELECT 'contact_submissions',                 COUNT(*) FROM contact_submissions                 WHERE tenant_id = 2
UNION ALL
SELECT 'conversation_email_mailboxes',        COUNT(*) FROM conversation_email_mailboxes        WHERE tenant_id = 2
UNION ALL
SELECT 'conversation_threads',                COUNT(*) FROM conversation_threads                WHERE tenant_id = 2
UNION ALL
SELECT 'documents',                           COUNT(*) FROM documents                           WHERE tenant_id = 2
UNION ALL
SELECT 'email_attachment_cache',              COUNT(*) FROM email_attachment_cache              WHERE tenant_id = 2
UNION ALL
SELECT 'email_drafts',                        COUNT(*) FROM email_drafts                        WHERE tenant_id = 2
UNION ALL
SELECT 'email_signatures',                    COUNT(*) FROM email_signatures                    WHERE tenant_id = 2
UNION ALL
SELECT 'email_sync_log',                      COUNT(*) FROM email_sync_log                      WHERE tenant_id = 2
UNION ALL
SELECT 'leads',                               COUNT(*) FROM leads                               WHERE tenant_id = 2
UNION ALL
SELECT 'loan_applications',                   COUNT(*) FROM loan_applications                   WHERE tenant_id = 2
UNION ALL
SELECT 'notifications',                       COUNT(*) FROM notifications                       WHERE tenant_id = 2
UNION ALL
SELECT 'pipeline_step_templates',             COUNT(*) FROM pipeline_step_templates             WHERE tenant_id = 2
UNION ALL
SELECT 'pre_approval_letters',                COUNT(*) FROM pre_approval_letters                WHERE tenant_id = 2
UNION ALL
SELECT 'realtor_prospects',                   COUNT(*) FROM realtor_prospects                   WHERE tenant_id = 2
UNION ALL
SELECT 'reminder_flow_executions',            COUNT(*) FROM reminder_flow_executions            WHERE tenant_id = 2
UNION ALL
SELECT 'reminder_flow_step_logs',             COUNT(*) FROM reminder_flow_step_logs             WHERE tenant_id = 2
UNION ALL
SELECT 'reminder_flows',                      COUNT(*) FROM reminder_flows                      WHERE tenant_id = 2
UNION ALL
SELECT 'scheduled_meetings',                  COUNT(*) FROM scheduled_meetings                  WHERE tenant_id = 2
UNION ALL
SELECT 'scheduler_availability',              COUNT(*) FROM scheduler_availability              WHERE tenant_id = 2
UNION ALL
SELECT 'scheduler_blocked_ranges',            COUNT(*) FROM scheduler_blocked_ranges            WHERE tenant_id = 2
UNION ALL
SELECT 'scheduler_settings',                  COUNT(*) FROM scheduler_settings                  WHERE tenant_id = 2
UNION ALL
SELECT 'system_settings',                     COUNT(*) FROM system_settings                     WHERE tenant_id = 2
UNION ALL
SELECT 'task_sign_documents',                 COUNT(*) FROM task_sign_documents                 WHERE tenant_id = 2
UNION ALL
SELECT 'task_signatures',                     COUNT(*) FROM task_signatures                     WHERE tenant_id = 2
UNION ALL
SELECT 'task_templates',                      COUNT(*) FROM task_templates                      WHERE tenant_id = 2
UNION ALL
SELECT 'tasks',                               COUNT(*) FROM tasks                               WHERE tenant_id = 2
UNION ALL
SELECT 'templates',                           COUNT(*) FROM templates                           WHERE tenant_id = 2;

-- If all counts above are 0, check tenant 1 below, then COMMIT.

-- ──────────────────────────────────────────────────────────
-- STEP 5: Tenant 1 sanity check — ALL counts must be > 0
--         If any row here is 0, something went wrong → ROLLBACK
-- ──────────────────────────────────────────────────────────

SELECT 'brokers (tenant 1)'        AS tbl, COUNT(*) AS count FROM brokers        WHERE tenant_id = 1
UNION ALL
SELECT 'clients (tenant 1)',                COUNT(*) FROM clients        WHERE tenant_id = 1
UNION ALL
SELECT 'loan_applications (tenant 1)',      COUNT(*) FROM loan_applications WHERE tenant_id = 1
UNION ALL
SELECT 'tasks (tenant 1)',                  COUNT(*) FROM tasks          WHERE tenant_id = 1
UNION ALL
SELECT 'templates (tenant 1)',              COUNT(*) FROM templates      WHERE tenant_id = 1
UNION ALL
SELECT 'leads (tenant 1)',                  COUNT(*) FROM leads          WHERE tenant_id = 1
UNION ALL
SELECT 'documents (tenant 1)',              COUNT(*) FROM documents      WHERE tenant_id = 1
UNION ALL
SELECT 'communications (tenant 1)',         COUNT(*) FROM communications WHERE tenant_id = 1;

-- ✅ All tenant-2 counts = 0  AND  all tenant-1 counts > 0 → safe to commit
COMMIT;

-- ❌ Any tenant-2 count ≠ 0  OR  any tenant-1 count = 0   → investigate
-- ROLLBACK;
