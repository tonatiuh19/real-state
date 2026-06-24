-- Backfill clients.phone from canonical SMS thread when profile phone is empty
-- but the client already has SMS history (fixes group MMS participant resolution).

SET @tenant_id = 1;

UPDATE clients c
JOIN conversation_threads ct
  ON ct.client_id = c.id
 AND ct.tenant_id = c.tenant_id
 AND ct.conversation_id = CONCAT('conv_client_', c.id)
SET
  c.phone = CONCAT('+1', ct.normalized_client_phone),
  c.normalized_phone = ct.normalized_client_phone,
  c.updated_at = NOW()
WHERE c.tenant_id = @tenant_id
  AND (c.phone IS NULL OR TRIM(c.phone) = '')
  AND ct.normalized_client_phone IS NOT NULL
  AND CHAR_LENGTH(ct.normalized_client_phone) = 10
  AND NOT EXISTS (
    SELECT 1 FROM clients c2
    WHERE c2.tenant_id = c.tenant_id
      AND c2.id <> c.id
      AND c2.phone IS NOT NULL
      AND c2.normalized_phone = ct.normalized_client_phone
  );
