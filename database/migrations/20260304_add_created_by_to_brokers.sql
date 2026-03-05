-- Migration: Add created_by_broker_id to brokers table
-- This tracks which Mortgage Banker (admin) created a partner (broker role) account.
-- Date: 2026-03-04

ALTER TABLE `brokers`
  ADD COLUMN `created_by_broker_id` int(11) DEFAULT NULL
    COMMENT 'The admin/Mortgage Banker who created this partner broker';

ALTER TABLE `brokers`
  ADD CONSTRAINT `fk_brokers_created_by`
    FOREIGN KEY (`created_by_broker_id`)
    REFERENCES `brokers` (`id`)
    ON DELETE SET NULL;

ALTER TABLE `brokers`
  ADD KEY `idx_brokers_created_by` (`created_by_broker_id`);
