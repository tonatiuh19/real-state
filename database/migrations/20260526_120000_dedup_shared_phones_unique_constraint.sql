-- ============================================================
-- Migration: Deduplicate shared-phone clients + enforce unique
-- Date: 2026-05-26
-- ============================================================
-- Strategy: For each shared-phone group, one record is kept as
-- the survivor. Non-survivors have their phone/normalized_phone
-- cleared to NULL so they remain as valid client records but
-- no longer conflict. A UNIQUE constraint is then added to
-- prevent future duplicates.
-- ============================================================

-- Step 1: Clear phone from non-survivor records
-- (12 records across 11 shared-phone groups)
--
-- Survivors chosen by: most loan/thread/message activity,
-- then real email over placeholder, then oldest record.
--
-- Group 9095279692 → survivor: 750015 (Hebert Medina, most msgs, real name)
UPDATE clients SET phone = NULL, normalized_phone = NULL
WHERE id IN (180015, 270015) AND tenant_id = 1;

-- Group 3232182144 → survivor: 210982 (Eloy Arcineda Monroy, Gmail)
UPDATE clients SET phone = NULL, normalized_phone = NULL
WHERE id = 210432 AND tenant_id = 1;

-- Group 3232890985 → survivor: 210939 (Oscar Andrade, real Gmail)
UPDATE clients SET phone = NULL, normalized_phone = NULL
WHERE id = 210704 AND tenant_id = 1;

-- Group 3233139071 → survivor: 211020 (Edgar Meza Ramirez, real Hotmail)
UPDATE clients SET phone = NULL, normalized_phone = NULL
WHERE id = 210746 AND tenant_id = 1;

-- Group 3233696104 → survivor: 210811 (Joanna Perez, real Gmail)
UPDATE clients SET phone = NULL, normalized_phone = NULL
WHERE id = 210747 AND tenant_id = 1;

-- Group 3237180001 → survivor: 150015 (Daniel Carrillo, 70 messages)
UPDATE clients SET phone = NULL, normalized_phone = NULL
WHERE id = 1020015 AND tenant_id = 1;

-- Group 3238614116 → survivor: 510017 (Kayla Mendez Serrano, active loan)
UPDATE clients SET phone = NULL, normalized_phone = NULL
WHERE id = 510015 AND tenant_id = 1;

-- Group 5626310218 → survivor: 211095 (Sandra Hernandez, real email)
UPDATE clients SET phone = NULL, normalized_phone = NULL
WHERE id = 211059 AND tenant_id = 1;

-- Group 5628468176 → survivor: 210172 (Sueann Lopez)
UPDATE clients SET phone = NULL, normalized_phone = NULL
WHERE id = 210259 AND tenant_id = 1;

-- Group 9093748394 → survivor: 210452 (Raymond Green, email matches name)
UPDATE clients SET phone = NULL, normalized_phone = NULL
WHERE id = 210301 AND tenant_id = 1;

-- Group 9096800849 → survivor: 210652 (Leticia Hernandez, oldest record)
UPDATE clients SET phone = NULL, normalized_phone = NULL
WHERE id = 210951 AND tenant_id = 1;

-- Step 2: Also clear any noemail placeholder emails from non-survivors
-- that had them (so they don't look like legit emails in the system).
-- Replace with a clearly-blank marker using their client ID.
UPDATE clients SET email = CONCAT('cleared_', id, '@noemail.placeholder')
WHERE id IN (180015, 270015, 210432, 210704, 210746, 210747, 1020015, 510015, 211059, 210259, 210301, 210951)
  AND tenant_id = 1
  AND email LIKE '%@noemail.placeholder';

-- Step 3: Drop the existing non-unique index on (tenant_id, normalized_phone)
-- and replace with a UNIQUE KEY. NULL values are excluded from uniqueness
-- checks in MySQL/TiDB so the cleared records above are safe.
ALTER TABLE clients DROP INDEX idx_clients_tenant_norm_phone;
ALTER TABLE clients ADD UNIQUE KEY `uq_clients_tenant_norm_phone` (`tenant_id`, `normalized_phone`);
