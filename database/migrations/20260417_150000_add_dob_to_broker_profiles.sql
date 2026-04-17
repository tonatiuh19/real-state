-- Migration: Add date_of_birth to broker_profiles
-- Purpose: Enables birthday tracking for partners and mortgage bankers in the calendar

ALTER TABLE broker_profiles
  ADD COLUMN `date_of_birth` date DEFAULT NULL COMMENT 'Date of birth for birthday calendar events'
  AFTER `total_loans_closed`;
