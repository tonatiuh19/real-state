-- Migration: 20260324_220000_remove_stop_opt_out_from_sms_templates.sql
-- Removes " Reply STOP to opt out." from all SMS template bodies.
-- Twilio automatically appends opt-out instructions for toll-free numbers
-- and 10DLC numbers, so including it manually causes duplicate text.

UPDATE templates
SET
  body = REPLACE(body, ' Reply STOP to opt out.', ''),
  updated_at = NOW()
WHERE
  tenant_id = 1
  AND template_type = 'sms'
  AND body LIKE '% Reply STOP to opt out.%';
