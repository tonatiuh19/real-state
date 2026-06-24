-- Bulk CSV import staging jobs (platform owner only)

CREATE TABLE IF NOT EXISTS `bulk_import_jobs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tenant_id` int NOT NULL DEFAULT '1',
  `entity` enum('clients','realtors') COLLATE utf8mb4_unicode_ci NOT NULL,
  `uploaded_by_broker_id` int NOT NULL,
  `file_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_sha256` char(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('validated','committed','expired','failed') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'validated',
  `options_json` json DEFAULT NULL,
  `preview_json` json DEFAULT NULL,
  `result_json` json DEFAULT NULL,
  `row_count` int NOT NULL DEFAULT '0',
  `created_count` int NOT NULL DEFAULT '0',
  `skipped_count` int NOT NULL DEFAULT '0',
  `error_count` int NOT NULL DEFAULT '0',
  `expires_at` datetime NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `committed_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_bulk_import_tenant_status` (`tenant_id`,`status`),
  KEY `idx_bulk_import_uploader` (`uploaded_by_broker_id`,`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
