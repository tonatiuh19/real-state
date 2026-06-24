-- Fix orphaned client normalized_phone values and thread phone denormalization drift.
--
-- Root cause: clients.phone cleared but normalized_phone left set → client search
-- matches a number the UI shows as "No phone". Thread normalized_client_phone can
-- also drift from client_phone after manual edits or legacy imports.

-- 1) Clear indexed phone on clients with no display phone
UPDATE clients
SET normalized_phone = NULL
WHERE phone IS NULL
  AND normalized_phone IS NOT NULL;

-- 2) Re-sync thread normalized_client_phone from client_phone (last 10 digits)
UPDATE conversation_threads
SET normalized_client_phone = RIGHT(REGEXP_REPLACE(client_phone, '[^0-9]', ''), 10)
WHERE client_phone IS NOT NULL
  AND REGEXP_REPLACE(client_phone, '[^0-9]', '') <> ''
  AND (
    normalized_client_phone IS NULL
    OR normalized_client_phone <> RIGHT(REGEXP_REPLACE(client_phone, '[^0-9]', ''), 10)
  );

-- 3) Clear thread normalized phone when client_phone is empty
UPDATE conversation_threads
SET normalized_client_phone = NULL
WHERE client_phone IS NULL
  AND normalized_client_phone IS NOT NULL;
