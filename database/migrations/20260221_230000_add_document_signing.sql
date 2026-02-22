-- Migration: Add document signing feature
-- Date: 2026-02-21
-- Description: Adds tables and columns to support document signing task templates
--              where broker uploads a PDF, defines signature zones, and clients sign them.

-- --------------------------------------------------------
-- Table: task_sign_documents
-- Stores the PDF document and signature zone definitions for a signing task template
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `task_sign_documents` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) NOT NULL DEFAULT '1',
  `task_template_id` int(11) NOT NULL COMMENT 'References task_templates.id',
  `file_path` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Full URL or path on external server (disruptinglabs)',
  `original_filename` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_size` bigint(20) DEFAULT NULL COMMENT 'File size in bytes',
  `signature_zones` json DEFAULT NULL COMMENT 'Array of zone objects [{id, page, x, y, width, height, label}]',
  `uploaded_by_broker_id` int(11) NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_task_template_id` (`task_template_id`),
  KEY `idx_tenant_id` (`tenant_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='PDF documents with signature zone definitions for signing task templates';

-- --------------------------------------------------------
-- Table: task_signatures
-- Stores signature images submitted by clients for signing task instances
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `task_signatures` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) NOT NULL DEFAULT '1',
  `task_id` int(11) NOT NULL COMMENT 'References tasks.id (task instance)',
  `sign_document_id` int(11) NOT NULL COMMENT 'References task_sign_documents.id',
  `zone_id` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Zone identifier from signature_zones JSON',
  `signature_data` longtext COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Base64 encoded PNG from signature canvas',
  `signed_by_user_id` int(11) DEFAULT NULL COMMENT 'Client user who signed',
  `signed_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_task_zone` (`task_id`, `zone_id`),
  KEY `idx_task_id` (`task_id`),
  KEY `idx_sign_document_id` (`sign_document_id`),
  KEY `idx_tenant_id` (`tenant_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Client signature responses for document signing tasks';

-- --------------------------------------------------------
-- Add has_signing flag to task_templates
-- --------------------------------------------------------
ALTER TABLE `task_templates`
  ADD COLUMN `has_signing` tinyint(1) DEFAULT '0' COMMENT 'Whether this task requires document signing (has signing zones)' AFTER `has_custom_form`;

-- Add index for the new column
ALTER TABLE `task_templates`
  ADD KEY `idx_task_templates_has_signing` (`has_signing`);
