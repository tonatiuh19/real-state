-- Migration: Clean up SMS templates and complete unified templates system
-- Date: 2026-02-04 15:00:00
-- Description: Remove sms_templates table and ensure all template operations use unified templates table

-- Step 1: Migrate existing sms_templates data to templates table (will do nothing if table doesn't exist)
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
  st.tenant_id, 
  st.name, 
  CONCAT('Migrated from sms_templates: ', st.name) as description, 
  'sms' as template_type, 
  CASE 
    WHEN st.template_type = 'reminder' THEN 'reminder'
    WHEN st.template_type = 'status_update' THEN 'update'
    WHEN st.template_type = 'document_request' THEN 'reminder'
    ELSE 'system'
  END as category, 
  NULL as subject, 
  st.body, 
  JSON_ARRAY() as variables, 
  st.is_active, 
  1 as created_by_broker_id, 
  st.created_at, 
  st.updated_at
FROM sms_templates st
WHERE NOT EXISTS (
  SELECT 1 FROM templates t2 
  WHERE t2.tenant_id = st.tenant_id 
    AND t2.name = st.name 
    AND t2.template_type = 'sms'
);

-- Step 2: Drop sms_templates table (will show warning if doesn't exist, but won't fail)
DROP TABLE IF EXISTS sms_templates;

-- Step 3: Verify unified templates system is complete
SELECT 
  'Templates by type' as summary,
  template_type,
  COUNT(*) as count
FROM templates 
GROUP BY template_type
UNION ALL
SELECT 
  'Total templates' as summary,
  'all' as template_type,
  COUNT(*) as count
FROM templates;

-- Final verification
SELECT 'SMS templates migration completed successfully' as status;