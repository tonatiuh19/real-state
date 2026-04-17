-- Migration: Disable Zoom / video call option for all brokers
-- Zoom integration is not yet configured. This turns off allow_video globally
-- (both existing rows and the column default) so the option does not appear
-- on any public scheduler page until Zoom credentials are properly set up.

-- 1. Set all existing scheduler settings rows to allow_video = 0
UPDATE scheduler_settings
SET allow_video = 0;

-- 2. Change the column default so newly created rows are also off
ALTER TABLE scheduler_settings
  ALTER COLUMN allow_video SET DEFAULT 0;
