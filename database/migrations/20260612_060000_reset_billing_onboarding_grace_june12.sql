-- Reset billing onboarding grace to start 2026-06-12 00:00 UTC.
-- 3-day grace window: 2026-06-12 through 2026-06-14; restrictions from 2026-06-15
-- when subscription is still inactive and billing is live (ui on + mode not off).
-- Safe while billing_quota_mode remains off — clock starts but nothing blocks yet.

UPDATE system_settings
SET setting_value = '2026-06-12 00:00:00',
    updated_at = UTC_TIMESTAMP()
WHERE tenant_id = 1
  AND setting_key = 'billing_onboarding_started_at';

INSERT INTO system_settings (tenant_id, setting_key, setting_value, setting_type, description)
SELECT
  1,
  'billing_onboarding_started_at',
  '2026-06-12 00:00:00',
  'string',
  'UTC timestamp when billing goes live — starts 3-day onboarding grace'
WHERE NOT EXISTS (
  SELECT 1 FROM system_settings
  WHERE tenant_id = 1 AND setting_key = 'billing_onboarding_started_at'
);

UPDATE tenant_subscription
SET past_due_at = NULL,
    grace_ends_at = NULL,
    restricted_at = NULL,
    suspended_at = NULL,
    updated_at = UTC_TIMESTAMP()
WHERE tenant_id = 1;

DELETE FROM tenant_usage_period
WHERE tenant_id = 1
  AND period_start = '2026-05-31';
