-- Migration: 20261119_013000_main_line_sip_desk_phone
-- Front-desk Poly CCX 600 on the company main line via Twilio SIP Domain
-- encore-mortgage.sip.twilio.com (SD1af10034120b1216cdecaaa475dc31e6).
--
-- main_line_sip_domain_sid   → only this SIP domain may place outbound desk calls
-- main_line_desk_ring_seconds → desk phone rings first this long, then browsers
-- main_line_sip_endpoints     → JSON array of SIP URIs that ring first.
--   Left EMPTY here on purpose: set it only after the phone shows "Registered",
--   via 20261119_013500_enable_front_desk_ring.sql.
INSERT INTO `system_settings` (`tenant_id`, `setting_key`, `setting_value`, `setting_type`, `description`)
VALUES
  (1, 'main_line_sip_domain_sid', 'SD1af10034120b1216cdecaaa475dc31e6', 'string', 'Twilio SIP Domain SID allowed to place outbound desk-phone calls from the main line.'),
  (1, 'main_line_desk_ring_seconds', '15', 'number', 'Seconds the front-desk SIP phone rings before the browser ring group.'),
  (1, 'main_line_sip_endpoints', '[]', 'json', 'JSON array of SIP URIs (desk phones) that ring first for main-line calls.')
ON DUPLICATE KEY UPDATE `setting_key` = `setting_key`;
