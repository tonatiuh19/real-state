-- Billing access ladder: grace → restricted → suspended (subscription past_due)
-- @see docs/BILLING_AND_QUOTA_PLAN.md D8c

ALTER TABLE tenant_subscription
  ADD COLUMN past_due_at DATETIME NULL COMMENT 'When platform fee payment first failed',
  ADD COLUMN grace_ends_at DATETIME NULL COMMENT 'End of subscription grace window',
  ADD COLUMN restricted_at DATETIME NULL COMMENT 'When cost actions were restricted post-grace',
  ADD COLUMN suspended_at DATETIME NULL COMMENT 'When full billing wall applies';

INSERT INTO system_settings (tenant_id, setting_key, setting_value, setting_type, description)
VALUES
  (1, 'billing_grace_days', '2', 'number', 'Days after past_due before restricting cost actions'),
  (1, 'billing_suspend_days', '7', 'number', 'Days after past_due before suspending tenant (full wall)')
ON DUPLICATE KEY UPDATE
  setting_value = VALUES(setting_value),
  setting_type = VALUES(setting_type),
  description = VALUES(description),
  updated_at = NOW();
