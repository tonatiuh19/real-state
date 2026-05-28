-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: Add platform_owner role and promote Daniel Carrillo and Alex Gomez
-- Date: 2026-05-27
-- ─────────────────────────────────────────────────────────────────────────────
-- Adds the new `platform_owner` role to the brokers.role enum (additive change,
-- no existing data is altered other than the two designees).
-- platform_owner = full tenant-wide data visibility + exclusive access to
-- People Management, Reminder Flows, and Communication Templates.
-- Conversations and Email remain scoped to 3-path ownership for ALL roles
-- including platform_owner (privacy is preserved).
-- ─────────────────────────────────────────────────────────────────────────────

-- Step 1: Extend the enum to include platform_owner (safe additive change)
ALTER TABLE brokers
  MODIFY COLUMN role ENUM('broker','admin','platform_owner')
  NOT NULL DEFAULT 'broker';

-- Step 2: Promote Alex Gomez (id=1) and Daniel Carrillo (id=3)
UPDATE brokers
SET role = 'platform_owner'
WHERE id IN (1, 3)
  AND tenant_id = 1;
