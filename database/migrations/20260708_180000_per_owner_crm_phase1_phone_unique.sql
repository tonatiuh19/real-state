-- Per-Owner CRM — Phase 1: per-owner phone UNIQUE (flags still OFF — legacy API checks)
-- Spec: docs/PER_OWNER_CRM_ARCHITECTURE.md §6.1, §13 Phase 1
--
-- Replaces tenant-wide (tenant_id, normalized_phone) UNIQUE with per-owner
-- (tenant_id, assigned_broker_id, normalized_phone). Application-layer phone
-- conflict checks remain tenant-wide until per_owner_crm_enabled is turned on.
--
-- PRECONDITION: No duplicate (tenant_id, assigned_broker_id, normalized_phone)
-- groups in prod. Run scripts/smoke-test-per-owner-crm-phase1.ts preflight first.
-- TiDB Cloud Serverless (MySQL 8.0 compatible).

-- Safety: fail fast if same-owner duplicate phones would violate new unique key
-- (TiDB does not support SIGNAL in all modes; use a no-op update trick)
-- If this SELECT returns rows, do NOT apply — resolve duplicates first.
-- SELECT tenant_id, assigned_broker_id, normalized_phone, COUNT(*) AS cnt
-- FROM clients WHERE normalized_phone IS NOT NULL AND normalized_phone != ''
-- GROUP BY tenant_id, assigned_broker_id, normalized_phone HAVING cnt > 1;

-- Backfill list_visibility for any legacy rows (should already be 'active')
UPDATE `clients`
SET `list_visibility` = 'active'
WHERE `list_visibility` IS NULL OR `list_visibility` = '';

-- Swap unique constraint: tenant-wide → per-owner
ALTER TABLE `clients` DROP INDEX `uq_clients_tenant_norm_phone`;

ALTER TABLE `clients`
  ADD UNIQUE KEY `uq_clients_tenant_owner_norm_phone`
    (`tenant_id`, `assigned_broker_id`, `normalized_phone`)
  COMMENT 'Same phone allowed for different owners; one row per owner per phone';
