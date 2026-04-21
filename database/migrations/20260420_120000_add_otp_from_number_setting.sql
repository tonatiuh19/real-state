-- Add otp_from_number to system_settings
-- This is the Twilio phone number used to send OTP verification codes (broker login + client login).
-- E.164 format required, e.g. +15623370000 (the shared Encore Mortgage line).
-- Configurable via Admin → Settings → Phone Configuration.

INSERT INTO system_settings (tenant_id, setting_key, setting_value, setting_type, description)
VALUES (
  1,
  'otp_from_number',
  '+15623370000',
  'string',
  'Twilio phone number (E.164) used to send OTP verification SMS codes. Must be a number owned by this Twilio account.'
)
ON DUPLICATE KEY UPDATE
  setting_value = VALUES(setting_value),
  description   = VALUES(description);
