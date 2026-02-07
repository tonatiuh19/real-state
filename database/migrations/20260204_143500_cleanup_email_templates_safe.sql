-- Migration: Clean up remaining email_templates references (continuation)
-- Date: 2026-02-04 14:35:00
-- Description: Complete cleanup of email_templates system for partially migrated database

-- Check what still needs to be done and handle gracefully

-- Step 1: Migrate existing email_templates data to templates table if not already done
SET @email_templates_exists = (
  SELECT COUNT(*) 
  FROM information_schema.TABLES 
  WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'email_templates'
);

SET @sql = IF(@email_templates_exists > 0,
  'INSERT IGNORE INTO templates (tenant_id, name, description, template_type, category, subject, body, variables, is_active, created_by_broker_id, created_at, updated_at) SELECT et.tenant_id, et.name, CONCAT(\"Migrated from email_templates: \", et.name) as description, \"email\" as template_type, CASE WHEN et.template_type = \"welcome\" THEN \"welcome\" WHEN et.template_type = \"status_update\" THEN \"update\" WHEN et.template_type = \"document_request\" THEN \"reminder\" WHEN et.template_type = \"approval\" THEN \"update\" WHEN et.template_type = \"denial\" THEN \"update\" ELSE \"system\" END as category, et.subject, COALESCE(et.body_html, et.body_text) as body, JSON_ARRAY() as variables, et.is_active, 1 as created_by_broker_id, et.created_at, et.updated_at FROM email_templates et WHERE NOT EXISTS (SELECT 1 FROM templates t2 WHERE t2.tenant_id = et.tenant_id AND t2.name = et.name AND t2.template_type = \"email\")',
  'SELECT "Email templates table does not exist - migration not needed" as status'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Only add template_id if it doesn't exist
SET @column_exists = (
  SELECT COUNT(*) 
  FROM information_schema.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'campaigns' 
    AND COLUMN_NAME = 'template_id'
);

SET @sql = IF(@column_exists = 0, 
  'ALTER TABLE campaigns ADD COLUMN template_id INT(11) DEFAULT NULL AFTER target_audience',
  'SELECT "template_id column already exists" as status'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Migrate campaign references if email_template_id column still exists
SET @old_column_exists = (
  SELECT COUNT(*) 
  FROM information_schema.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'campaigns' 
    AND COLUMN_NAME = 'email_template_id'
);

-- Only migrate if both tables and columns exist
SET @sql = IF(@old_column_exists > 0 AND @email_templates_exists > 0,
  'UPDATE campaigns c SET c.template_id = (SELECT t.id FROM templates t JOIN email_templates et ON t.tenant_id = et.tenant_id AND t.name = et.name AND t.template_type = \"email\" WHERE et.id = c.email_template_id LIMIT 1) WHERE c.email_template_id IS NOT NULL AND c.template_id IS NULL',
  'SELECT "Migration not needed - columns or tables do not exist" as status'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add index if it doesn't exist
SET @index_exists = (
  SELECT COUNT(*) 
  FROM information_schema.STATISTICS 
  WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'campaigns' 
    AND INDEX_NAME = 'idx_template_id'
);

SET @sql = IF(@index_exists = 0,
  'ALTER TABLE campaigns ADD INDEX idx_template_id (template_id)',
  'SELECT "Index already exists" as status'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add foreign key if it doesn't exist
SET @fk_exists = (
  SELECT COUNT(*) 
  FROM information_schema.KEY_COLUMN_USAGE 
  WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'campaigns' 
    AND CONSTRAINT_NAME = 'fk_campaigns_template'
);

SET @sql = IF(@fk_exists = 0,
  'ALTER TABLE campaigns ADD CONSTRAINT fk_campaigns_template FOREIGN KEY (template_id) REFERENCES templates (id) ON DELETE SET NULL',
  'SELECT "Foreign key already exists" as status'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Drop old foreign key if it exists
SET @old_fk_exists = (
  SELECT COUNT(*) 
  FROM information_schema.KEY_COLUMN_USAGE 
  WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'campaigns' 
    AND CONSTRAINT_NAME = 'campaigns_ibfk_1'
);

SET @sql = IF(@old_fk_exists > 0,
  'ALTER TABLE campaigns DROP FOREIGN KEY campaigns_ibfk_1',
  'SELECT "Old foreign key does not exist" as status'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Drop old columns if they exist (first drop any foreign key constraints)
SET @sql = IF(@old_column_exists > 0,
  'ALTER TABLE campaigns DROP COLUMN email_template_id',
  'SELECT "email_template_id column does not exist" as status'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sms_column_exists = (
  SELECT COUNT(*) 
  FROM information_schema.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'campaigns' 
    AND COLUMN_NAME = 'sms_template_id'
);

-- Drop any foreign key constraints on sms_template_id first
SET @sms_fk_exists = (
  SELECT COUNT(*) 
  FROM information_schema.KEY_COLUMN_USAGE 
  WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'campaigns' 
    AND COLUMN_NAME = 'sms_template_id'
    AND CONSTRAINT_NAME != 'PRIMARY'
);

-- Find and drop the foreign key constraint for sms_template_id if it exists
SET @sms_fk_name = (
  SELECT CONSTRAINT_NAME 
  FROM information_schema.KEY_COLUMN_USAGE 
  WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'campaigns' 
    AND COLUMN_NAME = 'sms_template_id'
    AND CONSTRAINT_NAME != 'PRIMARY'
  LIMIT 1
);

SET @sql = IF(@sms_fk_exists > 0,
  CONCAT('ALTER TABLE campaigns DROP FOREIGN KEY ', @sms_fk_name),
  'SELECT "No foreign key on sms_template_id" as status'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Now drop the sms_template_id column
SET @sql = IF(@sms_column_exists > 0,
  'ALTER TABLE campaigns DROP COLUMN sms_template_id',
  'SELECT "sms_template_id column does not exist" as status'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Update campaign_type enum to include whatsapp
ALTER TABLE campaigns 
MODIFY COLUMN campaign_type ENUM('email','sms','whatsapp','mixed') NOT NULL;

-- Drop email_templates table if it exists
SET @sql = IF(@email_templates_exists > 0,
  'DROP TABLE email_templates',
  'SELECT "email_templates table does not exist" as status'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Final verification
SELECT 'Migration completed successfully' as status;