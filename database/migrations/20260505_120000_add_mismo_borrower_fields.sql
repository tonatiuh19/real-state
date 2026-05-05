-- ============================================================================
-- Migration: 20260505_120000_add_mismo_borrower_fields
-- Purpose:   Add fields required to generate complete MISMO 3.4 / ULAD XML
--            that passes Fannie Mae Desktop Underwriter (DU) validation.
-- Fields added:
--   clients.middle_name            → PARTY > INDIVIDUAL > NAME > MiddleName
--   clients.address_unit           → AddressUnitIdentifier in PARTY ADDRESSES
--   loan_applications.property_unit       → AddressUnitIdentifier in COLLATERAL
--   loan_applications.marital_status      → BORROWER_DETAIL > MaritalStatusType
--   loan_applications.dependent_count     → BORROWER_DETAIL > DependentCount
--   loan_applications.dependent_ages      → BORROWER > DEPENDENTS (ages in years)
--   loan_applications.years_at_address    → RESIDENCE_DETAIL duration fields
-- ============================================================================

ALTER TABLE `clients`
  ADD COLUMN `middle_name` VARCHAR(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL
    COMMENT 'Borrower middle name for MISMO MiddleName element'
    AFTER `last_name`,
  ADD COLUMN `address_unit` VARCHAR(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL
    COMMENT 'Apartment / unit number for MISMO AddressUnitIdentifier'
    AFTER `address_street`;

ALTER TABLE `loan_applications`
  ADD COLUMN `property_unit` VARCHAR(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL
    COMMENT 'Property unit/apt number for MISMO COLLATERAL AddressUnitIdentifier'
    AFTER `property_address`,
  ADD COLUMN `marital_status` ENUM('married','separated','single','divorced','widowed') COLLATE utf8mb4_unicode_ci DEFAULT NULL
    COMMENT 'Borrower marital status for MISMO MaritalStatusType'
    AFTER `citizenship_status`,
  ADD COLUMN `dependent_count` TINYINT UNSIGNED DEFAULT NULL
    COMMENT 'Number of financial dependents for MISMO DependentCount'
    AFTER `marital_status`,
  ADD COLUMN `dependent_ages` JSON DEFAULT NULL
    COMMENT 'Array of dependent ages in years, e.g. [14, 6], for MISMO DEPENDENTS section'
    AFTER `dependent_count`,
  ADD COLUMN `years_at_address` DECIMAL(4,1) DEFAULT NULL
    COMMENT 'Years borrower has lived at current address for MISMO BorrowerResidencyDurationYearsCount'
    AFTER `dependent_ages`;
