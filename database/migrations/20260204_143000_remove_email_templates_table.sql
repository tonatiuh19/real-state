-- Migration: Clean up database by removing email_templates table and using unified templates
-- Date: 2026-02-04 14:30:00
-- Description: This migration consolidates email templates into the unified templates system

-- Step 1: Migrate existing email_templates data to templates table
INSERT IGNORE INTO templates (
  tenant_id,
  name,
  description,
  template_type,
  category,
  subject,
  body,
  variables,
  is_active,
  created_by_broker_id,
  created_at,
  updated_at
)
SELECT 
  et.tenant_id,
  et.name,
  CONCAT('Migrated from email_templates: ', et.name) as description,
  'email' as template_type,
  CASE 
    WHEN et.template_type = 'welcome' THEN 'welcome'
    WHEN et.template_type = 'status_update' THEN 'update'
    WHEN et.template_type = 'document_request' THEN 'reminder'
    WHEN et.template_type = 'approval' THEN 'update'
    WHEN et.template_type = 'denial' THEN 'update'
    ELSE 'system'
  END as category,
  et.subject,
  COALESCE(et.body_html, et.body_text) as body,
  JSON_ARRAY() as variables,
  et.is_active,
  1 as created_by_broker_id, -- Default to broker ID 1
  et.created_at,
  et.updated_at
FROM email_templates et
WHERE NOT EXISTS (
  SELECT 1 FROM templates t2 
  WHERE t2.tenant_id = et.tenant_id 
    AND t2.name = et.name 
    AND t2.template_type = 'email'
);

-- Step 2: Add template_id column to campaigns table
ALTER TABLE campaigns 
ADD COLUMN template_id INT(11) DEFAULT NULL AFTER target_audience;

-- Step 3: Migrate campaign references from email_template_id to template_id
UPDATE campaigns c
SET c.template_id = (
  SELECT t.id 
  FROM templates t 
  JOIN email_templates et ON t.tenant_id = et.tenant_id 
    AND t.name = et.name 
    AND t.template_type = 'email'
  WHERE et.id = c.email_template_id
  LIMIT 1
)
WHERE c.email_template_id IS NOT NULL 
  AND c.template_id IS NULL;

-- Step 4: Add index for template_id
ALTER TABLE campaigns 
ADD INDEX idx_template_id (template_id);

-- Step 5: Add foreign key constraint for template_id
ALTER TABLE campaigns 
ADD CONSTRAINT fk_campaigns_template 
FOREIGN KEY (template_id) REFERENCES templates (id) ON DELETE SET NULL;

-- Step 6: Drop old foreign key constraints (ignore errors if doesn't exist)
SET foreign_key_checks = 0;
ALTER TABLE campaigns DROP FOREIGN KEY campaigns_ibfk_1;
SET foreign_key_checks = 1;

-- Step 7: Remove old template columns from campaigns (ignore errors if don't exist)
ALTER TABLE campaigns DROP COLUMN email_template_id;
ALTER TABLE campaigns DROP COLUMN sms_template_id;

-- Step 8: Update campaign_type enum to include whatsapp
ALTER TABLE campaigns 
MODIFY COLUMN campaign_type ENUM('email','sms','whatsapp','mixed') NOT NULL;

-- Step 9: Drop email_templates table
DROP TABLE IF EXISTS email_templates;

-- Verify migration success
SELECT 
  'Templates migrated' as step,
  COUNT(*) as count
FROM templates 
WHERE template_type = 'email'
UNION ALL
SELECT 
  'Campaigns updated' as step,
  COUNT(*) as count
FROM campaigns 
WHERE template_id IS NOT NULL;