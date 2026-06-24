-- Fix "Grupo testt" test group: remove sending line participant, link 909 to Hebert,
-- move misplaced inbound reply into the group thread.

SET @tenant_id = 1;
SET @conv = CONVERT('conv_group_bc53558b3d054e86' USING utf8mb4) COLLATE utf8mb4_unicode_ci;
SET @client_conv = CONVERT('conv_client_750015' USING utf8mb4) COLLATE utf8mb4_unicode_ci;
SET @inbox = '+15623370000';

UPDATE conversation_participants
SET left_at = NOW()
WHERE tenant_id = @tenant_id
  AND conversation_id = @conv
  AND broker_id = 270004
  AND left_at IS NULL;

UPDATE conversation_participants
SET
  participant_type = 'client',
  client_id = 750015,
  broker_id = NULL,
  lead_id = NULL,
  display_name = 'Hebert Medina'
WHERE tenant_id = @tenant_id
  AND conversation_id = @conv
  AND phone_e164 = '+19095279692'
  AND left_at IS NULL;

UPDATE communications
SET
  conversation_id = @conv,
  metadata = JSON_SET(
    COALESCE(metadata, JSON_OBJECT()),
    '$.source', 'group_individual_reply',
    '$.is_group_mms', true
  )
WHERE tenant_id = @tenant_id
  AND id = 17790619
  AND conversation_id = @client_conv;

UPDATE conversation_threads
SET
  participant_fingerprint = SHA2(CONCAT(@inbox, '|+13234756240,+19095279692'), 256),
  message_count = (
    SELECT COUNT(*)
    FROM communications c
    WHERE c.tenant_id = @tenant_id
      AND c.conversation_id = @conv
      AND c.communication_type NOT IN ('system_event')
  ),
  last_message_preview = 'Recibido',
  last_message_at = '2026-06-24 00:10:48',
  last_message_type = 'sms',
  unread_count = GREATEST(unread_count, 1),
  updated_at = NOW()
WHERE tenant_id = @tenant_id
  AND conversation_id = @conv;

UPDATE conversation_threads
SET
  message_count = (
    SELECT COUNT(*)
    FROM communications c
    WHERE c.tenant_id = @tenant_id
      AND c.conversation_id = @client_conv
      AND c.communication_type NOT IN ('system_event')
  ),
  last_message_at = COALESCE(
    (
      SELECT MAX(c.created_at)
      FROM communications c
      WHERE c.tenant_id = @tenant_id
        AND c.conversation_id = @client_conv
    ),
    last_message_at
  ),
  last_message_preview = COALESCE(
    (
      SELECT LEFT(c.body, 200)
      FROM communications c
      WHERE c.tenant_id = @tenant_id
        AND c.conversation_id = @client_conv
      ORDER BY c.created_at DESC
      LIMIT 1
    ),
    last_message_preview
  ),
  updated_at = NOW()
WHERE tenant_id = @tenant_id
  AND conversation_id = @client_conv;
