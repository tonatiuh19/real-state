-- Migration: Add partner_broker_id to loan_applications
-- Date: 2026-03-05
-- Description: Adds a separate partner broker field to loan applications,
-- allowing manual assignment of a realtor partner independent of the Mortgage Banker.

ALTER TABLE `loan_applications`
  ADD COLUMN `partner_broker_id` int(11) DEFAULT NULL
    COMMENT 'Realtor partner broker manually assigned to this loan application'
    AFTER `broker_user_id`;

ALTER TABLE `loan_applications`
  ADD KEY `idx_partner_broker` (`partner_broker_id`);

ALTER TABLE `loan_applications`
  ADD CONSTRAINT `loan_applications_partner_ibfk`
    FOREIGN KEY (`partner_broker_id`) REFERENCES `brokers` (`id`) ON DELETE SET NULL;
