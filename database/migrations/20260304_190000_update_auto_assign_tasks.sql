-- ============================================================
-- Migration: 20260304_190000_update_auto_assign_tasks.sql
-- Description: Update task auto-assignment logic per new flowchart:
--   - Add retired_with_pension to user_profiles.employment_status enum
--   - Rename template #42 to include Business Tax Returns
--   - Add 6 new task templates + form fields
-- ============================================================

-- 1. Add retired_with_pension to user_profiles.employment_status enum
ALTER TABLE `user_profiles`
  MODIFY COLUMN `employment_status`
    ENUM('employed','self_employed','unemployed','retired','retired_with_pension')
    COLLATE utf8mb4_unicode_ci DEFAULT NULL;

-- 2. Rename template #42 "Federal Tax Returns (Last 2 Years)"
--    → "Federal Tax Returns Last 2 Years Including Business Tax Returns"
UPDATE `task_templates`
SET
  `title`                  = 'Federal Tax Returns Last 2 Years Including Business Tax Returns',
  `description`            = 'Provide signed federal tax returns (Form 1040) for the last two years, including all business tax returns (Schedule C, 1120-S, 1065, etc.) and all schedules.',
  `document_instructions`  = 'Attach complete and signed IRS Form 1040 with all business tax returns (Schedule C, 1120-S, 1065, etc.) for the last two tax years.',
  `updated_at`             = NOW()
WHERE `id` = 42 AND `tenant_id` = 1;

-- 3. Insert 6 new task templates (IDs 58–63)
INSERT INTO `task_templates`
  (`tenant_id`, `title`, `description`, `task_type`, `priority`,
   `default_due_days`, `order_index`, `is_active`, `created_by_broker_id`,
   `requires_documents`, `document_instructions`, `has_custom_form`,
   `has_signing`, `created_at`, `updated_at`)
VALUES

-- ID 58 — replaces "Housing Payment Statement" in always-assign
(1,
 '2 Months Bank Statements',
 'Provide your last two months of bank statements for all accounts.',
 'document_verification', 'medium', 14, 14, 1, 1, 1,
 'Attach the last two months of all bank account statements. Must show account holder name, partial account number, and all transactions.',
 0, 0, NOW(), NOW()),

-- ID 59 — W-2 income path
(1,
 'Most Recent Pay-Stubs (1 Month)',
 'Provide your most recent one month of consecutive pay stubs from your employer.',
 'document_verification', 'high', 10, 17, 1, 1, 1,
 'Attach your most recent consecutive pay stubs covering at least one month. Must show employer name, gross pay, deductions, and year-to-date totals.',
 0, 0, NOW(), NOW()),

-- ID 60 — convergence point for all income types
(1,
 'Federal Tax Returns (Last 2 Years) or Schedule C (Last 2 Years)',
 'Provide your federal income tax returns or Schedule C for the last two tax years.',
 'document_verification', 'high', 14, 22, 1, 1, 1,
 'Attach your complete and signed federal tax returns (Form 1040) or Schedule C for the last two tax years. Include all schedules and attachments.',
 0, 0, NOW(), NOW()),

-- ID 61 — property type (condo / single_family / multi_family)
(1,
 'Mortgage Statement',
 'Provide the most recent mortgage statement for the subject property.',
 'document_verification', 'medium', 10, 31, 1, 1, 1,
 'Attach your most recent mortgage statement showing outstanding balance, monthly payment, lender name, and property address.',
 0, 0, NOW(), NOW()),

-- ID 62 — property type paths AND refinance/home_equity loan type
(1,
 'Insurance Policy',
 'Provide the current homeowners or property insurance policy for the subject property.',
 'document_verification', 'medium', 14, 32, 1, 1, 1,
 'Attach the current insurance policy (declaration page). Must include policy number, coverage amounts, property address, named insured, and effective dates.',
 0, 0, NOW(), NOW()),

-- ID 63 — refinance / home_equity loan type (replaces "Current Mortgage Statement" + "Property Tax Bill")
(1,
 'Current Mortgage Statement / Payoff Letter',
 'Provide the most recent mortgage statement or an official payoff letter for the property being refinanced.',
 'document_verification', 'high', 7, 33, 1, 1, 1,
 'Attach your most recent mortgage statement or an official payoff letter from your lender. Must show current balance, monthly payment, and lender contact information.',
 0, 0, NOW(), NOW());

-- 4. Add default document upload form fields for each new template
INSERT INTO `task_form_fields`
  (`task_template_id`, `field_name`, `field_label`, `field_type`,
   `is_required`, `order_index`, `help_text`, `created_at`)
VALUES
(58, 'document_upload', 'Attach Document', 'file_pdf', 1, 0,
 'Attach the last two months of all bank account statements. Must show account holder name, partial account number, and all transactions.', NOW()),

(59, 'document_upload', 'Attach Document', 'file_pdf', 1, 0,
 'Attach your most recent consecutive pay stubs covering at least one month. Must show employer name, gross pay, deductions, and year-to-date totals.', NOW()),

(60, 'document_upload', 'Attach Document', 'file_pdf', 1, 0,
 'Attach your complete and signed federal tax returns (Form 1040) or Schedule C for the last two tax years. Include all schedules and attachments.', NOW()),

(61, 'document_upload', 'Attach Document', 'file_pdf', 1, 0,
 'Attach your most recent mortgage statement showing outstanding balance, monthly payment, lender name, and property address.', NOW()),

(62, 'document_upload', 'Attach Document', 'file_pdf', 1, 0,
 'Attach the current insurance policy (declaration page). Must include policy number, coverage amounts, property address, named insured, and effective dates.', NOW()),

(63, 'document_upload', 'Attach Document', 'file_pdf', 1, 0,
 'Attach your most recent mortgage statement or an official payoff letter from your lender. Must show current balance, monthly payment, and lender contact information.', NOW());
