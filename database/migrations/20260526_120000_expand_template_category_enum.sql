-- Migration: Expand templates.category ENUM to include UI-defined values
-- Date: 2026-05-26
-- Description: The frontend uses category values (status_update, document_request,
--              approval, denial, custom) that were not previously in the ENUM.
--              This migration expands the ENUM to include all values used in the UI.

ALTER TABLE `templates`
  MODIFY COLUMN `category`
    ENUM(
      'welcome',
      'reminder',
      'update',
      'follow_up',
      'marketing',
      'system',
      'status_update',
      'document_request',
      'approval',
      'denial',
      'custom'
    )
    COLLATE utf8mb4_unicode_ci
    DEFAULT 'system';
