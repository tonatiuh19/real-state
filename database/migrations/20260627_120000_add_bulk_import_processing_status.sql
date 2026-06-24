-- Add 'processing' status for atomic commit claim (prevents double-commit)

ALTER TABLE `bulk_import_jobs`
  MODIFY COLUMN `status` enum('validated','processing','committed','expired','failed')
    COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'validated';
