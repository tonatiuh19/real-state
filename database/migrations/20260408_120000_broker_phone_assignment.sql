-- Migration: 20260408_120000_broker_phone_assignment
-- Add per-broker Twilio phone number assignment and voice greeting setting.
-- Compatible with TiDB Cloud Serverless (MySQL 8.0).

-- 1. Add voice columns to brokers table.
ALTER TABLE `brokers`
  ADD COLUMN `twilio_phone_sid` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL
    COMMENT 'Twilio IncomingPhoneNumber SID assigned to this broker for inbound routing and outbound caller ID',
  ADD COLUMN `twilio_caller_id` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL
    COMMENT 'E.164 phone number derived from twilio_phone_sid; used as callerId for outbound calls',
  ADD COLUMN `voice_available` tinyint(1) NOT NULL DEFAULT 0
    COMMENT '1 = broker has toggled Available in the CRM and their Twilio Device is registered';

-- 2. Add a unique index so each Twilio number can only be assigned to one broker per tenant.
ALTER TABLE `brokers`
  ADD UNIQUE KEY `uq_broker_twilio_phone` (`tenant_id`, `twilio_phone_sid`);

-- 3. Index to speed up available-broker lookups on inbound calls.
ALTER TABLE `brokers`
  ADD INDEX `idx_broker_voice_available` (`tenant_id`, `status`, `voice_available`);

-- 3. Add voice_greeting setting to system_settings.
--    This is the text-to-speech greeting played before a call is connected.
INSERT INTO `system_settings` (`tenant_id`, `setting_key`, `setting_value`, `setting_type`, `description`)
VALUES
  (1, 'voice_greeting', '', 'string', 'Text-to-speech greeting played when someone calls the CRM. Leave empty to skip greeting.');
