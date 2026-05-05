-- ============================================================================
-- Migration: 20260505_140000_seed_mismo_test_data_la19602677
-- Purpose:   Seed realistic MISMO 3.4 test data for loan LA19602677
--            (Abraham Flores, client_id=450015, loan_application_id=210016)
--            so the full XML export can be exercised end-to-end.
-- ============================================================================

-- ── clients: fill missing MISMO fields ──────────────────────────────────────
UPDATE `clients`
SET
  `middle_name`    = 'Antonio',
  `date_of_birth`  = '1985-06-15',
  `address_street` = '502 Mayland Ave',
  `address_unit`   = NULL,
  `address_city`   = 'La Puente',
  `address_state`  = 'CA',
  `address_zip`    = '91746'
WHERE `id` = 450015
  AND `tenant_id` = 1;

-- ── loan_applications: fill missing MISMO fields ────────────────────────────
UPDATE `loan_applications`
SET
  `property_unit`   = NULL,
  `marital_status`  = 'single',
  `dependent_count` = 2,
  `dependent_ages`  = JSON_ARRAY(14, 10),
  `years_at_address` = 3.5,
  `loan_purpose`    = 'Purchase primary residence'
WHERE `id` = 210016
  AND `tenant_id` = 1;
