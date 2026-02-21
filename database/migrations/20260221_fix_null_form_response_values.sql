-- Fix task_form_responses rows that were stored with NULL field_value
-- due to a property name mismatch bug (response_value vs field_value).
-- Deleting these lets the client re-submit and store the correct value.

DELETE FROM task_form_responses
WHERE field_value IS NULL;
