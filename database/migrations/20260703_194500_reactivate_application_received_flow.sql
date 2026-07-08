-- Reactivate the Application Received nurture flow (id=3).
-- This flow is production-critical: public and manual application submits
-- depend on it for welcome email/SMS and follow-up sequences.

UPDATE `reminder_flows`
SET `is_active` = 1,
    `updated_at` = NOW()
WHERE `id` = 3
  AND `tenant_id` = 1
  AND `trigger_event` = 'application_received';
