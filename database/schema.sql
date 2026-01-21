-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Jan 20, 2026 at 11:38 PM
-- Server version: 5.7.23-23
-- PHP Version: 8.1.34

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `alanchat_encore_m`
--

-- --------------------------------------------------------

--
-- Table structure for table `application_status_history`
--

CREATE TABLE `application_status_history` (
  `id` int(11) NOT NULL,
  `application_id` int(11) NOT NULL,
  `from_status` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `to_status` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `changed_by_broker_id` int(11) DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `audit_logs`
--

CREATE TABLE `audit_logs` (
  `id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `broker_id` int(11) DEFAULT NULL,
  `actor_type` enum('user','broker') COLLATE utf8mb4_unicode_ci NOT NULL,
  `action` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `entity_type` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `entity_id` int(11) DEFAULT NULL,
  `changes` json DEFAULT NULL,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `brokers`
--

CREATE TABLE `brokers` (
  `id` int(11) NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `first_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `last_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `role` enum('broker','admin') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'broker',
  `status` enum('active','inactive','suspended') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `email_verified` tinyint(1) DEFAULT '0',
  `last_login` datetime DEFAULT NULL,
  `license_number` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `specializations` json DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `brokers`
--

INSERT INTO `brokers` (`id`, `email`, `first_name`, `last_name`, `phone`, `role`, `status`, `email_verified`, `last_login`, `license_number`, `specializations`, `created_at`, `updated_at`) VALUES
(1, 'axgoomez@gmail.com', 'Alex', 'Gomez', NULL, 'admin', 'active', 1, '2026-01-20 21:54:43', NULL, NULL, '2026-01-20 18:56:12', '2026-01-20 21:54:43'),
(2, 'tonatiuh.gom@gmail.com', 'Tonatiuh', 'Gomez', '4741400363', 'admin', 'active', 0, '2026-01-20 23:11:01', '123457890', '[\"First-Time Home Buyers\"]', '2026-01-20 23:10:11', '2026-01-20 23:11:01');

-- --------------------------------------------------------

--
-- Table structure for table `broker_profiles`
--

CREATE TABLE `broker_profiles` (
  `id` int(11) NOT NULL,
  `broker_id` int(11) NOT NULL,
  `bio` text COLLATE utf8mb4_unicode_ci,
  `office_address` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `office_city` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `office_state` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `office_zip` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `avatar_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `years_experience` int(11) DEFAULT NULL,
  `total_loans_closed` int(11) DEFAULT '0',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `broker_sessions`
--

CREATE TABLE `broker_sessions` (
  `id` int(11) NOT NULL,
  `broker_id` int(11) NOT NULL,
  `session_code` int(6) NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `expires_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `broker_sessions`
--

INSERT INTO `broker_sessions` (`id`, `broker_id`, `session_code`, `is_active`, `ip_address`, `user_agent`, `expires_at`, `created_at`) VALUES
(4, 2, 766374, 1, NULL, NULL, '2026-01-21 05:25:49', '2026-01-21 05:10:49');

-- --------------------------------------------------------

--
-- Table structure for table `campaigns`
--

CREATE TABLE `campaigns` (
  `id` int(11) NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `campaign_type` enum('email','sms','mixed') COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('draft','scheduled','active','paused','completed') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'draft',
  `target_audience` json DEFAULT NULL,
  `email_template_id` int(11) DEFAULT NULL,
  `sms_template_id` int(11) DEFAULT NULL,
  `scheduled_start` datetime DEFAULT NULL,
  `scheduled_end` datetime DEFAULT NULL,
  `created_by_broker_id` int(11) DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `campaign_recipients`
--

CREATE TABLE `campaign_recipients` (
  `id` int(11) NOT NULL,
  `campaign_id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `lead_id` int(11) DEFAULT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('pending','sent','delivered','opened','clicked','bounced','unsubscribed') COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `sent_at` datetime DEFAULT NULL,
  `opened_at` datetime DEFAULT NULL,
  `clicked_at` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `clients`
--

CREATE TABLE `clients` (
  `id` int(11) NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `first_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `last_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `alternate_phone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `date_of_birth` date DEFAULT NULL,
  `ssn_encrypted` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address_street` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address_city` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address_state` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address_zip` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `employment_status` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `income_type` enum('W-2','1099','Self-Employed','Investor','Mixed') COLLATE utf8mb4_unicode_ci NOT NULL,
  `annual_income` decimal(15,2) DEFAULT NULL,
  `credit_score` int(11) DEFAULT NULL,
  `status` enum('active','inactive','suspended') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `email_verified` tinyint(1) DEFAULT '0',
  `phone_verified` tinyint(1) DEFAULT '0',
  `last_login` datetime DEFAULT NULL,
  `assigned_broker_id` int(11) DEFAULT NULL,
  `source` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `referral_code` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `clients`
--

INSERT INTO `clients` (`id`, `email`, `password_hash`, `first_name`, `last_name`, `phone`, `alternate_phone`, `date_of_birth`, `ssn_encrypted`, `address_street`, `address_city`, `address_state`, `address_zip`, `employment_status`, `income_type`, `annual_income`, `credit_score`, `status`, `email_verified`, `phone_verified`, `last_login`, `assigned_broker_id`, `source`, `referral_code`, `created_at`, `updated_at`) VALUES
(1, 'test.client@example.com', '', 'John', 'Doe', '(555) 123-4567', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'W-2', NULL, NULL, 'active', 0, 0, NULL, 1, 'broker_created', NULL, '2026-01-20 21:55:33', '2026-01-20 21:55:33');

-- --------------------------------------------------------

--
-- Table structure for table `communications`
--

CREATE TABLE `communications` (
  `id` int(11) NOT NULL,
  `application_id` int(11) DEFAULT NULL,
  `lead_id` int(11) DEFAULT NULL,
  `from_user_id` int(11) DEFAULT NULL,
  `from_broker_id` int(11) DEFAULT NULL,
  `to_user_id` int(11) DEFAULT NULL,
  `to_broker_id` int(11) DEFAULT NULL,
  `communication_type` enum('email','sms','call','internal_note') COLLATE utf8mb4_unicode_ci NOT NULL,
  `direction` enum('inbound','outbound') COLLATE utf8mb4_unicode_ci NOT NULL,
  `subject` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `body` text COLLATE utf8mb4_unicode_ci,
  `status` enum('pending','sent','delivered','failed','read') COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `external_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `metadata` json DEFAULT NULL,
  `scheduled_at` datetime DEFAULT NULL,
  `sent_at` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `compliance_checklists`
--

CREATE TABLE `compliance_checklists` (
  `id` int(11) NOT NULL,
  `application_id` int(11) NOT NULL,
  `checklist_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_completed` tinyint(1) DEFAULT '0',
  `completed_by_broker_id` int(11) DEFAULT NULL,
  `completed_at` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `compliance_checklist_items`
--

CREATE TABLE `compliance_checklist_items` (
  `id` int(11) NOT NULL,
  `checklist_id` int(11) NOT NULL,
  `item_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `item_description` text COLLATE utf8mb4_unicode_ci,
  `is_required` tinyint(1) DEFAULT '1',
  `is_completed` tinyint(1) DEFAULT '0',
  `completed_by_broker_id` int(11) DEFAULT NULL,
  `completed_at` datetime DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `documents`
--

CREATE TABLE `documents` (
  `id` int(11) NOT NULL,
  `application_id` int(11) DEFAULT NULL,
  `uploaded_by_user_id` int(11) DEFAULT NULL,
  `uploaded_by_broker_id` int(11) DEFAULT NULL,
  `document_type` enum('id_verification','income_verification','bank_statement','tax_return','pay_stub','employment_letter','credit_report','property_appraisal','purchase_agreement','title_report','insurance','other') COLLATE utf8mb4_unicode_ci NOT NULL,
  `document_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_path` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_size_bytes` int(11) DEFAULT NULL,
  `mime_type` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('pending_review','approved','rejected','expired') COLLATE utf8mb4_unicode_ci DEFAULT 'pending_review',
  `is_required` tinyint(1) DEFAULT '0',
  `reviewed_by_broker_id` int(11) DEFAULT NULL,
  `reviewed_at` datetime DEFAULT NULL,
  `review_notes` text COLLATE utf8mb4_unicode_ci,
  `expiration_date` date DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `email_templates`
--

CREATE TABLE `email_templates` (
  `id` int(11) NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `subject` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `body_html` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `body_text` text COLLATE utf8mb4_unicode_ci,
  `template_type` enum('welcome','status_update','document_request','approval','denial','custom') COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `email_templates`
--

INSERT INTO `email_templates` (`id`, `name`, `subject`, `body_html`, `body_text`, `template_type`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'Welcome Client', 'Welcome to Our Loan Services', '<p>Dear {{first_name}},</p><p>Welcome! We\'re excited to help you with your loan application.</p>', NULL, 'welcome', 1, '2026-01-20 18:56:12', '2026-01-20 18:56:12'),
(2, 'Application Submitted', 'Your Loan Application Has Been Received', '<p>Dear {{first_name}},</p><p>We have received your application #{{application_number}}. We will review it shortly.</p>', NULL, 'status_update', 1, '2026-01-20 18:56:12', '2026-01-20 18:56:12'),
(3, 'Documents Required', 'Additional Documents Needed', '<p>Dear {{first_name}},</p><p>Please upload the following documents to proceed with your application.</p>', NULL, 'document_request', 1, '2026-01-20 18:56:12', '2026-01-20 18:56:12');

-- --------------------------------------------------------

--
-- Table structure for table `leads`
--

CREATE TABLE `leads` (
  `id` int(11) NOT NULL,
  `source` enum('website','referral','social_media','cold_call','event','other') COLLATE utf8mb4_unicode_ci NOT NULL,
  `source_details` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `first_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `last_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `interest_type` enum('purchase','refinance','home_equity','commercial','other') COLLATE utf8mb4_unicode_ci NOT NULL,
  `estimated_loan_amount` decimal(12,2) DEFAULT NULL,
  `property_type` enum('single_family','condo','multi_family','commercial','land','other') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('new','contacted','qualified','unqualified','converted','lost') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'new',
  `assigned_broker_id` int(11) DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `converted_to_client_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `lead_activities`
--

CREATE TABLE `lead_activities` (
  `id` int(11) NOT NULL,
  `lead_id` int(11) NOT NULL,
  `activity_type` enum('call','email','sms','meeting','note','status_change') COLLATE utf8mb4_unicode_ci NOT NULL,
  `subject` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `performed_by_broker_id` int(11) DEFAULT NULL,
  `scheduled_at` datetime DEFAULT NULL,
  `completed_at` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `loan_applications`
--

CREATE TABLE `loan_applications` (
  `id` int(11) NOT NULL,
  `application_number` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `client_user_id` int(11) NOT NULL,
  `broker_user_id` int(11) DEFAULT NULL,
  `loan_type` enum('purchase','refinance','home_equity','commercial','construction','other') COLLATE utf8mb4_unicode_ci NOT NULL,
  `loan_amount` decimal(12,2) NOT NULL,
  `property_value` decimal(12,2) DEFAULT NULL,
  `property_address` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `property_city` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `property_state` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `property_zip` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `property_type` enum('single_family','condo','multi_family','commercial','land','other') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `down_payment` decimal(12,2) DEFAULT NULL,
  `loan_purpose` text COLLATE utf8mb4_unicode_ci,
  `status` enum('draft','submitted','under_review','documents_pending','underwriting','conditional_approval','approved','denied','closed','cancelled') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'draft',
  `current_step` int(11) DEFAULT '1',
  `total_steps` int(11) DEFAULT '8',
  `priority` enum('low','medium','high','urgent') COLLATE utf8mb4_unicode_ci DEFAULT 'medium',
  `estimated_close_date` date DEFAULT NULL,
  `actual_close_date` date DEFAULT NULL,
  `interest_rate` decimal(5,3) DEFAULT NULL,
  `loan_term_months` int(11) DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `submitted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `loan_applications`
--

INSERT INTO `loan_applications` (`id`, `application_number`, `client_user_id`, `broker_user_id`, `loan_type`, `loan_amount`, `property_value`, `property_address`, `property_city`, `property_state`, `property_zip`, `property_type`, `down_payment`, `loan_purpose`, `status`, `current_step`, `total_steps`, `priority`, `estimated_close_date`, `actual_close_date`, `interest_rate`, `loan_term_months`, `notes`, `created_at`, `updated_at`, `submitted_at`) VALUES
(1, 'LA67733401', 1, 1, 'purchase', 350000.00, 450000.00, '123 Main Street', 'San Francisco', 'CA', '94102', 'single_family', 100000.00, 'Primary residence purchase', 'submitted', 1, 8, 'medium', '2026-03-15', NULL, NULL, NULL, 'Test loan application for development', '2026-01-20 21:55:33', '2026-01-20 21:55:33', '2026-01-20 21:55:33');

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

CREATE TABLE `notifications` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `message` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `notification_type` enum('info','success','warning','error') COLLATE utf8mb4_unicode_ci DEFAULT 'info',
  `is_read` tinyint(1) DEFAULT '0',
  `action_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `read_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `notifications`
--

INSERT INTO `notifications` (`id`, `user_id`, `title`, `message`, `notification_type`, `is_read`, `action_url`, `created_at`, `read_at`) VALUES
(1, 1, 'New Loan Application Created', 'Your loan application LA67733401 has been created. Please complete the assigned tasks.', 'info', 0, '/portal', '2026-01-20 21:55:33', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `sms_templates`
--

CREATE TABLE `sms_templates` (
  `id` int(11) NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `body` varchar(1600) COLLATE utf8mb4_unicode_ci NOT NULL,
  `template_type` enum('reminder','status_update','document_request','custom') COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `system_settings`
--

CREATE TABLE `system_settings` (
  `id` int(11) NOT NULL,
  `setting_key` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `setting_value` text COLLATE utf8mb4_unicode_ci,
  `setting_type` enum('string','number','boolean','json') COLLATE utf8mb4_unicode_ci DEFAULT 'string',
  `description` text COLLATE utf8mb4_unicode_ci,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `system_settings`
--

INSERT INTO `system_settings` (`id`, `setting_key`, `setting_value`, `setting_type`, `description`, `updated_at`) VALUES
(1, 'company_name', 'Loan Broker Pro', 'string', 'Company name', '2026-01-20 18:56:12'),
(2, 'support_email', 'support@example.com', 'string', 'Support email address', '2026-01-20 18:56:12'),
(3, 'max_file_upload_mb', '10', 'number', 'Maximum file upload size in MB', '2026-01-20 18:56:12'),
(4, 'enable_sms', 'true', 'boolean', 'Enable SMS notifications', '2026-01-20 18:56:12'),
(5, 'enable_email', 'true', 'boolean', 'Enable email notifications', '2026-01-20 18:56:12');

-- --------------------------------------------------------

--
-- Table structure for table `tasks`
--

CREATE TABLE `tasks` (
  `id` int(11) NOT NULL,
  `template_id` int(11) DEFAULT NULL COMMENT 'References task_template if created from template',
  `order_index` int(11) DEFAULT '0' COMMENT 'Order in loan workflow (copied from template)',
  `application_id` int(11) DEFAULT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `task_type` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Matches task_template.task_type',
  `status` enum('pending','in_progress','completed','cancelled','overdue') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `priority` enum('low','medium','high','urgent') COLLATE utf8mb4_unicode_ci DEFAULT 'medium',
  `assigned_to_user_id` int(11) DEFAULT NULL,
  `assigned_to_broker_id` int(11) DEFAULT NULL,
  `created_by_broker_id` int(11) DEFAULT NULL,
  `due_date` datetime DEFAULT NULL,
  `completed_at` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `tasks`
--

INSERT INTO `tasks` (`id`, `template_id`, `order_index`, `application_id`, `title`, `description`, `task_type`, `status`, `priority`, `assigned_to_user_id`, `assigned_to_broker_id`, `created_by_broker_id`, `due_date`, `completed_at`, `created_at`, `updated_at`) VALUES
(2, NULL, 0, 1, 'Clear to Close', 'Final review before closing', 'review', 'pending', 'urgent', 1, NULL, 1, '2026-02-10 21:55:33', NULL, '2026-01-20 21:55:33', '2026-01-20 21:55:33'),
(3, NULL, 0, 1, 'Underwriting Submission', 'Submit complete file to underwriting', 'underwriting', 'pending', 'high', 1, NULL, 1, '2026-01-30 21:55:34', NULL, '2026-01-20 21:55:33', '2026-01-20 21:55:33'),
(4, NULL, 0, 1, 'Property Appraisal Order', 'Order property appraisal', 'appraisal', 'pending', 'medium', 1, NULL, 1, '2026-01-25 21:55:34', NULL, '2026-01-20 21:55:33', '2026-01-20 21:55:33');

-- --------------------------------------------------------

--
-- Table structure for table `task_templates`
--

CREATE TABLE `task_templates` (
  `id` int(11) NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `task_type` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Custom task type from wizard',
  `priority` enum('low','medium','high','urgent') COLLATE utf8mb4_unicode_ci DEFAULT 'medium',
  `default_due_days` int(11) DEFAULT NULL COMMENT 'Days after loan creation to set as due date (NULL = no due date)',
  `order_index` int(11) DEFAULT '0' COMMENT 'Order in the loan workflow (lower = earlier in process)',
  `is_active` tinyint(1) DEFAULT '1' COMMENT 'Only active templates are used for new loans',
  `created_by_broker_id` int(11) NOT NULL COMMENT 'Broker who created this template',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Reusable task templates for loan workflows';

--
-- Dumping data for table `task_templates`
--

INSERT INTO `task_templates` (`id`, `title`, `description`, `task_type`, `priority`, `default_due_days`, `order_index`, `is_active`, `created_by_broker_id`, `created_at`, `updated_at`) VALUES
(1, 'Initial Document Collection', 'Collect initial loan application documents from client', 'document_collection', 'high', 2, 1, 1, 1, '2026-01-20 20:56:49', '2026-01-20 20:56:49'),
(2, 'Credit Report Review', 'Pull and review client credit report', 'credit_check', 'high', 1, 2, 1, 1, '2026-01-20 20:56:49', '2026-01-20 20:56:49'),
(3, 'Income Verification', 'Verify employment and income documentation', 'verification', 'high', 3, 3, 1, 1, '2026-01-20 20:56:49', '2026-01-20 20:56:49'),
(4, 'Property Appraisal Order', 'Order property appraisal', 'appraisal', 'medium', 5, 4, 1, 1, '2026-01-20 20:56:49', '2026-01-20 20:56:49'),
(5, 'Title Search', 'Order title search and insurance', 'title_search', 'medium', 7, 5, 1, 1, '2026-01-20 20:56:49', '2026-01-20 20:56:49'),
(6, 'Underwriting Submission', 'Submit complete file to underwriting', 'underwriting', 'high', 10, 6, 1, 1, '2026-01-20 20:56:49', '2026-01-20 20:56:49'),
(7, 'Conditional Approval Follow-up', 'Address underwriting conditions', 'follow_up', 'high', 14, 7, 1, 1, '2026-01-20 20:56:49', '2026-01-20 20:56:49'),
(8, 'Clear to Close', 'Final review before closing', 'review', 'urgent', 21, 8, 1, 1, '2026-01-20 20:56:49', '2026-01-20 20:56:49'),
(9, 'Schedule Closing', 'Coordinate closing date with all parties', 'closing', 'high', 25, 9, 1, 1, '2026-01-20 20:56:49', '2026-01-20 20:56:49'),
(10, 'Fund Loan', 'Final loan funding and disbursement', 'closing', 'urgent', 30, 10, 1, 1, '2026-01-20 20:56:49', '2026-01-20 20:56:49');

-- --------------------------------------------------------

--
-- Table structure for table `user_profiles`
--

CREATE TABLE `user_profiles` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `date_of_birth` date DEFAULT NULL,
  `ssn_last_four` varchar(4) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address_line1` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address_line2` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `city` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `state` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `zip_code` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `country` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT 'USA',
  `employment_status` enum('employed','self_employed','unemployed','retired') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `employer_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `annual_income` decimal(12,2) DEFAULT NULL,
  `credit_score` int(11) DEFAULT NULL,
  `avatar_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `user_sessions`
--

CREATE TABLE `user_sessions` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `session_code` int(6) NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `expires_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `application_status_history`
--
ALTER TABLE `application_status_history`
  ADD PRIMARY KEY (`id`),
  ADD KEY `changed_by_broker_id` (`changed_by_broker_id`),
  ADD KEY `idx_application_id` (`application_id`),
  ADD KEY `idx_created_at` (`created_at`);

--
-- Indexes for table `audit_logs`
--
ALTER TABLE `audit_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_broker_id` (`broker_id`),
  ADD KEY `idx_entity` (`entity_type`,`entity_id`),
  ADD KEY `idx_created_at` (`created_at`);

--
-- Indexes for table `brokers`
--
ALTER TABLE `brokers`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `idx_email` (`email`),
  ADD KEY `idx_role` (`role`),
  ADD KEY `idx_status` (`status`);

--
-- Indexes for table `broker_profiles`
--
ALTER TABLE `broker_profiles`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `broker_id` (`broker_id`);

--
-- Indexes for table `broker_sessions`
--
ALTER TABLE `broker_sessions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_broker_id` (`broker_id`),
  ADD KEY `idx_session_code` (`session_code`),
  ADD KEY `idx_is_active` (`is_active`),
  ADD KEY `idx_expires_at` (`expires_at`);

--
-- Indexes for table `campaigns`
--
ALTER TABLE `campaigns`
  ADD PRIMARY KEY (`id`),
  ADD KEY `email_template_id` (`email_template_id`),
  ADD KEY `sms_template_id` (`sms_template_id`),
  ADD KEY `created_by_broker_id` (`created_by_broker_id`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_campaign_type` (`campaign_type`);

--
-- Indexes for table `campaign_recipients`
--
ALTER TABLE `campaign_recipients`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `lead_id` (`lead_id`),
  ADD KEY `idx_campaign_id` (`campaign_id`),
  ADD KEY `idx_status` (`status`);

--
-- Indexes for table `clients`
--
ALTER TABLE `clients`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `idx_email` (`email`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_assigned_broker` (`assigned_broker_id`),
  ADD KEY `idx_income_type` (`income_type`);

--
-- Indexes for table `communications`
--
ALTER TABLE `communications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `from_user_id` (`from_user_id`),
  ADD KEY `from_broker_id` (`from_broker_id`),
  ADD KEY `to_user_id` (`to_user_id`),
  ADD KEY `to_broker_id` (`to_broker_id`),
  ADD KEY `idx_application_id` (`application_id`),
  ADD KEY `idx_lead_id` (`lead_id`),
  ADD KEY `idx_communication_type` (`communication_type`),
  ADD KEY `idx_created_at` (`created_at`);

--
-- Indexes for table `compliance_checklists`
--
ALTER TABLE `compliance_checklists`
  ADD PRIMARY KEY (`id`),
  ADD KEY `completed_by_broker_id` (`completed_by_broker_id`),
  ADD KEY `idx_application_id` (`application_id`);

--
-- Indexes for table `compliance_checklist_items`
--
ALTER TABLE `compliance_checklist_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `completed_by_broker_id` (`completed_by_broker_id`),
  ADD KEY `idx_checklist_id` (`checklist_id`);

--
-- Indexes for table `documents`
--
ALTER TABLE `documents`
  ADD PRIMARY KEY (`id`),
  ADD KEY `uploaded_by_user_id` (`uploaded_by_user_id`),
  ADD KEY `uploaded_by_broker_id` (`uploaded_by_broker_id`),
  ADD KEY `reviewed_by_broker_id` (`reviewed_by_broker_id`),
  ADD KEY `idx_application_id` (`application_id`),
  ADD KEY `idx_document_type` (`document_type`),
  ADD KEY `idx_status` (`status`);

--
-- Indexes for table `email_templates`
--
ALTER TABLE `email_templates`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_template_type` (`template_type`);

--
-- Indexes for table `leads`
--
ALTER TABLE `leads`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_assigned_broker` (`assigned_broker_id`),
  ADD KEY `idx_created_at` (`created_at`);

--
-- Indexes for table `lead_activities`
--
ALTER TABLE `lead_activities`
  ADD PRIMARY KEY (`id`),
  ADD KEY `performed_by_broker_id` (`performed_by_broker_id`),
  ADD KEY `idx_lead_id` (`lead_id`),
  ADD KEY `idx_activity_type` (`activity_type`),
  ADD KEY `idx_scheduled_at` (`scheduled_at`);

--
-- Indexes for table `loan_applications`
--
ALTER TABLE `loan_applications`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `application_number` (`application_number`),
  ADD KEY `idx_application_number` (`application_number`),
  ADD KEY `idx_client` (`client_user_id`),
  ADD KEY `idx_broker` (`broker_user_id`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_created_at` (`created_at`);

--
-- Indexes for table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_is_read` (`is_read`),
  ADD KEY `idx_created_at` (`created_at`);

--
-- Indexes for table `sms_templates`
--
ALTER TABLE `sms_templates`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_template_type` (`template_type`);

--
-- Indexes for table `system_settings`
--
ALTER TABLE `system_settings`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `setting_key` (`setting_key`);

--
-- Indexes for table `tasks`
--
ALTER TABLE `tasks`
  ADD PRIMARY KEY (`id`),
  ADD KEY `created_by_broker_id` (`created_by_broker_id`),
  ADD KEY `idx_application_id` (`application_id`),
  ADD KEY `idx_assigned_to_user` (`assigned_to_user_id`),
  ADD KEY `idx_assigned_to_broker` (`assigned_to_broker_id`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_due_date` (`due_date`),
  ADD KEY `idx_template` (`template_id`),
  ADD KEY `idx_application_status` (`application_id`,`status`);

--
-- Indexes for table `task_templates`
--
ALTER TABLE `task_templates`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_created_by_broker` (`created_by_broker_id`),
  ADD KEY `idx_active_order` (`is_active`,`order_index`);

--
-- Indexes for table `user_profiles`
--
ALTER TABLE `user_profiles`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `user_id` (`user_id`);

--
-- Indexes for table `user_sessions`
--
ALTER TABLE `user_sessions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_session_code` (`session_code`),
  ADD KEY `idx_is_active` (`is_active`),
  ADD KEY `idx_expires_at` (`expires_at`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `application_status_history`
--
ALTER TABLE `application_status_history`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `audit_logs`
--
ALTER TABLE `audit_logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `brokers`
--
ALTER TABLE `brokers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `broker_profiles`
--
ALTER TABLE `broker_profiles`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `broker_sessions`
--
ALTER TABLE `broker_sessions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `campaigns`
--
ALTER TABLE `campaigns`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `campaign_recipients`
--
ALTER TABLE `campaign_recipients`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `clients`
--
ALTER TABLE `clients`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `communications`
--
ALTER TABLE `communications`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `compliance_checklists`
--
ALTER TABLE `compliance_checklists`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `compliance_checklist_items`
--
ALTER TABLE `compliance_checklist_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `documents`
--
ALTER TABLE `documents`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `email_templates`
--
ALTER TABLE `email_templates`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `leads`
--
ALTER TABLE `leads`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `lead_activities`
--
ALTER TABLE `lead_activities`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `loan_applications`
--
ALTER TABLE `loan_applications`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `sms_templates`
--
ALTER TABLE `sms_templates`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `system_settings`
--
ALTER TABLE `system_settings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `tasks`
--
ALTER TABLE `tasks`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `task_templates`
--
ALTER TABLE `task_templates`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT for table `user_profiles`
--
ALTER TABLE `user_profiles`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `user_sessions`
--
ALTER TABLE `user_sessions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `application_status_history`
--
ALTER TABLE `application_status_history`
  ADD CONSTRAINT `application_status_history_ibfk_1` FOREIGN KEY (`application_id`) REFERENCES `loan_applications` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `application_status_history_ibfk_2` FOREIGN KEY (`changed_by_broker_id`) REFERENCES `brokers` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `audit_logs`
--
ALTER TABLE `audit_logs`
  ADD CONSTRAINT `audit_logs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `clients` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `audit_logs_ibfk_2` FOREIGN KEY (`broker_id`) REFERENCES `brokers` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `broker_profiles`
--
ALTER TABLE `broker_profiles`
  ADD CONSTRAINT `broker_profiles_ibfk_1` FOREIGN KEY (`broker_id`) REFERENCES `brokers` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `broker_sessions`
--
ALTER TABLE `broker_sessions`
  ADD CONSTRAINT `broker_sessions_ibfk_1` FOREIGN KEY (`broker_id`) REFERENCES `brokers` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `campaigns`
--
ALTER TABLE `campaigns`
  ADD CONSTRAINT `campaigns_ibfk_1` FOREIGN KEY (`email_template_id`) REFERENCES `email_templates` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `campaigns_ibfk_2` FOREIGN KEY (`sms_template_id`) REFERENCES `sms_templates` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `campaigns_ibfk_3` FOREIGN KEY (`created_by_broker_id`) REFERENCES `brokers` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `campaign_recipients`
--
ALTER TABLE `campaign_recipients`
  ADD CONSTRAINT `campaign_recipients_ibfk_1` FOREIGN KEY (`campaign_id`) REFERENCES `campaigns` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `campaign_recipients_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `clients` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `campaign_recipients_ibfk_3` FOREIGN KEY (`lead_id`) REFERENCES `leads` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `communications`
--
ALTER TABLE `communications`
  ADD CONSTRAINT `communications_ibfk_1` FOREIGN KEY (`application_id`) REFERENCES `loan_applications` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `communications_ibfk_2` FOREIGN KEY (`lead_id`) REFERENCES `leads` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `communications_ibfk_3` FOREIGN KEY (`from_user_id`) REFERENCES `clients` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `communications_ibfk_4` FOREIGN KEY (`from_broker_id`) REFERENCES `brokers` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `communications_ibfk_5` FOREIGN KEY (`to_user_id`) REFERENCES `clients` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `communications_ibfk_6` FOREIGN KEY (`to_broker_id`) REFERENCES `brokers` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `compliance_checklists`
--
ALTER TABLE `compliance_checklists`
  ADD CONSTRAINT `compliance_checklists_ibfk_1` FOREIGN KEY (`application_id`) REFERENCES `loan_applications` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `compliance_checklists_ibfk_2` FOREIGN KEY (`completed_by_broker_id`) REFERENCES `brokers` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `compliance_checklist_items`
--
ALTER TABLE `compliance_checklist_items`
  ADD CONSTRAINT `compliance_checklist_items_ibfk_1` FOREIGN KEY (`checklist_id`) REFERENCES `compliance_checklists` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `compliance_checklist_items_ibfk_2` FOREIGN KEY (`completed_by_broker_id`) REFERENCES `brokers` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `documents`
--
ALTER TABLE `documents`
  ADD CONSTRAINT `documents_ibfk_1` FOREIGN KEY (`application_id`) REFERENCES `loan_applications` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `documents_ibfk_2` FOREIGN KEY (`uploaded_by_user_id`) REFERENCES `clients` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `documents_ibfk_3` FOREIGN KEY (`uploaded_by_broker_id`) REFERENCES `brokers` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `documents_ibfk_4` FOREIGN KEY (`reviewed_by_broker_id`) REFERENCES `brokers` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `leads`
--
ALTER TABLE `leads`
  ADD CONSTRAINT `leads_ibfk_1` FOREIGN KEY (`assigned_broker_id`) REFERENCES `brokers` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `lead_activities`
--
ALTER TABLE `lead_activities`
  ADD CONSTRAINT `lead_activities_ibfk_1` FOREIGN KEY (`lead_id`) REFERENCES `leads` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `lead_activities_ibfk_2` FOREIGN KEY (`performed_by_broker_id`) REFERENCES `brokers` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `loan_applications`
--
ALTER TABLE `loan_applications`
  ADD CONSTRAINT `loan_applications_ibfk_1` FOREIGN KEY (`client_user_id`) REFERENCES `clients` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `loan_applications_ibfk_2` FOREIGN KEY (`broker_user_id`) REFERENCES `brokers` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `notifications`
--
ALTER TABLE `notifications`
  ADD CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `clients` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `tasks`
--
ALTER TABLE `tasks`
  ADD CONSTRAINT `fk_task_template` FOREIGN KEY (`template_id`) REFERENCES `task_templates` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `tasks_ibfk_1` FOREIGN KEY (`application_id`) REFERENCES `loan_applications` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `tasks_ibfk_3` FOREIGN KEY (`assigned_to_user_id`) REFERENCES `clients` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `tasks_ibfk_4` FOREIGN KEY (`assigned_to_broker_id`) REFERENCES `brokers` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `tasks_ibfk_5` FOREIGN KEY (`created_by_broker_id`) REFERENCES `brokers` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `task_templates`
--
ALTER TABLE `task_templates`
  ADD CONSTRAINT `fk_task_template_broker` FOREIGN KEY (`created_by_broker_id`) REFERENCES `brokers` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `user_profiles`
--
ALTER TABLE `user_profiles`
  ADD CONSTRAINT `user_profiles_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `clients` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `user_sessions`
--
ALTER TABLE `user_sessions`
  ADD CONSTRAINT `user_sessions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `clients` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
