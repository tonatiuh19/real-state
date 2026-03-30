-- Make password_hash nullable since the app is passwordless
ALTER TABLE `clients`
  MODIFY COLUMN `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL;
