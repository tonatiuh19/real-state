-- Migration: 20260421_000001_add_flow_category_to_reminder_flows
-- Adds flow_category column to reminder_flows to distinguish between
-- loan pipeline flows and realtor prospecting flows.
-- Also extends trigger_event enum with realtor prospecting stage triggers.

-- 1. Add flow_category column
ALTER TABLE `reminder_flows`
  ADD COLUMN `flow_category` ENUM('loan', 'realtor_prospecting') NOT NULL DEFAULT 'loan'
  AFTER `loan_type_filter`;

-- 2. Extend trigger_event enum with realtor prospecting stages
ALTER TABLE `reminder_flows`
  MODIFY COLUMN `trigger_event` ENUM(
    -- Loan pipeline triggers (existing)
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
    'manual',
    -- Realtor prospecting stage triggers (new)
    'prospect_contact_attempted',
    'prospect_contacted',
    'prospect_appt_set',
    'prospect_waiting_for_1st_deal',
    'prospect_first_deal_funded',
    'prospect_second_deal_funded',
    'prospect_top_agent_whale'
  ) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'app_sent';

-- 3. Add index for efficient category filtering
ALTER TABLE `reminder_flows`
  ADD KEY `idx_reminder_flows_category` (`flow_category`, `is_active`);
