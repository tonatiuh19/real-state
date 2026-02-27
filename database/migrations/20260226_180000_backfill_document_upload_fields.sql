-- Migration: 20260226_180000_backfill_document_upload_fields.sql
-- Backfill default document upload form fields for all task_templates
-- that have requires_documents = 1 but are missing task_form_fields rows.
--
-- Templates added via earlier migrations (34-57) were never given their
-- auto-generated form fields, so tasks created from them return 0 fields.
-- This migration inserts a single "Attach Document" file_pdf field for each
-- affected template, matching the pattern used by the API's create-template path.

INSERT INTO `task_form_fields`
  (`task_template_id`, `field_name`, `field_label`, `field_type`, `is_required`, `order_index`, `help_text`)
SELECT
  tt.id,
  'document_upload',
  'Attach Document',
  'file_pdf',
  1,
  0,
  COALESCE(tt.document_instructions, 'Upload the required document (PDF or clear image).')
FROM `task_templates` tt
WHERE tt.requires_documents = 1
  AND NOT EXISTS (
    SELECT 1
    FROM `task_form_fields` tff
    WHERE tff.task_template_id = tt.id
  );
