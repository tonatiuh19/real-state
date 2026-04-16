-- Add inbox_number to conversation_threads so replies go out from the same
-- Twilio number that received the original inbound message.
ALTER TABLE `conversation_threads`
  ADD COLUMN `inbox_number` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL
    COMMENT 'Twilio number (To) that received the first inbound message'
  AFTER `client_email`;
