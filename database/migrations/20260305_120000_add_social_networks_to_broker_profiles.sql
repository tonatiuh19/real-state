-- Migration: Add social network fields and full address support to broker_profiles
-- Date: 2026-03-05
-- Description: Adds social network URL columns (Facebook, Instagram, LinkedIn, Twitter/X,
--              YouTube, Website) to the broker_profiles table so that mortgage bankers
--              and partners can display their social media presence on their public info card.

ALTER TABLE `broker_profiles`
  ADD COLUMN `facebook_url`  VARCHAR(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL AFTER `office_zip`,
  ADD COLUMN `instagram_url` VARCHAR(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL AFTER `facebook_url`,
  ADD COLUMN `linkedin_url`  VARCHAR(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL AFTER `instagram_url`,
  ADD COLUMN `twitter_url`   VARCHAR(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL AFTER `linkedin_url`,
  ADD COLUMN `youtube_url`   VARCHAR(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL AFTER `twitter_url`,
  ADD COLUMN `website_url`   VARCHAR(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL AFTER `youtube_url`;
