-- Default inbound-email alerts OFF to prevent Resend → O365 Inbox → Resend loops.
-- Existing preference rows are left unchanged; missing-row merge uses app defaults.

ALTER TABLE `broker_notification_preferences`
  MODIFY COLUMN `email_inbound_email` tinyint(1) NOT NULL DEFAULT 0;
