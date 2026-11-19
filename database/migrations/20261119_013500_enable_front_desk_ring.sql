-- Migration: 20261119_013500_enable_front_desk_ring
-- Apply ONLY after the Poly CCX 600 shows the line as registered.
-- Main-line calls then ring the front desk first (15s), then Emma / available team, then voicemail.
UPDATE `system_settings`
SET `setting_value` = '["sip:frontdesk@encore-mortgage.sip.twilio.com"]'
WHERE `setting_key` = 'main_line_sip_endpoints' AND `tenant_id` = 1;
