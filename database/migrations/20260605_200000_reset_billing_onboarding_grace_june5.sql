-- Reset billing onboarding grace to start at go-live (2026-06-05 00:00 UTC).
-- 3-day grace window: 2026-06-05 through 2026-06-07; restrictions apply from 2026-06-08
-- if subscription is still inactive/incomplete and billing_quota_mode is enforce.
-- Idempotent: safe to re-run.

UPDATE system_settings
SET setting_value = '2026-06-05 00:00:00',
    updated_at = UTC_TIMESTAMP()
WHERE tenant_id = 1
  AND setting_key = 'billing_onboarding_started_at';

INSERT INTO system_settings (tenant_id, setting_key, setting_value, setting_type, description)
SELECT
  1,
  'billing_onboarding_started_at',
  '2026-06-05 00:00:00',
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
