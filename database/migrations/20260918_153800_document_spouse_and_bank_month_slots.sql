-- Document checklist: spouse ID/SSN optional slots + bank Month 1 / Month 2
-- Spec decisions: 1A (always show optional spouse), 2A (exactly 2 bank months).
-- Updates templates 34 (ID), 37 (SSN), 58 (2 Months Bank Statements).
-- TiDB Cloud Serverless (MySQL 8.0 compatible).

-- ── Government-Issued ID (template 34) ───────────────────────────────────────
UPDATE `task_form_fields`
SET
  `field_name` = 'borrower_id',
  `field_label` = 'Borrower ID',
  `is_required` = 1,
  `order_index` = 0,
  `help_text` = 'Attach a clear photo or scan of the primary borrower''s valid government-issued ID (passport, driver license, state ID, etc.).'
WHERE `id` = 35 AND `task_template_id` = 34;

INSERT INTO `task_form_fields`
  (`task_template_id`, `field_name`, `field_label`, `field_type`, `is_required`, `order_index`, `help_text`)
SELECT 34, 'spouse_id', 'Spouse / Co-borrower ID', 'file_pdf', 0, 1,
  'Optional — attach the spouse or co-borrower''s government-issued ID when applying as a couple.'
FROM DUAL
WHERE NOT EXISTS (
  SELECT 1 FROM `task_form_fields`
  WHERE `task_template_id` = 34 AND `field_name` = 'spouse_id'
);

UPDATE `task_templates`
SET
  `document_instructions` = 'Upload the borrower''s ID (required). Optionally add a spouse / co-borrower ID for joint applications.'
WHERE `id` = 34;

-- ── Social Security Card (template 37) ───────────────────────────────────────
UPDATE `task_form_fields`
SET
  `field_name` = 'borrower_ssn',
  `field_label` = 'Borrower Social Security Card',
  `is_required` = 1,
  `order_index` = 0,
  `help_text` = 'Attach a clear photo or scan of the primary borrower''s Social Security card. Make sure the number is clearly visible.'
WHERE `id` = 38 AND `task_template_id` = 37;

INSERT INTO `task_form_fields`
  (`task_template_id`, `field_name`, `field_label`, `field_type`, `is_required`, `order_index`, `help_text`)
SELECT 37, 'spouse_ssn', 'Spouse / Co-borrower Social Security Card', 'file_pdf', 0, 1,
  'Optional — attach the spouse or co-borrower''s Social Security card when applying as a couple.'
FROM DUAL
WHERE NOT EXISTS (
  SELECT 1 FROM `task_form_fields`
  WHERE `task_template_id` = 37 AND `field_name` = 'spouse_ssn'
);

UPDATE `task_templates`
SET
  `document_instructions` = 'Upload the borrower''s Social Security card (required). Optionally add a spouse / co-borrower card for joint applications.'
WHERE `id` = 37;

-- ── 2 Months Bank Statements (template 58) ───────────────────────────────────
UPDATE `task_form_fields`
SET
  `field_name` = 'bank_statement_month_1',
  `field_label` = 'Bank Statement – Month 1',
  `is_required` = 1,
  `order_index` = 0,
  `help_text` = 'Attach the most recent full month of bank statements. Must show account holder name, partial account number, and all transactions.'
WHERE `id` = 66 AND `task_template_id` = 58;

INSERT INTO `task_form_fields`
  (`task_template_id`, `field_name`, `field_label`, `field_type`, `is_required`, `order_index`, `help_text`)
SELECT 58, 'bank_statement_month_2', 'Bank Statement – Month 2', 'file_pdf', 1, 1,
  'Attach the prior full month of bank statements (second of the two required months).'
FROM DUAL
WHERE NOT EXISTS (
  SELECT 1 FROM `task_form_fields`
  WHERE `task_template_id` = 58 AND `field_name` = 'bank_statement_month_2'
);

UPDATE `task_templates`
SET
  `document_instructions` = 'Upload two separate months of bank statements (Month 1 and Month 2). Each must show account holder name, partial account number, and all transactions.'
WHERE `id` = 58;
