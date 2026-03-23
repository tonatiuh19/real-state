-- Migration: Add Zoom meeting fields to scheduled_meetings
-- Replaces Jitsi room IDs with Zoom meeting data (meeting ID, join URL, start URL for host)
-- Environment variables required on server: ZOOM_ACCOUNT_ID, ZOOM_CLIENT_ID, ZOOM_CLIENT_SECRET

ALTER TABLE `scheduled_meetings`
  ADD COLUMN `zoom_meeting_id` VARCHAR(64) NULL DEFAULT NULL COMMENT 'Zoom meeting numeric ID' AFTER `jitsi_room_id`,
  ADD COLUMN `zoom_join_url` VARCHAR(2048) NULL DEFAULT NULL COMMENT 'Zoom join URL for client' AFTER `zoom_meeting_id`,
  ADD COLUMN `zoom_start_url` TEXT NULL DEFAULT NULL COMMENT 'Zoom start URL for broker/host (contains auth token)' AFTER `zoom_join_url`;
