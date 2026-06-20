-- Enable Realtor Management sidebar for Mortgage Bankers (tenant 1)
-- Platform owners can toggle this via Settings → Role Section Permissions.

UPDATE broker_role_section_permissions
SET is_visible = 1, updated_at = NOW()
WHERE tenant_id = 1
  AND broker_role = 'admin'
  AND section_id = 'brokers';
