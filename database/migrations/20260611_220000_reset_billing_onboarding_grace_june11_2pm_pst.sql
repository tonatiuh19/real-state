-- Onboarding grace starts 2026-06-11 14:00 Pacific Standard Time (= 22:00 UTC).
-- 3-day grace: through 2026-06-14 14:00 PST (22:00 UTC).
-- Restrictions only when billing_quota_mode=enforce and subscription still inactive.
-- Safe to apply before go-live; grace clock does not run until billing_ui_enabled=true.

UPDATE system_settings
SET setting_value = '2026-06-11 22:00:00',
    updated_at = UTC_TIMESTAMP()
WHERE tenant_id = 1
  AND setting_key = 'billing_onboarding_started_at';

INSERT INTO system_settings (tenant_id, setting_key, setting_value, setting_type, description)
SELECT
  1,
  'billing_onboarding_started_at',
  '2026-06-11 22:00:00',
  'string',
  'UTC timestamp when billing went live — starts 3-day onboarding grace (Jun 11 2pm PST)'
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
