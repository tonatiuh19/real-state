-- Migration: 20260420_210000_add_contact_broker_to_threads
-- Purpose: Add contact_broker_id to conversation_threads so a conversation
--          can track a broker/realtor as the *contact* (not the CRM handler).
--          This enables proper panel discrimination in the Conversations UI.

ALTER TABLE `conversation_threads`
  ADD COLUMN `contact_broker_id` INT(11) DEFAULT NULL
    COMMENT 'Broker/realtor who is the contact in this thread (not the CRM handler)'
  AFTER `broker_id`;
