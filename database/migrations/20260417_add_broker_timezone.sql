-- Migration: Add timezone preference to brokers table
-- This becomes the single source of truth for a broker's timezone:
-- used by the scheduler (slot display) AND by conversation/message timestamps.
-- Default: America/Los_Angeles (Pacific — California).

ALTER TABLE brokers
  ADD COLUMN `timezone` varchar(60) NOT NULL DEFAULT 'America/Los_Angeles'
  AFTER `call_forwarding_phone`;
