-- Migration: Add Pre-Approval Letters feature
-- Date: 2026-02-26 20:00:00
-- Description: Creates pre_approval_letters table to store customizable HTML 
--              pre-approval letters tied to each loan application.

-- --------------------------------------------------------
-- Table structure for `pre_approval_letters`
-- --------------------------------------------------------

CREATE TABLE IF NOT EXISTS `pre_approval_letters` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) NOT NULL DEFAULT '1',
  `application_id` int(11) NOT NULL COMMENT 'FK to loan_applications.id',
  `approved_amount` decimal(12,2) NOT NULL COMMENT 'Current pre-approved amount shown on letter (can be edited up to max_approved_amount)',
  `max_approved_amount` decimal(12,2) NOT NULL COMMENT 'Maximum pre-approval ceiling — set only by admin brokers, cannot be exceeded',
  `html_content` longtext COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Fully customizable HTML body of the letter',
  `letter_date` date NOT NULL COMMENT 'Date shown on the letter',
  `expires_at` date DEFAULT NULL COMMENT 'Optional expiration date for the pre-approval',
  `is_active` tinyint(1) NOT NULL DEFAULT '1' COMMENT '1 = active/enabled, 0 = disabled',
  `created_by_broker_id` int(11) NOT NULL COMMENT 'Broker who issued the letter',
  `updated_by_broker_id` int(11) DEFAULT NULL COMMENT 'Broker who last edited the letter',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_pre_approval_per_loan` (`application_id`, `tenant_id`) COMMENT 'One active letter per loan per tenant',
  KEY `idx_pre_approval_tenant` (`tenant_id`),
  KEY `idx_pre_approval_application` (`application_id`),
  KEY `idx_pre_approval_created_by` (`created_by_broker_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Pre-approval letters attached to loan applications. One letter per loan, customizable HTML content.';

-- --------------------------------------------------------
-- Add company_logo_url to system_settings if not present
-- --------------------------------------------------------

INSERT IGNORE INTO `system_settings` (`tenant_id`, `setting_key`, `setting_value`, `setting_type`, `description`)
VALUES
  (1, 'company_logo_url', '', 'string', 'URL to company logo displayed in pre-approval letters'),
  (1, 'company_name', 'Encore Mortgage', 'string', 'Company name displayed in pre-approval letters'),
  (1, 'company_address', '', 'string', 'Company address displayed in pre-approval letters'),
  (1, 'company_phone', '', 'string', 'Company phone displayed in pre-approval letters'),
  (1, 'company_nmls', '', 'string', 'Company NMLS license number for pre-approval letters');

-- --------------------------------------------------------
-- Seed default pre-approval letter HTML template
-- --------------------------------------------------------

INSERT IGNORE INTO `system_settings` (`tenant_id`, `setting_key`, `setting_value`, `setting_type`, `description`)
VALUES (
  1,
  'pre_approval_default_template',
  '<div style="font-family: Arial, Helvetica, sans-serif; max-width: 750px; margin: 0 auto; padding: 48px; background: #fff; color: #222;">

  <table style="width: 100%; margin-bottom: 20px; border-collapse: collapse;">
    <tr>
      <td style="vertical-align: top; width: 55%;">{{COMPANY_LOGO}}</td>
      <td style="vertical-align: top; text-align: right; font-size: 13px; color: #333; line-height: 1.8;">
        <strong>{{COMPANY_NAME}}</strong><br>P. {{COMPANY_PHONE}}<br>NMLS# {{COMPANY_NMLS}}
      </td>
    </tr>
  </table>

  <hr style="border: none; border-top: 1px solid #ccc; margin-bottom: 20px;">

  <table style="width: 100%; margin-bottom: 20px; border-collapse: collapse;">
    <tr>
      <td style="font-size: 13px;">Date: {{LETTER_DATE}}</td>
      <td style="font-size: 13px; text-align: right;">Expires: {{EXPIRES_SHORT}}</td>
    </tr>
  </table>

  <p style="margin: 0 0 20px; font-size: 13px;">Re: {{CLIENT_FULL_NAME}}</p>
  <hr style="border: none; border-top: 1px solid #ccc; margin-bottom: 20px;">

  <p style="margin: 0 0 16px; font-size: 13px; line-height: 1.7;">This letter shall serve as a pre-approval for a loan in connection with the purchase transaction for the above referenced buyer(s). Based on preliminary information, a pre-approval is herein granted with the following terms:</p>

  <p style="margin: 0 0 5px; font-size: 13px;">Purchase Price: {{APPROVED_AMOUNT}}</p>
  <p style="margin: 0 0 5px; font-size: 13px;">Loan Type: </p>
  <p style="margin: 0 0 5px; font-size: 13px;">Term: 30 years</p>
  <p style="margin: 0 0 5px; font-size: 13px;">FICO Score: </p>
  <p style="margin: 0 0 20px; font-size: 13px;">Property Address: {{PROPERTY_ADDRESS}}</p>

  <p style="margin: 0 0 8px; font-size: 13px;"><strong>We have reviewed the following:</strong></p>
  <ul style="margin: 0 0 20px; padding-left: 24px; font-size: 13px; line-height: 1.9;">
    <li>Reviewed applicant&#39;s credit report and credit score</li>
    <li>Verified applicant&#39;s income documentation and debt to income ratio</li>
    <li>Verified applicant&#39;s assets documentation</li>
  </ul>

  <p style="margin: 0 0 20px; font-size: 13px; line-height: 1.7;">Disclaimer: <strong>Loan Contingency.</strong> Even though a buyer may hold a pre-approval letter, further investigations concerning the property or the borrower could result in a loan denial. We suggest the buyer consider a loan contingency requirement in the purchase contract (to protect earnest money deposit) in accordance with applicable state law.</p>

  <p style="margin: 0 0 32px; font-size: 13px;">Realtor Partner: </p>

  <table style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="vertical-align: top; width: 100px;">{{BROKER_PHOTO}}</td>
      <td style="vertical-align: top; padding-left: 16px; font-size: 13px; line-height: 1.7;">
        <p style="margin: 0 0 3px;"><strong>{{BROKER_FULL_NAME}}</strong></p>
        <p style="margin: 0 0 3px; color: #444;">Mortgage Banker</p>
        <p style="margin: 0 0 3px; color: #444;">{{BROKER_LICENSE}}</p>
        <p style="margin: 0 0 3px; color: #444;">{{COMPANY_NAME}}</p>
        <p style="margin: 0 0 3px; color: #444;">{{BROKER_PHONE}}</p>
        <p style="margin: 0; color: #444;">{{BROKER_EMAIL}}</p>
      </td>
    </tr>
  </table>

</div>',
  'string',
  'Default HTML template for pre-approval letters — matches Encore Mortgage letter format'
);
