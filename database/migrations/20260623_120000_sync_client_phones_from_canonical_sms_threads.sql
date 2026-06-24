-- Align clients.phone with the canonical SMS thread (conv_client_{id}) when they diverge.
-- Preserves the old CRM phone in alternate_phone when empty (e.g. Xavi: US SMS line vs MX mobile).

SET @tenant_id = 1;

CREATE TEMPORARY TABLE _client_phone_sync (
  client_id INT NOT NULL PRIMARY KEY,
  new_phone VARCHAR(20) NOT NULL,
  new_norm VARCHAR(10) NOT NULL,
  old_phone VARCHAR(20) NULL
);

INSERT INTO _client_phone_sync (client_id, new_phone, new_norm, old_phone)
SELECT
  c.id,
  CONCAT('+1', ct.normalized_client_phone),
  ct.normalized_client_phone,
  c.phone
FROM clients c
JOIN conversation_threads ct
  ON ct.client_id = c.id
 AND ct.tenant_id = c.tenant_id
 AND ct.conversation_id = CONCAT('conv_client_', c.id)
WHERE c.tenant_id = @tenant_id
  AND ct.normalized_client_phone IS NOT NULL
  AND CHAR_LENGTH(ct.normalized_client_phone) = 10
  AND (c.normalized_phone IS NULL OR c.normalized_phone <> ct.normalized_client_phone);

UPDATE clients c
JOIN _client_phone_sync s ON s.client_id = c.id
SET
  c.alternate_phone = COALESCE(c.alternate_phone, s.old_phone),
  c.phone = s.new_phone,
  c.normalized_phone = s.new_norm,
  c.updated_at = NOW()
WHERE c.tenant_id = @tenant_id;

UPDATE conversation_threads ct
JOIN clients c ON c.id = ct.client_id AND c.tenant_id = ct.tenant_id
SET
  ct.client_phone = c.phone,
  ct.normalized_client_phone = c.normalized_phone,
  ct.updated_at = NOW()
WHERE c.tenant_id = @tenant_id
  AND c.phone IS NOT NULL
  AND c.normalized_phone IS NOT NULL
  AND (
    ct.normalized_client_phone IS NULL
    OR ct.normalized_client_phone <> c.normalized_phone
  );

DROP TEMPORARY TABLE _client_phone_sync;
