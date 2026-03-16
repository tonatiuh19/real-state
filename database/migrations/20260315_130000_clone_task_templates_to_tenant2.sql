-- Migration: Clone task templates + form fields to tenant 2
-- Date: 2026-03-15
-- Compatible with MySQL 8.0 (HostGator)
-- Description:
--   Copies task templates from tenant_id=1 to tenant_id=2,
--   then copies related task_form_fields to the newly matched tenant 2 templates.
--
-- Notes:
--   - Template dedupe key: (tenant_id=2, title)
--   - Form dedupe key: (task_template_id, field_name)
--   - created_by_broker_id for tenant 2 uses the first tenant 2 admin broker when available;
--     otherwise falls back to source created_by_broker_id.

START TRANSACTION;

-- 1) Clone task templates from tenant 1 -> tenant 2
INSERT INTO `task_templates` (
  `tenant_id`,
  `title`,
  `description`,
  `task_type`,
  `priority`,
  `default_due_days`,
  `order_index`,
  `is_active`,
  `created_by_broker_id`,
  `created_at`,
  `updated_at`,
  `requires_documents`,
  `document_instructions`,
  `has_custom_form`,
  `has_signing`
)
SELECT
  2 AS `tenant_id`,
  src.`title`,
  src.`description`,
  src.`task_type`,
  src.`priority`,
  src.`default_due_days`,
  src.`order_index`,
  src.`is_active`,
  COALESCE(
    (
      SELECT b.`id`
      FROM `brokers` b
      WHERE b.`tenant_id` = 2
        AND b.`role` = 'admin'
      ORDER BY b.`id` ASC
      LIMIT 1
    ),
    src.`created_by_broker_id`
  ) AS `created_by_broker_id`,
  NOW() AS `created_at`,
  NOW() AS `updated_at`,
  src.`requires_documents`,
  src.`document_instructions`,
  src.`has_custom_form`,
  src.`has_signing`
FROM `task_templates` src
WHERE src.`tenant_id` = 1
  AND NOT EXISTS (
    SELECT 1
    FROM `task_templates` t2
    WHERE t2.`tenant_id` = 2
      AND t2.`title` = src.`title`
  );

-- 2) Clone form fields by matching source template title to tenant 2 template title
INSERT INTO `task_form_fields` (
  `task_template_id`,
  `field_name`,
  `field_label`,
  `field_type`,
  `field_options`,
  `is_required`,
  `placeholder`,
  `validation_rules`,
  `order_index`,
  `help_text`,
  `created_at`
)
SELECT
  t2.`id` AS `task_template_id`,
  ff.`field_name`,
  ff.`field_label`,
  ff.`field_type`,
  ff.`field_options`,
  ff.`is_required`,
  ff.`placeholder`,
  ff.`validation_rules`,
  ff.`order_index`,
  ff.`help_text`,
  NOW() AS `created_at`
FROM `task_form_fields` ff
INNER JOIN `task_templates` t1
  ON t1.`id` = ff.`task_template_id`
 AND t1.`tenant_id` = 1
INNER JOIN `task_templates` t2
  ON t2.`tenant_id` = 2
 AND t2.`title` = t1.`title`
WHERE NOT EXISTS (
  SELECT 1
  FROM `task_form_fields` ff2
  WHERE ff2.`task_template_id` = t2.`id`
    AND ff2.`field_name` = ff.`field_name`
);

COMMIT;
