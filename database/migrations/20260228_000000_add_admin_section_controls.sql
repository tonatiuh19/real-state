-- Migration: Add admin_section_controls table
-- Date: 2026-02-28
-- Description: Allows managing which admin sidebar sections are disabled/enabled
--              and customizing their tooltip messages from the database.

CREATE TABLE `admin_section_controls` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) NOT NULL DEFAULT '1',
  `section_id` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Matches the id field in the sidebar menu items',
  `is_disabled` tinyint(1) NOT NULL DEFAULT '0',
  `tooltip_message` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Coming Soon',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_tenant_section` (`tenant_id`, `section_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Controls which admin sidebar sections are disabled and their tooltip messages';

-- Seed default records for all known sidebar sections (enabled by default)
-- The "conversations" section starts disabled as it was hardcoded previously.
INSERT INTO `admin_section_controls` (`tenant_id`, `section_id`, `is_disabled`, `tooltip_message`) VALUES
(1, 'dashboard',                  0, 'Coming Soon'),
(1, 'pipeline',                   0, 'Coming Soon'),
(1, 'clients',                    0, 'Coming Soon'),
(1, 'tasks',                      0, 'Coming Soon'),
(1, 'documents',                  0, 'Coming Soon'),
(1, 'communication-templates',    0, 'Coming Soon'),
(1, 'reminder-flows',             0, 'Coming Soon'),
(1, 'conversations',              1, 'Coming Soon'),
(1, 'reports',                    0, 'Coming Soon'),
(1, 'brokers',                    0, 'Coming Soon'),
(1, 'settings',                   0, 'Coming Soon');
