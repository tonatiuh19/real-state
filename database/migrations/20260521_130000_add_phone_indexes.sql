-- Migration: 20260521_130000_add_phone_indexes.sql
-- Root Cause RC-3: Every phone-based client lookup calls
-- REGEXP_REPLACE(phone, '[^0-9]', '') which forces a full table scan.
-- At scale this creates latency during inbound call handling and risks
-- a lookup timeout that would leave the thread with client_id=NULL.
--
-- Original intent: STORED generated columns + indexes.
-- TiDB Cloud Serverless (v8.5.3) does NOT support:
--   - Adding STORED generated columns via ALTER TABLE
--   - Expression indexes on unsafe functions (REGEXP_REPLACE)
--
-- WORKAROUND APPLIED: Regular columns backfilled via UPDATE + indexes.
-- The application MUST write normalized_phone / normalized_client_phone
-- on every INSERT / UPDATE to keep the indexes accurate.
-- api/index.ts: handleCreateClient, handleUpdateClient, _executeThreadUpsert
-- all write these columns as of the session that applied this migration.
--
-- APPLIED TO PROD: 2026-05-21
-- Status: Applied successfully (exit 0)

-- 1. clients table: add regular normalized phone column + composite index
ALTER TABLE clients
  ADD COLUMN normalized_phone VARCHAR(10) NULL;

UPDATE clients
  SET normalized_phone = RIGHT(REGEXP_REPLACE(phone, '[^0-9]', ''), 10)
  WHERE phone IS NOT NULL;

ALTER TABLE clients
  ADD INDEX idx_clients_tenant_norm_phone (tenant_id, normalized_phone);

-- 2. conversation_threads: add regular normalized client_phone column + index
ALTER TABLE conversation_threads
  ADD COLUMN normalized_client_phone VARCHAR(10) NULL;

UPDATE conversation_threads
  SET normalized_client_phone = RIGHT(REGEXP_REPLACE(client_phone, '[^0-9]', ''), 10)
  WHERE client_phone IS NOT NULL;

ALTER TABLE conversation_threads
  ADD INDEX idx_ct_tenant_norm_client_phone (tenant_id, normalized_client_phone);

-- NOTE: After applying this migration, the REGEXP_REPLACE subqueries in
-- api/index.ts can be rewritten to use these columns instead:
--   WHERE pc.normalized_phone = ct.normalized_client_phone
-- This is a follow-up optimisation (P2). The migration is safe without
-- the code rewrite -- existing queries continue to work via REGEXP_REPLACE.
