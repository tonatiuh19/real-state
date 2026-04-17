-- Migration: Replace jitsi_room_id with proper Zoom columns
-- Jitsi was never used in production; Zoom is the intended video provider.
-- meeting_type enum('phone','video') stays unchanged — 'video' maps to Zoom.
-- Zoom is currently disabled (allow_video=0 in scheduler_settings) but these
-- columns need to exist so bookings don't error when Zoom is eventually enabled.

-- Step 1: Rename jitsi_room_id to zoom_meeting_id
ALTER TABLE `scheduled_meetings`
  CHANGE COLUMN `jitsi_room_id` `zoom_meeting_id` varchar(255)
    COLLATE utf8mb4_unicode_ci DEFAULT NULL
    COMMENT 'Zoom meeting ID for video call meetings';

-- Step 2: Add zoom_join_url after zoom_meeting_id
ALTER TABLE `scheduled_meetings`
  ADD COLUMN `zoom_join_url` varchar(1000)
    COLLATE utf8mb4_unicode_ci DEFAULT NULL
    COMMENT 'Zoom join URL for attendees'
    AFTER `zoom_meeting_id`;

-- Step 3: Add zoom_start_url after zoom_join_url
ALTER TABLE `scheduled_meetings`
  ADD COLUMN `zoom_start_url` varchar(1000)
    COLLATE utf8mb4_unicode_ci DEFAULT NULL
    COMMENT 'Zoom start URL for the host (broker)'
    AFTER `zoom_join_url`;
