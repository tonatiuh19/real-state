-- Migration: Add Mortgi quota tracking settings
-- Date: 2026-05-18

INSERT IGNORE INTO system_settings (tenant_id, setting_key, setting_value, setting_type, description)
VALUES
  (1, 'mortgi_quota_exceeded', 'false', 'boolean', 'Auto-set to true when Groq API rate limit is hit'),
  (1, 'mortgi_quota_exceeded_at', '', 'string', 'ISO timestamp of when the quota was last exceeded');
