-- Migration: Change avatar_url columns to MEDIUMTEXT to support base64 data URIs
-- Date: 2026-02-28 18:00:00

ALTER TABLE `broker_profiles`
  MODIFY COLUMN `avatar_url` MEDIUMTEXT COLLATE utf8mb4_unicode_ci DEFAULT NULL;

-- Also update clients table in case it has the same column type
ALTER TABLE `clients`
  MODIFY COLUMN `avatar_url` MEDIUMTEXT COLLATE utf8mb4_unicode_ci DEFAULT NULL;
