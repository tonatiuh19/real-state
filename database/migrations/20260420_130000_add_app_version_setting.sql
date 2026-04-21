-- Add app_version to system_settings
-- This is the human-managed release/deploy version shown in the admin settings header.
-- Example values: v1.0.0, 2026.04.20.1, prod-2026-04-20

INSERT INTO system_settings (tenant_id, setting_key, setting_value, setting_type, description)
VALUES (
  1,
  'app_version',
  'v1.0.0',
  'string',
  'Current deployed application version shown in the admin settings page header.'
)
ON DUPLICATE KEY UPDATE
  setting_value = VALUES(setting_value),
  description = VALUES(description);
