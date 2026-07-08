-- Migration: Reopen "submitted but empty" document tasks
-- Context: A client-side upload bug allowed document tasks to be marked
--          pending_approval even when no file persisted to the CDN / task_documents.
--          Result: the client saw the task as "submitted / pending review" but the
--          broker (e.g. Daniel Carrillo on LA08597405 / David Gallegos) had nothing
--          to approve ("No documents or form responses yet").
--
-- Fix (data): reopen every document-requiring task that is pending_approval but has
--             zero task_documents so the client is prompted to re-upload. The code
--             fixes (client + server guards) prevent this state from recurring.
--
-- Safe: only touches tasks that (a) require file uploads via their template and
--       (b) currently have NO stored documents. Tasks with at least one saved
--       document (e.g. the bank-statement task 510032) are left untouched.
-- TiDB Cloud Serverless (MySQL 8.0 compatible).

UPDATE tasks t
SET
  t.status = 'reopened',
  t.completed_at = NULL,
  t.documents_uploaded = 0,
  t.form_completed = 0,
  t.reopened_at = NOW(),
  t.reopen_reason = 'Auto-reopened: task was submitted for review but no document was saved due to an upload issue. Please re-upload your document(s).',
  t.updated_at = NOW()
WHERE t.status = 'pending_approval'
  AND t.template_id IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM task_form_fields tff
    WHERE tff.task_template_id = t.template_id
      AND tff.field_type IN ('file_pdf', 'file_image')
  )
  AND NOT EXISTS (
    SELECT 1
    FROM task_documents td
    WHERE td.task_id = t.id
  );
