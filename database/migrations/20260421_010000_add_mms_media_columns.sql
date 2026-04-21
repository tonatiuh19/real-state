-- Add MMS/media attachment support to communications
-- Twilio sends MediaUrl0..N + MediaContentType0..N when an inbound SMS includes media.

ALTER TABLE `communications`
  ADD COLUMN `media_url` TEXT COLLATE utf8mb4_unicode_ci DEFAULT NULL
    COMMENT 'URL(s) of MMS media attachments — JSON array for multiple items, plain URL for single'
    AFTER `body`;

ALTER TABLE `communications`
  ADD COLUMN `media_content_type` VARCHAR(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL
    COMMENT 'MIME type of the primary media attachment (e.g. image/jpeg, application/pdf)'
    AFTER `media_url`;
