-- Migration: Add employer contact fields to loan_applications
-- Used on Loan Overview / Loan Overlay Employment section.
-- Note: TiDB/MySQL do not support ADD COLUMN IF NOT EXISTS here.
-- Re-running this migration will fail if columns already exist — that is expected.

ALTER TABLE `loan_applications`
  ADD COLUMN `employer_phone` VARCHAR(30) DEFAULT NULL
    COMMENT 'Employer phone number at time of application'
    AFTER `years_employed`;

ALTER TABLE `loan_applications`
  ADD COLUMN `employer_address` VARCHAR(500) DEFAULT NULL
    COMMENT 'Employer street/business address at time of application'
    AFTER `employer_phone`;

ALTER TABLE `loan_applications`
  ADD COLUMN `employment_start_date` DATE DEFAULT NULL
    COMMENT 'Date employment at current employer started'
    AFTER `employer_address`;
