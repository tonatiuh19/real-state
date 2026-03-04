-- Expand avatar_url columns from varchar(500) to varchar(1024)
-- CDN URLs returned by disruptinglabs.com can exceed 500 characters.
-- This prevents silent truncation when saving/updating avatar URLs.
-- MySQL 8.0 compatible.

ALTER TABLE `broker_profiles`
  MODIFY COLUMN `avatar_url` varchar(1024) COLLATE utf8mb4_unicode_ci DEFAULT NULL;

ALTER TABLE `user_profiles`
  MODIFY COLUMN `avatar_url` varchar(1024) COLLATE utf8mb4_unicode_ci DEFAULT NULL;
