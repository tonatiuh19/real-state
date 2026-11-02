-- Per-owner CRM: client email UNIQUE per owner + partner realtor phone/email per owner
-- Spec decisions: 5A (same client email allowed across MBs), 6D (realtor phone+email
-- per created_by_broker_id; blank phone/email OK via NULL unique semantics).
-- TiDB Cloud Serverless (MySQL 8.0 compatible).
--
-- PRECONDITION: No duplicate (tenant_id, assigned_broker_id, email) on clients;
-- no duplicate (tenant_id, created_by_broker_id, email) on brokers.

-- ── Clients: tenant-wide email → per-owner email ─────────────────────────────
ALTER TABLE `clients` DROP INDEX `unique_tenant_email`;

ALTER TABLE `clients`
  ADD UNIQUE KEY `uq_clients_tenant_owner_email`
    (`tenant_id`, `assigned_broker_id`, `email`)
  COMMENT 'Same email allowed for different owners; one row per owner per email';

-- ── Brokers (partner realtors): normalized phone + per-owner uniqueness ──────
ALTER TABLE `brokers`
  ADD COLUMN `normalized_phone` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL
  COMMENT 'Last-10-digit normalised phone; maintained by app on every write'
  AFTER `phone`;

-- Backfill from existing phone values
UPDATE `brokers`
SET `normalized_phone` = NULLIF(
  RIGHT(REGEXP_REPLACE(IFNULL(`phone`, ''), '[^0-9]', ''), 10),
  ''
)
WHERE `phone` IS NOT NULL AND `phone` != '';

-- Drop tenant-wide email unique so partners under different MBs can share email
ALTER TABLE `brokers` DROP INDEX `unique_tenant_email`;

-- Per-owner email for partners (created_by_broker_id set). Admins with NULL
-- created_by_broker_id rely on API tenant-wide checks (MySQL allows multiple NULLs).
ALTER TABLE `brokers`
  ADD UNIQUE KEY `uq_brokers_tenant_owner_email`
    (`tenant_id`, `created_by_broker_id`, `email`)
  COMMENT 'Partner realtor email unique per owning MB; blanks/NULL owner handled in API';

ALTER TABLE `brokers`
  ADD UNIQUE KEY `uq_brokers_tenant_owner_norm_phone`
    (`tenant_id`, `created_by_broker_id`, `normalized_phone`)
  COMMENT 'Partner realtor phone unique per owning MB; NULL phone = no conflict';

ALTER TABLE `brokers`
  ADD KEY `idx_brokers_normalized_phone` (`tenant_id`, `normalized_phone`);
