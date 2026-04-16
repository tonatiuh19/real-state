-- Add call forwarding settings to the brokers table.
-- call_forwarding_enabled: 1 = when a call rings the CRM it also rings the broker's personal phone.
-- call_forwarding_phone: the personal/cell number to forward to (E.164 preferred).
ALTER TABLE `brokers`
  ADD COLUMN `call_forwarding_enabled` tinyint(1) NOT NULL DEFAULT 0
    COMMENT '1 = simultaneously ring this broker personal phone on incoming CRM calls'
  AFTER `voice_available`;

ALTER TABLE `brokers`
  ADD COLUMN `call_forwarding_phone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL
    COMMENT 'E.164 personal phone number for call forwarding'
  AFTER `call_forwarding_enabled`;
