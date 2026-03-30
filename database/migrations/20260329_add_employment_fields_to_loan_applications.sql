-- Migration: Add employment fields to loan_applications
-- These values were previously concatenated into the `notes` column.
-- Now stored as proper columns for display, filtering, and reporting.

ALTER TABLE `loan_applications`
  ADD COLUMN `employment_status` ENUM('employed','self_employed','unemployed','retired','retired_with_pension') DEFAULT NULL
    COMMENT 'Applicant employment status at time of application'
    AFTER `citizenship_status`;

ALTER TABLE `loan_applications`
  ADD COLUMN `employer_name` VARCHAR(255) DEFAULT NULL
    COMMENT 'Employer or business name at time of application'
    AFTER `employment_status`;

ALTER TABLE `loan_applications`
  ADD COLUMN `years_employed` VARCHAR(20) DEFAULT NULL
    COMMENT 'Years at current employer/business at time of application'
    AFTER `employer_name`;
