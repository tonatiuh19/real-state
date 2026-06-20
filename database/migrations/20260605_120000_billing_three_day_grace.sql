-- 3-day billing grace: deploy onboarding + declined renewal payment
-- Clears stale past_due milestones incorrectly set on inactive subscriptions.

INSERT INTO system_settings (tenant_id, setting_key, setting_value, setting_type, description)
VALUES (
  1,
  'billing_grace_days',
  '3',
  'number',
  'Days of grace after billing go-live or declined renewal before restricting cost actions'
)
ON DUPLICATE KEY UPDATE
  setting_value = '3',
  description = VALUES(description),
  updated_at = UTC_TIMESTAMP();

INSERT INTO system_settings (tenant_id, setting_key, setting_value, setting_type, description)
VALUES (
  1,
  'billing_onboarding_started_at',
  UTC_TIMESTAMP(),
  'string',
  'UTC ISO timestamp when billing went live — starts onboarding grace window'
)
ON DUPLICATE KEY UPDATE
  setting_value = COALESCE(NULLIF(setting_value, ''), VALUES(setting_value)),
  updated_at = UTC_TIMESTAMP();

UPDATE tenant_subscription
SET past_due_at = NULL,
    grace_ends_at = NULL,
    restricted_at = NULL,
    suspended_at = NULL,
    updated_at = UTC_TIMESTAMP()
WHERE tenant_id = 1
  AND status IN ('inactive', 'active', 'trialing');
