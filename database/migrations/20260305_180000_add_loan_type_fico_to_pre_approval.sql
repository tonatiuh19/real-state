-- Migration: Add loan_type and fico_score to pre_approval_letters
-- Date: 2026-03-05 18:00:00

ALTER TABLE `pre_approval_letters`
  ADD COLUMN `loan_type` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL
    COMMENT 'Loan type shown on the letter: FHA, Conventional, USDA, VA, Non-QM'
    AFTER `expires_at`,
  ADD COLUMN `fico_score` smallint(6) DEFAULT NULL
    COMMENT 'FICO credit score shown on the letter'
    AFTER `loan_type`;
