-- Flow #3 was inactive in production (welcome nurture bypassed; fallback email only).
-- Reactivate so new applications start the full Application Received sequence.

UPDATE `reminder_flows`
SET `is_active` = 1,
    `updated_at` = NOW()
WHERE `id` = 3
  AND `tenant_id` = 1
  AND `trigger_event` = 'application_received';
