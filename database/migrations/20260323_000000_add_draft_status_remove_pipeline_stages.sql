-- Migration: Add 'draft' status to loan_applications and update default
-- Adds 'draft' as the first pipeline stage (replaces 'app_sent' as default)
-- Note: 'app_sent' and 'prequalified' are retained in the enum for backward compatibility
--       but are no longer shown in the pipeline UI.

ALTER TABLE `loan_applications`
  MODIFY COLUMN `status` enum(
    'draft',
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
  ) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'draft';
