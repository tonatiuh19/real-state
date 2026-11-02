-- Additive columns for Twilio Bulk Messaging dual-engine (no breaking changes).
-- Default sms_engine='messages' keeps legacy send path.
-- Split ALTERs for TiDB compatibility.

ALTER TABLE `realtor_broadcasts`
  ADD COLUMN `sms_engine` ENUM('messages','bulk') NOT NULL DEFAULT 'messages'
    AFTER `channel`;

ALTER TABLE `realtor_broadcasts`
  ADD COLUMN `twilio_operation_ids` JSON DEFAULT NULL
    AFTER `sms_engine`;

ALTER TABLE `realtor_broadcasts`
  ADD COLUMN `bulk_stats_json` JSON DEFAULT NULL
    AFTER `twilio_operation_ids`;

ALTER TABLE `realtor_broadcast_recipients`
  ADD COLUMN `sms_bulk_message_id` VARCHAR(128) DEFAULT NULL
    AFTER `sms_ext_id`;

INSERT INTO `system_settings`
  (`tenant_id`, `setting_key`, `setting_value`, `setting_type`, `description`)
VALUES
  (1, 'broadcast_sms_engine', 'messages', 'string',
   'SMS broadcast delivery engine: messages (default) or bulk (Twilio Bulk Messaging beta)'),
  (1, 'broadcast_bulk_min_recipients', '1', 'number',
   'Minimum SMS recipients before Bulk engine is used when broadcast_sms_engine=bulk'),
  (1, 'broadcast_bulk_chunk_size', '9000', 'number',
   'Max recipients per Twilio Bulk Messages request (hard cap 10000)')
ON DUPLICATE KEY UPDATE
  `description` = VALUES(`description`);
