-- Migration: Add document task templates
-- Date: 2026-02-25
-- Description: Adds 7 standard document task templates (ID, License, Green Card,
--              SSN, Estado de Cuenta (2 meses), Póliza del Seguro, W2).
--              All templates require document attachment (requires_documents = 1).

INSERT INTO `task_templates`
  (`tenant_id`, `title`, `description`, `task_type`, `priority`, `default_due_days`, `order_index`, `is_active`, `created_by_broker_id`, `requires_documents`, `document_instructions`, `has_custom_form`, `has_signing`)
VALUES
  -- 1. Government-issued ID
  (1,
   'Government-Issued ID',
   'Provide a valid government-issued photo identification.',
   'document_verification',
   'high',
   7,
   10,
   1,
   1,
   1,
   'Attach a clear photo or scan of your valid government-issued ID (passport, driver license, state ID, etc.).',
   0,
   0),

  -- 2. Driver's License
  (1,
   'Driver''s License',
   'Provide your valid driver''s license as a form of identification.',
   'document_verification',
   'high',
   7,
   11,
   1,
   1,
   1,
   'Attach a clear photo or scan of your valid driver''s license (front and back).',
   0,
   0),

  -- 3. Green Card
  (1,
   'Green Card (Permanent Resident Card)',
   'Provide your valid Permanent Resident Card (Form I-551).',
   'document_verification',
   'high',
   7,
   12,
   1,
   1,
   1,
   'Attach a clear photo or scan of your valid Green Card (front and back).',
   0,
   0),

  -- 4. Social Security Card
  (1,
   'Social Security Card (SSN)',
   'Provide your Social Security card issued by the Social Security Administration (SSA).',
   'document_verification',
   'high',
   7,
   13,
   1,
   1,
   1,
   'Attach a clear photo or scan of your Social Security card. Make sure the number is clearly visible.',
   0,
   0),

  -- 5. Mortgage/Rent Payment Statement (two months)
  (1,
   'Housing Payment Statement (2 Months)',
   'Provide the last two months of bank or mortgage statements showing your housing payment.',
   'document_verification',
   'medium',
   14,
   14,
   1,
   1,
   1,
   'Attach the last two months of bank or mortgage statements. They must clearly show the account holder name, partial account number, and housing payment transactions.',
   0,
   0),

  -- 6. Homeowner's Insurance Policy
  (1,
   'Homeowner''s Insurance Policy',
   'Provide the current homeowner''s insurance policy for the property.',
   'document_verification',
   'medium',
   14,
   15,
   1,
   1,
   1,
   'Attach the active homeowner''s insurance policy. It must include the policy number, coverage details, insured name, and effective dates.',
   0,
   0),

  -- 7. W-2 Form
  (1,
   'W-2 Form',
   'Provide your W-2 form(s) for the most recent tax year.',
   'document_verification',
   'high',
   14,
   16,
   1,
   1,
   1,
   'Attach all W-2 forms from the most recent tax year. If you have multiple employers, include the W-2 from each one.',
   0,
   0);
