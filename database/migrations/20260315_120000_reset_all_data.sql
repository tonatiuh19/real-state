-- Migration: Reset all application data
-- Date: 2026-03-15
-- WARNING: This is destructive. It drops all app tables listed below.

SET FOREIGN_KEY_CHECKS = 0;

SET SESSION group_concat_max_len = 100000;

SET @drop_sql = NULL;

SELECT GROUP_CONCAT(
	CONCAT('DROP TABLE `', TABLE_NAME, '`')
	ORDER BY TABLE_NAME
	SEPARATOR '; '
)
INTO @drop_sql
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_SCHEMA = DATABASE()
	AND TABLE_NAME IN (
		'admin_section_controls',
		'application_status_history',
		'audit_logs',
		'broker_monthly_metrics',
		'broker_profiles',
		'broker_sessions',
		'brokers',
		'campaign_recipients',
		'campaigns',
		'clients',
		'communications',
		'compliance_checklist_items',
		'compliance_checklists',
		'contact_submissions',
		'conversation_threads',
		'documents',
		'environment_keys',
		'lead_activities',
		'leads',
		'loan_applications',
		'notifications',
		'pipeline_step_templates',
		'pre_approval_letters',
		'reminder_flow_connections',
		'reminder_flow_executions',
		'reminder_flow_steps',
		'reminder_flows',
		'system_settings',
		'task_documents',
		'task_form_fields',
		'task_form_responses',
		'task_signatures',
		'task_sign_documents',
		'task_templates',
		'tasks',
		'templates',
		'user_profiles',
		'user_sessions',
		'tenants'
	);

SET @drop_sql = IFNULL(@drop_sql, 'SELECT 1');

PREPARE stmt FROM @drop_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET FOREIGN_KEY_CHECKS = 1;
