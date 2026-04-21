-- Configure inbound call routing for tenant 1
--
-- (562) 337-0000  →  Shared / All Mortgage Bankers (no broker row needs updating)
-- (562) 449-0000  →  Personal line for Daniel Carrillo (broker id=3)
--
-- The routing logic in handleVoiceIncoming checks:
--   WHERE twilio_caller_id = '<E.164 dialled number>'
-- If a match is found → ring only that broker exclusively.
-- If no match → shared: ring all available brokers simultaneously.

-- 1. Safety: clear any pre-existing assignment for (562) 449-0000
UPDATE `brokers`
SET `twilio_caller_id` = NULL, `twilio_phone_sid` = NULL
WHERE `tenant_id` = 1
  AND `twilio_caller_id` = '+15624490000';

-- 2. Safety: clear any pre-existing assignment for (562) 337-0000
--    (should be shared, so no broker should own it)
UPDATE `brokers`
SET `twilio_caller_id` = NULL, `twilio_phone_sid` = NULL
WHERE `tenant_id` = 1
  AND `twilio_caller_id` = '+15623370000';

-- 3. Assign (562) 449-0000 exclusively to Daniel Carrillo (id=3)
UPDATE `brokers`
SET `twilio_caller_id` = '+15624490000'
WHERE `id` = 3
  AND `tenant_id` = 1;

-- Verify result
SELECT id, first_name, last_name, twilio_caller_id
FROM `brokers`
WHERE `tenant_id` = 1
  AND `twilio_caller_id` IS NOT NULL;
