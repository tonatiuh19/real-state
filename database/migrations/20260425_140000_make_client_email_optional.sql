-- Migration: Make clients.email optional
-- Date: 2026-04-25
-- Purpose: Allow creating clients without an email address. Existing NOT NULL
--          constraint is relaxed. A UNIQUE index is updated to allow multiple
--          NULLs (MySQL/TiDB: NULLs are not considered equal in UNIQUE indexes).
--          The application layer generates a unique noemail_<phone>@noemail.placeholder
--          placeholder when no email is provided so the column constraint is met
--          while still signalling "no real email".

-- Step 1: Drop the existing UNIQUE index so we can recreate it as nullable-friendly.
ALTER TABLE clients DROP INDEX unique_tenant_email;

-- Step 2: Make the column nullable.
ALTER TABLE clients MODIFY COLUMN email varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL;

-- Step 3: Re-add the UNIQUE index. MySQL/TiDB treat NULLs as distinct so
--         multiple rows with NULL email are allowed. Real addresses remain unique per tenant.
CREATE UNIQUE INDEX unique_tenant_email ON clients (tenant_id, email);
