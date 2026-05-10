-- Migration: add Microsoft Teams support to scheduler settings and meetings
-- MySQL 8.0 / TiDB compatible

-- 1) Add Teams toggle to scheduler settings
ALTER TABLE `scheduler_settings`
  ADD COLUMN `allow_teams` tinyint(1) NOT NULL DEFAULT '0' AFTER `allow_video`;

-- 2) Expand meeting_type enum to include Teams
ALTER TABLE `scheduled_meetings`
  MODIFY COLUMN `meeting_type` enum('phone','video','teams')
    COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'phone';

-- 3) Add Teams meeting metadata fields
ALTER TABLE `scheduled_meetings`
  ADD COLUMN `teams_meeting_id` varchar(255)
    COLLATE utf8mb4_unicode_ci DEFAULT NULL
    COMMENT 'Microsoft Teams meeting ID for video call meetings'
    AFTER `zoom_start_url`;

ALTER TABLE `scheduled_meetings`
  ADD COLUMN `teams_join_url` varchar(1000)
    COLLATE utf8mb4_unicode_ci DEFAULT NULL
    COMMENT 'Microsoft Teams join URL for attendees'
    AFTER `teams_meeting_id`;
