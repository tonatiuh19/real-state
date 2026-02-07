-- Migration: Migrate email_templates to unified templates table and clean up database
-- Date: 2026-02-04 13:00:00
-- NOTE: Run each step individually to avoid errors

-- Step 1: Migrate existing email_templates data to templates table
INSERT IGNORE INTO templates (
  tenant_id,
  name,
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
  tenant_id,
  name,
  'email' as template_type,
  CASE 
    WHEN template_type = 'welcome' THEN 'welcome'
    WHEN template_type = 'status_update' THEN 'update'
    WHEN template_type = 'document_request' THEN 'reminder'
    WHEN template_type = 'approval' THEN 'update'
    WHEN template_type = 'denial' THEN 'update'
    ELSE 'system'
  END as category,
  subject,
  COALESCE(body_html, body_text) as body,
  JSON_ARRAY() as variables,
  is_active,
  1 as created_by_broker_id,
  created_at,
  updated_at
FROM email_templates
WHERE NOT EXISTS (
  SELECT 1 FROM templates t2 
  WHERE t2.tenant_id = email_templates.tenant_id 
    AND t2.name = email_templates.name 
    AND t2.template_type = 'email'
);

-- Step 2: Add template_id column to campaigns (run only if column doesn't exist)
-- ALTER TABLE campaigns ADD COLUMN template_id INT(11) DEFAULT NULL;

-- Step 3: Populate template_id based on email_template_id
-- UPDATE campaigns c
-- JOIN email_templates et ON c.email_template_id = et.id
-- JOIN templates t ON t.tenant_id = et.tenant_id 
--   AND t.name = et.name 
--   AND t.template_type = 'email'
-- SET c.template_id = t.id
-- WHERE c.email_template_id IS NOT NULL;

-- Step 4: Add index and foreign key (run only if they don't exist)
-- ALTER TABLE campaigns ADD INDEX template_id_idx (template_id);
-- ALTER TABLE campaigns ADD CONSTRAINT campaigns_template_fk FOREIGN KEY (template_id) REFERENCES templates (id) ON DELETE SET NULL;

-- Step 5: Drop old constraints and columns (run only if they exist)
-- ALTER TABLE campaigns DROP FOREIGN KEY campaigns_ibfk_1;
-- ALTER TABLE campaigns DROP COLUMN email_template_id;
-- ALTER TABLE campaigns DROP COLUMN sms_template_id;

-- Step 6: Drop email_templates table
-- DROP TABLE IF EXISTS email_templates;

-- Step 7: Update campaign_type enum to include whatsapp
-- ALTER TABLE campaigns MODIFY COLUMN campaign_type ENUM('email','sms','whatsapp','mixed') NOT NULL;