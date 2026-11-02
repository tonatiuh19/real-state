-- Per-Owner CRM — Phase 0 foundation (no behavior change)
-- Spec: docs/PER_OWNER_CRM_ARCHITECTURE.md §6, §13 Phase 0
--
-- Adds new tables + additive columns + feature flags (all OFF by default).
-- Does NOT relax clients phone UNIQUE (Phase 1) or backfill thread scope (Phase 2).
-- Existing APIs and list/thread behavior remain unchanged until flags are enabled.
-- TiDB Cloud Serverless (MySQL 8.0 compatible).

-- ─── 6.2 Identity link group ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `crm_person_groups` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tenant_id` int NOT NULL,
  `status` enum('pending','linked','merged','rejected') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `canonical_client_id` int DEFAULT NULL COMMENT 'Set when merged; borrower-of-record default',
  `created_by_broker_id` int NOT NULL,
  `approved_by_broker_id` int DEFAULT NULL,
  `approved_at` datetime DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_cpg_tenant_status` (`tenant_id`, `status`),
  KEY `idx_cpg_created_by` (`created_by_broker_id`),
  CONSTRAINT `fk_cpg_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_cpg_created_by` FOREIGN KEY (`created_by_broker_id`) REFERENCES `brokers` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_cpg_approved_by` FOREIGN KEY (`approved_by_broker_id`) REFERENCES `brokers` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_cpg_canonical_client` FOREIGN KEY (`canonical_client_id`) REFERENCES `clients` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Identity link groups — same real person across owner CRM rows';

CREATE TABLE IF NOT EXISTS `crm_person_group_members` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tenant_id` int NOT NULL,
  `group_id` int NOT NULL,
  `entity_type` enum('client','broker','lead') COLLATE utf8mb4_unicode_ci NOT NULL,
  `entity_id` int NOT NULL,
  `role` enum('member','borrower_of_record') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'member',
  `joined_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_cpgm_entity` (`tenant_id`, `entity_type`, `entity_id`),
  KEY `idx_cpgm_group` (`group_id`),
  CONSTRAINT `fk_cpgm_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_cpgm_group` FOREIGN KEY (`group_id`) REFERENCES `crm_person_groups` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Members of a crm_person_groups identity link';

-- ─── 6.3 Transfer jobs ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `crm_transfer_jobs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tenant_id` int NOT NULL,
  `from_broker_id` int NOT NULL,
  `to_broker_id` int NOT NULL,
  `source_entity_type` enum('client','broker') COLLATE utf8mb4_unicode_ci NOT NULL,
  `source_entity_id` int NOT NULL,
  `status` enum('pending','review','completed','cancelled') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `resolution_json` json DEFAULT NULL,
  `created_by_broker_id` int NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `completed_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_ctj_tenant_status` (`tenant_id`, `status`),
  KEY `idx_ctj_from_broker` (`from_broker_id`),
  KEY `idx_ctj_to_broker` (`to_broker_id`),
  CONSTRAINT `fk_ctj_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_ctj_from_broker` FOREIGN KEY (`from_broker_id`) REFERENCES `brokers` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_ctj_to_broker` FOREIGN KEY (`to_broker_id`) REFERENCES `brokers` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_ctj_created_by` FOREIGN KEY (`created_by_broker_id`) REFERENCES `brokers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Client/realtor transfer wizard jobs (copy/shared access)';

-- ─── 6.1 Clients visibility (additive — Phase 4 logic uses these) ───────────
ALTER TABLE `clients`
  ADD COLUMN `list_visibility` enum('active','hidden','archived') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active'
    COMMENT 'Per-owner CRM list visibility after transfer/soft-remove',
  ADD COLUMN `hidden_reason` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  ADD COLUMN `hidden_at` datetime DEFAULT NULL;

ALTER TABLE `clients`
  ADD KEY `idx_clients_owner_visibility` (`tenant_id`, `assigned_broker_id`, `list_visibility`);

-- ─── 6.4 Conversation threads scope column (additive — Phase 2 backfill) ─────
ALTER TABLE `conversation_threads`
  ADD COLUMN `owner_client_scope_broker_id` int DEFAULT NULL
    COMMENT 'Denormalized clients.assigned_broker_id for thread client_id';

ALTER TABLE `conversation_threads`
  ADD KEY `idx_ct_owner_scope` (`tenant_id`, `owner_client_scope_broker_id`, `client_id`);

ALTER TABLE `conversation_threads`
  ADD CONSTRAINT `fk_ct_owner_scope_broker`
    FOREIGN KEY (`owner_client_scope_broker_id`) REFERENCES `brokers` (`id`) ON DELETE SET NULL;

-- ─── Feature flags (all OFF — no behavior change until deliberately enabled) ─
INSERT IGNORE INTO `system_settings`
  (`tenant_id`, `setting_key`, `setting_value`, `setting_type`, `description`)
VALUES
  (1, 'per_owner_crm_enabled', 'false', 'boolean',
   'Master switch for per-owner CRM rows, scoped threads, identity linking (see PER_OWNER_CRM_ARCHITECTURE.md)'),
  (1, 'per_owner_crm_allow_production', 'false', 'boolean',
   'When true, per_owner_crm_enabled applies in production runtime'),
  (1, 'per_owner_crm_pilot_broker_ids', '[]', 'json',
   'Optional JSON array of broker IDs for pilot before full tenant rollout');
