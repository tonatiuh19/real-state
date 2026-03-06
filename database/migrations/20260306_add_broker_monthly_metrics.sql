-- Migration: Add broker_monthly_metrics table and source_category to leads
-- Description: Supports the monthly metrics dashboard tracking (leads, credit pulls,
--              pre-approvals, closings, conversion goals, lead source breakdown)
-- Date: 2026-03-06

-- --------------------------------------------------------
-- 1. Create broker_monthly_metrics table
-- --------------------------------------------------------

CREATE TABLE IF NOT EXISTS `broker_monthly_metrics` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) NOT NULL DEFAULT '1',
  -- NULL = tenant-wide admin goals row; non-null = partner-specific actuals row
  `broker_id` int(11) DEFAULT NULL COMMENT 'NULL = admin/global goals row; set for partner-scoped manual actuals',
  `year` int(4) NOT NULL,
  `month` int(2) NOT NULL,

  -- Conversion rate goals (admin only, stored on broker_id IS NULL row)
  `lead_to_credit_goal` decimal(5,2) DEFAULT '70.00',
  `credit_to_preapp_goal` decimal(5,2) DEFAULT '50.00',
  `lead_to_closing_goal` decimal(5,2) DEFAULT '25.00',

  -- Monthly volume goals (admin only)
  `leads_goal` int(11) DEFAULT '40',
  `credit_pulls_goal` int(11) DEFAULT '28',
  `closings_goal` int(11) DEFAULT '10',

  -- Manually-entered actuals (editable by the row owner)
  `credit_pulls_actual` int(11) NOT NULL DEFAULT '0',

  -- Previous year reference data (manually entered)
  `prev_year_leads` int(11) DEFAULT NULL,
  `prev_year_closings` int(11) DEFAULT NULL,

  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_tenant_broker_year_month` (`tenant_id`, `broker_id`, `year`, `month`),
  KEY `idx_tenant_id` (`tenant_id`),
  KEY `idx_broker_id` (`broker_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Monthly broker performance goals (admin, broker_id IS NULL) and per-partner manual actuals';

-- --------------------------------------------------------
-- 2. Add source_category column to leads table
--    Maps to broker dashboard lead codes:
--    CCR, PC, PR, PF, RLTR, AD, BUS, BLDR
-- --------------------------------------------------------

ALTER TABLE `leads`
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
  COMMENT 'Broker-specific lead source category for metrics tracking'
  AFTER `source_details`;
