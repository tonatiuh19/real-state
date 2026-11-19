-- Migration: 20261119_004500_reset_stale_voice_available
-- 14 brokers (mostly realtor partners) had voice_available = 1 stuck since
-- Jul–Nov 2026: browsers closed without unregistering, so shared-line calls
-- kept ringing them. Reset rows not touched in the last 24h. Anyone actually
-- online is set back to 1 by their browser's "registered" event on reconnect.
UPDATE `brokers`
SET `voice_available` = 0
WHERE `tenant_id` = 1
  AND `voice_available` = 1
  AND `updated_at` < NOW() - INTERVAL 1 DAY;
