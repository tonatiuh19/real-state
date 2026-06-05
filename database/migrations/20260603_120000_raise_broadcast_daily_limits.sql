-- Temporarily raise daily broadcast caps (abuse guardrails disabled for now).
-- Billing is enforced via tenant_broadcast_credits.
-- Safe to re-run: upserts by tenant_id + setting_key.

INSERT INTO system_settings (tenant_id, setting_key, setting_value, updated_at)
VALUES
  (1, 'broadcast_daily_sms_limit', '100000', NOW()),
  (1, 'broadcast_daily_email_limit', '100000', NOW())
ON DUPLICATE KEY UPDATE
  setting_value = VALUES(setting_value),
  updated_at = NOW();
