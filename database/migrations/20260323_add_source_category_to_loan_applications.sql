-- Migration: Add source_category to loan_applications
-- Date: 2026-03-23
-- Description: Tracks the lead source category for each loan application,
--              matching the same enum used in the `leads` table for metrics consistency.

ALTER TABLE `loan_applications`
  ADD COLUMN `source_category` enum(
    'current_client_referral',
    'past_client',
    'past_client_referral',
    'personal_friend',
    'realtor',
    'advertisement',
    'business_partner',
    'builder',
    'other'
  ) COLLATE utf8mb4_unicode_ci DEFAULT NULL
  COMMENT 'Lead source category for this loan application — used in Lead Source Analysis metrics'
  AFTER `citizenship_status`;
