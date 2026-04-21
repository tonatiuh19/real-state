-- Backfill client_name and client_id on conversation_threads where the phone
-- can be matched to a known client or lead but the name was never resolved.
--
-- Matching logic: compare last 10 digits of both numbers (strips +1, spaces, dashes, etc.)
-- Priority: clients table first, then leads table.

-- ── 1. Backfill from clients ──────────────────────────────────────────────────
UPDATE conversation_threads ct
JOIN clients c
  ON ct.tenant_id = c.tenant_id
  AND ct.client_phone IS NOT NULL
  AND ct.client_phone != ''
  AND RIGHT(REGEXP_REPLACE(ct.client_phone, '[^0-9]', ''), 10)
    = RIGHT(REGEXP_REPLACE(c.phone,         '[^0-9]', ''), 10)
SET
  ct.client_name = TRIM(CONCAT(COALESCE(c.first_name, ''), ' ', COALESCE(c.last_name, ''))),
  ct.client_id   = c.id
WHERE
  ct.tenant_id = 1
  AND (ct.client_name IS NULL OR ct.client_name = '' OR ct.client_name = 'Unknown Client')
  AND c.phone IS NOT NULL
  AND c.phone != '';

-- ── 2. Backfill from leads (only where clients didn't match) ─────────────────
UPDATE conversation_threads ct
JOIN leads l
  ON ct.tenant_id = l.tenant_id
  AND ct.client_phone IS NOT NULL
  AND ct.client_phone != ''
  AND RIGHT(REGEXP_REPLACE(ct.client_phone, '[^0-9]', ''), 10)
    = RIGHT(REGEXP_REPLACE(l.phone,         '[^0-9]', ''), 10)
SET
  ct.client_name = TRIM(CONCAT(COALESCE(l.first_name, ''), ' ', COALESCE(l.last_name, ''))),
  ct.lead_id     = l.id
WHERE
  ct.tenant_id = 1
  AND (ct.client_name IS NULL OR ct.client_name = '' OR ct.client_name = 'Unknown Client')
  AND l.phone IS NOT NULL
  AND l.phone != '';
