-- Migration: Add tenant_id to task_templates table
-- Date: 2026-02-03
-- Description: Add tenant_id column to task_templates for proper tenant isolation
--              This is CRITICAL for multi-tenant deployments sharing the same database

-- Step 1: Add tenant_id column with default value
ALTER TABLE `task_templates`
ADD COLUMN `tenant_id` int(11) NOT NULL DEFAULT '1'
AFTER `id`;

-- Step 2: Add foreign key constraint
ALTER TABLE `task_templates`
ADD CONSTRAINT `fk_task_templates_tenant`
FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`)
ON DELETE CASCADE
ON UPDATE CASCADE;

-- Step 3: Add index for performance
ALTER TABLE `task_templates`
ADD INDEX `idx_task_templates_tenant` (`tenant_id`);

-- Step 4: Update existing records (if any) to default tenant
-- Note: If you have existing data from multiple tenants, update this accordingly
UPDATE `task_templates` SET `tenant_id` = 1 WHERE `tenant_id` = 1;

-- Verification queries (run these manually to verify):
-- SELECT COUNT(*) FROM task_templates WHERE tenant_id IS NULL; -- Should return 0
-- SELECT * FROM task_templates LIMIT 5; -- Verify tenant_id exists
-- SHOW CREATE TABLE task_templates; -- Verify FK constraint added
