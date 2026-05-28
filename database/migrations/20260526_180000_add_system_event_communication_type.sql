-- Migration: Add 'system_event' to communications.communication_type ENUM
-- Purpose: Store close/reopen timeline events in the conversation history
-- so brokers can see when a conversation was closed or reopened.
-- Date: 2026-05-26

ALTER TABLE `communications`
  MODIFY COLUMN `communication_type`
    ENUM('email','sms','whatsapp','call','internal_note','system_event')
    COLLATE utf8mb4_unicode_ci NOT NULL;
