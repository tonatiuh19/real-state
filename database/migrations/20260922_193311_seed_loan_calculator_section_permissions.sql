-- Seed Loan Calculator sidebar section for admin + broker on all tenants.
-- Visible by default (7A). Platform owners can hide via Settings.
-- Safe to re-run: skips rows that already exist.

INSERT INTO broker_role_section_permissions (tenant_id, broker_role, section_id, is_visible)
SELECT t.id, 'admin', 'loan-calculator', 1
FROM tenants t
WHERE NOT EXISTS (
  SELECT 1 FROM broker_role_section_permissions p
  WHERE p.tenant_id = t.id
    AND p.broker_role = 'admin'
    AND p.section_id = 'loan-calculator'
);

INSERT INTO broker_role_section_permissions (tenant_id, broker_role, section_id, is_visible)
SELECT t.id, 'broker', 'loan-calculator', 1
FROM tenants t
WHERE NOT EXISTS (
  SELECT 1 FROM broker_role_section_permissions p
  WHERE p.tenant_id = t.id
    AND p.broker_role = 'broker'
    AND p.section_id = 'loan-calculator'
);
