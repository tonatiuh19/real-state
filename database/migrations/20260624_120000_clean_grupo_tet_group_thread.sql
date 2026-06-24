-- Clean test group "Grupo tet" (conv_group_1087978d18614ca4):
-- 1) Remove sending-line broker from participants (was receiving its own Group MMS)
-- 2) Link 9095279692 to Hebert Medina (750015) instead of orphan external_phone
-- 3) Recompute participant_fingerprint for correct 2-person Group MMS

SET @tenant_id = 1;
SET @conv = CONVERT('conv_group_1087978d18614ca4' USING utf8mb4) COLLATE utf8mb4_unicode_ci;
SET @inbox = '+15623370000';

-- Remove Encore Mortgage Processing (sending line) from active participants
UPDATE conversation_participants
SET left_at = NOW()
WHERE tenant_id = @tenant_id
  AND conversation_id = @conv
  AND broker_id = 270004
  AND left_at IS NULL;

-- Hebert Medina owns 9095279692
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

-- Fingerprint matches groupConvComputeParticipantFingerprint(inbox, [+13234756240, +19095279692])
UPDATE conversation_threads
SET
  participant_fingerprint = SHA2(
    CONCAT('+15623370000|+13234756240,+19095279692'),
    256
  ),
  message_count = (
    SELECT COUNT(*)
    FROM communications c
    WHERE c.tenant_id = @tenant_id
      AND c.conversation_id = @conv
      AND c.communication_type NOT IN ('system_event')
  ),
  updated_at = NOW()
WHERE tenant_id = @tenant_id
  AND conversation_id = @conv;

INSERT INTO communications (
  tenant_id, communication_type, direction, body, status,
  conversation_id, message_type, delivery_status, created_at
)
SELECT
  @tenant_id,
  'system_event',
  'outbound',
  'Group cleaned: removed sending line from participants; Hebert linked to client profile',
  'delivered',
  @conv,
  'text',
  'delivered',
  NOW()
FROM DUAL
WHERE NOT EXISTS (
  SELECT 1 FROM communications
  WHERE tenant_id = @tenant_id
    AND conversation_id = @conv
    AND communication_type = 'system_event'
    AND body LIKE 'Group cleaned: removed sending line%'
);
