-- Migration: Add purchase property address fields to pre_approval_letters
-- Date: 2026-04-21
-- Description: Allows the broker to specify the property the client intends to
--              purchase on the pre-approval letter, independent of the loan's
--              registered property address.

ALTER TABLE `pre_approval_letters`
  ADD COLUMN `purchase_property_address` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL
    COMMENT 'Street address of the property the client intends to purchase';

ALTER TABLE `pre_approval_letters`
  ADD COLUMN `purchase_property_city` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL
    COMMENT 'City of the intended purchase property';

ALTER TABLE `pre_approval_letters`
  ADD COLUMN `purchase_property_state` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL
    COMMENT 'State of the intended purchase property';

ALTER TABLE `pre_approval_letters`
  ADD COLUMN `purchase_property_zip` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL
    COMMENT 'ZIP code of the intended purchase property';
