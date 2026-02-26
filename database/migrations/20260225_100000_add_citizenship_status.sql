-- Migration: Add citizenship_status to clients and loan_applications
-- Date: 2026-02-25
-- Description: Adds citizenship/immigration status to clients and loan_applications
--              so the system can auto-assign the correct task templates on
--              public wizard submission (e.g. Green Card task for permanent residents).

-- ── clients table ──────────────────────────────────────────────────────────────
-- Note: if the column already exists this will error with #1060 — safe to ignore.
ALTER TABLE `clients`
  ADD COLUMN `citizenship_status`
    ENUM('us_citizen','permanent_resident','non_resident','other')
    COLLATE utf8mb4_unicode_ci
    DEFAULT NULL
    COMMENT 'Client citizenship/immigration status'
  AFTER `credit_score`;

-- ── loan_applications table ────────────────────────────────────────────────────
ALTER TABLE `loan_applications`
  ADD COLUMN `citizenship_status`
    ENUM('us_citizen','permanent_resident','non_resident','other')
    COLLATE utf8mb4_unicode_ci
    DEFAULT NULL
    COMMENT 'Applicant citizenship/immigration status at time of application'
  AFTER `submitted_at`;

-- ── Indexes ─────────────────────────────────────────────────────────────────────
-- Note: if the index already exists this will error with #1061 — safe to ignore.
CREATE INDEX `idx_clients_citizenship`
  ON `clients` (`citizenship_status`);

CREATE INDEX `idx_loan_apps_citizenship`
  ON `loan_applications` (`citizenship_status`);
