-- =====================================================
-- Migration: Add broker support to notifications table
-- =====================================================
-- Adds a `recipient_type` column so the same `notifications`
-- table can power both client-portal and broker-admin
-- notification feeds. Drops the strict FK on user_id->clients(id)
-- (replaced by a soft index, since user_id can now reference
-- either clients.id or brokers.id depending on recipient_type).
-- Also adds a `category` column for cool icon/grouping in the UI.
-- =====================================================

-- 1) Drop the strict FK that ties user_id to clients.id
ALTER TABLE `notifications`
  DROP FOREIGN KEY `notifications_ibfk_1`;

-- 2) Add recipient_type column (defaults to 'client' to keep existing rows valid)
ALTER TABLE `notifications`
  ADD COLUMN `recipient_type` ENUM('client','broker') NOT NULL DEFAULT 'client'
    AFTER `user_id`;

-- 3) Add category column for UI grouping/icons (message, call, loan, client, task, flow, system)
ALTER TABLE `notifications`
  ADD COLUMN `category` VARCHAR(32) NOT NULL DEFAULT 'system'
    AFTER `notification_type`;

-- 4) Composite index for fast lookups by (tenant, recipient_type, user_id, is_read)
ALTER TABLE `notifications`
  ADD INDEX `idx_recipient_lookup` (`tenant_id`, `recipient_type`, `user_id`, `is_read`, `created_at`);
