-- Flow #3 was inactive again (is_active=0 since 2026-08-24).
-- Deploy preflight requires Application Received nurture to be active.
-- Welcome sequence was bypassed; only fallback email would run.

UPDATE `reminder_flows`
SET `is_active` = 1,
    `updated_at` = NOW()
WHERE `id` = 3
  AND `tenant_id` = 1
  AND `trigger_event` = 'application_received';
