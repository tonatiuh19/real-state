-- One-off data repair (NOT a schema migration).
-- Inbound SMS from Daniel Carrillo (+13237180001) to info@'s line +15623370000
-- were stored in broker #3's thread (conv_client_150015) instead of broker
-- #2580002's thread (conv_client_5910015) because handleInboundSMS resolved
-- the client tenant-wide. Fixed in api/index.ts on 2026-10-13.
--
-- Moves the 4 affected messages (to_broker_id = 2580002) into the correct
-- thread and refreshes the thread summary. Older June row 18330079
-- (to_broker_id 270004, line had a different owner then) is left untouched.

START TRANSACTION;

UPDATE communications
SET conversation_id = 'conv_client_5910015',
    from_user_id    = 5910015
WHERE tenant_id = 1
  AND id IN (44340019, 44340051, 46320011, 46320047)
  AND conversation_id = 'conv_client_150015'
  AND direction = 'inbound'
  AND to_broker_id = 2580002;

-- Latest message in 5910015 is now the inbound "Hi" (2026-10-13 15:46:30).
UPDATE conversation_threads
SET last_message_preview = 'Hi',
    last_message_type    = 'sms',
    last_message_at      = '2026-10-13 15:46:30',
    message_count        = message_count + 4,
    unread_count         = unread_count + 1,
    updated_at           = NOW()
WHERE tenant_id = 1 AND conversation_id = 'conv_client_5910015';

UPDATE conversation_threads
SET message_count = GREATEST(message_count - 4, 0),
    updated_at    = NOW()
WHERE tenant_id = 1 AND conversation_id = 'conv_client_150015';

COMMIT;

-- Verify
SELECT id, conversation_id, direction, LEFT(body, 30) AS body, created_at
FROM communications
WHERE tenant_id = 1
  AND id IN (44340019, 44340051, 46320011, 46320047);
