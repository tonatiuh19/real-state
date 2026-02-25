-- Migration: Add public_token to brokers for unique share links
-- Date: 2026-02-24
-- Description: Each broker gets a permanent unique UUID token used to
--              generate a shareable application link for clients.
--              URL format: /apply/{public_token}

-- 1. Add public_token column to brokers
ALTER TABLE `brokers`
  ADD COLUMN `public_token` VARCHAR(36) NULL DEFAULT NULL COMMENT 'UUID token for public broker share link' AFTER `specializations`,
  ADD UNIQUE KEY `uk_brokers_public_token` (`public_token`);

-- 2. Populate existing brokers with a UUID token
UPDATE `brokers` SET `public_token` = UUID() WHERE `public_token` IS NULL;

-- 3. Make the column NOT NULL after populating
ALTER TABLE `brokers`
  MODIFY COLUMN `public_token` VARCHAR(36) NOT NULL COMMENT 'UUID token for public broker share link';

-- 4. Add broker_token to loan_applications so we can track which link was used
ALTER TABLE `loan_applications`
  ADD COLUMN `broker_token` VARCHAR(36) NULL DEFAULT NULL COMMENT 'Broker public_token used when client submitted via share link' AFTER `notes`;

-- 5. Create index for performance
ALTER TABLE `loan_applications`
  ADD INDEX `idx_loan_applications_broker_token` (`broker_token`);
