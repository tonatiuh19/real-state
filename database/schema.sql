-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Mar 28, 2026 at 06:38 PM
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
-- Table structure for table `admin_section_controls`
--

CREATE TABLE `admin_section_controls` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) NOT NULL DEFAULT '1',
  `section_id` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Matches the id field in the sidebar menu items',
  `is_disabled` tinyint(1) NOT NULL DEFAULT '0',
  `tooltip_message` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Coming Soon',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Controls which admin sidebar sections are disabled and their tooltip messages';

--
-- Dumping data for table `admin_section_controls`
--

INSERT INTO `admin_section_controls` (`id`, `tenant_id`, `section_id`, `is_disabled`, `tooltip_message`, `created_at`, `updated_at`) VALUES
(1, 1, 'dashboard', 0, 'Coming Soon', '2026-02-28 17:35:37', '2026-02-28 17:35:37'),
(2, 1, 'pipeline', 0, 'Coming Soon', '2026-02-28 17:35:37', '2026-02-28 17:35:37'),
(3, 1, 'clients', 0, 'Coming Soon', '2026-02-28 17:35:37', '2026-02-28 17:35:37'),
(4, 1, 'tasks', 0, 'Coming Soon', '2026-02-28 17:35:37', '2026-02-28 17:35:37'),
(5, 1, 'documents', 0, 'Coming Soon', '2026-02-28 17:35:37', '2026-02-28 17:35:37'),
(6, 1, 'communication-templates', 0, 'Coming Soon', '2026-02-28 17:35:37', '2026-02-28 17:35:37'),
(7, 1, 'reminder-flows', 0, 'Coming Soon', '2026-02-28 17:35:37', '2026-02-28 17:35:37'),
(8, 1, 'conversations', 0, 'Coming Soon', '2026-02-28 17:35:37', '2026-02-28 17:38:02'),
(9, 1, 'reports', 0, 'Coming Soon', '2026-02-28 17:35:37', '2026-02-28 17:35:37'),
(10, 1, 'brokers', 0, 'Coming Soon', '2026-02-28 17:35:37', '2026-02-28 17:35:37'),
(11, 1, 'settings', 0, 'Coming Soon', '2026-02-28 17:35:37', '2026-02-28 17:35:37'),
(12, 1, 'scheduler', 1, 'Coming Soon', '2026-03-20 13:48:01', '2026-03-22 19:04:49');

-- --------------------------------------------------------

--
-- Table structure for table `application_status_history`
--

CREATE TABLE `application_status_history` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) NOT NULL DEFAULT '1',
  `application_id` int(11) NOT NULL,
  `from_status` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `to_status` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `changed_by_broker_id` int(11) DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `audit_logs`
--

CREATE TABLE `audit_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) DEFAULT NULL,
  `user_id` int(11) DEFAULT NULL,
  `broker_id` int(11) DEFAULT NULL,
  `actor_type` enum('user','broker') COLLATE utf8mb4_unicode_ci NOT NULL,
  `action` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `entity_type` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `entity_id` int(11) DEFAULT NULL,
  `changes` json DEFAULT NULL,
  `status` enum('success','failure','warning') COLLATE utf8mb4_unicode_ci DEFAULT 'success',
  `error_message` text COLLATE utf8mb4_unicode_ci,
  `request_id` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `duration_ms` int(11) DEFAULT NULL COMMENT 'Request duration in milliseconds',
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `audit_logs`
--

INSERT INTO `audit_logs` (`id`, `tenant_id`, `user_id`, `broker_id`, `actor_type`, `action`, `entity_type`, `entity_id`, `changes`, `status`, `error_message`, `request_id`, `duration_ms`, `ip_address`, `user_agent`, `created_at`) VALUES
(1, 1, NULL, 1, 'broker', 'view_audit_logs', NULL, NULL, NULL, 'success', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2026-01-21 20:51:03'),
(2, 1, NULL, 1, 'broker', 'view_audit_logs', NULL, NULL, NULL, 'success', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2026-01-21 20:58:08'),
(3, 1, NULL, 1, 'broker', 'view_audit_logs', NULL, NULL, NULL, 'success', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2026-01-21 21:02:06'),
(4, 1, NULL, 1, 'broker', 'view_audit_logs', NULL, NULL, NULL, 'success', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2026-01-21 21:02:42'),
(5, 1, NULL, 1, 'broker', 'view_audit_logs', NULL, NULL, NULL, 'success', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2026-01-21 21:05:12'),
(6, 1, NULL, 1, 'broker', 'view_audit_logs', NULL, NULL, NULL, 'success', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2026-01-21 21:05:20'),
(7, 1, NULL, 1, 'broker', 'view_audit_logs', NULL, NULL, NULL, 'success', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2026-01-21 21:06:07'),
(8, 1, NULL, 1, 'broker', 'view_audit_logs', NULL, NULL, NULL, 'success', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2026-01-21 21:06:55'),
(9, 1, NULL, 1, 'broker', 'view_audit_logs', NULL, NULL, NULL, 'success', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2026-01-21 21:17:11'),
(10, 1, NULL, 1, 'broker', 'view_audit_logs', NULL, NULL, NULL, 'success', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2026-01-21 21:47:34'),
(11, 1, NULL, 1, 'broker', 'view_audit_logs', NULL, NULL, NULL, 'success', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2026-01-21 21:47:57'),
(12, 1, NULL, 1, 'broker', 'view_audit_logs', NULL, NULL, NULL, 'success', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2026-01-21 21:48:09'),
(13, 1, NULL, 1, 'broker', 'view_audit_logs', NULL, NULL, NULL, 'success', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2026-01-21 21:48:29'),
(14, 1, NULL, 1, 'broker', 'approve_task', 'task', 17, '{\"status\": \"approved\", \"approved_at\": \"2026-01-28T05:12:41.478Z\"}', 'success', NULL, NULL, NULL, NULL, NULL, '2026-01-27 23:12:41'),
(15, 1, NULL, 1, 'broker', 'approve_task', 'task', 18, '{\"status\": \"approved\", \"approved_at\": \"2026-01-28T20:59:44.042Z\"}', 'success', NULL, NULL, NULL, NULL, NULL, '2026-01-28 14:59:44'),
(16, 1, NULL, 1, 'broker', 'generate_mismo', 'loan_application', 10, '{\"filename\": \"MISMO_LA33836272_2026-01-28.xml\", \"generated_at\": \"2026-01-28T20:59:48.158Z\"}', 'success', NULL, NULL, NULL, NULL, NULL, '2026-01-28 14:59:48'),
(17, 1, NULL, 1, 'broker', 'approve_task', 'task', 19, '{\"status\": \"approved\", \"approved_at\": \"2026-01-28T21:07:46.718Z\"}', 'success', NULL, NULL, NULL, NULL, NULL, '2026-01-28 15:07:46'),
(18, 1, NULL, 1, 'broker', 'generate_mismo', 'loan_application', 11, '{\"filename\": \"MISMO_LA34345831_2026-01-28.xml\", \"generated_at\": \"2026-01-28T21:07:57.184Z\"}', 'success', NULL, NULL, NULL, NULL, NULL, '2026-01-28 15:07:57'),
(19, 1, NULL, 4, 'broker', 'view_audit_logs', NULL, NULL, NULL, 'success', NULL, NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', '2026-01-28 23:55:48'),
(20, 1, NULL, 4, 'broker', 'generate_mismo', 'loan_application', 11, '{\"filename\": \"MISMO_LA34345831_2026-01-29.xml\", \"generated_at\": \"2026-01-29T06:01:01.966Z\"}', 'success', NULL, NULL, NULL, NULL, NULL, '2026-01-29 00:01:01'),
(21, 1, NULL, 4, 'broker', 'view_audit_logs', NULL, NULL, NULL, 'success', NULL, NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', '2026-01-29 00:03:05'),
(22, 1, NULL, 4, 'broker', 'view_audit_logs', NULL, NULL, NULL, 'success', NULL, NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', '2026-01-29 00:03:38'),
(23, 1, NULL, 1, 'broker', 'view_audit_logs', NULL, NULL, NULL, 'success', NULL, NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '2026-01-31 00:30:18'),
(24, NULL, NULL, 1, 'broker', 'view_audit_logs', NULL, NULL, NULL, 'success', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '2026-02-02 15:57:02'),
(25, NULL, NULL, 1, 'broker', 'view_audit_logs', NULL, NULL, NULL, 'success', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '2026-02-02 15:57:28'),
(26, NULL, NULL, 1, 'broker', 'view_audit_logs', NULL, NULL, NULL, 'success', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '2026-02-02 15:58:03'),
(27, NULL, NULL, 1, 'broker', 'view_audit_logs', NULL, NULL, NULL, 'success', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '2026-02-02 15:59:00'),
(28, 2, NULL, 7, 'broker', 'view_audit_logs', NULL, NULL, NULL, 'success', NULL, NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', '2026-02-03 17:36:50'),
(29, 2, NULL, 7, 'broker', 'view_audit_logs', NULL, NULL, NULL, 'success', NULL, NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', '2026-02-03 17:36:59'),
(30, 2, NULL, 7, 'broker', 'view_audit_logs', NULL, NULL, NULL, 'success', NULL, NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '2026-02-05 18:37:39'),
(31, 2, NULL, 6, 'broker', 'update_task_form_field', 'task_form_field', 28, '{\"field_name\": {\"to\": \"ine_frontt\", \"from\": \"document_front\"}, \"field_type\": {\"to\": \"file_pdf\", \"from\": \"file_pdf\"}, \"field_label\": {\"to\": \"INE FRONTT\", \"from\": \"Document - Front\"}, \"task_template_id\": \"29\"}', 'success', NULL, NULL, NULL, NULL, NULL, '2026-02-11 20:55:11'),
(32, 2, NULL, 6, 'broker', 'update_task_form_field', 'task_form_field', 29, '{\"field_name\": {\"to\": \"ine_back\", \"from\": \"document_back\"}, \"field_type\": {\"to\": \"file_pdf\", \"from\": \"file_pdf\"}, \"field_label\": {\"to\": \"INE BACK\", \"from\": \"Document - Back\"}, \"task_template_id\": \"29\"}', 'success', NULL, NULL, NULL, NULL, NULL, '2026-02-11 20:55:11'),
(33, 2, NULL, 6, 'broker', 'update_task_form_field', 'task_form_field', 28, '{\"field_name\": {\"to\": \"ine_front\", \"from\": \"ine_frontt\"}, \"field_type\": {\"to\": \"file_pdf\", \"from\": \"file_pdf\"}, \"field_label\": {\"to\": \"INE Front\", \"from\": \"INE FRONTT\"}, \"task_template_id\": \"29\"}', 'success', NULL, NULL, NULL, NULL, NULL, '2026-02-11 20:56:14'),
(34, 2, NULL, 6, 'broker', 'update_task_form_field', 'task_form_field', 29, '{\"field_name\": {\"to\": \"ine_back\", \"from\": \"ine_back\"}, \"field_type\": {\"to\": \"file_pdf\", \"from\": \"file_pdf\"}, \"field_label\": {\"to\": \"INE Back\", \"from\": \"INE BACK\"}, \"task_template_id\": \"29\"}', 'success', NULL, NULL, NULL, NULL, NULL, '2026-02-11 20:56:14'),
(35, 1, NULL, 1, 'broker', 'system_migration', 'conversation_system', NULL, '{\"date\": \"2026-02-11\", \"version\": \"1.0\", \"migration\": \"conversation_system_setup\"}', 'success', NULL, NULL, NULL, NULL, NULL, '2026-02-11 23:04:12'),
(36, 2, NULL, 7, 'broker', 'system_migration', 'conversation_system', NULL, '{\"date\": \"2026-02-11\", \"version\": \"1.0\", \"migration\": \"conversation_system_setup\"}', 'success', NULL, NULL, NULL, NULL, NULL, '2026-02-11 23:04:12'),
(37, 1, NULL, NULL, 'user', 'delete_corrupted_templates', 'template', NULL, '{\"action\": \"Deleted all templates to fix JSON corruption\"}', 'success', 'Deleted all template data due to JSON corruption, will recreate with proper format', NULL, NULL, NULL, NULL, '2026-02-12 18:18:21'),
(38, NULL, NULL, NULL, 'user', 'recreate_templates_clean', 'template', NULL, '{\"count\": \"12\", \"action\": \"Recreated all templates with proper JSON format\"}', 'success', 'Successfully recreated all template data with proper JSON arrays', NULL, NULL, NULL, NULL, '2026-02-12 18:18:21'),
(39, 2, NULL, NULL, 'user', 'fix_corrupted_json', 'template', 10, '{\"new\": \"[\\\"client_name\\\", \\\"application_id\\\", \\\"broker_name\\\"]\", \"old\": \"client_name,application_id,broker_name\"}', 'success', 'Fixed corrupted JSON for template 10', NULL, NULL, NULL, NULL, '2026-02-12 18:21:04'),
(40, 2, NULL, NULL, 'user', 'fix_corrupted_json', 'template', 11, '{\"new\": \"[\\\"client_name\\\", \\\"broker_name\\\", \\\"document_count\\\"]\", \"old\": \"client_name,broker_name,document_count\"}', 'success', 'Fixed corrupted JSON for template 11', NULL, NULL, NULL, NULL, '2026-02-12 18:21:04'),
(41, 2, NULL, NULL, 'user', 'fix_corrupted_json', 'template', 12, '{\"new\": \"[\\\"client_name\\\", \\\"status\\\", \\\"additional_notes\\\", \\\"next_steps\\\", \\\"broker_name\\\"]\", \"old\": \"client_name,status,additional_notes,next_steps,broker_name\"}', 'success', 'Fixed corrupted JSON for template 12', NULL, NULL, NULL, NULL, '2026-02-12 18:21:04'),
(42, 2, NULL, 7, 'broker', 'view_audit_logs', NULL, NULL, NULL, 'success', NULL, NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '2026-02-13 00:04:49'),
(43, 2, NULL, 7, 'broker', 'view_audit_logs', NULL, NULL, NULL, 'success', NULL, NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '2026-02-13 13:13:18'),
(44, 1, NULL, 4, 'broker', 'view_audit_logs', NULL, NULL, NULL, 'success', NULL, NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '2026-02-13 23:51:37'),
(45, 1, NULL, 4, 'broker', 'view_audit_logs', NULL, NULL, NULL, 'success', NULL, NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '2026-02-13 23:54:45'),
(46, 1, NULL, 4, 'broker', 'view_audit_logs', NULL, NULL, NULL, 'success', NULL, NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '2026-02-19 10:59:23'),
(47, 1, NULL, 4, 'broker', 'view_audit_logs', NULL, NULL, NULL, 'success', NULL, NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '2026-02-19 10:59:50'),
(48, 1, NULL, 1, 'broker', 'view_audit_logs', NULL, NULL, NULL, 'success', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '2026-02-19 20:36:22'),
(49, 1, NULL, 1, 'broker', 'view_audit_logs', NULL, NULL, NULL, 'success', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '2026-02-19 20:37:14'),
(50, 1, NULL, 4, 'broker', 'view_audit_logs', NULL, NULL, NULL, 'success', NULL, NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '2026-02-19 21:47:06'),
(51, 1, NULL, 4, 'broker', 'view_audit_logs', NULL, NULL, NULL, 'success', NULL, NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '2026-02-19 21:47:47'),
(52, 1, NULL, 4, 'broker', 'view_audit_logs', NULL, NULL, NULL, 'success', NULL, NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '2026-02-19 21:48:11'),
(53, 1, NULL, 4, 'broker', 'view_audit_logs', NULL, NULL, NULL, 'success', NULL, NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '2026-02-19 21:53:06'),
(54, 1, NULL, 4, 'broker', 'view_audit_logs', NULL, NULL, NULL, 'success', NULL, NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '2026-02-19 21:53:23'),
(55, 1, NULL, 1, 'broker', 'view_audit_logs', NULL, NULL, NULL, 'success', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '2026-02-19 21:58:14'),
(56, 1, NULL, 1, 'broker', 'update_task_form_field', 'task_form_field', 30, '{\"field_name\": {\"to\": \"front\", \"from\": \"document_front\"}, \"field_type\": {\"to\": \"file_pdf\", \"from\": \"file_pdf\"}, \"field_label\": {\"to\": \"Front\", \"from\": \"Document - Front\"}, \"task_template_id\": \"30\"}', 'success', NULL, NULL, NULL, NULL, NULL, '2026-02-20 18:04:36'),
(57, 1, NULL, 1, 'broker', 'update_task_form_field', 'task_form_field', 31, '{\"field_name\": {\"to\": \"back\", \"from\": \"document_back\"}, \"field_type\": {\"to\": \"file_pdf\", \"from\": \"file_pdf\"}, \"field_label\": {\"to\": \"Back\", \"from\": \"Document - Back\"}, \"task_template_id\": \"30\"}', 'success', NULL, NULL, NULL, NULL, NULL, '2026-02-20 18:04:36'),
(58, 1, NULL, 1, 'broker', 'create_task_form_field', 'task_form_field', 32, '{\"field_name\": \"license_number\", \"field_type\": \"text\", \"field_label\": \"License Number\", \"task_template_id\": \"30\"}', 'success', NULL, NULL, NULL, NULL, NULL, '2026-02-20 18:04:36'),
(59, 1, NULL, 1, 'broker', 'schema_migration', 'pipeline_step_templates', NULL, '{\"action\": \"create_table\", \"migration\": \"20260220_add_pipeline_step_templates\"}', 'success', NULL, NULL, NULL, NULL, NULL, '2026-02-20 18:37:57'),
(60, 1, NULL, 1, 'broker', 'view_audit_logs', NULL, NULL, NULL, 'success', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '2026-02-20 19:17:15'),
(61, 1, NULL, 1, 'broker', 'view_audit_logs', NULL, NULL, NULL, 'success', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '2026-02-20 19:17:16'),
(62, 1, NULL, 1, 'broker', 'view_audit_logs', NULL, NULL, NULL, 'success', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '2026-02-20 19:35:58'),
(63, 1, NULL, 1, 'broker', 'view_audit_logs', NULL, NULL, NULL, 'success', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '2026-02-20 19:36:10'),
(64, 1, NULL, 1, 'broker', 'view_audit_logs', NULL, NULL, NULL, 'success', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '2026-02-20 19:36:19'),
(65, 1, NULL, 1, 'broker', 'view_audit_logs', NULL, NULL, NULL, 'success', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '2026-02-20 19:38:40'),
(66, 1, NULL, 1, 'broker', 'view_audit_logs', NULL, NULL, NULL, 'success', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '2026-02-20 21:21:46'),
(67, 1, NULL, 1, 'broker', 'view_audit_logs', NULL, NULL, NULL, 'success', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '2026-02-20 21:25:20'),
(68, 1, NULL, 1, 'broker', 'update_task_form_field', 'task_form_field', 33, '{\"field_name\": {\"to\": \"attach_the_document\", \"from\": \"document_front\"}, \"field_type\": {\"to\": \"file_pdf\", \"from\": \"file_pdf\"}, \"field_label\": {\"to\": \"Attach the document\", \"from\": \"Document - Front\"}, \"task_template_id\": \"31\"}', 'success', NULL, NULL, NULL, NULL, NULL, '2026-02-21 15:44:15'),
(69, 1, NULL, 1, 'broker', 'reopen_task', 'task', 28, '{\"reason\": \"Please re-upload the documents\", \"status\": \"reopened\", \"reopened_at\": \"2026-02-21T23:36:00.144Z\"}', 'success', NULL, NULL, NULL, NULL, NULL, '2026-02-21 17:36:00'),
(70, 1, NULL, 1, 'broker', 'approve_task', 'task', 28, '{\"status\": \"approved\", \"approved_at\": \"2026-02-21T23:41:31.107Z\"}', 'success', NULL, NULL, NULL, NULL, NULL, '2026-02-21 17:41:31'),
(71, 1, NULL, 1, 'broker', 'approve_task', 'task', 29, '{\"status\": \"approved\", \"approved_at\": \"2026-02-21T23:49:48.257Z\"}', 'success', NULL, NULL, NULL, NULL, NULL, '2026-02-21 17:49:48'),
(72, 1, NULL, 1, 'broker', 'approve_task', 'task', 30, '{\"status\": \"approved\", \"approved_at\": \"2026-02-22T02:17:27.742Z\"}', 'success', NULL, NULL, NULL, NULL, NULL, '2026-02-21 20:17:27'),
(73, 1, NULL, 4, 'broker', 'view_audit_logs', NULL, NULL, NULL, 'success', NULL, NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '2026-02-23 13:08:56'),
(74, 1, NULL, 4, 'broker', 'view_audit_logs', NULL, NULL, NULL, 'success', NULL, NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '2026-02-23 13:41:31'),
(75, 1, NULL, 1, 'broker', 'view_audit_logs', NULL, NULL, NULL, 'success', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-02-23 18:07:04'),
(76, 1, NULL, 1, 'broker', 'reopen_task', 'task', 34, '{\"reason\": \"Esta mal\", \"status\": \"reopened\", \"reopened_at\": \"2026-02-24T00:21:31.996Z\"}', 'success', NULL, NULL, NULL, NULL, NULL, '2026-02-23 18:21:32'),
(77, 1, NULL, 1, 'broker', 'approve_task', 'task', 35, '{\"status\": \"approved\", \"approved_at\": \"2026-02-24T00:21:54.095Z\"}', 'success', NULL, NULL, NULL, NULL, NULL, '2026-02-23 18:21:54'),
(78, 1, NULL, 1, 'broker', 'approve_task', 'task', 34, '{\"status\": \"approved\", \"approved_at\": \"2026-02-24T00:23:49.484Z\"}', 'success', NULL, NULL, NULL, NULL, NULL, '2026-02-23 18:23:49'),
(79, 1, NULL, 1, 'broker', 'generate_mismo', 'loan_application', 22, '{\"filename\": \"MISMO_LA92351886_2026-02-24.xml\", \"generated_at\": \"2026-02-24T00:24:02.418Z\"}', 'success', NULL, NULL, NULL, NULL, NULL, '2026-02-23 18:24:02'),
(80, 1, NULL, 3, 'broker', 'view_audit_logs', NULL, NULL, NULL, 'success', NULL, NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-02-24 16:50:45'),
(81, 1, NULL, 4, 'broker', 'view_audit_logs', NULL, NULL, NULL, 'success', NULL, NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '2026-02-26 20:27:00'),
(82, 1, NULL, 1, 'broker', 'reopen_task', 'task', 55, '{\"reason\": \"please re-submit again\", \"status\": \"reopened\", \"reopened_at\": \"2026-02-27T03:13:27.314Z\"}', 'success', NULL, NULL, NULL, NULL, NULL, '2026-02-26 21:13:27'),
(83, 1, NULL, 1, 'broker', 'approve_task', 'task', 50, '{\"status\": \"approved\", \"approved_at\": \"2026-02-27T03:13:52.787Z\"}', 'success', NULL, NULL, NULL, NULL, NULL, '2026-02-26 21:13:52'),
(84, 1, NULL, 1, 'broker', 'approve_task', 'task', 51, '{\"status\": \"approved\", \"approved_at\": \"2026-02-27T03:15:20.179Z\"}', 'success', NULL, NULL, NULL, NULL, NULL, '2026-02-26 21:15:20'),
(85, 1, NULL, 1, 'broker', 'approve_task', 'task', 54, '{\"status\": \"approved\", \"approved_at\": \"2026-02-27T03:15:41.001Z\"}', 'success', NULL, NULL, NULL, NULL, NULL, '2026-02-26 21:15:41'),
(86, 1, NULL, 1, 'broker', 'approve_task', 'task', 52, '{\"status\": \"approved\", \"approved_at\": \"2026-02-27T03:15:59.250Z\"}', 'success', NULL, NULL, NULL, NULL, NULL, '2026-02-26 21:15:59'),
(87, 1, NULL, 1, 'broker', 'approve_task', 'task', 53, '{\"status\": \"approved\", \"approved_at\": \"2026-02-27T03:16:16.972Z\"}', 'success', NULL, NULL, NULL, NULL, NULL, '2026-02-26 21:16:17'),
(88, 1, NULL, 1, 'broker', 'approve_task', 'task', 55, '{\"status\": \"approved\", \"approved_at\": \"2026-02-27T03:18:19.672Z\"}', 'success', NULL, NULL, NULL, NULL, NULL, '2026-02-26 21:18:19'),
(89, 1, NULL, 1, 'broker', 'create_pre_approval_letter', 'pre_approval_letter', 1, '{\"application_id\": \"26\", \"approved_amount\": 440000, \"max_approved_amount\": 440000}', 'success', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-02-26 22:26:57'),
(90, 1, NULL, 1, 'broker', 'update_pre_approval_letter', 'pre_approval_letter', 1, '{\"expires_at\": \"2026-02-28\", \"letter_date\": \"2026-02-27\", \"html_content\": \"(updated)\", \"approved_amount\": 440000, \"max_approved_amount\": 440000}', 'success', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-02-26 22:28:38'),
(91, 1, NULL, 1, 'broker', 'delete_pre_approval_letter', 'pre_approval_letter', 1, '{\"application_id\": \"26\"}', 'success', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-02-26 22:29:16'),
(92, 1, NULL, 1, 'broker', 'create_pre_approval_letter', 'pre_approval_letter', 2, '{\"application_id\": \"26\", \"approved_amount\": 440000, \"max_approved_amount\": 440000}', 'success', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-02-26 22:36:15'),
(93, 1, NULL, 1, 'broker', 'delete_pre_approval_letter', 'pre_approval_letter', 2, '{\"application_id\": \"26\"}', 'success', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-02-26 22:36:49'),
(94, 1, NULL, 1, 'broker', 'create_pre_approval_letter', 'pre_approval_letter', 3, '{\"application_id\": \"26\", \"approved_amount\": 440000, \"max_approved_amount\": 440000}', 'success', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-02-26 22:39:24'),
(95, 1, NULL, 1, 'broker', 'delete_pre_approval_letter', 'pre_approval_letter', 3, '{\"application_id\": \"26\"}', 'success', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-02-26 22:39:52'),
(96, 1, NULL, 1, 'broker', 'create_pre_approval_letter', 'pre_approval_letter', 4, '{\"application_id\": \"26\", \"approved_amount\": 440000, \"max_approved_amount\": 440000}', 'success', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-02-26 22:40:36'),
(97, 1, NULL, 1, 'broker', 'delete_pre_approval_letter', 'pre_approval_letter', 4, '{\"application_id\": \"26\"}', 'success', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-02-26 22:54:07'),
(98, 1, NULL, 1, 'broker', 'create_pre_approval_letter', 'pre_approval_letter', 5, '{\"application_id\": \"26\", \"approved_amount\": 440000, \"max_approved_amount\": 440000}', 'success', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-02-26 22:54:21'),
(99, 1, NULL, 1, 'broker', 'send_pre_approval_letter_email', 'pre_approval_letter', 5, '{\"subject\": \"Your Pre-Approval Letter — LA50710937\", \"template_id\": null, \"client_email\": \"tonatiuh.gom@gmail.com\", \"pdf_attached\": true, \"send_success\": true, \"application_id\": \"26\"}', 'success', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-02-26 23:22:45'),
(100, 1, NULL, NULL, 'user', 'schema_migration', 'reminder_flows_system', NULL, '{\"migration\": \"20260228_add_reminder_flows\", \"tables_created\": [\"reminder_flows\", \"reminder_flow_steps\", \"reminder_flow_connections\", \"reminder_flow_executions\"]}', 'success', NULL, NULL, NULL, NULL, NULL, '2026-02-28 16:03:38'),
(101, 1, NULL, 1, 'broker', 'view_audit_logs', NULL, NULL, NULL, 'success', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-02-28 17:26:13'),
(102, 1, NULL, 1, 'broker', 'export_report', 'report', NULL, '{\"format\": \"csv\", \"to_date\": \"2026-02-28\", \"from_date\": \"2026-01-29\", \"report_type\": \"overview\"}', 'success', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-02-28 17:26:23'),
(103, 1, NULL, 1, 'broker', 'view_audit_logs', NULL, NULL, NULL, 'success', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-02-28 17:47:46'),
(104, 1, NULL, 1, 'broker', 'view_audit_logs', NULL, NULL, NULL, 'success', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-02-28 18:57:40'),
(105, 1, NULL, 1, 'broker', 'view_audit_logs', NULL, NULL, NULL, 'success', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-02-28 19:14:14'),
(106, 1, NULL, 1, 'broker', 'view_audit_logs', NULL, NULL, NULL, 'success', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-02-28 19:14:45'),
(107, 1, NULL, 1, 'broker', 'view_audit_logs', NULL, NULL, NULL, 'success', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-02-28 19:44:58'),
(108, 1, NULL, 1, 'broker', 'view_audit_logs', NULL, NULL, NULL, 'success', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-02-28 20:20:55'),
(109, 1, NULL, 1, 'broker', 'view_audit_logs', NULL, NULL, NULL, 'success', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-02-28 20:30:24'),
(110, 1, NULL, 1, 'broker', 'approve_task', 'task', 62, '{\"status\": \"approved\", \"approved_at\": \"2026-03-03T01:08:01.261Z\"}', 'success', NULL, NULL, NULL, NULL, NULL, '2026-03-02 19:08:01'),
(111, 1, NULL, 1, 'broker', 'approve_task', 'task', 56, '{\"status\": \"approved\", \"approved_at\": \"2026-03-03T01:08:04.966Z\"}', 'success', NULL, NULL, NULL, NULL, NULL, '2026-03-02 19:08:05'),
(112, 1, NULL, 1, 'broker', 'approve_task', 'task', 57, '{\"status\": \"approved\", \"approved_at\": \"2026-03-03T01:08:08.121Z\"}', 'success', NULL, NULL, NULL, NULL, NULL, '2026-03-02 19:08:08'),
(113, 1, NULL, 1, 'broker', 'approve_task', 'task', 58, '{\"status\": \"approved\", \"approved_at\": \"2026-03-03T01:08:23.863Z\"}', 'success', NULL, NULL, NULL, NULL, NULL, '2026-03-02 19:08:23'),
(114, 1, NULL, 1, 'broker', 'approve_task', 'task', 59, '{\"status\": \"approved\", \"approved_at\": \"2026-03-03T01:08:40.607Z\"}', 'success', NULL, NULL, NULL, NULL, NULL, '2026-03-02 19:08:40'),
(115, 1, NULL, 1, 'broker', 'approve_task', 'task', 60, '{\"status\": \"approved\", \"approved_at\": \"2026-03-03T01:08:44.098Z\"}', 'success', NULL, NULL, NULL, NULL, NULL, '2026-03-02 19:08:44'),
(116, 1, NULL, 1, 'broker', 'approve_task', 'task', 61, '{\"status\": \"approved\", \"approved_at\": \"2026-03-03T01:08:47.320Z\"}', 'success', NULL, NULL, NULL, NULL, NULL, '2026-03-02 19:08:47'),
(117, 1, NULL, 1, 'broker', 'create_pre_approval_letter', 'pre_approval_letter', 6, '{\"application_id\": \"27\", \"approved_amount\": 440000, \"max_approved_amount\": 440000}', 'success', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-03-02 19:09:17'),
(118, 1, NULL, 3, 'broker', 'view_audit_logs', NULL, NULL, NULL, 'success', NULL, NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-03-02 19:25:40'),
(119, 1, NULL, 3, 'broker', 'view_audit_logs', NULL, NULL, NULL, 'success', NULL, NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-03-02 20:41:13'),
(120, 1, NULL, 1, 'broker', 'approve_task', 'task', 68, '{\"status\": \"approved\", \"approved_at\": \"2026-03-05T00:41:28.511Z\"}', 'success', NULL, NULL, NULL, NULL, NULL, '2026-03-04 18:41:28'),
(121, 1, NULL, 1, 'broker', 'approve_task', 'task', 63, '{\"status\": \"approved\", \"approved_at\": \"2026-03-05T00:41:31.373Z\"}', 'success', NULL, NULL, NULL, NULL, NULL, '2026-03-04 18:41:31'),
(122, 1, NULL, 1, 'broker', 'approve_task', 'task', 64, '{\"status\": \"approved\", \"approved_at\": \"2026-03-05T00:41:34.234Z\"}', 'success', NULL, NULL, NULL, NULL, NULL, '2026-03-04 18:41:34'),
(123, 1, NULL, 1, 'broker', 'approve_task', 'task', 65, '{\"status\": \"approved\", \"approved_at\": \"2026-03-05T00:41:36.789Z\"}', 'success', NULL, NULL, NULL, NULL, NULL, '2026-03-04 18:41:36'),
(124, 1, NULL, 1, 'broker', 'approve_task', 'task', 66, '{\"status\": \"approved\", \"approved_at\": \"2026-03-05T00:41:40.202Z\"}', 'success', NULL, NULL, NULL, NULL, NULL, '2026-03-04 18:41:40'),
(125, 1, NULL, 1, 'broker', 'approve_task', 'task', 67, '{\"status\": \"approved\", \"approved_at\": \"2026-03-05T00:41:43.355Z\"}', 'success', NULL, NULL, NULL, NULL, NULL, '2026-03-04 18:41:43'),
(126, 1, NULL, 1, 'broker', 'create_pre_approval_letter', 'pre_approval_letter', 7, '{\"application_id\": \"28\", \"approved_amount\": 440000, \"max_approved_amount\": 440000}', 'success', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-03-04 18:44:28'),
(127, 1, NULL, 1, 'broker', 'delete_pre_approval_letter', 'pre_approval_letter', 7, '{\"application_id\": \"28\"}', 'success', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-03-04 18:44:59'),
(128, 1, NULL, NULL, 'broker', 'create_pre_approval_letter', 'pre_approval_letter', 8, '{\"application_id\": \"28\", \"approved_amount\": 440000, \"max_approved_amount\": 440000}', 'success', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-03-04 19:28:44'),
(129, 1, NULL, NULL, 'broker', 'delete_pre_approval_letter', 'pre_approval_letter', 8, '{\"application_id\": \"28\"}', 'success', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-03-04 19:36:10'),
(130, 1, NULL, NULL, 'broker', 'create_pre_approval_letter', 'pre_approval_letter', 9, '{\"application_id\": \"28\", \"approved_amount\": 440000, \"max_approved_amount\": 440000}', 'success', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-03-04 19:36:20'),
(131, 1, NULL, NULL, 'broker', 'delete_pre_approval_letter', 'pre_approval_letter', 9, '{\"application_id\": \"28\"}', 'success', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-03-04 19:36:35'),
(132, 1, NULL, NULL, 'broker', 'create_pre_approval_letter', 'pre_approval_letter', 10, '{\"application_id\": \"28\", \"approved_amount\": 440000, \"max_approved_amount\": 440000}', 'success', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-03-04 19:38:06'),
(133, 1, NULL, NULL, 'broker', 'delete_pre_approval_letter', 'pre_approval_letter', 10, '{\"application_id\": \"28\"}', 'success', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-03-04 19:39:36'),
(134, 1, NULL, NULL, 'broker', 'create_pre_approval_letter', 'pre_approval_letter', 11, '{\"application_id\": \"28\", \"approved_amount\": 440000, \"max_approved_amount\": 440000}', 'success', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-03-04 19:44:09'),
(135, 1, NULL, NULL, 'broker', 'delete_pre_approval_letter', 'pre_approval_letter', 11, '{\"application_id\": \"28\"}', 'success', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-03-04 19:44:38'),
(136, 1, NULL, NULL, 'broker', 'create_pre_approval_letter', 'pre_approval_letter', 12, '{\"application_id\": \"28\", \"approved_amount\": 440000, \"max_approved_amount\": 440000}', 'success', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-03-04 19:46:04'),
(137, 1, NULL, NULL, 'broker', 'delete_pre_approval_letter', 'pre_approval_letter', 12, '{\"application_id\": \"28\"}', 'success', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-03-04 19:46:39'),
(138, 1, NULL, NULL, 'broker', 'create_pre_approval_letter', 'pre_approval_letter', 13, '{\"application_id\": \"28\", \"approved_amount\": 440000, \"max_approved_amount\": 440000}', 'success', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-03-04 19:47:46'),
(139, 1, NULL, NULL, 'broker', 'delete_pre_approval_letter', 'pre_approval_letter', 13, '{\"application_id\": \"28\"}', 'success', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-03-04 19:48:24'),
(140, 1, NULL, 1, 'broker', 'approve_task', 'task', 69, '{\"status\": \"approved\", \"approved_at\": \"2026-03-05T02:48:47.185Z\"}', 'success', NULL, NULL, NULL, NULL, NULL, '2026-03-04 20:48:47'),
(141, 1, NULL, 1, 'broker', 'approve_task', 'task', 70, '{\"status\": \"approved\", \"approved_at\": \"2026-03-05T02:48:56.165Z\"}', 'success', NULL, NULL, NULL, NULL, NULL, '2026-03-04 20:48:56'),
(142, 1, NULL, 1, 'broker', 'approve_task', 'task', 75, '{\"status\": \"approved\", \"approved_at\": \"2026-03-05T02:48:59.056Z\"}', 'success', NULL, NULL, NULL, NULL, NULL, '2026-03-04 20:48:59'),
(143, 1, NULL, 1, 'broker', 'approve_task', 'task', 77, '{\"status\": \"approved\", \"approved_at\": \"2026-03-05T02:49:01.636Z\"}', 'success', NULL, NULL, NULL, NULL, NULL, '2026-03-04 20:49:01'),
(144, 1, NULL, 1, 'broker', 'approve_task', 'task', 71, '{\"status\": \"approved\", \"approved_at\": \"2026-03-05T02:49:04.032Z\"}', 'success', NULL, NULL, NULL, NULL, NULL, '2026-03-04 20:49:04'),
(145, 1, NULL, 1, 'broker', 'approve_task', 'task', 72, '{\"status\": \"approved\", \"approved_at\": \"2026-03-05T02:49:06.941Z\"}', 'success', NULL, NULL, NULL, NULL, NULL, '2026-03-04 20:49:06'),
(146, 1, NULL, 1, 'broker', 'approve_task', 'task', 73, '{\"status\": \"approved\", \"approved_at\": \"2026-03-05T02:49:10.099Z\"}', 'success', NULL, NULL, NULL, NULL, NULL, '2026-03-04 20:49:10'),
(147, 1, NULL, 1, 'broker', 'approve_task', 'task', 74, '{\"status\": \"approved\", \"approved_at\": \"2026-03-05T02:49:13.794Z\"}', 'success', NULL, NULL, NULL, NULL, NULL, '2026-03-04 20:49:13'),
(148, 1, NULL, 1, 'broker', 'approve_task', 'task', 76, '{\"status\": \"approved\", \"approved_at\": \"2026-03-05T02:49:16.516Z\"}', 'success', NULL, NULL, NULL, NULL, NULL, '2026-03-04 20:49:16'),
(149, 1, NULL, 1, 'broker', 'approve_task', 'task', 78, '{\"status\": \"approved\", \"approved_at\": \"2026-03-05T02:49:19.567Z\"}', 'success', NULL, NULL, NULL, NULL, NULL, '2026-03-04 20:49:19'),
(150, 1, NULL, 3, 'broker', 'view_audit_logs', NULL, NULL, NULL, 'success', NULL, NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-03-05 12:22:08'),
(151, 1, NULL, 3, 'broker', 'view_audit_logs', NULL, NULL, NULL, 'success', NULL, NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-03-05 12:22:09'),
(152, 1, NULL, 3, 'broker', 'update_system_settings', 'system_settings', 1, '{\"keys\": [\"pre_approval_require_all_tasks\"]}', 'success', NULL, NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-03-05 12:22:22'),
(153, 1, NULL, 3, 'broker', 'view_audit_logs', NULL, NULL, NULL, 'success', NULL, NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-03-05 13:42:29'),
(154, 1, NULL, 3, 'broker', 'create_pre_approval_letter', 'pre_approval_letter', 14, '{\"application_id\": \"29\", \"approved_amount\": 500000, \"max_approved_amount\": 800000}', 'success', NULL, NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-03-05 13:43:23'),
(155, 1, NULL, 3, 'broker', 'delete_pre_approval_letter', 'pre_approval_letter', 14, '{\"application_id\": \"29\"}', 'success', NULL, NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-03-05 13:44:36'),
(156, 1, NULL, 3, 'broker', 'update_system_settings', 'system_settings', 1, '{\"keys\": [\"pre_approval_require_all_tasks\"]}', 'success', NULL, NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-03-05 13:52:59'),
(157, 1, NULL, 1, 'broker', 'approve_task', 'task', 79, '{\"status\": \"approved\", \"approved_at\": \"2026-03-06T01:32:08.286Z\"}', 'success', NULL, NULL, NULL, NULL, NULL, '2026-03-05 19:32:08'),
(158, 1, NULL, 1, 'broker', 'approve_task', 'task', 80, '{\"status\": \"approved\", \"approved_at\": \"2026-03-06T01:32:13.047Z\"}', 'success', NULL, NULL, NULL, NULL, NULL, '2026-03-05 19:32:13'),
(159, 1, NULL, 1, 'broker', 'approve_task', 'task', 84, '{\"status\": \"approved\", \"approved_at\": \"2026-03-06T01:33:22.587Z\"}', 'success', NULL, NULL, NULL, NULL, NULL, '2026-03-05 19:33:22'),
(160, 1, NULL, 1, 'broker', 'approve_task', 'task', 86, '{\"status\": \"approved\", \"approved_at\": \"2026-03-06T01:33:25.730Z\"}', 'success', NULL, NULL, NULL, NULL, NULL, '2026-03-05 19:33:25'),
(161, 1, NULL, 1, 'broker', 'approve_task', 'task', 81, '{\"status\": \"approved\", \"approved_at\": \"2026-03-06T01:33:28.827Z\"}', 'success', NULL, NULL, NULL, NULL, NULL, '2026-03-05 19:33:28'),
(162, 1, NULL, 1, 'broker', 'approve_task', 'task', 82, '{\"status\": \"approved\", \"approved_at\": \"2026-03-06T01:33:31.597Z\"}', 'success', NULL, NULL, NULL, NULL, NULL, '2026-03-05 19:33:31'),
(163, 1, NULL, 1, 'broker', 'approve_task', 'task', 83, '{\"status\": \"approved\", \"approved_at\": \"2026-03-06T01:33:35.135Z\"}', 'success', NULL, NULL, NULL, NULL, NULL, '2026-03-05 19:33:35'),
(164, 1, NULL, 1, 'broker', 'approve_task', 'task', 85, '{\"status\": \"approved\", \"approved_at\": \"2026-03-06T01:33:37.381Z\"}', 'success', NULL, NULL, NULL, NULL, NULL, '2026-03-05 19:33:37'),
(165, 1, NULL, 1, 'broker', 'approve_task', 'task', 87, '{\"status\": \"approved\", \"approved_at\": \"2026-03-06T01:33:40.363Z\"}', 'success', NULL, NULL, NULL, NULL, NULL, '2026-03-05 19:33:40'),
(166, 1, NULL, 1, 'broker', 'create_pre_approval_letter', 'pre_approval_letter', 15, '{\"application_id\": \"30\", \"approved_amount\": 440000, \"max_approved_amount\": 440000}', 'success', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-03-05 19:44:29'),
(167, 1, NULL, 11, 'broker', 'approve_task', 'task', 88, '{\"status\": \"approved\", \"approved_at\": \"2026-03-06T05:40:12.763Z\"}', 'success', NULL, NULL, NULL, NULL, NULL, '2026-03-05 23:40:12'),
(168, 1, NULL, 11, 'broker', 'approve_task', 'task', 89, '{\"status\": \"approved\", \"approved_at\": \"2026-03-06T05:40:15.364Z\"}', 'success', NULL, NULL, NULL, NULL, NULL, '2026-03-05 23:40:15'),
(169, 1, NULL, 11, 'broker', 'approve_task', 'task', 93, '{\"status\": \"approved\", \"approved_at\": \"2026-03-06T05:40:18.274Z\"}', 'success', NULL, NULL, NULL, NULL, NULL, '2026-03-05 23:40:18'),
(170, 1, NULL, 11, 'broker', 'approve_task', 'task', 95, '{\"status\": \"approved\", \"approved_at\": \"2026-03-06T05:40:20.659Z\"}', 'success', NULL, NULL, NULL, NULL, NULL, '2026-03-05 23:40:20'),
(171, 1, NULL, 11, 'broker', 'approve_task', 'task', 90, '{\"status\": \"approved\", \"approved_at\": \"2026-03-06T05:40:23.280Z\"}', 'success', NULL, NULL, NULL, NULL, NULL, '2026-03-05 23:40:23'),
(172, 1, NULL, 11, 'broker', 'approve_task', 'task', 91, '{\"status\": \"approved\", \"approved_at\": \"2026-03-06T05:40:26.342Z\"}', 'success', NULL, NULL, NULL, NULL, NULL, '2026-03-05 23:40:26'),
(173, 1, NULL, 11, 'broker', 'approve_task', 'task', 92, '{\"status\": \"approved\", \"approved_at\": \"2026-03-06T05:40:30.026Z\"}', 'success', NULL, NULL, NULL, NULL, NULL, '2026-03-05 23:40:30'),
(174, 1, NULL, 11, 'broker', 'approve_task', 'task', 94, '{\"status\": \"approved\", \"approved_at\": \"2026-03-06T05:40:32.677Z\"}', 'success', NULL, NULL, NULL, NULL, NULL, '2026-03-05 23:40:32'),
(175, 1, NULL, 11, 'broker', 'approve_task', 'task', 96, '{\"status\": \"approved\", \"approved_at\": \"2026-03-06T05:40:35.104Z\"}', 'success', NULL, NULL, NULL, NULL, NULL, '2026-03-05 23:40:35'),
(176, 1, NULL, 1, 'broker', 'create_pre_approval_letter', 'pre_approval_letter', 16, '{\"application_id\": \"31\", \"approved_amount\": 340000, \"max_approved_amount\": 340000}', 'success', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-03-05 23:44:40'),
(177, 1, NULL, 1, 'broker', 'delete_pre_approval_letter', 'pre_approval_letter', 16, '{\"application_id\": \"31\"}', 'success', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-03-05 23:45:18'),
(178, 1, NULL, 1, 'broker', 'create_pre_approval_letter', 'pre_approval_letter', 17, '{\"application_id\": \"31\", \"approved_amount\": 350000, \"max_approved_amount\": 350000}', 'success', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-03-06 00:02:22'),
(179, 1, NULL, 1, 'broker', 'delete_pre_approval_letter', 'pre_approval_letter', 17, '{\"application_id\": \"31\"}', 'success', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-03-06 00:02:48'),
(180, 1, NULL, 1, 'broker', 'create_pre_approval_letter', 'pre_approval_letter', 18, '{\"application_id\": \"31\", \"approved_amount\": 440000, \"max_approved_amount\": 440000}', 'success', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-03-06 00:09:39'),
(181, 1, NULL, 3, 'broker', 'view_audit_logs', NULL, NULL, NULL, 'success', NULL, NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-03-06 08:26:23'),
(182, 1, NULL, 3, 'broker', 'delete_pre_approval_letter', 'pre_approval_letter', 18, '{\"application_id\": \"31\"}', 'success', NULL, NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-03-06 08:42:37'),
(183, 1, NULL, 3, 'broker', 'create_pre_approval_letter', 'pre_approval_letter', 19, '{\"application_id\": \"31\", \"approved_amount\": 500000, \"max_approved_amount\": 800000}', 'success', NULL, NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-03-06 08:43:35'),
(184, 1, NULL, 3, 'broker', 'view_audit_logs', NULL, NULL, NULL, 'success', NULL, NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-03-06 08:51:02'),
(185, 1, NULL, 11, 'broker', 'approve_task', 'task', 97, '{\"status\": \"approved\", \"approved_at\": \"2026-03-10T03:08:12.294Z\"}', 'success', NULL, NULL, NULL, NULL, NULL, '2026-03-09 21:08:12'),
(186, 1, NULL, 11, 'broker', 'approve_task', 'task', 98, '{\"status\": \"approved\", \"approved_at\": \"2026-03-10T03:08:14.365Z\"}', 'success', NULL, NULL, NULL, NULL, NULL, '2026-03-09 21:08:14'),
(187, 1, NULL, 11, 'broker', 'approve_task', 'task', 102, '{\"status\": \"approved\", \"approved_at\": \"2026-03-10T03:08:16.576Z\"}', 'success', NULL, NULL, NULL, NULL, NULL, '2026-03-09 21:08:16'),
(188, 1, NULL, 11, 'broker', 'approve_task', 'task', 104, '{\"status\": \"approved\", \"approved_at\": \"2026-03-10T03:08:19.165Z\"}', 'success', NULL, NULL, NULL, NULL, NULL, '2026-03-09 21:08:19'),
(189, 1, NULL, 11, 'broker', 'approve_task', 'task', 99, '{\"status\": \"approved\", \"approved_at\": \"2026-03-10T03:08:21.492Z\"}', 'success', NULL, NULL, NULL, NULL, NULL, '2026-03-09 21:08:21'),
(190, 1, NULL, 11, 'broker', 'approve_task', 'task', 100, '{\"status\": \"approved\", \"approved_at\": \"2026-03-10T03:08:23.902Z\"}', 'success', NULL, NULL, NULL, NULL, NULL, '2026-03-09 21:08:23'),
(191, 1, NULL, 11, 'broker', 'approve_task', 'task', 101, '{\"status\": \"approved\", \"approved_at\": \"2026-03-10T03:08:26.575Z\"}', 'success', NULL, NULL, NULL, NULL, NULL, '2026-03-09 21:08:26'),
(192, 1, NULL, 11, 'broker', 'approve_task', 'task', 103, '{\"status\": \"approved\", \"approved_at\": \"2026-03-10T03:08:29.290Z\"}', 'success', NULL, NULL, NULL, NULL, NULL, '2026-03-09 21:08:29'),
(193, 1, NULL, 11, 'broker', 'approve_task', 'task', 105, '{\"status\": \"approved\", \"approved_at\": \"2026-03-10T03:08:31.909Z\"}', 'success', NULL, NULL, NULL, NULL, NULL, '2026-03-09 21:08:31'),
(194, 1, NULL, 1, 'broker', 'create_pre_approval_letter', 'pre_approval_letter', 20, '{\"application_id\": \"32\", \"approved_amount\": 440000, \"max_approved_amount\": 440000}', 'success', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-03-09 21:09:33'),
(195, 1, NULL, 1, 'broker', 'delete_pre_approval_letter', 'pre_approval_letter', 20, '{\"application_id\": \"32\"}', 'success', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-03-09 21:09:59');
INSERT INTO `audit_logs` (`id`, `tenant_id`, `user_id`, `broker_id`, `actor_type`, `action`, `entity_type`, `entity_id`, `changes`, `status`, `error_message`, `request_id`, `duration_ms`, `ip_address`, `user_agent`, `created_at`) VALUES
(196, 1, NULL, 1, 'broker', 'create_pre_approval_letter', 'pre_approval_letter', 21, '{\"application_id\": \"32\", \"approved_amount\": 440000, \"max_approved_amount\": 440000}', 'success', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-03-09 21:10:37'),
(197, 1, NULL, 1, 'broker', 'update_pre_approval_letter', 'pre_approval_letter', 21, '{\"expires_at\": \"2026-04-06\", \"letter_date\": \"2026-03-09\", \"html_content\": \"(updated)\", \"approved_amount\": 339931}', 'success', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-03-09 21:18:31'),
(198, 1, NULL, 11, 'broker', 'update_pre_approval_letter', 'pre_approval_letter', 21, '{\"approved_amount\": 440000}', 'success', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-03-09 21:19:56'),
(199, 1, NULL, 11, 'broker', 'update_pre_approval_letter', 'pre_approval_letter', 21, '{\"approved_amount\": 340000}', 'success', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-03-09 21:20:52'),
(200, 1, NULL, 11, 'broker', 'update_pre_approval_letter', 'pre_approval_letter', 21, '{\"approved_amount\": 440000}', 'success', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-03-09 21:22:33'),
(201, 1, NULL, 11, 'broker', 'update_pre_approval_letter', 'pre_approval_letter', 21, '{\"approved_amount\": 400000}', 'success', NULL, NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-03-09 21:25:55'),
(202, 1, NULL, NULL, 'user', 'schema_migration', 'reminder_flows_system', NULL, '{\"changes\": [\"trigger_event expanded to pipeline statuses\", \"loan_type_filter added\", \"step_type: wait_for_response + branch\", \"edge_type: loan_type_purchase/refinance/no_response/responded\", \"executions: context_data/last_step_started_at/responded_at\", \"pipeline_step_templates enum aligned\"], \"migration\": \"20260312_120000_enhance_reminder_flow_system\"}', 'success', NULL, NULL, NULL, NULL, NULL, '2026-03-12 21:27:00'),
(203, 1, NULL, NULL, 'user', 'schema_migration', 'reminder_flow_steps', NULL, '{\"changes\": [\"added send_whatsapp to reminder_flow_steps.step_type enum\"], \"migration\": \"20260312_130000_add_whatsapp_flow_step_type\"}', 'success', NULL, NULL, NULL, NULL, NULL, '2026-03-12 21:37:25'),
(204, 1, NULL, NULL, 'user', 'schema_migration', 'reminder_flows', NULL, '{\"migration\": \"20260312_140000_seed_app_sent_reminder_flow\", \"description\": \"Created App Sent reminder flow with 16 templates and 3 branches (purchase/refi/default)\"}', 'success', NULL, NULL, NULL, NULL, NULL, '2026-03-12 21:56:35'),
(205, 1, NULL, NULL, 'user', 'schema_migration', 'reminder_flows', NULL, '{\"migration\": \"20260312_150000_seed_application_received_reminder_flow\", \"description\": \"Created Application Received reminder flow with 8 templates, adverse status guard, and loan_type branch (Purchase/Refi/Default)\"}', 'success', NULL, NULL, NULL, NULL, NULL, '2026-03-12 22:05:46'),
(206, 1, NULL, NULL, 'user', 'schema_migration', 'reminder_flows', NULL, '{\"migration\": \"20260312_160000_seed_prequalified_reminder_flow\", \"description\": \"Created Prequalified reminder flow with 21 templates, 8 response-gated rounds per branch (Purchase/Refi/Default), ending with all-user internal notification\"}', 'success', NULL, NULL, NULL, NULL, NULL, '2026-03-12 22:34:43'),
(207, 1, NULL, NULL, 'user', 'schema_migration', 'reminder_flows', NULL, '{\"migration\": \"20260312_170000_seed_preapproved_reminder_flow\", \"description\": \"Created Preapproved reminder flow with 19 templates, 2 branches (Purchase/Refi/Default→Purchase), pure time-based drip — 12 SMS + 11 Email over ~88 days per branch, no response gates\"}', 'success', NULL, NULL, NULL, NULL, NULL, '2026-03-12 22:47:43'),
(208, 1, NULL, NULL, 'user', 'schema_migration', 'reminder_flows', NULL, '{\"migration\": \"20260312_180000_seed_under_contract_loan_setup_reminder_flow\", \"description\": \"Created Under Contract/Loan Set Up reminder flow: immediate SMS + Email, no branching\"}', 'success', NULL, NULL, NULL, NULL, NULL, '2026-03-12 22:50:22'),
(209, 1, NULL, NULL, 'user', 'schema_migration', 'reminder_flows', NULL, '{\"migration\": \"20260312_190000_seed_submitted_to_underwriting_reminder_flow\", \"description\": \"Created Submitted to Underwriting reminder flow: immediate SMS + Email explaining the underwriting process, no branching\"}', 'success', NULL, NULL, NULL, NULL, NULL, '2026-03-12 22:51:53'),
(210, 1, NULL, NULL, 'user', 'schema_migration', 'reminder_flows', NULL, '{\"migration\": \"20260312_200000_seed_approved_with_conditions_reminder_flow\", \"description\": \"Created Approved with Conditions reminder flow: immediate SMS + Email to client, then 3 internal notifications to alert team to contact Buyer Agent, Listing Agent, and Title Agent\"}', 'success', NULL, NULL, NULL, NULL, NULL, '2026-03-12 22:55:03'),
(211, 1, NULL, NULL, 'user', 'schema_migration', 'reminder_flows', NULL, '{\"migration\": \"20260312_210000_seed_clear_to_close_reminder_flow\", \"description\": \"Created Clear to Close reminder flow: shared SMS, branch by loan type, Purchase email (closing checklist for home buyer) or Refi email (right of rescission + refi closing checklist). Default routes to Purchase.\"}', 'success', NULL, NULL, NULL, NULL, NULL, '2026-03-12 22:57:51'),
(212, 1, NULL, NULL, 'user', 'schema_migration', 'reminder_flows', NULL, '{\"migration\": \"20260312_220000_seed_loan_funded_reminder_flow\", \"description\": \"Created Loan Funded reminder flow: condition on actual_close_date (field_not_empty), wait_until_date then SMS + Email. Nada branch ends silently. Also added wait_until_date step type and field_not_empty/field_empty condition types to engine and shared types.\"}', 'success', NULL, NULL, NULL, NULL, NULL, '2026-03-12 23:02:15'),
(213, 1, NULL, 4, 'broker', 'view_audit_logs', NULL, NULL, NULL, 'success', NULL, NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36', '2026-03-18 16:30:21'),
(214, 1, NULL, 4, 'broker', 'view_audit_logs', NULL, NULL, NULL, 'success', NULL, NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36', '2026-03-18 16:31:20'),
(215, 1, NULL, 1, 'broker', 'view_audit_logs', NULL, NULL, NULL, 'success', NULL, NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36', '2026-03-22 19:17:20'),
(216, 1, NULL, 1, 'broker', 'view_audit_logs', NULL, NULL, NULL, 'success', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36', '2026-03-24 18:16:29'),
(217, 1, NULL, 1, 'broker', 'view_audit_logs', NULL, NULL, NULL, 'success', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36', '2026-03-24 18:19:00');

-- --------------------------------------------------------

--
-- Table structure for table `brokers`
--

CREATE TABLE `brokers` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) NOT NULL DEFAULT '1',
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
  `public_token` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'UUID token for public broker share link',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_by_broker_id` int(11) DEFAULT NULL COMMENT 'The admin/Mortgage Banker who created this partner broker',
  `twilio_phone_sid` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Twilio IncomingPhoneNumber SID assigned to this broker for inbound routing and outbound caller ID',
  `twilio_caller_id` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'E.164 phone number derived from twilio_phone_sid; used as callerId for outbound calls',
  `voice_available` tinyint(1) NOT NULL DEFAULT '0' COMMENT '1 = broker has toggled Available in the CRM and their Twilio Device is registered',
  `call_forwarding_enabled` tinyint(1) NOT NULL DEFAULT '0' COMMENT '1 = simultaneously ring this broker personal phone on incoming CRM calls',
  `call_forwarding_phone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'E.164 personal phone number for call forwarding'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `brokers`
--

INSERT INTO `brokers` (`id`, `tenant_id`, `email`, `first_name`, `last_name`, `phone`, `role`, `status`, `email_verified`, `last_login`, `license_number`, `specializations`, `public_token`, `created_at`, `updated_at`, `created_by_broker_id`) VALUES
(1, 1, 'axgoomez@gmail.com', 'Alex', 'Gomez', '+1 323-475-6240', 'admin', 'active', 1, '2026-03-25 22:12:42', NULL, '[\"FHA Loans\"]', '9b99af09-11e1-11f1-83cc-525400bd6b5d', '2026-01-20 18:56:12', '2026-03-25 22:12:42', NULL),
(3, 1, 'teamdc@encoremortgage.org', 'Daniel', 'Carrillo', '(562) 449-0000', 'admin', 'active', 0, '2026-03-17 17:54:46', '380277', '[]', '9b99b7b0-11e1-11f1-83cc-525400bd6b5d', '2026-01-21 00:08:17', '2026-03-17 17:54:46', NULL),
(4, 1, 'hebert@trueduplora.com', 'Hebert', 'Montecinos', NULL, 'admin', 'active', 0, '2026-03-18 16:09:22', NULL, '[\"Investment Properties\", \"Refinancing\"]', '9b99c1b4-11e1-11f1-83cc-525400bd6b5d', '2026-01-21 00:08:54', '2026-03-18 16:09:22', NULL),
(6, 2, 'axgoomez@gmail.com', 'Alex', 'Gomez', NULL, 'admin', 'active', 1, '2026-03-16 17:00:59', NULL, NULL, '9b99c454-11e1-11f1-83cc-525400bd6b5d', '2026-01-20 18:56:12', '2026-03-16 17:00:59', NULL),
(7, 2, 'hebert@trueduplora.com', 'Hebert', 'Montecinos', NULL, 'admin', 'active', 0, '2026-02-13 00:04:37', NULL, NULL, '9b99c5ad-11e1-11f1-83cc-525400bd6b5d', '2026-02-03 14:59:53', '2026-02-24 18:33:30', NULL),
(11, 1, 'tonatiuh.gom@gmail.com', 'Alejandro', 'Gomez', '(474) 140-0363', 'broker', 'active', 0, '2026-03-09 21:24:30', NULL, '[]', 'ec5bb0d4-191b-11f1-83cc-525400bd6b5d', '2026-03-05 23:18:34', '2026-03-09 21:25:24', 1),
(12, 1, 'daniel@encoremortgage.org', 'Realtor', 'Partner', '3237180001', 'broker', 'active', 0, '2026-03-17 17:53:54', NULL, NULL, '59051ae7-1bd4-11f1-83cc-525400bd6b5d', '2026-03-09 10:23:46', '2026-03-17 17:53:54', 3);

-- --------------------------------------------------------

--
-- Table structure for table `broker_monthly_metrics`
--

CREATE TABLE `broker_monthly_metrics` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) NOT NULL DEFAULT '1',
  `broker_id` int(11) DEFAULT NULL COMMENT 'NULL = admin/global goals row; set for partner-scoped manual actuals',
  `year` int(4) NOT NULL,
  `month` int(2) NOT NULL,
  `lead_to_credit_goal` decimal(5,2) DEFAULT '70.00',
  `credit_to_preapp_goal` decimal(5,2) DEFAULT '50.00',
  `lead_to_closing_goal` decimal(5,2) DEFAULT '25.00',
  `leads_goal` int(11) DEFAULT '40',
  `credit_pulls_goal` int(11) DEFAULT '28',
  `closings_goal` int(11) DEFAULT '10',
  `credit_pulls_actual` int(11) NOT NULL DEFAULT '0',
  `prev_year_leads` int(11) DEFAULT NULL,
  `prev_year_closings` int(11) DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Monthly broker performance goals (admin, broker_id IS NULL) and per-partner manual actuals';

-- --------------------------------------------------------

--
-- Table structure for table `calendar_events`
--

CREATE TABLE `calendar_events` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tenant_id` int NOT NULL DEFAULT '1',
  `broker_id` int DEFAULT NULL COMMENT 'Owning broker (NULL = applies to all)',
  `event_type` enum('birthday','home_anniversary','realtor_anniversary','important_date','reminder','other') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'other',
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `event_date` date NOT NULL COMMENT 'The date of the event (or base date for yearly recurrence)',
  `event_time` time DEFAULT NULL COMMENT 'Optional time for non-all-day events',
  `all_day` tinyint NOT NULL DEFAULT '1',
  `recurrence` enum('none','yearly') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'none',
  `color` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Optional hex or named color for display',
  `linked_client_id` int DEFAULT NULL COMMENT 'Optional FK to clients.id',
  `linked_person_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Free-text contact name (realtor, etc.)',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_calendar_events_tenant_broker` (`tenant_id`,`broker_id`),
  KEY `idx_calendar_events_date` (`event_date`),
  KEY `idx_calendar_events_client` (`linked_client_id`),
  CONSTRAINT `fk_calendar_events_broker` FOREIGN KEY (`broker_id`) REFERENCES `brokers` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_calendar_events_client` FOREIGN KEY (`linked_client_id`) REFERENCES `clients` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `broker_profiles`
--

CREATE TABLE `broker_profiles` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `broker_id` int(11) NOT NULL,
  `bio` text COLLATE utf8mb4_unicode_ci,
  `office_address` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `office_city` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `office_state` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `office_zip` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `facebook_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `instagram_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `linkedin_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `twitter_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `youtube_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `website_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `avatar_url` mediumtext COLLATE utf8mb4_unicode_ci,
  `years_experience` int(11) DEFAULT NULL,
  `total_loans_closed` int(11) DEFAULT '0',
  `date_of_birth` date DEFAULT NULL COMMENT 'Date of birth for birthday calendar events',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `broker_profiles`
--

INSERT INTO `broker_profiles` (`id`, `broker_id`, `bio`, `office_address`, `office_city`, `office_state`, `office_zip`, `facebook_url`, `instagram_url`, `linkedin_url`, `twitter_url`, `youtube_url`, `website_url`, `avatar_url`, `years_experience`, `total_loans_closed`, `created_at`, `updated_at`) VALUES
(1, 1, NULL, '3301 Lyon St', 'San Francisco', 'CA', '94123', NULL, 'https://www.instagram.com/tonatiuhgbr/', NULL, NULL, NULL, NULL, 'https://disruptinglabs.com/data/api/data/encore-profiles/profile-1/main_image/69a6138f45544_1772491663.png', 50, 0, '2026-02-24 20:53:50', '2026-03-05 18:08:40'),
(3, 4, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'https://disruptinglabs.com/data/api/data/encore-profiles/profile-4/main_image/69a635b968a3d_1772500409.png', NULL, 0, '2026-03-02 19:13:29', '2026-03-02 19:13:29'),
(5, 3, 'Sharing my expertise to personally assist thousands of families with sustainable home financing for the past 24 years 🏡💼✨', '15111 Whittier Blvd Suite 101-B', 'Whittier', 'CA', '90603', 'https://www.facebook.com/danielcarrillodc/', 'https://www.instagram.com/danielcarrillodc', 'https://www.linkedin.com/in/danielcarrillodc/', NULL, 'https://www.youtube.com/channel/UCoQr7UzGLfPFR8jyaLhHoJw', 'https://encoremortgage.us/daniel-carrillo', 'https://disruptinglabs.com/data/api/data/encore-profiles/profile-3/main_image/69a914674dc84_1772688487.png', 24, 0, '2026-03-04 23:28:07', '2026-03-16 13:21:53'),
(8, 11, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'https://disruptinglabs.com/data/api/data/encore-profiles/profile-11/main_image/69aa63c41e481_1772774340.png', NULL, 0, '2026-03-05 23:19:00', '2026-03-09 21:25:24'),
(9, 12, 'https://calendly.com/danielcarrillodc/initial-call ', '123 Main St', 'Whittier', 'CA', '90603', NULL, NULL, NULL, NULL, NULL, 'https://Danielcarrillodc.com', 'https://disruptinglabs.com/data/api/data/encore-profiles/profile-12/main_image/69af30efd69ec_1773089007.png', NULL, 0, '2026-03-09 10:23:46', '2026-03-09 14:43:28');

-- --------------------------------------------------------

--
-- Table structure for table `broker_sessions`
--

CREATE TABLE `broker_sessions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
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
(131, 6, 744871, 1, NULL, NULL, '2026-03-16 23:15:36', '2026-03-16 23:00:36'),
(135, 3, 599254, 1, NULL, NULL, '2026-03-18 00:09:24', '2026-03-17 23:54:24');

-- --------------------------------------------------------

--
-- Table structure for table `campaigns`
--

CREATE TABLE `campaigns` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) NOT NULL DEFAULT '1',
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `campaign_type` enum('email','sms','whatsapp','mixed') COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('draft','scheduled','active','paused','completed') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'draft',
  `target_audience` json DEFAULT NULL,
  `template_id` int(11) DEFAULT NULL,
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
  `id` int(11) NOT NULL AUTO_INCREMENT,
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
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) NOT NULL DEFAULT '1',
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
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
  `citizenship_status` enum('us_citizen','permanent_resident','non_resident','other') COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Client citizenship/immigration status',
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

INSERT INTO `clients` (`id`, `tenant_id`, `email`, `password_hash`, `first_name`, `last_name`, `phone`, `alternate_phone`, `date_of_birth`, `ssn_encrypted`, `address_street`, `address_city`, `address_state`, `address_zip`, `employment_status`, `income_type`, `annual_income`, `credit_score`, `citizenship_status`, `status`, `email_verified`, `phone_verified`, `last_login`, `assigned_broker_id`, `source`, `referral_code`, `created_at`, `updated_at`) VALUES
(14, 2, 'tonatiuh.gom@gmail.com', '', 'Tonatiuh', 'Gomez', '+524741400363', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'W-2', NULL, NULL, NULL, 'active', 0, 0, NULL, 6, 'broker_created', NULL, '2026-02-11 21:03:41', '2026-03-22 19:01:57'),
(22, 1, 'Carrillodaniel@me.com', '', 'Daniel', 'Carrillo', '3237180001', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'W-2', NULL, NULL, NULL, 'active', 0, 0, '2026-03-05 22:08:57', 3, 'broker_created', NULL, '2026-02-24 16:53:10', '2026-03-05 22:08:57');

-- --------------------------------------------------------

--
-- Table structure for table `communications`
--

CREATE TABLE `communications` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) NOT NULL DEFAULT '1',
  `application_id` int(11) DEFAULT NULL,
  `lead_id` int(11) DEFAULT NULL,
  `from_user_id` int(11) DEFAULT NULL,
  `from_broker_id` int(11) DEFAULT NULL,
  `to_user_id` int(11) DEFAULT NULL,
  `to_broker_id` int(11) DEFAULT NULL,
  `communication_type` enum('email','sms','whatsapp','call','internal_note') COLLATE utf8mb4_unicode_ci NOT NULL,
  `direction` enum('inbound','outbound') COLLATE utf8mb4_unicode_ci NOT NULL,
  `subject` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `body` text COLLATE utf8mb4_unicode_ci,
  `status` enum('pending','sent','delivered','failed','read') COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `external_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `conversation_id` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `source_execution_id` int(11) DEFAULT NULL COMMENT 'reminder_flow_executions.id that produced this message (NULL = manual send)',
  `thread_id` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reply_to_id` int(11) DEFAULT NULL,
  `message_type` enum('text','image','document','audio','video','template') COLLATE utf8mb4_unicode_ci DEFAULT 'text',
  `template_id` int(11) DEFAULT NULL,
  `delivery_status` enum('pending','sent','delivered','read','failed','rejected') COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `delivery_timestamp` datetime DEFAULT NULL,
  `read_timestamp` datetime DEFAULT NULL,
  `error_code` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `error_message` text COLLATE utf8mb4_unicode_ci,
  `cost` decimal(10,4) DEFAULT NULL COMMENT 'Cost in USD for SMS/WhatsApp messages',
  `provider_response` json DEFAULT NULL COMMENT 'Full provider response for debugging',
  `metadata` json DEFAULT NULL,
  `scheduled_at` datetime DEFAULT NULL,
  `sent_at` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `communications`
--

INSERT INTO `communications` (`id`, `tenant_id`, `application_id`, `lead_id`, `from_user_id`, `from_broker_id`, `to_user_id`, `to_broker_id`, `communication_type`, `direction`, `subject`, `body`, `status`, `external_id`, `conversation_id`, `source_execution_id`, `thread_id`, `reply_to_id`, `message_type`, `template_id`, `delivery_status`, `delivery_timestamp`, `read_timestamp`, `error_code`, `error_message`, `cost`, `provider_response`, `metadata`, `scheduled_at`, `sent_at`, `created_at`) VALUES
(4, 1, NULL, NULL, NULL, NULL, NULL, NULL, 'sms', 'outbound', NULL, 'Hi Lionel! 🏠 Great news — we received your home purchase application (#LA11598165) and our team is already reviewing it. Questions? Just reply! – {{broker_name}}, Encore Mortgage. Reply STOP to opt out.', 'sent', 'SMe37137390f0127de7017d163b87a9304', 'conv_client_32_loan_37_flow_3', 7, NULL, NULL, 'text', 23, 'sent', NULL, NULL, NULL, NULL, 0.0000, NULL, NULL, NULL, '2026-03-24 22:10:02', '2026-03-24 22:10:02'),
(5, 1, NULL, NULL, NULL, NULL, NULL, NULL, 'email', 'outbound', '🏠 We\'ve Received Your Purchase Loan Application!', 'Hi Lionel,\n\nExciting news! Your home purchase loan application has been officially received and is now in our system.\n\nApplication #: LA11598165\n\nOur team will begin a thorough review right away. Here\'s what to expect:\n\n• We\'ll contact you within 1 business day with next steps.\n• You may be asked to provide supporting documents through your client portal.\n• We\'ll keep you updated every step of the way.\n\nWe\'re thrilled to be part of your homeownership journey. Don\'t hesitate to reach out with any questions!\n\n{{broker_name}}\nEncore Mortgage', 'sent', '<enc-conv_client_32_loan_37_flow_3-1774411802650@disruptinglabs.com>', 'conv_client_32_loan_37_flow_3', 7, NULL, NULL, 'text', 24, 'sent', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-03-24 22:10:03', '2026-03-24 22:10:03'),
(6, 1, NULL, NULL, NULL, NULL, NULL, 1, 'sms', 'inbound', NULL, 'Thanks for sharing that update. If you have any questions about your credit or need info on next steps, just let me know how I can help.', 'delivered', 'SM1488b08f8dd63d0fa747ce2c55cfbcf7', 'conv_client_32_loan_37_flow_3', NULL, NULL, NULL, 'text', NULL, 'delivered', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-03-24 22:10:16', '2026-03-24 22:10:16'),
(7, 1, NULL, NULL, NULL, NULL, NULL, NULL, 'email', 'outbound', 'What Happens Next with Your Purchase Loan (#LA11598165)', 'Hi Lionel,\n\nJust following up! Now that we have your application (#LA11598165), here\'s a quick checklist of documents you\'ll want to have ready:\n\n✅ Government-issued photo ID (driver\'s license or passport)\n✅ Last 2 months of pay stubs\n✅ Last 2 years of W-2s or tax returns\n✅ Last 2–3 months of bank statements\n✅ Any gift letters (if applicable)\n\nYou can upload everything securely through your client portal. Getting these in early will help us move faster!\n\nReady to chat? Reply to this email or give us a call — we\'re here.\n\n{{broker_name}}\nEncore Mortgage', 'sent', '<enc-conv_client_32_loan_37_flow_3-1774412102113@disruptinglabs.com>', 'conv_client_32_loan_37_flow_3', 7, NULL, NULL, 'text', 25, 'sent', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-03-24 22:15:02', '2026-03-24 22:15:02'),
(8, 1, NULL, NULL, NULL, NULL, NULL, NULL, 'sms', 'outbound', NULL, 'Hi Lionel! 🏠 Great news — we received your home purchase application (#LA54906010) and our team is already reviewing it. Questions? Just reply! – Alex Gomez, Encore Mortgage.', 'sent', 'SMe88b27eaa21a8217c988b34a4528bf24', 'conv_client_33_loan_39_flow_3', 8, NULL, NULL, 'text', 23, 'sent', NULL, NULL, NULL, NULL, 0.0000, NULL, NULL, NULL, '2026-03-25 10:19:04', '2026-03-25 10:19:04'),
(9, 1, NULL, NULL, NULL, NULL, NULL, NULL, 'email', 'outbound', '🏠 We\'ve Received Your Purchase Loan Application!', 'Hi Lionel,\n\nExciting news! Your home purchase loan application has been officially received and is now in our system.\n\nApplication #: LA54906010\n\nOur team will begin a thorough review right away. Here\'s what to expect:\n\n• We\'ll contact you within 1 business day with next steps.\n• You may be asked to provide supporting documents through your client portal.\n• We\'ll keep you updated every step of the way.\n\nWe\'re thrilled to be part of your homeownership journey. Don\'t hesitate to reach out with any questions!\n\nAlex Gomez\nEncore Mortgage', 'sent', '<enc-conv_client_33_loan_39_flow_3-1774455545421@disruptinglabs.com>', 'conv_client_33_loan_39_flow_3', 8, NULL, NULL, 'text', 24, 'sent', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-03-25 10:19:05', '2026-03-25 10:19:05'),
(10, 1, NULL, NULL, NULL, NULL, NULL, 1, 'sms', 'inbound', NULL, 'Thanks for letting me know about your application update. If you have any questions about your credit or need guidance, just let me know how I can help.', 'delivered', 'SM1f6bae394714c5fdaf7b4b4313af07b8', 'conv_client_33_loan_39_flow_3', NULL, NULL, NULL, 'text', NULL, 'delivered', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-03-25 10:19:22', '2026-03-25 10:19:22'),
(11, 1, NULL, NULL, NULL, NULL, NULL, NULL, 'email', 'outbound', 'What Happens Next with Your Purchase Loan (#LA54906010)', 'Hi Lionel,\n\nJust following up! Now that we have your application (#LA54906010), here\'s a quick checklist of documents you\'ll want to have ready:\n\n✅ Government-issued photo ID (driver\'s license or passport)\n✅ Last 2 months of pay stubs\n✅ Last 2 years of W-2s or tax returns\n✅ Last 2–3 months of bank statements\n✅ Any gift letters (if applicable)\n\nYou can upload everything securely through your client portal. Getting these in early will help us move faster!\n\nReady to chat? Reply to this email or give us a call — we\'re here.\n\nAlex Gomez\nEncore Mortgage', 'sent', '<enc-conv_client_33_loan_39_flow_3-1774456684172@disruptinglabs.com>', 'conv_client_33_loan_39_flow_3', 8, NULL, NULL, 'text', 25, 'sent', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-03-25 10:38:04', '2026-03-25 10:38:04');

-- NOTE: update_conversation_thread trigger removed for TiDB Serverless compatibility.
-- This logic is handled in application code (api/index.ts upsertConversationThread).

-- --------------------------------------------------------

--
-- Table structure for table `compliance_checklists`
--

CREATE TABLE `compliance_checklists` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) NOT NULL DEFAULT '1',
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
  `id` int(11) NOT NULL AUTO_INCREMENT,
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
-- Table structure for table `contact_submissions`
--

CREATE TABLE `contact_submissions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) NOT NULL DEFAULT '1',
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `subject` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `message` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_read` tinyint(1) NOT NULL DEFAULT '0',
  `read_by_broker_id` int(11) DEFAULT NULL,
  `read_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `conversation_threads`
--

CREATE TABLE `conversation_threads` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) NOT NULL DEFAULT '1',
  `conversation_id` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `application_id` int(11) DEFAULT NULL,
  `lead_id` int(11) DEFAULT NULL,
  `client_id` int(11) DEFAULT NULL,
  `broker_id` int(11) DEFAULT NULL,
  `client_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `client_phone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `client_email` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `inbox_number` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Twilio number (To) that received the first inbound message',
  `last_message_at` datetime NOT NULL,
  `last_message_preview` text COLLATE utf8mb4_unicode_ci,
  `last_message_type` enum('email','sms','whatsapp','call','internal_note') COLLATE utf8mb4_unicode_ci NOT NULL,
  `message_count` int(11) DEFAULT '0',
  `unread_count` int(11) DEFAULT '0',
  `priority` enum('low','normal','high','urgent') COLLATE utf8mb4_unicode_ci DEFAULT 'normal',
  `status` enum('active','archived','closed') COLLATE utf8mb4_unicode_ci DEFAULT 'active',
  `tags` json DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `conversation_threads`
--

-- (no seed data)

-- --------------------------------------------------------

--
-- Table structure for table `documents`
--

CREATE TABLE `documents` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) NOT NULL DEFAULT '1',
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
-- Table structure for table `environment_keys`
--

CREATE TABLE `environment_keys` (
  `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `title` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Service name, e.g. stripe',
  `type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Key type: publishable | secret | webhook',
  `key_string` text COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'The actual key value',
  `is_test` tinyint(1) NOT NULL DEFAULT '1' COMMENT '1 = test/sandbox, 0 = live/production',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `environment_keys`
--

INSERT INTO `environment_keys` (`id`, `title`, `type`, `key_string`, `is_test`, `created_at`, `updated_at`) VALUES
(1, 'stripe', 'publishable', '', 1, '2026-02-23 23:50:30', '2026-02-26 23:43:35'),
(2, 'stripe', 'secret', '', 1, '2026-02-23 23:50:30', '2026-02-26 23:43:31'),
(3, 'stripe', 'publishable', '', 0, '2026-02-23 23:50:30', '2026-02-23 23:50:30'),
(4, 'stripe', 'secret', '', 0, '2026-02-23 23:50:30', '2026-02-23 23:50:30');

-- --------------------------------------------------------

--
-- Table structure for table `leads`
--

CREATE TABLE `leads` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) NOT NULL DEFAULT '1',
  `source` enum('website','referral','social_media','cold_call','event','other') COLLATE utf8mb4_unicode_ci NOT NULL,
  `source_details` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `source_category` enum('current_client_referral','past_client','past_client_referral','personal_friend','realtor','advertisement','business_partner','builder','other') COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Broker-specific lead source category for metrics tracking',
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
  `id` int(11) NOT NULL AUTO_INCREMENT,
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
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) NOT NULL DEFAULT '1',
  `application_number` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `client_user_id` int(11) NOT NULL,
  `broker_user_id` int(11) DEFAULT NULL,
  `partner_broker_id` int(11) DEFAULT NULL COMMENT 'Realtor partner broker manually assigned to this loan application',
  `loan_type` enum('purchase','refinance') COLLATE utf8mb4_unicode_ci NOT NULL,
  `loan_amount` decimal(12,2) NOT NULL,
  `property_value` decimal(12,2) DEFAULT NULL,
  `property_address` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `property_city` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `property_state` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `property_zip` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `property_type` enum('single_family','condo','multi_family','commercial','land','other') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `down_payment` decimal(12,2) DEFAULT NULL,
  `loan_purpose` text COLLATE utf8mb4_unicode_ci,
  `status` enum('draft','app_sent','application_received','prequalified','preapproved','under_contract_loan_setup','submitted_to_underwriting','approved_with_conditions','clear_to_close','docs_out','loan_funded') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'draft',
  `current_step` int(11) DEFAULT '1',
  `total_steps` int(11) DEFAULT '8',
  `priority` enum('low','medium','high','urgent') COLLATE utf8mb4_unicode_ci DEFAULT 'medium',
  `estimated_close_date` date DEFAULT NULL,
  `actual_close_date` date DEFAULT NULL,
  `interest_rate` decimal(5,3) DEFAULT NULL,
  `loan_term_months` int(11) DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `broker_token` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Broker public_token used when client submitted via share link',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `submitted_at` datetime DEFAULT NULL,
  `citizenship_status` enum('us_citizen','permanent_resident','non_resident','other') COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Applicant citizenship/immigration status at time of application',
  `employment_status` enum('employed','self_employed','unemployed','retired','retired_with_pension') COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Applicant employment status at time of application',
  `employer_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Employer or business name at time of application',
  `years_employed` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Years at current employer/business at time of application',
  `source_category` enum('current_client_referral','past_client','past_client_referral','personal_friend','realtor','advertisement','business_partner','builder','other') COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Lead source category for this loan application — used in Lead Source Analysis metrics'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `loan_applications`
--

INSERT INTO `loan_applications` (`id`, `tenant_id`, `application_number`, `client_user_id`, `broker_user_id`, `partner_broker_id`, `loan_type`, `loan_amount`, `property_value`, `property_address`, `property_city`, `property_state`, `property_zip`, `property_type`, `down_payment`, `loan_purpose`, `status`, `current_step`, `total_steps`, `priority`, `estimated_close_date`, `actual_close_date`, `interest_rate`, `loan_term_months`, `notes`, `broker_token`, `created_at`, `updated_at`, `submitted_at`, `citizenship_status`, `source_category`) VALUES
(15, 2, 'LA65421662', 14, 6, NULL, 'purchase', 350000.00, 450000.00, '123 Main Street', 'San Francisco', 'CA', '94102', 'single_family', 100000.00, 'Primary residence purchase', 'application_received', 1, 8, 'medium', '2026-03-15', NULL, NULL, NULL, 'Test loan application for development', NULL, '2026-02-11 21:03:41', '2026-03-10 22:55:05', '2026-02-11 21:03:41', NULL, NULL),
(23, 1, 'LA73590546', 22, 3, NULL, 'purchase', 800000.00, 1000000.00, 'TBD', 'Whittier', 'CA', '90603', 'single_family', 3.50, NULL, 'application_received', 1, 8, 'medium', NULL, NULL, NULL, NULL, NULL, NULL, '2026-02-24 16:53:10', '2026-03-23 15:10:25', '2026-02-24 16:53:10', NULL, 'past_client_referral');

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

CREATE TABLE `notifications` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) NOT NULL DEFAULT '1',
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

INSERT INTO `notifications` (`id`, `tenant_id`, `user_id`, `title`, `message`, `notification_type`, `is_read`, `action_url`, `created_at`, `read_at`) VALUES
(18, 2, 14, 'New Loan Application Created', 'Your loan application LA65421662 has been created. Please complete the assigned tasks.', 'info', 0, '/portal', '2026-02-11 21:03:42', NULL),
(36, 1, 22, 'New Loan Application Created', 'Your loan application LA73590546 has been created. Please complete the assigned tasks.', 'info', 0, '/portal', '2026-02-24 16:53:10', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `pipeline_step_templates`
--

CREATE TABLE `pipeline_step_templates` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) NOT NULL DEFAULT '1',
  `pipeline_step` enum('app_sent','application_received','prequalified','preapproved','under_contract_loan_setup','submitted_to_underwriting','approved_with_conditions','clear_to_close','docs_out','loan_funded') COLLATE utf8mb4_unicode_ci NOT NULL,
  `communication_type` enum('email','sms','whatsapp') COLLATE utf8mb4_unicode_ci NOT NULL,
  `template_id` int(11) NOT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_by_broker_id` int(11) DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `pre_approval_letters`
--

CREATE TABLE `pre_approval_letters` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) NOT NULL DEFAULT '1',
  `application_id` int(11) NOT NULL COMMENT 'FK to loan_applications.id',
  `approved_amount` decimal(12,2) NOT NULL COMMENT 'Current pre-approved amount shown on letter (can be edited up to max_approved_amount)',
  `max_approved_amount` decimal(12,2) NOT NULL COMMENT 'Maximum pre-approval ceiling — set only by admin brokers, cannot be exceeded',
  `html_content` longtext COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Fully customizable HTML body of the letter',
  `letter_date` date NOT NULL COMMENT 'Date shown on the letter',
  `expires_at` date DEFAULT NULL COMMENT 'Optional expiration date for the pre-approval',
  `loan_type` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Loan type shown on the letter: FHA, Conventional, USDA, VA, Non-QM',
  `fico_score` smallint(6) DEFAULT NULL COMMENT 'FICO credit score shown on the letter',
  `is_active` tinyint(1) NOT NULL DEFAULT '1' COMMENT '1 = active/enabled, 0 = disabled',
  `created_by_broker_id` int(11) NOT NULL COMMENT 'Broker who issued the letter',
  `updated_by_broker_id` int(11) DEFAULT NULL COMMENT 'Broker who last edited the letter',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Pre-approval letters attached to loan applications. One letter per loan, customizable HTML content.';

--
-- Dumping data for table `pre_approval_letters`
--

INSERT INTO `pre_approval_letters` (`id`, `tenant_id`, `application_id`, `approved_amount`, `max_approved_amount`, `html_content`, `letter_date`, `expires_at`, `loan_type`, `fico_score`, `is_active`, `created_by_broker_id`, `updated_by_broker_id`, `created_at`, `updated_at`) VALUES
(5, 1, 26, 440000.00, 440000.00, '<div style=\"font-family: Arial, Helvetica, sans-serif; max-width: 750px; margin: 0 auto; padding: 48px; background: #fff; color: #222;\">\n\n  <!-- HEADER: Logo left, company info right -->\n  <table style=\"width: 100%; margin-bottom: 20px; border-collapse: collapse;\">\n    <tr>\n      <td style=\"vertical-align: top; width: 55%;\">\n        {{COMPANY_LOGO}}\n      </td>\n      <td style=\"vertical-align: top; text-align: right; font-size: 13px; color: #333; line-height: 1.8;\">\n        <strong>{{COMPANY_NAME}}</strong><br>\n        P. {{COMPANY_PHONE}}<br>\n        NMLS# {{COMPANY_NMLS}}\n      </td>\n    </tr>\n  </table>\n\n  <hr style=\"border: none; border-top: 1px solid #ccc; margin-bottom: 20px;\">\n\n  <!-- DATE + EXPIRES row -->\n  <table style=\"width: 100%; margin-bottom: 20px; border-collapse: collapse;\">\n    <tr>\n      <td style=\"font-size: 13px;\">Date: {{LETTER_DATE}}</td>\n      <td style=\"font-size: 13px; text-align: right;\">Expires: {{EXPIRES_SHORT}}</td>\n    </tr>\n  </table>\n\n  <!-- RE LINE -->\n  <p style=\"margin: 0 0 20px; font-size: 13px;\">Re: {{CLIENT_FULL_NAME}}</p>\n\n  <hr style=\"border: none; border-top: 1px solid #ccc; margin-bottom: 20px;\">\n\n  <!-- BODY -->\n  <p style=\"margin: 0 0 16px; font-size: 13px; line-height: 1.7;\">\n    This letter shall serve as a pre-approval for a loan in connection with the purchase transaction for the above referenced buyer(s). Based on preliminary information, a pre-approval is herein granted with the following terms:\n  </p>\n\n  <!-- LOAN DETAILS -->\n  <p style=\"margin: 0 0 5px; font-size: 13px;\">Purchase Price: {{APPROVED_AMOUNT}}</p>\n  <p style=\"margin: 0 0 5px; font-size: 13px;\">Loan Type: </p>\n  <p style=\"margin: 0 0 5px; font-size: 13px;\">Term: 30 years</p>\n  <p style=\"margin: 0 0 5px; font-size: 13px;\">FICO Score: </p>\n  <p style=\"margin: 0 0 20px; font-size: 13px;\">Property Address: {{PROPERTY_ADDRESS}}</p>\n\n  <!-- REVIEWED SECTION -->\n  <p style=\"margin: 0 0 8px; font-size: 13px;\"><strong>We have reviewed the following:</strong></p>\n  <ul style=\"margin: 0 0 20px; padding-left: 24px; font-size: 13px; line-height: 1.9;\">\n    <li>Reviewed applicant&#39;s credit report and credit score</li>\n    <li>Verified applicant&#39;s income documentation and debt to income ratio</li>\n    <li>Verified applicant&#39;s assets documentation</li>\n  </ul>\n\n  <!-- DISCLAIMER -->\n  <p style=\"margin: 0 0 20px; font-size: 13px; line-height: 1.7;\">\n    Disclaimer: <strong>Loan Contingency.</strong> Even though a buyer may hold a pre-approval letter, further investigations concerning the property or the borrower could result in a loan denial. We suggest the buyer consider a loan contingency requirement in the purchase contract (to protect earnest money deposit) in accordance with applicable state law.\n  </p>\n\n  <!-- REALTOR PARTNER -->\n  <p style=\"margin: 0 0 32px; font-size: 13px;\">Realtor Partner: </p>\n\n  <!-- BROKER SIGNATURE -->\n  <table style=\"width: 100%; border-collapse: collapse;\">\n    <tr>\n      <td style=\"vertical-align: top; width: 100px;\">\n        {{BROKER_PHOTO}}\n      </td>\n      <td style=\"vertical-align: top; padding-left: 16px; font-size: 13px;\">\n        <p style=\"margin: 0 0 3px;\"><strong>{{BROKER_FULL_NAME}}</strong></p>\n        <p style=\"margin: 0 0 3px; color: #444;\">Mortgage Banker</p>\n        {{BROKER_LICENSE}}\n        <p style=\"margin: 0 0 3px; color: #444;\">{{COMPANY_NAME}}</p>\n        <p style=\"margin: 0 0 3px; color: #444;\">{{BROKER_PHONE}}</p>\n        <p style=\"margin: 0; color: #444;\">{{BROKER_EMAIL}}</p>\n      </td>\n    </tr>\n  </table>\n\n</div>', '2026-02-27', '2026-02-28', NULL, NULL, 1, 1, NULL, '2026-02-26 22:54:21', '2026-02-26 22:54:21'),
(6, 1, 27, 440000.00, 440000.00, '<div style=\"font-family: Arial, Helvetica, sans-serif; width: 100%; box-sizing: border-box; padding: 48px; background: #fff; color: #222;\">\n\n  <!-- HEADER: Logo left, company info right -->\n  <table style=\"width: 100%; margin-bottom: 20px; border-collapse: collapse;\">\n    <tr>\n      <td style=\"vertical-align: top; width: 55%;\">\n        {{COMPANY_LOGO}}\n      </td>\n      <td style=\"vertical-align: top; text-align: right; font-size: 13px; color: #333; line-height: 1.8;\">\n        <strong>{{COMPANY_NAME}}</strong><br>\n        P. {{COMPANY_PHONE}}<br>\n        NMLS# {{COMPANY_NMLS}}\n      </td>\n    </tr>\n  </table>\n\n  <hr style=\"border: none; border-top: 1px solid #ccc; margin-bottom: 20px;\">\n\n  <!-- DATE + EXPIRES row -->\n  <table style=\"width: 100%; margin-bottom: 20px; border-collapse: collapse;\">\n    <tr>\n      <td style=\"font-size: 13px;\">Date: {{LETTER_DATE}}</td>\n      <td style=\"font-size: 13px; text-align: right;\">Expires: {{EXPIRES_SHORT}}</td>\n    </tr>\n  </table>\n\n  <!-- RE LINE -->\n  <p style=\"margin: 0 0 20px; font-size: 13px;\">Re: {{CLIENT_FULL_NAME}}</p>\n\n  <hr style=\"border: none; border-top: 1px solid #ccc; margin-bottom: 20px;\">\n\n  <!-- BODY -->\n  <p style=\"margin: 0 0 16px; font-size: 13px; line-height: 1.7;\">\n    This letter shall serve as a pre-approval for a loan in connection with the purchase transaction for the above referenced buyer(s). Based on preliminary information, a pre-approval is herein granted with the following terms:\n  </p>\n\n  <!-- LOAN DETAILS -->\n  <p style=\"margin: 0 0 5px; font-size: 13px;\">Purchase Price: {{APPROVED_AMOUNT}}</p>\n  <p style=\"margin: 0 0 5px; font-size: 13px;\">Loan Type: </p>\n  <p style=\"margin: 0 0 5px; font-size: 13px;\">Term: 30 years</p>\n  <p style=\"margin: 0 0 5px; font-size: 13px;\">FICO Score: </p>\n  <p style=\"margin: 0 0 20px; font-size: 13px;\">Property Address: {{PROPERTY_ADDRESS}}</p>\n\n  <!-- REVIEWED SECTION -->\n  <p style=\"margin: 0 0 8px; font-size: 13px;\"><strong>We have reviewed the following:</strong></p>\n  <ul style=\"margin: 0 0 20px; padding-left: 24px; font-size: 13px; line-height: 1.9;\">\n    <li>Reviewed applicant&#39;s credit report and credit score</li>\n    <li>Verified applicant&#39;s income documentation and debt to income ratio</li>\n    <li>Verified applicant&#39;s assets documentation</li>\n  </ul>\n\n  <!-- DISCLAIMER -->\n  <p style=\"margin: 0 0 20px; font-size: 13px; line-height: 1.7;\">\n    Disclaimer: <strong>Loan Contingency.</strong> Even though a buyer may hold a pre-approval letter, further investigations concerning the property or the borrower could result in a loan denial. We suggest the buyer consider a loan contingency requirement in the purchase contract (to protect earnest money deposit) in accordance with applicable state law.\n  </p>\n\n  <!-- REALTOR PARTNER -->\n  <p style=\"margin: 0 0 32px; font-size: 13px;\">Realtor Partner: </p>\n\n  <!-- BROKER SIGNATURE -->\n  <table style=\"width: 100%; border-collapse: collapse;\">\n    <tr>\n      <td style=\"vertical-align: top; width: 100px;\">\n        {{BROKER_PHOTO}}\n      </td>\n      <td style=\"vertical-align: top; padding-left: 16px; font-size: 13px;\">\n        <p style=\"margin: 0 0 3px;\"><strong>{{BROKER_FULL_NAME}}</strong></p>\n        <p style=\"margin: 0 0 3px; color: #444;\">Mortgage Banker</p>\n        {{BROKER_LICENSE}}\n        <p style=\"margin: 0 0 3px; color: #444;\">{{COMPANY_NAME}}</p>\n        <p style=\"margin: 0 0 3px; color: #444;\">{{BROKER_PHONE}}</p>\n        <p style=\"margin: 0; color: #444;\">{{BROKER_EMAIL}}</p>\n      </td>\n    </tr>\n  </table>\n\n</div>', '2026-03-05', '2026-04-09', NULL, NULL, 1, 1, NULL, '2026-03-02 19:09:17', '2026-03-02 19:09:17'),
(15, 1, 30, 440000.00, 440000.00, '<div style=\"font-family: Arial, Helvetica, sans-serif; width: 100%; box-sizing: border-box; padding: 48px; background: #fff; color: #222;\">\n\n  <!-- HEADER: Logo left, company info right -->\n  <table style=\"width: 100%; margin-bottom: 20px; border-collapse: collapse;\">\n    <tr>\n      <td style=\"vertical-align: top; width: 55%;\">\n        {{COMPANY_LOGO}}\n      </td>\n      <td style=\"vertical-align: top; text-align: right; font-size: 13px; color: #333; line-height: 1.8;\">\n        <strong>{{COMPANY_NAME}}</strong><br>\n        P. {{COMPANY_PHONE}}<br>\n        NMLS# {{COMPANY_NMLS}}\n      </td>\n    </tr>\n  </table>\n\n  <hr style=\"border: none; border-top: 1px solid #ccc; margin-bottom: 20px;\">\n\n  <!-- DATE + EXPIRES row -->\n  <table style=\"width: 100%; margin-bottom: 20px; border-collapse: collapse;\">\n    <tr>\n      <td style=\"font-size: 13px;\">Date: {{LETTER_DATE}}</td>\n      <td style=\"font-size: 13px; text-align: right;\">Expires: {{EXPIRES_SHORT}}</td>\n    </tr>\n  </table>\n\n  <!-- RE LINE -->\n  <p style=\"margin: 0 0 20px; font-size: 13px;\">Re: {{CLIENT_FULL_NAME}}</p>\n\n  <hr style=\"border: none; border-top: 1px solid #ccc; margin-bottom: 20px;\">\n\n  <!-- BODY -->\n  <p style=\"margin: 0 0 16px; font-size: 13px; line-height: 1.7;\">\n    This letter shall serve as a pre-approval for a loan in connection with the purchase transaction for the above referenced buyer(s). Based on preliminary information, a pre-approval is herein granted with the following terms:\n  </p>\n\n  <!-- LOAN DETAILS -->\n  <p style=\"margin: 0 0 5px; font-size: 13px;\">Purchase Price: {{APPROVED_AMOUNT}}</p>\n  <p style=\"margin: 0 0 5px; font-size: 13px;\">Loan Type: {{LOAN_TYPE}}</p>\n  <p style=\"margin: 0 0 5px; font-size: 13px;\">Term: 30 years</p>\n  <p style=\"margin: 0 0 5px; font-size: 13px;\">FICO Score: {{FICO_SCORE}}</p>\n  <p style=\"margin: 0 0 20px; font-size: 13px;\">Property Address: {{PROPERTY_ADDRESS}}</p>\n\n  <!-- REVIEWED SECTION -->\n  <p style=\"margin: 0 0 8px; font-size: 13px;\"><strong>We have reviewed the following:</strong></p>\n  <ul style=\"margin: 0 0 20px; padding-left: 24px; font-size: 13px; line-height: 1.9;\">\n    <li>Reviewed applicant&#39;s credit report and credit score</li>\n    <li>Verified applicant&#39;s income documentation and debt to income ratio</li>\n    <li>Verified applicant&#39;s assets documentation</li>\n  </ul>\n\n  <!-- DISCLAIMER -->\n  <p style=\"margin: 0 0 20px; font-size: 13px; line-height: 1.7;\">\n    Disclaimer: <strong>Loan Contingency.</strong> Even though a buyer may hold a pre-approval letter, further investigations concerning the property or the borrower could result in a loan denial. We suggest the buyer consider a loan contingency requirement in the purchase contract (to protect earnest money deposit) in accordance with applicable state law.\n  </p>\n\n  <!-- BROKER + PARTNER SIGNATURE -->\n  {{BROKER_SIGNATURE_SECTION}}\n\n</div>', '2026-03-06', '2026-03-24', 'Conventional', 350, 1, 1, NULL, '2026-03-05 19:44:28', '2026-03-05 19:44:28'),
(19, 1, 31, 500000.00, 800000.00, '<div style=\"font-family: Arial, Helvetica, sans-serif; width: 100%; box-sizing: border-box; padding: 48px; background: #fff; color: #222;\">\n\n  <!-- HEADER: Logo left, company info right -->\n  <table style=\"width: 100%; margin-bottom: 20px; border-collapse: collapse;\">\n    <tr>\n      <td style=\"vertical-align: top; width: 55%;\">\n        {{COMPANY_LOGO}}\n      </td>\n      <td style=\"vertical-align: top; text-align: right; font-size: 13px; color: #333; line-height: 1.8;\">\n        <strong>{{COMPANY_NAME}}</strong><br>\n        P. {{COMPANY_PHONE}}<br>\n        NMLS# {{COMPANY_NMLS}}\n      </td>\n    </tr>\n  </table>\n\n  <hr style=\"border: none; border-top: 1px solid #ccc; margin-bottom: 20px;\">\n\n  <!-- DATE + EXPIRES row -->\n  <table style=\"width: 100%; margin-bottom: 20px; border-collapse: collapse;\">\n    <tr>\n      <td style=\"font-size: 13px;\">Date: {{LETTER_DATE}}</td>\n      <td style=\"font-size: 13px; text-align: right;\">Expires: {{EXPIRES_SHORT}}</td>\n    </tr>\n  </table>\n\n  <!-- RE LINE -->\n  <p style=\"margin: 0 0 20px; font-size: 13px;\">Re: {{CLIENT_FULL_NAME}}</p>\n\n  <hr style=\"border: none; border-top: 1px solid #ccc; margin-bottom: 20px;\">\n\n  <!-- BODY -->\n  <p style=\"margin: 0 0 16px; font-size: 13px; line-height: 1.7;\">\n    This letter shall serve as a pre-approval for a loan in connection with the purchase transaction for the above referenced buyer(s). Based on preliminary information, a pre-approval is herein granted with the following terms:\n  </p>\n\n  <!-- LOAN DETAILS -->\n  <p style=\"margin: 0 0 5px; font-size: 13px;\">Purchase Price: {{APPROVED_AMOUNT}}</p>\n  <p style=\"margin: 0 0 5px; font-size: 13px;\">Loan Type: {{LOAN_TYPE}}</p>\n  <p style=\"margin: 0 0 5px; font-size: 13px;\">Term: 30 years</p>\n  <p style=\"margin: 0 0 5px; font-size: 13px;\">FICO Score: {{FICO_SCORE}}</p>\n  <p style=\"margin: 0 0 20px; font-size: 13px;\">Property Address: {{PROPERTY_ADDRESS}}</p>\n\n  <!-- REVIEWED SECTION -->\n  <p style=\"margin: 0 0 8px; font-size: 13px;\"><strong>We have reviewed the following:</strong></p>\n  <ul style=\"margin: 0 0 20px; padding-left: 24px; font-size: 13px; line-height: 1.9;\">\n    <li>Reviewed applicant&#39;s credit report and credit score</li>\n    <li>Verified applicant&#39;s income documentation and debt to income ratio</li>\n    <li>Verified applicant&#39;s assets documentation</li>\n  </ul>\n\n  <!-- DISCLAIMER -->\n  <p style=\"margin: 0 0 20px; font-size: 13px; line-height: 1.7;\">\n    Disclaimer: <strong>Loan Contingency.</strong> Even though a buyer may hold a pre-approval letter, further investigations concerning the property or the borrower could result in a loan denial. We suggest the buyer consider a loan contingency requirement in the purchase contract (to protect earnest money deposit) in accordance with applicable state law.\n  </p>\n\n  <!-- BROKER + PARTNER SIGNATURE -->\n  {{BROKER_SIGNATURE_SECTION}}\n\n</div>', '2026-03-06', '2026-03-31', 'Non-QM', 740, 1, 3, NULL, '2026-03-06 08:43:35', '2026-03-06 08:43:35'),
(21, 1, 32, 400000.00, 440000.00, '<div style=\"font-family: Arial, Helvetica, sans-serif; width: 100%; box-sizing: border-box; padding: 48px; background: #fff; color: #222;\">\n\n  <!-- HEADER: Logo left, company info right -->\n  <table style=\"width: 100%; margin-bottom: 20px; border-collapse: collapse;\">\n    <tr>\n      <td style=\"vertical-align: top; width: 55%;\">\n        {{COMPANY_LOGO}}\n      </td>\n      <td style=\"vertical-align: top; text-align: right; font-size: 13px; color: #333; line-height: 1.8;\">\n        <strong>{{COMPANY_NAME}}</strong><br>\n        P. {{COMPANY_PHONE}}<br>\n        NMLS# {{COMPANY_NMLS}}\n      </td>\n    </tr>\n  </table>\n\n  <hr style=\"border: none; border-top: 1px solid #ccc; margin-bottom: 20px;\">\n\n  <!-- DATE + EXPIRES row -->\n  <table style=\"width: 100%; margin-bottom: 20px; border-collapse: collapse;\">\n    <tr>\n      <td style=\"font-size: 13px;\">Date: {{LETTER_DATE}}</td>\n      <td style=\"font-size: 13px; text-align: right;\">Expires: {{EXPIRES_SHORT}}</td>\n    </tr>\n  </table>\n\n  <!-- RE LINE -->\n  <p style=\"margin: 0 0 20px; font-size: 13px;\">Re: {{CLIENT_FULL_NAME}}</p>\n\n  <hr style=\"border: none; border-top: 1px solid #ccc; margin-bottom: 20px;\">\n\n  <!-- BODY -->\n  <p style=\"margin: 0 0 16px; font-size: 13px; line-height: 1.7;\">\n    This letter shall serve as a pre-approval for a loan in connection with the purchase transaction for the above referenced buyer(s). Based on preliminary information, a pre-approval is herein granted with the following terms:\n  </p>\n\n  <!-- LOAN DETAILS -->\n  <p style=\"margin: 0 0 5px; font-size: 13px;\">Purchase Price: {{APPROVED_AMOUNT}}</p>\n  <p style=\"margin: 0 0 5px; font-size: 13px;\">Loan Type: {{LOAN_TYPE}}</p>\n  <p style=\"margin: 0 0 5px; font-size: 13px;\">Term: 30 years</p>\n  <p style=\"margin: 0 0 5px; font-size: 13px;\">FICO Score: {{FICO_SCORE}}</p>\n  <p style=\"margin: 0 0 20px; font-size: 13px;\">Property Address: {{PROPERTY_ADDRESS}}</p>\n\n  <!-- REVIEWED SECTION -->\n  <p style=\"margin: 0 0 8px; font-size: 13px;\"><strong>We have reviewed the following:</strong></p>\n  <ul style=\"margin: 0 0 20px; padding-left: 24px; font-size: 13px; line-height: 1.9;\">\n    <li>Reviewed applicant&#39;s credit report and credit score</li>\n    <li>Verified applicant&#39;s income documentation and debt to income ratio</li>\n    <li>Verified applicant&#39;s assets documentation</li>\n  </ul>\n\n  <!-- DISCLAIMER -->\n  <p style=\"margin: 0 0 20px; font-size: 13px; line-height: 1.7;\">\n    Disclaimer: <strong>Loan Contingency.</strong> Even though a buyer may hold a pre-approval letter, further investigations concerning the property or the borrower could result in a loan denial. We suggest the buyer consider a loan contingency requirement in the purchase contract (to protect earnest money deposit) in accordance with applicable state law.\n  </p>\n\n  <!-- BROKER + PARTNER SIGNATURE -->\n  {{BROKER_SIGNATURE_SECTION}}\n\n</div>', '2026-03-09', '2026-04-06', 'Conventional', 650, 1, 1, 11, '2026-03-09 21:10:37', '2026-03-09 21:25:55');

-- --------------------------------------------------------

--
-- Table structure for table `reminder_flows`
--

CREATE TABLE `reminder_flows` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) NOT NULL DEFAULT '1',
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `trigger_event` enum('app_sent','application_received','prequalified','preapproved','under_contract_loan_setup','submitted_to_underwriting','approved_with_conditions','clear_to_close','docs_out','loan_funded','task_pending','task_in_progress','task_overdue','no_activity','manual') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'app_sent',
  `trigger_delay_days` int(11) NOT NULL DEFAULT '0' COMMENT 'Days after trigger event to start flow',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `apply_to_all_loans` tinyint(1) NOT NULL DEFAULT '1' COMMENT 'When true, applies to all current and future loans',
  `loan_type_filter` enum('all','purchase','refinance') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'all' COMMENT 'Restrict this flow to a specific loan type or all',
  `created_by_broker_id` int(11) DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `reminder_flows`
--

INSERT INTO `reminder_flows` (`id`, `tenant_id`, `name`, `description`, `trigger_event`, `trigger_delay_days`, `is_active`, `apply_to_all_loans`, `loan_type_filter`, `created_by_broker_id`, `created_at`, `updated_at`) VALUES
(3, 1, 'Application Received — Nurture Sequence', 'Triggered when a loan application status moves to application_received. Checks the application is not in an adverse state, then branches by loan type (Purchase / Refi). Default (unclassified) follows the Purchase sequence. Cadence: SMS → Email → 10-min wait → Email → 2-day wait → SMS.', 'application_received', 0, 1, 1, 'all', 1, '2026-03-12 22:05:46', '2026-03-12 22:05:46'),
(5, 1, 'Preapproved — Nurture Drip Sequence', 'Triggered when loan status becomes preapproved. Branches by loan type (Purchase/Refi/Default→Purchase). Pure time-based drip — no response gates. 12 SMS + 11 Email over ~88 days. Both branches start with immediate SMS+Email, then share an escalating sequence.', 'preapproved', 0, 1, 1, 'all', 1, '2026-03-12 22:47:43', '2026-03-12 22:47:43'),
(6, 1, 'Under Contract/Loan Set Up — Welcome Sequence', 'Triggered immediately when loan status becomes under_contract_loan_setup. Sends an SMS followed by an Email with details on next steps. No branching.', 'under_contract_loan_setup', 0, 1, 1, 'all', 1, '2026-03-12 22:50:22', '2026-03-12 22:50:22'),
(7, 1, 'Submitted to Underwriting — Notification Sequence', 'Triggered immediately when loan status becomes submitted_to_underwriting. Sends an SMS and an Email explaining the underwriting process and what the client should expect. No branching.', 'submitted_to_underwriting', 0, 1, 1, 'all', 1, '2026-03-12 22:51:53', '2026-03-12 22:51:53'),
(8, 1, 'Approved with Conditions — Notification Sequence', 'Triggered immediately when loan status becomes approved_with_conditions. Sends client an SMS + Email explaining the conditional approval. Then fires three internal notifications to alert the team to contact the Buyer Agent, Listing Agent, and Title Agent respectively.', 'approved_with_conditions', 0, 1, 1, 'all', 1, '2026-03-12 22:55:03', '2026-03-12 22:55:03'),
(9, 1, 'Clear to Close — Closing Notification Sequence', 'Triggered immediately when loan status becomes clear_to_close. Sends a shared SMS, then branches by loan type: Purchase gets a purchase-specific closing prep email, Refi gets a refi-specific closing prep email. Default (Nada) routes to the Purchase email.', 'clear_to_close', 0, 1, 1, 'all', 1, '2026-03-12 22:57:51', '2026-03-12 22:57:51'),
(10, 1, 'Loan Funded — Closing Day Congratulations', 'Triggered when loan status becomes loan_funded. Checks if actual_close_date is set. If yes, waits until the close date then sends a congratulatory SMS + Email. If no close date is set (Nada), the flow ends without sending.', 'loan_funded', 0, 1, 1, 'all', 1, '2026-03-12 23:02:15', '2026-03-12 23:02:43');

-- --------------------------------------------------------

--
-- Table structure for table `reminder_flow_connections`
--

CREATE TABLE `reminder_flow_connections` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `flow_id` int(11) NOT NULL,
  `edge_key` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Unique key within flow for React Flow edge id',
  `source_step_key` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `target_step_key` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `label` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Edge label e.g. Yes / No for conditions',
  `edge_type` enum('default','condition_yes','condition_no','loan_type_purchase','loan_type_refinance','no_response','responded') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'default',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `reminder_flow_connections`
--

INSERT INTO `reminder_flow_connections` (`id`, `flow_id`, `edge_key`, `source_step_key`, `target_step_key`, `label`, `edge_type`, `created_at`) VALUES
(30, 3, 'e_trigger_adverse', 'trigger', 'cond_not_adverse', NULL, 'default', '2026-03-12 22:05:46'),
(31, 3, 'e_adverse_yes', 'cond_not_adverse', 'branch_loan_type', 'Not Adverse', 'condition_yes', '2026-03-12 22:05:46'),
(32, 3, 'e_adverse_no', 'cond_not_adverse', 'end_adverse', 'Adverse', 'condition_no', '2026-03-12 22:05:46'),
(33, 3, 'e_branch_purchase', 'branch_loan_type', 'purchase_sms_1', 'Purchase', 'loan_type_purchase', '2026-03-12 22:05:46'),
(34, 3, 'e_branch_refi', 'branch_loan_type', 'refi_sms_1', 'Refi', 'loan_type_refinance', '2026-03-12 22:05:46'),
(35, 3, 'e_branch_default', 'branch_loan_type', 'purchase_sms_1', 'Other', 'default', '2026-03-12 22:05:46'),
(36, 3, 'e_ps1_pe1', 'purchase_sms_1', 'purchase_email_1', NULL, 'default', '2026-03-12 22:05:46'),
(37, 3, 'e_pe1_pw10m', 'purchase_email_1', 'purchase_wait_10m', NULL, 'default', '2026-03-12 22:05:46'),
(38, 3, 'e_pw10m_pe2', 'purchase_wait_10m', 'purchase_email_2', NULL, 'default', '2026-03-12 22:05:46'),
(39, 3, 'e_pe2_pw2d', 'purchase_email_2', 'purchase_wait_2d', NULL, 'default', '2026-03-12 22:05:46'),
(40, 3, 'e_pw2d_ps2', 'purchase_wait_2d', 'purchase_sms_2', NULL, 'default', '2026-03-12 22:05:46'),
(41, 3, 'e_ps2_end_purchase', 'purchase_sms_2', 'end_purchase', NULL, 'default', '2026-03-12 22:05:46'),
(42, 3, 'e_rs1_re1', 'refi_sms_1', 'refi_email_1', NULL, 'default', '2026-03-12 22:05:46'),
(43, 3, 'e_re1_rw10m', 'refi_email_1', 'refi_wait_10m', NULL, 'default', '2026-03-12 22:05:46'),
(44, 3, 'e_rw10m_re2', 'refi_wait_10m', 'refi_email_2', NULL, 'default', '2026-03-12 22:05:46'),
(45, 3, 'e_re2_rw2d', 'refi_email_2', 'refi_wait_2d', NULL, 'default', '2026-03-12 22:05:46'),
(46, 3, 'e_rw2d_rs2', 'refi_wait_2d', 'refi_sms_2', NULL, 'default', '2026-03-12 22:05:46'),
(47, 3, 'e_rs2_end_refi', 'refi_sms_2', 'end_refi', NULL, 'default', '2026-03-12 22:05:46'),
(134, 5, 'e_trigger_branch', 'trigger', 'branch', NULL, 'default', '2026-03-12 22:47:43'),
(135, 5, 'e_branch_p', 'branch', 'p_s1', 'Purchase', 'loan_type_purchase', '2026-03-12 22:47:43'),
(136, 5, 'e_branch_r', 'branch', 'r_s1', 'Refi', 'loan_type_refinance', '2026-03-12 22:47:43'),
(137, 5, 'e_branch_def', 'branch', 'p_s1', 'Other', 'default', '2026-03-12 22:47:43'),
(138, 5, 'e_p_s1_e1', 'p_s1', 'p_e1', NULL, 'default', '2026-03-12 22:47:43'),
(139, 5, 'e_p_e1_w2d1', 'p_e1', 'p_w2d1', NULL, 'default', '2026-03-12 22:47:43'),
(140, 5, 'e_p_w2d1_s2', 'p_w2d1', 'p_s2', NULL, 'default', '2026-03-12 22:47:43'),
(141, 5, 'e_p_s2_w2d2', 'p_s2', 'p_w2d2', NULL, 'default', '2026-03-12 22:47:43'),
(142, 5, 'e_p_w2d2_s3', 'p_w2d2', 'p_s3', NULL, 'default', '2026-03-12 22:47:43'),
(143, 5, 'e_p_s3_e2', 'p_s3', 'p_e2', NULL, 'default', '2026-03-12 22:47:43'),
(144, 5, 'e_p_e2_w2d3', 'p_e2', 'p_w2d3', NULL, 'default', '2026-03-12 22:47:43'),
(145, 5, 'e_p_w2d3_s4', 'p_w2d3', 'p_s4', NULL, 'default', '2026-03-12 22:47:43'),
(146, 5, 'e_p_s4_w3d1', 'p_s4', 'p_w3d1', NULL, 'default', '2026-03-12 22:47:43'),
(147, 5, 'e_p_w3d1_s5', 'p_w3d1', 'p_s5', NULL, 'default', '2026-03-12 22:47:43'),
(148, 5, 'e_p_s5_e3', 'p_s5', 'p_e3', NULL, 'default', '2026-03-12 22:47:43'),
(149, 5, 'e_p_e3_w3d2', 'p_e3', 'p_w3d2', NULL, 'default', '2026-03-12 22:47:43'),
(150, 5, 'e_p_w3d2_s6', 'p_w3d2', 'p_s6', NULL, 'default', '2026-03-12 22:47:43'),
(151, 5, 'e_p_s6_e4', 'p_s6', 'p_e4', NULL, 'default', '2026-03-12 22:47:43'),
(152, 5, 'e_p_e4_w3d3', 'p_e4', 'p_w3d3', NULL, 'default', '2026-03-12 22:47:43'),
(153, 5, 'e_p_w3d3_s7', 'p_w3d3', 'p_s7', NULL, 'default', '2026-03-12 22:47:43'),
(154, 5, 'e_p_s7_w2d4', 'p_s7', 'p_w2d4', NULL, 'default', '2026-03-12 22:47:43'),
(155, 5, 'e_p_w2d4_s8', 'p_w2d4', 'p_s8', NULL, 'default', '2026-03-12 22:47:43'),
(156, 5, 'e_p_s8_w2d5', 'p_s8', 'p_w2d5', NULL, 'default', '2026-03-12 22:47:43'),
(157, 5, 'e_p_w2d5_s9', 'p_w2d5', 'p_s9', NULL, 'default', '2026-03-12 22:47:43'),
(158, 5, 'e_p_s9_w2d6', 'p_s9', 'p_w2d6', NULL, 'default', '2026-03-12 22:47:43'),
(159, 5, 'e_p_w2d6_s10', 'p_w2d6', 'p_s10', NULL, 'default', '2026-03-12 22:47:43'),
(160, 5, 'e_p_s10_w2d7', 'p_s10', 'p_w2d7', NULL, 'default', '2026-03-12 22:47:43'),
(161, 5, 'e_p_w2d7_s11', 'p_w2d7', 'p_s11', NULL, 'default', '2026-03-12 22:47:43'),
(162, 5, 'e_p_s11_w5d1', 'p_s11', 'p_w5d1', NULL, 'default', '2026-03-12 22:47:43'),
(163, 5, 'e_p_w5d1_s12', 'p_w5d1', 'p_s12', NULL, 'default', '2026-03-12 22:47:43'),
(164, 5, 'e_p_s12_e5', 'p_s12', 'p_e5', NULL, 'default', '2026-03-12 22:47:43'),
(165, 5, 'e_p_e5_w10d1', 'p_e5', 'p_w10d1', NULL, 'default', '2026-03-12 22:47:43'),
(166, 5, 'e_p_w10d1_e6', 'p_w10d1', 'p_e6', NULL, 'default', '2026-03-12 22:47:43'),
(167, 5, 'e_p_e6_w10d2', 'p_e6', 'p_w10d2', NULL, 'default', '2026-03-12 22:47:43'),
(168, 5, 'e_p_w10d2_e7', 'p_w10d2', 'p_e7', NULL, 'default', '2026-03-12 22:47:43'),
(169, 5, 'e_p_e7_w15d1', 'p_e7', 'p_w15d1', NULL, 'default', '2026-03-12 22:47:43'),
(170, 5, 'e_p_w15d1_e8', 'p_w15d1', 'p_e8', NULL, 'default', '2026-03-12 22:47:43'),
(171, 5, 'e_p_e8_w10d3', 'p_e8', 'p_w10d3', NULL, 'default', '2026-03-12 22:47:43'),
(172, 5, 'e_p_w10d3_e9', 'p_w10d3', 'p_e9', NULL, 'default', '2026-03-12 22:47:43'),
(173, 5, 'e_p_e9_w15d2', 'p_e9', 'p_w15d2', NULL, 'default', '2026-03-12 22:47:43'),
(174, 5, 'e_p_w15d2_e10', 'p_w15d2', 'p_e10', NULL, 'default', '2026-03-12 22:47:43'),
(175, 5, 'e_p_e10_e11', 'p_e10', 'p_e11', NULL, 'default', '2026-03-12 22:47:43'),
(176, 5, 'e_p_e11_end', 'p_e11', 'p_end', NULL, 'default', '2026-03-12 22:47:43'),
(177, 5, 'e_r_s1_e1', 'r_s1', 'r_e1', NULL, 'default', '2026-03-12 22:47:43'),
(178, 5, 'e_r_e1_w2d1', 'r_e1', 'r_w2d1', NULL, 'default', '2026-03-12 22:47:43'),
(179, 5, 'e_r_w2d1_s2', 'r_w2d1', 'r_s2', NULL, 'default', '2026-03-12 22:47:43'),
(180, 5, 'e_r_s2_w2d2', 'r_s2', 'r_w2d2', NULL, 'default', '2026-03-12 22:47:43'),
(181, 5, 'e_r_w2d2_s3', 'r_w2d2', 'r_s3', NULL, 'default', '2026-03-12 22:47:43'),
(182, 5, 'e_r_s3_e2', 'r_s3', 'r_e2', NULL, 'default', '2026-03-12 22:47:43'),
(183, 5, 'e_r_e2_w2d3', 'r_e2', 'r_w2d3', NULL, 'default', '2026-03-12 22:47:43'),
(184, 5, 'e_r_w2d3_s4', 'r_w2d3', 'r_s4', NULL, 'default', '2026-03-12 22:47:43'),
(185, 5, 'e_r_s4_w3d1', 'r_s4', 'r_w3d1', NULL, 'default', '2026-03-12 22:47:43'),
(186, 5, 'e_r_w3d1_s5', 'r_w3d1', 'r_s5', NULL, 'default', '2026-03-12 22:47:43'),
(187, 5, 'e_r_s5_e3', 'r_s5', 'r_e3', NULL, 'default', '2026-03-12 22:47:43'),
(188, 5, 'e_r_e3_w3d2', 'r_e3', 'r_w3d2', NULL, 'default', '2026-03-12 22:47:43'),
(189, 5, 'e_r_w3d2_s6', 'r_w3d2', 'r_s6', NULL, 'default', '2026-03-12 22:47:43'),
(190, 5, 'e_r_s6_e4', 'r_s6', 'r_e4', NULL, 'default', '2026-03-12 22:47:43'),
(191, 5, 'e_r_e4_w3d3', 'r_e4', 'r_w3d3', NULL, 'default', '2026-03-12 22:47:43'),
(192, 5, 'e_r_w3d3_s7', 'r_w3d3', 'r_s7', NULL, 'default', '2026-03-12 22:47:43'),
(193, 5, 'e_r_s7_w2d4', 'r_s7', 'r_w2d4', NULL, 'default', '2026-03-12 22:47:43'),
(194, 5, 'e_r_w2d4_s8', 'r_w2d4', 'r_s8', NULL, 'default', '2026-03-12 22:47:43'),
(195, 5, 'e_r_s8_w2d5', 'r_s8', 'r_w2d5', NULL, 'default', '2026-03-12 22:47:43'),
(196, 5, 'e_r_w2d5_s9', 'r_w2d5', 'r_s9', NULL, 'default', '2026-03-12 22:47:43'),
(197, 5, 'e_r_s9_w2d6', 'r_s9', 'r_w2d6', NULL, 'default', '2026-03-12 22:47:43'),
(198, 5, 'e_r_w2d6_s10', 'r_w2d6', 'r_s10', NULL, 'default', '2026-03-12 22:47:43'),
(199, 5, 'e_r_s10_w2d7', 'r_s10', 'r_w2d7', NULL, 'default', '2026-03-12 22:47:43'),
(200, 5, 'e_r_w2d7_s11', 'r_w2d7', 'r_s11', NULL, 'default', '2026-03-12 22:47:43'),
(201, 5, 'e_r_s11_w5d1', 'r_s11', 'r_w5d1', NULL, 'default', '2026-03-12 22:47:43'),
(202, 5, 'e_r_w5d1_s12', 'r_w5d1', 'r_s12', NULL, 'default', '2026-03-12 22:47:43'),
(203, 5, 'e_r_s12_e5', 'r_s12', 'r_e5', NULL, 'default', '2026-03-12 22:47:43'),
(204, 5, 'e_r_e5_w10d1', 'r_e5', 'r_w10d1', NULL, 'default', '2026-03-12 22:47:43'),
(205, 5, 'e_r_w10d1_e6', 'r_w10d1', 'r_e6', NULL, 'default', '2026-03-12 22:47:43'),
(206, 5, 'e_r_e6_w10d2', 'r_e6', 'r_w10d2', NULL, 'default', '2026-03-12 22:47:43'),
(207, 5, 'e_r_w10d2_e7', 'r_w10d2', 'r_e7', NULL, 'default', '2026-03-12 22:47:43'),
(208, 5, 'e_r_e7_w15d1', 'r_e7', 'r_w15d1', NULL, 'default', '2026-03-12 22:47:43'),
(209, 5, 'e_r_w15d1_e8', 'r_w15d1', 'r_e8', NULL, 'default', '2026-03-12 22:47:43'),
(210, 5, 'e_r_e8_w10d3', 'r_e8', 'r_w10d3', NULL, 'default', '2026-03-12 22:47:43'),
(211, 5, 'e_r_w10d3_e9', 'r_w10d3', 'r_e9', NULL, 'default', '2026-03-12 22:47:43'),
(212, 5, 'e_r_e9_w15d2', 'r_e9', 'r_w15d2', NULL, 'default', '2026-03-12 22:47:43'),
(213, 5, 'e_r_w15d2_e10', 'r_w15d2', 'r_e10', NULL, 'default', '2026-03-12 22:47:43'),
(214, 5, 'e_r_e10_e11', 'r_e10', 'r_e11', NULL, 'default', '2026-03-12 22:47:43'),
(215, 5, 'e_r_e11_end', 'r_e11', 'r_end', NULL, 'default', '2026-03-12 22:47:43'),
(216, 6, 'e_trigger_sms', 'trigger', 'sms', NULL, 'default', '2026-03-12 22:50:22'),
(217, 6, 'e_sms_email', 'sms', 'email', NULL, 'default', '2026-03-12 22:50:22'),
(218, 6, 'e_email_end', 'email', 'end', NULL, 'default', '2026-03-12 22:50:22'),
(219, 7, 'e_trigger_sms', 'trigger', 'sms', NULL, 'default', '2026-03-12 22:51:53'),
(220, 7, 'e_sms_email', 'sms', 'email', NULL, 'default', '2026-03-12 22:51:53'),
(221, 7, 'e_email_end', 'email', 'end', NULL, 'default', '2026-03-12 22:51:53'),
(222, 8, 'e_trigger_sms', 'trigger', 'sms', NULL, 'default', '2026-03-12 22:55:03'),
(223, 8, 'e_sms_email', 'sms', 'email', NULL, 'default', '2026-03-12 22:55:03'),
(224, 8, 'e_email_notify_buyer', 'email', 'notify_buyer', NULL, 'default', '2026-03-12 22:55:03'),
(225, 8, 'e_buyer_notify_listing', 'notify_buyer', 'notify_listing', NULL, 'default', '2026-03-12 22:55:03'),
(226, 8, 'e_listing_notify_title', 'notify_listing', 'notify_title', NULL, 'default', '2026-03-12 22:55:03'),
(227, 8, 'e_title_end', 'notify_title', 'end', NULL, 'default', '2026-03-12 22:55:03'),
(228, 9, 'e_trigger_sms', 'trigger', 'sms', NULL, 'default', '2026-03-12 22:57:51'),
(229, 9, 'e_sms_branch', 'sms', 'branch', NULL, 'default', '2026-03-12 22:57:51'),
(230, 9, 'e_branch_p', 'branch', 'p_email', 'Purchase', 'loan_type_purchase', '2026-03-12 22:57:51'),
(231, 9, 'e_branch_r', 'branch', 'r_email', 'Refi', 'loan_type_refinance', '2026-03-12 22:57:51'),
(232, 9, 'e_branch_def', 'branch', 'p_email', 'Other', 'default', '2026-03-12 22:57:51'),
(233, 9, 'e_p_email_end', 'p_email', 'p_end', NULL, 'default', '2026-03-12 22:57:51'),
(234, 9, 'e_r_email_end', 'r_email', 'r_end', NULL, 'default', '2026-03-12 22:57:51'),
(235, 10, 'e_trigger_branch', 'trigger', 'branch', NULL, 'default', '2026-03-12 23:02:15'),
(236, 10, 'e_branch_yes', 'branch', 'wait_close_date', 'Close Date Set', 'condition_yes', '2026-03-12 23:02:15'),
(237, 10, 'e_branch_no', 'branch', 'end_no_date', 'Nada', 'condition_no', '2026-03-12 23:02:15'),
(238, 10, 'e_branch_default', 'branch', 'end_no_date', 'Default', 'default', '2026-03-12 23:02:15'),
(239, 10, 'e_wait_sms', 'wait_close_date', 'sms', NULL, 'default', '2026-03-12 23:02:15'),
(240, 10, 'e_sms_email', 'sms', 'email', NULL, 'default', '2026-03-12 23:02:15'),
(241, 10, 'e_email_end', 'email', 'end', NULL, 'default', '2026-03-12 23:02:15');

-- --------------------------------------------------------

--
-- Table structure for table `reminder_flow_executions`
--

CREATE TABLE `reminder_flow_executions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) NOT NULL DEFAULT '1',
  `flow_id` int(11) NOT NULL,
  `loan_application_id` int(11) DEFAULT NULL,
  `client_id` int(11) DEFAULT NULL,
  `conversation_id` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Conversation thread tied to this execution — conv_client_{clientId}_loan_{loanId}_flow_{flowId}',
  `current_step_key` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('active','paused','completed','cancelled','failed') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `next_execution_at` datetime DEFAULT NULL COMMENT 'When the next step should execute',
  `completed_steps` json DEFAULT NULL COMMENT 'Array of completed step keys',
  `context_data` json DEFAULT NULL COMMENT 'Runtime context: loan_type, client info, application status, etc.',
  `last_step_started_at` datetime DEFAULT NULL COMMENT 'Timestamp when current step execution began (used for no_response timeout)',
  `responded_at` datetime DEFAULT NULL COMMENT 'Set when client responds; triggers responded edge on wait_for_response steps',
  `started_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `completed_at` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `reminder_flow_executions`
--

INSERT INTO `reminder_flow_executions` (`id`, `tenant_id`, `flow_id`, `loan_application_id`, `client_id`, `conversation_id`, `current_step_key`, `status`, `next_execution_at`, `completed_steps`, `context_data`, `last_step_started_at`, `responded_at`, `started_at`, `completed_at`, `created_at`, `updated_at`) VALUES
(3, 1, 3, 31, 29, 'conv_client_29_loan_31_flow_3', 'trigger', 'failed', '2026-03-17 21:38:15', '[]', '{\"loan_id\": 31, \"client_id\": 29, \"loan_type\": \"purchase\", \"client_name\": \"Jane Doe\", \"loan_status\": \"application_received\", \"client_email\": \"tonatiuh.gom@gmail.com\", \"client_phone\": \"(555) 123-4567\", \"actual_close_date\": null, \"application_number\": \"LA74994106\", \"estimated_close_date\": null}', '2026-03-17 15:38:14', NULL, '2026-03-17 15:38:14', NULL, '2026-03-17 15:38:14', '2026-03-24 21:36:58'),
(4, 1, 5, 32, 29, 'conv_client_29_loan_32_flow_5', 'trigger', 'failed', '2026-03-17 21:38:18', '[]', '{\"loan_id\": 32, \"client_id\": 29, \"loan_type\": \"purchase\", \"client_name\": \"Jane Doe\", \"loan_status\": \"preapproved\", \"client_email\": \"tonatiuh.gom@gmail.com\", \"client_phone\": \"(555) 123-4567\", \"actual_close_date\": null, \"application_number\": \"LA10261192\", \"estimated_close_date\": null}', '2026-03-17 15:38:17', NULL, '2026-03-17 15:38:17', NULL, '2026-03-17 15:38:17', '2026-03-24 21:36:58'),
(7, 1, 3, 37, 32, 'conv_client_32_loan_37_flow_3', 'end_purchase', 'completed', '2026-03-27 04:15:03', '[\"purchase_wait_2d\", \"purchase_sms_2\", \"end_purchase\"]', '{\"loan_id\": 37, \"client_id\": 32, \"loan_type\": \"purchase\", \"client_name\": \"Lionel Messi\", \"loan_status\": \"application_received\", \"client_email\": \"tonatiuh.gom@gmail.com\", \"client_phone\": \"3234756240\", \"actual_close_date\": null, \"application_number\": \"LA11598165\", \"estimated_close_date\": null}', '2026-03-24 22:15:02', NULL, '2026-03-24 22:06:40', '2026-03-27 04:19:04', '2026-03-24 22:06:40', '2026-03-27 04:19:04'),
(8, 1, 3, 39, 33, 'conv_client_33_loan_39_flow_3', 'end_purchase', 'completed', '2026-03-27 16:38:05', '[\"purchase_wait_2d\", \"purchase_sms_2\", \"end_purchase\"]', '{\"loan_id\": 39, \"client_id\": 33, \"loan_type\": \"purchase\", \"broker_name\": \"Alex Gomez\", \"client_name\": \"Lionel Messi\", \"loan_status\": \"application_received\", \"client_email\": \"tonatiuh.gom@gmail.com\", \"client_phone\": \"3234756240\", \"actual_close_date\": null, \"application_number\": \"LA54906010\", \"estimated_close_date\": null}', '2026-03-25 10:38:04', NULL, '2026-03-25 10:08:27', '2026-03-27 16:57:04', '2026-03-25 10:08:27', '2026-03-27 16:57:04');

-- --------------------------------------------------------

--
-- Table structure for table `reminder_flow_steps`
--

CREATE TABLE `reminder_flow_steps` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `flow_id` int(11) NOT NULL,
  `step_key` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Unique key within flow for React Flow node id',
  `step_type` enum('trigger','wait','send_notification','send_email','send_sms','send_whatsapp','condition','branch','wait_for_response','wait_until_date','end') COLLATE utf8mb4_unicode_ci NOT NULL,
  `label` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `config` json DEFAULT NULL COMMENT 'Step-specific configuration (message, delay hours/days, condition type, etc.)',
  `position_x` float NOT NULL DEFAULT '0' COMMENT 'X position on the flow canvas',
  `position_y` float NOT NULL DEFAULT '0' COMMENT 'Y position on the flow canvas',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `reminder_flow_steps`
--

INSERT INTO `reminder_flow_steps` (`id`, `flow_id`, `step_key`, `step_type`, `label`, `description`, `config`, `position_x`, `position_y`, `created_at`, `updated_at`) VALUES
(31, 3, 'trigger', 'trigger', 'Application Received Trigger', NULL, NULL, 400, 50, '2026-03-12 22:05:46', '2026-03-12 22:05:46'),
(32, 3, 'cond_not_adverse', 'condition', 'Loan Status Check (Not Adverse)', 'Verifies the loan is not in an adverse/blocked state before sending communications', '{\"condition_type\": \"loan_status_ne\", \"condition_value\": \"adverse\"}', 400, 220, '2026-03-12 22:05:46', '2026-03-12 22:05:46'),
(33, 3, 'end_adverse', 'end', 'End (Adverse — No Action)', 'Application is in adverse state; skip all automations', NULL, 680, 380, '2026-03-12 22:05:46', '2026-03-12 22:05:46'),
(34, 3, 'branch_loan_type', 'branch', 'Loan Type Branch', 'Routes Purchase and Default to left sequence; Refi to right sequence', '{\"condition_type\": \"loan_type\"}', 400, 380, '2026-03-12 22:05:46', '2026-03-12 22:05:46'),
(35, 3, 'purchase_sms_1', 'send_sms', 'Welcome SMS (Purchase)', 'Immediate SMS confirmation', '{\"template_id\": 23}', 200, 560, '2026-03-12 22:05:46', '2026-03-12 22:05:46'),
(36, 3, 'purchase_email_1', 'send_email', 'Welcome Email (Purchase)', 'Immediate welcome email', '{\"template_id\": 24}', 200, 710, '2026-03-12 22:05:46', '2026-03-12 22:05:46'),
(37, 3, 'purchase_wait_10m', 'wait', 'Wait 10 Minutes', NULL, '{\"delay_minutes\": 10}', 200, 860, '2026-03-12 22:05:46', '2026-03-12 22:05:46'),
(38, 3, 'purchase_email_2', 'send_email', 'Document Checklist Email (Purchase)', 'Follow-up email with document checklist', '{\"template_id\": 25}', 200, 1010, '2026-03-12 22:05:46', '2026-03-12 22:05:46'),
(39, 3, 'purchase_wait_2d', 'wait', 'Wait 2 Days', NULL, '{\"delay_days\": 2}', 200, 1160, '2026-03-12 22:05:46', '2026-03-12 22:05:46'),
(40, 3, 'purchase_sms_2', 'send_sms', 'Day-2 Follow-Up SMS (Purchase)', 'Check-in SMS after 2 days', '{\"template_id\": 26}', 200, 1310, '2026-03-12 22:05:46', '2026-03-12 22:05:46'),
(41, 3, 'end_purchase', 'end', 'End (Purchase)', 'Purchase nurture sequence complete', NULL, 200, 1460, '2026-03-12 22:05:46', '2026-03-12 22:05:46'),
(42, 3, 'refi_sms_1', 'send_sms', 'Welcome SMS (Refi)', 'Immediate SMS confirmation', '{\"template_id\": 27}', 580, 560, '2026-03-12 22:05:46', '2026-03-12 22:05:46'),
(43, 3, 'refi_email_1', 'send_email', 'Welcome Email (Refi)', 'Immediate welcome email', '{\"template_id\": 28}', 580, 710, '2026-03-12 22:05:46', '2026-03-12 22:05:46'),
(44, 3, 'refi_wait_10m', 'wait', 'Wait 10 Minutes', NULL, '{\"delay_minutes\": 10}', 580, 860, '2026-03-12 22:05:46', '2026-03-12 22:05:46'),
(45, 3, 'refi_email_2', 'send_email', 'Document Checklist Email (Refi)', 'Follow-up email with document checklist', '{\"template_id\": 29}', 580, 1010, '2026-03-12 22:05:46', '2026-03-12 22:05:46'),
(46, 3, 'refi_wait_2d', 'wait', 'Wait 2 Days', NULL, '{\"delay_days\": 2}', 580, 1160, '2026-03-12 22:05:46', '2026-03-12 22:05:46'),
(47, 3, 'refi_sms_2', 'send_sms', 'Day-2 Follow-Up SMS (Refi)', 'Check-in SMS after 2 days', '{\"template_id\": 30}', 580, 1310, '2026-03-12 22:05:46', '2026-03-12 22:05:46'),
(48, 3, 'end_refi', 'end', 'End (Refi)', 'Refi nurture sequence complete', NULL, 580, 1460, '2026-03-12 22:05:46', '2026-03-12 22:05:46'),
(135, 5, 'trigger', 'trigger', 'Preapproved Trigger', NULL, NULL, 500, 50, '2026-03-12 22:47:43', '2026-03-12 22:47:43'),
(136, 5, 'branch', 'branch', 'Loan Type Branch', 'Routes to Purchase or Refi sequence', '{\"condition_type\": \"loan_type\"}', 500, 200, '2026-03-12 22:47:43', '2026-03-12 22:47:43'),
(137, 5, 'p_s1', 'send_sms', 'SMS 1 (Purchase)', NULL, '{\"template_id\": 54}', 200, 380, '2026-03-12 22:47:43', '2026-03-12 22:47:43'),
(138, 5, 'p_e1', 'send_email', 'Email 1 (Purchase)', NULL, '{\"template_id\": 55}', 200, 510, '2026-03-12 22:47:43', '2026-03-12 22:47:43'),
(139, 5, 'p_w2d1', 'wait', 'Wait 2 Days', NULL, '{\"delay_days\": 2}', 200, 640, '2026-03-12 22:47:43', '2026-03-12 22:47:43'),
(140, 5, 'p_s2', 'send_sms', 'SMS 2 (Purchase)', NULL, '{\"template_id\": 58}', 200, 770, '2026-03-12 22:47:43', '2026-03-12 22:47:43'),
(141, 5, 'p_w2d2', 'wait', 'Wait 2 Days', NULL, '{\"delay_days\": 2}', 200, 900, '2026-03-12 22:47:43', '2026-03-12 22:47:43'),
(142, 5, 'p_s3', 'send_sms', 'SMS 3 (Purchase)', NULL, '{\"template_id\": 59}', 200, 1030, '2026-03-12 22:47:43', '2026-03-12 22:47:43'),
(143, 5, 'p_e2', 'send_email', 'Email 2 (Purchase)', NULL, '{\"template_id\": 60}', 200, 1160, '2026-03-12 22:47:43', '2026-03-12 22:47:43'),
(144, 5, 'p_w2d3', 'wait', 'Wait 2 Days', NULL, '{\"delay_days\": 2}', 200, 1290, '2026-03-12 22:47:43', '2026-03-12 22:47:43'),
(145, 5, 'p_s4', 'send_sms', 'SMS 4 (Purchase)', NULL, '{\"template_id\": 61}', 200, 1420, '2026-03-12 22:47:43', '2026-03-12 22:47:43'),
(146, 5, 'p_w3d1', 'wait', 'Wait 3 Days', NULL, '{\"delay_days\": 3}', 200, 1550, '2026-03-12 22:47:43', '2026-03-12 22:47:43'),
(147, 5, 'p_s5', 'send_sms', 'SMS 5 (Purchase)', NULL, '{\"template_id\": 62}', 200, 1680, '2026-03-12 22:47:43', '2026-03-12 22:47:43'),
(148, 5, 'p_e3', 'send_email', 'Email 3 (Purchase)', NULL, '{\"template_id\": 63}', 200, 1810, '2026-03-12 22:47:43', '2026-03-12 22:47:43'),
(149, 5, 'p_w3d2', 'wait', 'Wait 3 Days', NULL, '{\"delay_days\": 3}', 200, 1940, '2026-03-12 22:47:43', '2026-03-12 22:47:43'),
(150, 5, 'p_s6', 'send_sms', 'SMS 6 (Purchase)', NULL, '{\"template_id\": 64}', 200, 2070, '2026-03-12 22:47:43', '2026-03-12 22:47:43'),
(151, 5, 'p_e4', 'send_email', 'Email 4 (Purchase)', NULL, '{\"template_id\": 65}', 200, 2200, '2026-03-12 22:47:43', '2026-03-12 22:47:43'),
(152, 5, 'p_w3d3', 'wait', 'Wait 3 Days', NULL, '{\"delay_days\": 3}', 200, 2330, '2026-03-12 22:47:43', '2026-03-12 22:47:43'),
(153, 5, 'p_s7', 'send_sms', 'SMS 7 (Purchase)', NULL, '{\"template_id\": 66}', 200, 2460, '2026-03-12 22:47:43', '2026-03-12 22:47:43'),
(154, 5, 'p_w2d4', 'wait', 'Wait 2 Days', NULL, '{\"delay_days\": 2}', 200, 2590, '2026-03-12 22:47:43', '2026-03-12 22:47:43'),
(155, 5, 'p_s8', 'send_sms', 'SMS 8 (Purchase)', NULL, '{\"template_id\": 67}', 200, 2720, '2026-03-12 22:47:43', '2026-03-12 22:47:43'),
(156, 5, 'p_w2d5', 'wait', 'Wait 2 Days', NULL, '{\"delay_days\": 2}', 200, 2850, '2026-03-12 22:47:43', '2026-03-12 22:47:43'),
(157, 5, 'p_s9', 'send_sms', 'SMS 9 (Purchase)', NULL, '{\"template_id\": 68}', 200, 2980, '2026-03-12 22:47:43', '2026-03-12 22:47:43'),
(158, 5, 'p_w2d6', 'wait', 'Wait 2 Days', NULL, '{\"delay_days\": 2}', 200, 3110, '2026-03-12 22:47:43', '2026-03-12 22:47:43'),
(159, 5, 'p_s10', 'send_sms', 'SMS 10 (Purchase)', NULL, '{\"template_id\": 69}', 200, 3240, '2026-03-12 22:47:43', '2026-03-12 22:47:43'),
(160, 5, 'p_w2d7', 'wait', 'Wait 2 Days', NULL, '{\"delay_days\": 2}', 200, 3370, '2026-03-12 22:47:43', '2026-03-12 22:47:43'),
(161, 5, 'p_s11', 'send_sms', 'SMS 11 (Purchase)', NULL, '{\"template_id\": 70}', 200, 3500, '2026-03-12 22:47:43', '2026-03-12 22:47:43'),
(162, 5, 'p_w5d1', 'wait', 'Wait 5 Days', NULL, '{\"delay_days\": 5}', 200, 3630, '2026-03-12 22:47:43', '2026-03-12 22:47:43'),
(163, 5, 'p_s12', 'send_sms', 'SMS 12 (Purchase)', NULL, '{\"template_id\": 71}', 200, 3760, '2026-03-12 22:47:43', '2026-03-12 22:47:43'),
(164, 5, 'p_e5', 'send_email', 'Email 5 (Purchase)', NULL, '{\"template_id\": 72}', 200, 3890, '2026-03-12 22:47:43', '2026-03-12 22:47:43'),
(165, 5, 'p_w10d1', 'wait', 'Wait 10 Days', NULL, '{\"delay_days\": 10}', 200, 4020, '2026-03-12 22:47:43', '2026-03-12 22:47:43'),
(166, 5, 'p_e6', 'send_email', 'Email 6 (Purchase)', NULL, '{\"template_id\": 73}', 200, 4150, '2026-03-12 22:47:43', '2026-03-12 22:47:43'),
(167, 5, 'p_w10d2', 'wait', 'Wait 10 Days', NULL, '{\"delay_days\": 10}', 200, 4280, '2026-03-12 22:47:43', '2026-03-12 22:47:43'),
(168, 5, 'p_e7', 'send_email', 'Email 7 (Purchase)', NULL, '{\"template_id\": 74}', 200, 4410, '2026-03-12 22:47:43', '2026-03-12 22:47:43'),
(169, 5, 'p_w15d1', 'wait', 'Wait 15 Days', NULL, '{\"delay_days\": 15}', 200, 4540, '2026-03-12 22:47:43', '2026-03-12 22:47:43'),
(170, 5, 'p_e8', 'send_email', 'Email 8 (Purchase)', NULL, '{\"template_id\": 75}', 200, 4670, '2026-03-12 22:47:43', '2026-03-12 22:47:43'),
(171, 5, 'p_w10d3', 'wait', 'Wait 10 Days', NULL, '{\"delay_days\": 10}', 200, 4800, '2026-03-12 22:47:43', '2026-03-12 22:47:43'),
(172, 5, 'p_e9', 'send_email', 'Email 9 (Purchase)', NULL, '{\"template_id\": 76}', 200, 4930, '2026-03-12 22:47:43', '2026-03-12 22:47:43'),
(173, 5, 'p_w15d2', 'wait', 'Wait 15 Days', NULL, '{\"delay_days\": 15}', 200, 5060, '2026-03-12 22:47:43', '2026-03-12 22:47:43'),
(174, 5, 'p_e10', 'send_email', 'Email 10 (Purchase)', NULL, '{\"template_id\": 77}', 200, 5190, '2026-03-12 22:47:43', '2026-03-12 22:47:43'),
(175, 5, 'p_e11', 'send_email', 'Email 11 Final (Purchase)', NULL, '{\"template_id\": 78}', 200, 5320, '2026-03-12 22:47:43', '2026-03-12 22:47:43'),
(176, 5, 'p_end', 'end', 'End – Purchase Sequence Complete', NULL, NULL, 200, 5450, '2026-03-12 22:47:43', '2026-03-12 22:47:43'),
(177, 5, 'r_s1', 'send_sms', 'SMS 1 (Refi)', NULL, '{\"template_id\": 56}', 800, 380, '2026-03-12 22:47:43', '2026-03-12 22:47:43'),
(178, 5, 'r_e1', 'send_email', 'Email 1 (Refi)', NULL, '{\"template_id\": 57}', 800, 510, '2026-03-12 22:47:43', '2026-03-12 22:47:43'),
(179, 5, 'r_w2d1', 'wait', 'Wait 2 Days', NULL, '{\"delay_days\": 2}', 800, 640, '2026-03-12 22:47:43', '2026-03-12 22:47:43'),
(180, 5, 'r_s2', 'send_sms', 'SMS 2 (Refi)', NULL, '{\"template_id\": 58}', 800, 770, '2026-03-12 22:47:43', '2026-03-12 22:47:43'),
(181, 5, 'r_w2d2', 'wait', 'Wait 2 Days', NULL, '{\"delay_days\": 2}', 800, 900, '2026-03-12 22:47:43', '2026-03-12 22:47:43'),
(182, 5, 'r_s3', 'send_sms', 'SMS 3 (Refi)', NULL, '{\"template_id\": 59}', 800, 1030, '2026-03-12 22:47:43', '2026-03-12 22:47:43'),
(183, 5, 'r_e2', 'send_email', 'Email 2 (Refi)', NULL, '{\"template_id\": 60}', 800, 1160, '2026-03-12 22:47:43', '2026-03-12 22:47:43'),
(184, 5, 'r_w2d3', 'wait', 'Wait 2 Days', NULL, '{\"delay_days\": 2}', 800, 1290, '2026-03-12 22:47:43', '2026-03-12 22:47:43'),
(185, 5, 'r_s4', 'send_sms', 'SMS 4 (Refi)', NULL, '{\"template_id\": 61}', 800, 1420, '2026-03-12 22:47:43', '2026-03-12 22:47:43'),
(186, 5, 'r_w3d1', 'wait', 'Wait 3 Days', NULL, '{\"delay_days\": 3}', 800, 1550, '2026-03-12 22:47:43', '2026-03-12 22:47:43'),
(187, 5, 'r_s5', 'send_sms', 'SMS 5 (Refi)', NULL, '{\"template_id\": 62}', 800, 1680, '2026-03-12 22:47:43', '2026-03-12 22:47:43'),
(188, 5, 'r_e3', 'send_email', 'Email 3 (Refi)', NULL, '{\"template_id\": 63}', 800, 1810, '2026-03-12 22:47:43', '2026-03-12 22:47:43'),
(189, 5, 'r_w3d2', 'wait', 'Wait 3 Days', NULL, '{\"delay_days\": 3}', 800, 1940, '2026-03-12 22:47:43', '2026-03-12 22:47:43'),
(190, 5, 'r_s6', 'send_sms', 'SMS 6 (Refi)', NULL, '{\"template_id\": 64}', 800, 2070, '2026-03-12 22:47:43', '2026-03-12 22:47:43'),
(191, 5, 'r_e4', 'send_email', 'Email 4 (Refi)', NULL, '{\"template_id\": 65}', 800, 2200, '2026-03-12 22:47:43', '2026-03-12 22:47:43'),
(192, 5, 'r_w3d3', 'wait', 'Wait 3 Days', NULL, '{\"delay_days\": 3}', 800, 2330, '2026-03-12 22:47:43', '2026-03-12 22:47:43'),
(193, 5, 'r_s7', 'send_sms', 'SMS 7 (Refi)', NULL, '{\"template_id\": 66}', 800, 2460, '2026-03-12 22:47:43', '2026-03-12 22:47:43'),
(194, 5, 'r_w2d4', 'wait', 'Wait 2 Days', NULL, '{\"delay_days\": 2}', 800, 2590, '2026-03-12 22:47:43', '2026-03-12 22:47:43'),
(195, 5, 'r_s8', 'send_sms', 'SMS 8 (Refi)', NULL, '{\"template_id\": 67}', 800, 2720, '2026-03-12 22:47:43', '2026-03-12 22:47:43'),
(196, 5, 'r_w2d5', 'wait', 'Wait 2 Days', NULL, '{\"delay_days\": 2}', 800, 2850, '2026-03-12 22:47:43', '2026-03-12 22:47:43'),
(197, 5, 'r_s9', 'send_sms', 'SMS 9 (Refi)', NULL, '{\"template_id\": 68}', 800, 2980, '2026-03-12 22:47:43', '2026-03-12 22:47:43'),
(198, 5, 'r_w2d6', 'wait', 'Wait 2 Days', NULL, '{\"delay_days\": 2}', 800, 3110, '2026-03-12 22:47:43', '2026-03-12 22:47:43'),
(199, 5, 'r_s10', 'send_sms', 'SMS 10 (Refi)', NULL, '{\"template_id\": 69}', 800, 3240, '2026-03-12 22:47:43', '2026-03-12 22:47:43'),
(200, 5, 'r_w2d7', 'wait', 'Wait 2 Days', NULL, '{\"delay_days\": 2}', 800, 3370, '2026-03-12 22:47:43', '2026-03-12 22:47:43'),
(201, 5, 'r_s11', 'send_sms', 'SMS 11 (Refi)', NULL, '{\"template_id\": 70}', 800, 3500, '2026-03-12 22:47:43', '2026-03-12 22:47:43'),
(202, 5, 'r_w5d1', 'wait', 'Wait 5 Days', NULL, '{\"delay_days\": 5}', 800, 3630, '2026-03-12 22:47:43', '2026-03-12 22:47:43'),
(203, 5, 'r_s12', 'send_sms', 'SMS 12 (Refi)', NULL, '{\"template_id\": 71}', 800, 3760, '2026-03-12 22:47:43', '2026-03-12 22:47:43'),
(204, 5, 'r_e5', 'send_email', 'Email 5 (Refi)', NULL, '{\"template_id\": 72}', 800, 3890, '2026-03-12 22:47:43', '2026-03-12 22:47:43'),
(205, 5, 'r_w10d1', 'wait', 'Wait 10 Days', NULL, '{\"delay_days\": 10}', 800, 4020, '2026-03-12 22:47:43', '2026-03-12 22:47:43'),
(206, 5, 'r_e6', 'send_email', 'Email 6 (Refi)', NULL, '{\"template_id\": 73}', 800, 4150, '2026-03-12 22:47:43', '2026-03-12 22:47:43'),
(207, 5, 'r_w10d2', 'wait', 'Wait 10 Days', NULL, '{\"delay_days\": 10}', 800, 4280, '2026-03-12 22:47:43', '2026-03-12 22:47:43'),
(208, 5, 'r_e7', 'send_email', 'Email 7 (Refi)', NULL, '{\"template_id\": 74}', 800, 4410, '2026-03-12 22:47:43', '2026-03-12 22:47:43'),
(209, 5, 'r_w15d1', 'wait', 'Wait 15 Days', NULL, '{\"delay_days\": 15}', 800, 4540, '2026-03-12 22:47:43', '2026-03-12 22:47:43'),
(210, 5, 'r_e8', 'send_email', 'Email 8 (Refi)', NULL, '{\"template_id\": 75}', 800, 4670, '2026-03-12 22:47:43', '2026-03-12 22:47:43'),
(211, 5, 'r_w10d3', 'wait', 'Wait 10 Days', NULL, '{\"delay_days\": 10}', 800, 4800, '2026-03-12 22:47:43', '2026-03-12 22:47:43'),
(212, 5, 'r_e9', 'send_email', 'Email 9 (Refi)', NULL, '{\"template_id\": 76}', 800, 4930, '2026-03-12 22:47:43', '2026-03-12 22:47:43'),
(213, 5, 'r_w15d2', 'wait', 'Wait 15 Days', NULL, '{\"delay_days\": 15}', 800, 5060, '2026-03-12 22:47:43', '2026-03-12 22:47:43'),
(214, 5, 'r_e10', 'send_email', 'Email 10 (Refi)', NULL, '{\"template_id\": 77}', 800, 5190, '2026-03-12 22:47:43', '2026-03-12 22:47:43'),
(215, 5, 'r_e11', 'send_email', 'Email 11 Final (Refi)', NULL, '{\"template_id\": 78}', 800, 5320, '2026-03-12 22:47:43', '2026-03-12 22:47:43'),
(216, 5, 'r_end', 'end', 'End – Refi Sequence Complete', NULL, NULL, 800, 5450, '2026-03-12 22:47:43', '2026-03-12 22:47:43'),
(217, 6, 'trigger', 'trigger', 'Under Contract/Loan Set Up Trigger', NULL, NULL, 500, 50, '2026-03-12 22:50:22', '2026-03-12 22:50:22'),
(218, 6, 'sms', 'send_sms', 'Welcome SMS', NULL, '{\"template_id\": 79}', 500, 200, '2026-03-12 22:50:22', '2026-03-12 22:50:22'),
(219, 6, 'email', 'send_email', 'Welcome Email', NULL, '{\"template_id\": 80}', 500, 330, '2026-03-12 22:50:22', '2026-03-12 22:50:22'),
(220, 6, 'end', 'end', 'End', NULL, NULL, 500, 460, '2026-03-12 22:50:22', '2026-03-12 22:50:22'),
(221, 7, 'trigger', 'trigger', 'Submitted to Underwriting Trigger', NULL, NULL, 500, 50, '2026-03-12 22:51:53', '2026-03-12 22:51:53'),
(222, 7, 'sms', 'send_sms', 'Underwriting SMS', NULL, '{\"template_id\": 81}', 500, 200, '2026-03-12 22:51:53', '2026-03-12 22:51:53'),
(223, 7, 'email', 'send_email', 'Underwriting Email', NULL, '{\"template_id\": 82}', 500, 330, '2026-03-12 22:51:53', '2026-03-12 22:51:53'),
(224, 7, 'end', 'end', 'End', NULL, NULL, 500, 460, '2026-03-12 22:51:53', '2026-03-12 22:51:53'),
(225, 8, 'trigger', 'trigger', 'Approved with Conditions Trigger', NULL, NULL, 500, 50, '2026-03-12 22:55:03', '2026-03-12 22:55:03'),
(226, 8, 'sms', 'send_sms', 'Client SMS', NULL, '{\"template_id\": 83}', 500, 200, '2026-03-12 22:55:03', '2026-03-12 22:55:03'),
(227, 8, 'email', 'send_email', 'Client Email', NULL, '{\"template_id\": 84}', 500, 330, '2026-03-12 22:55:03', '2026-03-12 22:55:03'),
(228, 8, 'notify_buyer', 'send_notification', 'Notify Buyer Agent (Internal)', NULL, '{\"subject\": \"[ACTION] Notify Buyer Agent — Loan Approved with Conditions\", \"template_id\": 85}', 500, 460, '2026-03-12 22:55:03', '2026-03-12 22:55:03'),
(229, 8, 'notify_listing', 'send_notification', 'Notify Listing Agent (Internal)', NULL, '{\"subject\": \"[ACTION] Notify Listing Agent — Loan Approved with Conditions\", \"template_id\": 86}', 500, 590, '2026-03-12 22:55:03', '2026-03-12 22:55:03'),
(230, 8, 'notify_title', 'send_notification', 'Notify Title Agent (Internal)', NULL, '{\"subject\": \"[ACTION] Notify Title Agent — Loan Approved with Conditions\", \"template_id\": 87}', 500, 720, '2026-03-12 22:55:03', '2026-03-12 22:55:03'),
(231, 8, 'end', 'end', 'End', NULL, NULL, 500, 850, '2026-03-12 22:55:03', '2026-03-12 22:55:03'),
(232, 9, 'trigger', 'trigger', 'Clear to Close Trigger', NULL, NULL, 500, 50, '2026-03-12 22:57:51', '2026-03-12 22:57:51'),
(233, 9, 'sms', 'send_sms', 'Shared CTC SMS', NULL, '{\"template_id\": 88}', 500, 200, '2026-03-12 22:57:51', '2026-03-12 22:57:51'),
(234, 9, 'branch', 'branch', 'Loan Type Branch', 'Routes to Purchase or Refi email', '{\"condition_type\": \"loan_type\"}', 500, 350, '2026-03-12 22:57:51', '2026-03-12 22:57:51'),
(235, 9, 'p_email', 'send_email', 'CTC Email (Purchase)', NULL, '{\"template_id\": 89}', 250, 500, '2026-03-12 22:57:51', '2026-03-12 22:57:51'),
(236, 9, 'r_email', 'send_email', 'CTC Email (Refi)', NULL, '{\"template_id\": 90}', 750, 500, '2026-03-12 22:57:51', '2026-03-12 22:57:51'),
(237, 9, 'p_end', 'end', 'End (Purchase)', NULL, NULL, 250, 630, '2026-03-12 22:57:51', '2026-03-12 22:57:51'),
(238, 9, 'r_end', 'end', 'End (Refi)', NULL, NULL, 750, 630, '2026-03-12 22:57:51', '2026-03-12 22:57:51'),
(239, 10, 'trigger', 'trigger', 'Loan Funded Trigger', NULL, NULL, 500, 50, '2026-03-12 23:02:15', '2026-03-12 23:02:15'),
(240, 10, 'branch', 'condition', 'Has Close Date?', 'Check if actual_close_date is set on the loan', '{\"field_name\": \"actual_close_date\", \"condition_type\": \"field_not_empty\"}', 500, 200, '2026-03-12 23:02:15', '2026-03-12 23:02:15'),
(241, 10, 'wait_close_date', 'wait_until_date', 'Wait Until Close Date', 'Waits until actual_close_date, then continues', '{\"date_field\": \"actual_close_date\"}', 250, 370, '2026-03-12 23:02:15', '2026-03-12 23:02:15'),
(242, 10, 'sms', 'send_sms', 'Funded Congratulations SMS', NULL, '{\"template_id\": 91}', 250, 500, '2026-03-12 23:02:15', '2026-03-12 23:02:15'),
(243, 10, 'email', 'send_email', 'Funded Congratulations Email', NULL, '{\"template_id\": 92}', 250, 630, '2026-03-12 23:02:15', '2026-03-12 23:02:15'),
(244, 10, 'end', 'end', 'End', NULL, NULL, 250, 760, '2026-03-12 23:02:15', '2026-03-12 23:02:15'),
(245, 10, 'end_no_date', 'end', 'End (No Close Date)', NULL, NULL, 750, 370, '2026-03-12 23:02:15', '2026-03-12 23:02:15');

-- --------------------------------------------------------

--
-- Table structure for table `scheduled_meetings`
--

CREATE TABLE `scheduled_meetings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) NOT NULL DEFAULT '1',
  `broker_id` int(11) DEFAULT NULL,
  `client_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `client_email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `client_phone` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `meeting_date` date NOT NULL,
  `meeting_time` time NOT NULL,
  `meeting_end_time` time NOT NULL,
  `meeting_type` enum('phone','video') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'phone',
  `jitsi_room_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Auto-generated unique Jitsi room name for video calls',
  `status` enum('pending','confirmed','cancelled','completed','no_show') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'confirmed',
  `notes` text COLLATE utf8mb4_unicode_ci COMMENT 'Notes from the client at booking time',
  `broker_notes` text COLLATE utf8mb4_unicode_ci COMMENT 'Private notes from the broker',
  `booking_token` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'UUID for client self-cancellation',
  `public_token` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Broker public_token used to make the booking (brokers.public_token)',
  `cancelled_reason` text COLLATE utf8mb4_unicode_ci,
  `cancelled_by` enum('client','broker') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cancelled_at` timestamp NULL DEFAULT NULL,
  `reminder_24h_sent_at` timestamp NULL DEFAULT NULL,
  `reminder_1h_sent_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `scheduler_availability`
--

CREATE TABLE `scheduler_availability` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) NOT NULL DEFAULT '1',
  `broker_id` int(11) NOT NULL,
  `day_of_week` tinyint(4) NOT NULL COMMENT '0=Sunday,1=Monday,...,6=Saturday',
  `start_time` time NOT NULL,
  `end_time` time NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `scheduler_availability`
--

INSERT INTO `scheduler_availability` (`id`, `tenant_id`, `broker_id`, `day_of_week`, `start_time`, `end_time`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 1, 1, 1, '09:00:00', '17:00:00', 1, '2026-03-20 19:48:14', '2026-03-20 19:48:14'),
(2, 1, 3, 1, '09:00:00', '17:00:00', 1, '2026-03-20 19:48:14', '2026-03-20 19:48:14'),
(3, 1, 4, 1, '09:00:00', '17:00:00', 1, '2026-03-20 19:48:14', '2026-03-20 19:48:14'),
(4, 2, 6, 1, '09:00:00', '17:00:00', 1, '2026-03-20 19:48:14', '2026-03-20 19:48:14'),
(5, 2, 7, 1, '09:00:00', '17:00:00', 1, '2026-03-20 19:48:14', '2026-03-20 19:48:14'),
(6, 1, 11, 1, '09:00:00', '17:00:00', 1, '2026-03-20 19:48:14', '2026-03-20 19:48:14'),
(7, 1, 12, 1, '09:00:00', '17:00:00', 1, '2026-03-20 19:48:14', '2026-03-20 19:48:14'),
(8, 1, 1, 2, '09:00:00', '17:00:00', 1, '2026-03-20 19:48:14', '2026-03-20 19:48:14'),
(9, 1, 3, 2, '09:00:00', '17:00:00', 1, '2026-03-20 19:48:14', '2026-03-20 19:48:14'),
(10, 1, 4, 2, '09:00:00', '17:00:00', 1, '2026-03-20 19:48:14', '2026-03-20 19:48:14'),
(11, 2, 6, 2, '09:00:00', '17:00:00', 1, '2026-03-20 19:48:14', '2026-03-20 19:48:14'),
(12, 2, 7, 2, '09:00:00', '17:00:00', 1, '2026-03-20 19:48:14', '2026-03-20 19:48:14'),
(13, 1, 11, 2, '09:00:00', '17:00:00', 1, '2026-03-20 19:48:14', '2026-03-20 19:48:14'),
(14, 1, 12, 2, '09:00:00', '17:00:00', 1, '2026-03-20 19:48:14', '2026-03-20 19:48:14'),
(15, 1, 1, 3, '09:00:00', '17:00:00', 1, '2026-03-20 19:48:14', '2026-03-20 19:48:14'),
(16, 1, 3, 3, '09:00:00', '17:00:00', 1, '2026-03-20 19:48:14', '2026-03-20 19:48:14'),
(17, 1, 4, 3, '09:00:00', '17:00:00', 1, '2026-03-20 19:48:14', '2026-03-20 19:48:14'),
(18, 2, 6, 3, '09:00:00', '17:00:00', 1, '2026-03-20 19:48:14', '2026-03-20 19:48:14'),
(19, 2, 7, 3, '09:00:00', '17:00:00', 1, '2026-03-20 19:48:14', '2026-03-20 19:48:14'),
(20, 1, 11, 3, '09:00:00', '17:00:00', 1, '2026-03-20 19:48:14', '2026-03-20 19:48:14'),
(21, 1, 12, 3, '09:00:00', '17:00:00', 1, '2026-03-20 19:48:14', '2026-03-20 19:48:14'),
(22, 1, 1, 4, '09:00:00', '17:00:00', 1, '2026-03-20 19:48:14', '2026-03-20 19:48:14'),
(23, 1, 3, 4, '09:00:00', '17:00:00', 1, '2026-03-20 19:48:14', '2026-03-20 19:48:14'),
(24, 1, 4, 4, '09:00:00', '17:00:00', 1, '2026-03-20 19:48:14', '2026-03-20 19:48:14'),
(25, 2, 6, 4, '09:00:00', '17:00:00', 1, '2026-03-20 19:48:14', '2026-03-20 19:48:14'),
(26, 2, 7, 4, '09:00:00', '17:00:00', 1, '2026-03-20 19:48:14', '2026-03-20 19:48:14'),
(27, 1, 11, 4, '09:00:00', '17:00:00', 1, '2026-03-20 19:48:14', '2026-03-20 19:48:14'),
(28, 1, 12, 4, '09:00:00', '17:00:00', 1, '2026-03-20 19:48:14', '2026-03-20 19:48:14'),
(29, 1, 1, 5, '09:00:00', '17:00:00', 1, '2026-03-20 19:48:14', '2026-03-20 19:48:14'),
(30, 1, 3, 5, '09:00:00', '17:00:00', 1, '2026-03-20 19:48:14', '2026-03-20 19:48:14'),
(31, 1, 4, 5, '09:00:00', '17:00:00', 1, '2026-03-20 19:48:14', '2026-03-20 19:48:14'),
(32, 2, 6, 5, '09:00:00', '17:00:00', 1, '2026-03-20 19:48:14', '2026-03-20 19:48:14'),
(33, 2, 7, 5, '09:00:00', '17:00:00', 1, '2026-03-20 19:48:14', '2026-03-20 19:48:14'),
(34, 1, 11, 5, '09:00:00', '17:00:00', 1, '2026-03-20 19:48:14', '2026-03-20 19:48:14'),
(35, 1, 12, 5, '09:00:00', '17:00:00', 1, '2026-03-20 19:48:14', '2026-03-20 19:48:14');

-- --------------------------------------------------------

--
-- Table structure for table `scheduler_settings`
--

CREATE TABLE `scheduler_settings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) NOT NULL DEFAULT '1',
  `broker_id` int(11) NOT NULL,
  `is_enabled` tinyint(1) NOT NULL DEFAULT '1',
  `meeting_title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Mortgage Consultation',
  `meeting_description` text COLLATE utf8mb4_unicode_ci,
  `slot_duration_minutes` int(11) NOT NULL DEFAULT '30',
  `buffer_time_minutes` int(11) NOT NULL DEFAULT '15',
  `advance_booking_days` int(11) NOT NULL DEFAULT '30',
  `min_booking_hours` int(11) NOT NULL DEFAULT '2',
  `timezone` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'America/Chicago',
  `allow_phone` tinyint(1) NOT NULL DEFAULT '1',
  `allow_video` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `scheduler_settings`
--

INSERT INTO `scheduler_settings` (`id`, `tenant_id`, `broker_id`, `is_enabled`, `meeting_title`, `meeting_description`, `slot_duration_minutes`, `buffer_time_minutes`, `advance_booking_days`, `min_booking_hours`, `timezone`, `allow_phone`, `allow_video`, `created_at`, `updated_at`) VALUES
(1, 1, 1, 1, 'Mortgage Consultation', 'Schedule a free consultation with our mortgage expert. We\'ll discuss your goals and walk you through your best loan options.', 30, 15, 30, 2, 'America/Chicago', 1, 1, '2026-03-20 19:48:14', '2026-03-20 19:48:14'),
(2, 1, 3, 1, 'Mortgage Consultation', 'Schedule a free consultation with our mortgage expert. We\'ll discuss your goals and walk you through your best loan options.', 30, 15, 30, 2, 'America/Chicago', 1, 1, '2026-03-20 19:48:14', '2026-03-20 19:48:14'),
(3, 1, 4, 1, 'Mortgage Consultation', 'Schedule a free consultation with our mortgage expert. We\'ll discuss your goals and walk you through your best loan options.', 30, 15, 30, 2, 'America/Chicago', 1, 1, '2026-03-20 19:48:14', '2026-03-20 19:48:14'),
(4, 2, 6, 1, 'Mortgage Consultation', 'Schedule a free consultation with our mortgage expert. We\'ll discuss your goals and walk you through your best loan options.', 30, 15, 30, 2, 'America/Chicago', 1, 1, '2026-03-20 19:48:14', '2026-03-20 19:48:14'),
(5, 2, 7, 1, 'Mortgage Consultation', 'Schedule a free consultation with our mortgage expert. We\'ll discuss your goals and walk you through your best loan options.', 30, 15, 30, 2, 'America/Chicago', 1, 1, '2026-03-20 19:48:14', '2026-03-20 19:48:14'),
(6, 1, 11, 1, 'Mortgage Consultation', 'Schedule a free consultation with our mortgage expert. We\'ll discuss your goals and walk you through your best loan options.', 30, 15, 30, 2, 'America/Chicago', 1, 1, '2026-03-20 19:48:14', '2026-03-20 19:48:14'),
(7, 1, 12, 1, 'Mortgage Consultation', 'Schedule a free consultation with our mortgage expert. We\'ll discuss your goals and walk you through your best loan options.', 30, 15, 30, 2, 'America/Chicago', 1, 1, '2026-03-20 19:48:14', '2026-03-20 19:48:14');

-- --------------------------------------------------------

--
-- Table structure for table `system_settings`
--

CREATE TABLE `system_settings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) DEFAULT NULL,
  `setting_key` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `setting_value` text COLLATE utf8mb4_unicode_ci,
  `setting_type` enum('string','number','boolean','json') COLLATE utf8mb4_unicode_ci DEFAULT 'string',
  `description` text COLLATE utf8mb4_unicode_ci,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `system_settings`
--

INSERT INTO `system_settings` (`id`, `tenant_id`, `setting_key`, `setting_value`, `setting_type`, `description`, `updated_at`) VALUES
(1, 1, 'company_name', 'Encore Mortgage', 'string', 'Company name', '2026-02-26 22:37:43'),
(2, 1, 'support_email', 'support@example.com', 'string', 'Support email address', '2026-02-02 14:24:22'),
(3, 1, 'max_file_upload_mb', '10', 'number', 'Maximum file upload size in MB', '2026-02-02 14:24:22'),
(4, 1, 'enable_sms', 'true', 'boolean', 'Enable SMS notifications', '2026-02-02 14:24:22'),
(5, 1, 'enable_email', 'true', 'boolean', 'Enable email notifications', '2026-02-02 14:24:22'),
(6, 1, 'company_logo_url', '', 'string', 'URL to company logo displayed in pre-approval letters', '2026-02-26 22:13:34'),
(7, 1, 'company_address', '', 'string', 'Company address displayed in pre-approval letters', '2026-02-26 22:13:34'),
(8, 1, 'company_phone', '5623370000', 'string', 'Company phone displayed in pre-approval letters', '2026-02-28 23:15:03'),
(9, 1, 'company_nmls', '1105497', 'string', 'Company NMLS license number for pre-approval letters', '2026-02-28 23:14:10'),
(11, 1, 'pre_approval_default_template', '<div style=\"font-family: Arial, Helvetica, sans-serif; max-width: 750px; margin: 0 auto; padding: 48px; background: #fff; color: #222;\">\r\n\r\n  <table style=\"width: 100%; margin-bottom: 20px; border-collapse: collapse;\">\r\n    <tr>\r\n      <td style=\"vertical-align: top; width: 55%;\">{{COMPANY_LOGO}}</td>\r\n      <td style=\"vertical-align: top; text-align: right; font-size: 13px; color: #333; line-height: 1.8;\">\r\n        <strong>{{COMPANY_NAME}}</strong><br>P. {{COMPANY_PHONE}}<br>NMLS# {{COMPANY_NMLS}}\r\n      </td>\r\n    </tr>\r\n  </table>\r\n\r\n  <hr style=\"border: none; border-top: 1px solid #ccc; margin-bottom: 20px;\">\r\n\r\n  <table style=\"width: 100%; margin-bottom: 20px; border-collapse: collapse;\">\r\n    <tr>\r\n      <td style=\"font-size: 13px;\">Date: {{LETTER_DATE}}</td>\r\n      <td style=\"font-size: 13px; text-align: right;\">Expires: {{EXPIRES_SHORT}}</td>\r\n    </tr>\r\n  </table>\r\n\r\n  <p style=\"margin: 0 0 20px; font-size: 13px;\">Re: {{CLIENT_FULL_NAME}}</p>\r\n  <hr style=\"border: none; border-top: 1px solid #ccc; margin-bottom: 20px;\">\r\n\r\n  <p style=\"margin: 0 0 16px; font-size: 13px; line-height: 1.7;\">This letter shall serve as a pre-approval for a loan in connection with the purchase transaction for the above referenced buyer(s). Based on preliminary information, a pre-approval is herein granted with the following terms:</p>\r\n\r\n  <p style=\"margin: 0 0 5px; font-size: 13px;\">Purchase Price: {{APPROVED_AMOUNT}}</p>\r\n  <p style=\"margin: 0 0 5px; font-size: 13px;\">Loan Type: </p>\r\n  <p style=\"margin: 0 0 5px; font-size: 13px;\">Term: 30 years</p>\r\n  <p style=\"margin: 0 0 5px; font-size: 13px;\">FICO Score: </p>\r\n  <p style=\"margin: 0 0 20px; font-size: 13px;\">Property Address: {{PROPERTY_ADDRESS}}</p>\r\n\r\n  <p style=\"margin: 0 0 8px; font-size: 13px;\"><strong>We have reviewed the following:</strong></p>\r\n  <ul style=\"margin: 0 0 20px; padding-left: 24px; font-size: 13px; line-height: 1.9;\">\r\n    <li>Reviewed applicant&#39;s credit report and credit score</li>\r\n    <li>Verified applicant&#39;s income documentation and debt to income ratio</li>\r\n    <li>Verified applicant&#39;s assets documentation</li>\r\n  </ul>\r\n\r\n  <p style=\"margin: 0 0 20px; font-size: 13px; line-height: 1.7;\">Disclaimer: <strong>Loan Contingency.</strong> Even though a buyer may hold a pre-approval letter, further investigations concerning the property or the borrower could result in a loan denial. We suggest the buyer consider a loan contingency requirement in the purchase contract (to protect earnest money deposit) in accordance with applicable state law.</p>\r\n\r\n  <p style=\"margin: 0 0 32px; font-size: 13px;\">Realtor Partner: </p>\r\n\r\n  <table style=\"width: 100%; border-collapse: collapse;\">\r\n    <tr>\r\n      <td style=\"vertical-align: top; width: 100px;\">{{BROKER_PHOTO}}</td>\r\n      <td style=\"vertical-align: top; padding-left: 16px; font-size: 13px; line-height: 1.7;\">\r\n        <p style=\"margin: 0 0 3px;\"><strong>{{BROKER_FULL_NAME}}</strong></p>\r\n        <p style=\"margin: 0 0 3px; color: #444;\">Mortgage Banker</p>\r\n        <p style=\"margin: 0 0 3px; color: #444;\">{{BROKER_LICENSE}}</p>\r\n        <p style=\"margin: 0 0 3px; color: #444;\">{{COMPANY_NAME}}</p>\r\n        <p style=\"margin: 0 0 3px; color: #444;\">{{BROKER_PHONE}}</p>\r\n        <p style=\"margin: 0; color: #444;\">{{BROKER_EMAIL}}</p>\r\n      </td>\r\n    </tr>\r\n  </table>\r\n\r\n</div>', 'string', 'Default HTML template for pre-approval letters — matches Encore Mortgage letter format', '2026-02-26 22:13:35'),
(12, 1, 'pre_approval_require_all_tasks', 'false', 'string', NULL, '2026-03-05 13:52:59'),
(30002, 1, 'voice_greeting', '', 'string', 'Text-to-speech greeting played when someone calls the CRM. Leave empty to skip greeting.', '2026-04-08 19:26:00');

-- --------------------------------------------------------

--
-- Table structure for table `tasks`
--

CREATE TABLE `tasks` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) NOT NULL DEFAULT '1',
  `template_id` int(11) DEFAULT NULL COMMENT 'References task_template if created from template',
  `order_index` int(11) DEFAULT '0' COMMENT 'Order in loan workflow (copied from template)',
  `application_id` int(11) DEFAULT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `task_type` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Matches task_template.task_type',
  `status` enum('pending','in_progress','completed','pending_approval','approved','reopened','cancelled','overdue') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `priority` enum('low','medium','high','urgent') COLLATE utf8mb4_unicode_ci DEFAULT 'medium',
  `assigned_to_user_id` int(11) DEFAULT NULL,
  `assigned_to_broker_id` int(11) DEFAULT NULL,
  `created_by_broker_id` int(11) DEFAULT NULL,
  `due_date` datetime DEFAULT NULL,
  `completed_at` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `form_completed` tinyint(1) DEFAULT '0' COMMENT 'Whether custom form is completed',
  `form_completed_at` datetime DEFAULT NULL COMMENT 'When form was completed',
  `documents_uploaded` tinyint(1) DEFAULT '0' COMMENT 'Whether required documents are uploaded',
  `documents_verified` tinyint(1) DEFAULT '0' COMMENT 'Whether uploaded documents are verified by broker',
  `approval_status` enum('pending','approved','rejected') COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Approval status by broker/admin',
  `approved_by_broker_id` int(11) DEFAULT NULL COMMENT 'Broker who approved the task',
  `approved_at` datetime DEFAULT NULL COMMENT 'When task was approved',
  `reopened_by_broker_id` int(11) DEFAULT NULL COMMENT 'Broker who reopened the task',
  `reopened_at` datetime DEFAULT NULL COMMENT 'When task was reopened',
  `reopen_reason` text COLLATE utf8mb4_unicode_ci COMMENT 'Reason for reopening task',
  `status_change_reason` text COLLATE utf8mb4_unicode_ci COMMENT 'Reason/comment for manual status changes',
  `status_changed_by_broker_id` int(11) DEFAULT NULL COMMENT 'Broker who manually changed status',
  `status_changed_at` datetime DEFAULT NULL COMMENT 'When status was manually changed'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `tasks`
--

INSERT INTO `tasks` (`id`, `tenant_id`, `template_id`, `order_index`, `application_id`, `title`, `description`, `task_type`, `status`, `priority`, `assigned_to_user_id`, `assigned_to_broker_id`, `created_by_broker_id`, `due_date`, `completed_at`, `created_at`, `updated_at`, `form_completed`, `form_completed_at`, `documents_uploaded`, `documents_verified`, `approval_status`, `approved_by_broker_id`, `approved_at`, `reopened_by_broker_id`, `reopened_at`, `reopen_reason`, `status_change_reason`, `status_changed_by_broker_id`, `status_changed_at`) VALUES
(23, 2, NULL, 0, 15, 'INE Document Verification', '', 'document_verification', 'pending', 'medium', 14, NULL, 6, '2026-02-14 21:03:42', NULL, '2026-02-11 21:03:41', '2026-02-11 21:03:41', 0, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `task_documents`
--

CREATE TABLE `task_documents` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `task_id` int(11) NOT NULL,
  `field_id` int(11) DEFAULT NULL COMMENT 'Associated form field if uploaded via form',
  `document_type` enum('pdf','image') COLLATE utf8mb4_unicode_ci NOT NULL,
  `filename` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `original_filename` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_path` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Path on external server',
  `file_size` bigint(20) DEFAULT NULL COMMENT 'File size in bytes',
  `uploaded_by_user_id` int(11) DEFAULT NULL,
  `uploaded_by_broker_id` int(11) DEFAULT NULL,
  `uploaded_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `notes` text COLLATE utf8mb4_unicode_ci
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Document attachments for tasks';

-- --------------------------------------------------------

--
-- Table structure for table `task_form_fields`
--

CREATE TABLE `task_form_fields` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `task_template_id` int(11) NOT NULL,
  `field_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Field name (e.g., license_number)',
  `field_label` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Display label',
  `field_type` enum('text','number','email','phone','date','textarea','file_pdf','file_image','select','checkbox') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'text',
  `field_options` json DEFAULT NULL COMMENT 'Options for select fields',
  `is_required` tinyint(1) DEFAULT '1',
  `placeholder` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `validation_rules` json DEFAULT NULL COMMENT 'Validation rules (min, max, pattern, etc)',
  `order_index` int(11) DEFAULT '0',
  `help_text` text COLLATE utf8mb4_unicode_ci COMMENT 'Helper text shown below field',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Custom form fields for task templates';

--
-- Dumping data for table `task_form_fields`
--

INSERT INTO `task_form_fields` (`id`, `task_template_id`, `field_name`, `field_label`, `field_type`, `field_options`, `is_required`, `placeholder`, `validation_rules`, `order_index`, `help_text`, `created_at`) VALUES
(35, 34, 'document_upload', 'Attach Document', 'file_pdf', NULL, 1, NULL, NULL, 0, 'Attach a clear photo or scan of your valid government-issued ID (passport, driver license, state ID, etc.).', '2026-02-26 18:03:40'),
(36, 35, 'document_upload', 'Attach Document', 'file_pdf', NULL, 1, NULL, NULL, 0, 'Attach a clear photo or scan of your valid driver\'s license (front and back).', '2026-02-26 18:03:40'),
(37, 36, 'document_upload', 'Attach Document', 'file_pdf', NULL, 1, NULL, NULL, 0, 'Attach a clear photo or scan of your valid Green Card (front and back).', '2026-02-26 18:03:40'),
(38, 37, 'document_upload', 'Attach Document', 'file_pdf', NULL, 1, NULL, NULL, 0, 'Attach a clear photo or scan of your Social Security card. Make sure the number is clearly visible.', '2026-02-26 18:03:40'),
(39, 38, 'document_upload', 'Attach Document', 'file_pdf', NULL, 1, NULL, NULL, 0, 'Attach the last two months of bank or mortgage statements. They must clearly show the account holder name, partial account number, and housing payment transactions.', '2026-02-26 18:03:40'),
(40, 39, 'document_upload', 'Attach Document', 'file_pdf', NULL, 1, NULL, NULL, 0, 'Attach the active homeowner\'s insurance policy. It must include the policy number, coverage details, insured name, and effective dates.', '2026-02-26 18:03:40'),
(41, 40, 'document_upload', 'Attach Document', 'file_pdf', NULL, 1, NULL, NULL, 0, 'Attach all W-2 forms from the most recent tax year. If you have multiple employers, include the W-2 from each one.', '2026-02-26 18:03:40'),
(42, 41, 'document_upload', 'Attach Document', 'file_pdf', NULL, 1, NULL, NULL, 0, 'Attach all 1099 forms (1099-MISC, 1099-NEC, 1099-INT, etc.) for the last two tax years. Include all issuers.', '2026-02-26 18:03:40'),
(43, 42, 'document_upload', 'Attach Document', 'file_pdf', NULL, 1, NULL, NULL, 0, 'Attach complete and signed IRS Form 1040 with all schedules (Schedule C, E, etc.) for the last two tax years.', '2026-02-26 18:03:40'),
(44, 43, 'document_upload', 'Attach Document', 'file_pdf', NULL, 1, NULL, NULL, 0, 'Attach a copy of your valid business license, DBA registration, or LLC/corporation certificate.', '2026-02-26 18:03:40'),
(45, 44, 'document_upload', 'Attach Document', 'file_pdf', NULL, 1, NULL, NULL, 0, 'Attach a YTD profit & loss statement prepared by a CPA or bookkeeper. Must include revenue, expenses, and net income.', '2026-02-26 18:03:40'),
(46, 45, 'document_upload', 'Attach Document', 'file_pdf', NULL, 1, NULL, NULL, 0, 'Attach the last 3 months of all business bank statements. Must show account holder name, account number (partial), and all transactions.', '2026-02-26 18:03:40'),
(47, 46, 'document_upload', 'Attach Document', 'file_pdf', NULL, 1, NULL, NULL, 0, 'Attach the last 2 months of all investment, brokerage, or retirement account statements (401k, IRA, etc.).', '2026-02-26 18:03:40'),
(48, 47, 'document_upload', 'Attach Document', 'file_pdf', NULL, 1, NULL, NULL, 0, 'Attach the most recent pension or retirement award/benefit letter. It must show the monthly payment amount and the issuing organization.', '2026-02-26 18:03:40'),
(49, 48, 'document_upload', 'Attach Document', 'file_pdf', NULL, 1, NULL, NULL, 0, 'Attach your most recent Social Security award letter showing your monthly benefit amount. You can obtain it from ssa.gov.', '2026-02-26 18:03:40'),
(50, 49, 'document_upload', 'Attach Document', 'file_pdf', NULL, 1, NULL, NULL, 0, 'Attach a clear copy of your valid visa, I-94 Arrival/Departure Record, Employment Authorization Document (EAD), or other immigration status document.', '2026-02-26 18:03:40'),
(51, 50, 'document_upload', 'Attach Document', 'file_pdf', NULL, 1, NULL, NULL, 0, 'Attach your IRS ITIN assignment letter (Notice CP565) showing your Individual Taxpayer Identification Number.', '2026-02-26 18:03:40'),
(52, 51, 'document_upload', 'Attach Document', 'file_pdf', NULL, 1, NULL, NULL, 0, 'Attach your most recent mortgage statement showing the current balance, monthly payment, and lender information.', '2026-02-26 18:03:40'),
(53, 52, 'document_upload', 'Attach Document', 'file_pdf', NULL, 1, NULL, NULL, 0, 'Attach the most recent property tax assessment or bill from your county/city assessor.', '2026-02-26 18:03:40'),
(54, 53, 'document_upload', 'Attach Document', 'file_pdf', NULL, 1, NULL, NULL, 0, 'Attach the signed purchase agreement (sales contract) including all addenda and counteroffers.', '2026-02-26 18:03:40'),
(55, 54, 'document_upload', 'Attach Document', 'file_pdf', NULL, 1, NULL, NULL, 0, 'Attach the architectural/engineering plans for the construction project and the signed builder contract including total cost breakdown.', '2026-02-26 18:03:40'),
(56, 55, 'document_upload', 'Attach Document', 'file_pdf', NULL, 1, NULL, NULL, 0, 'Attach the current HOA dues statement and the master/blanket insurance policy (hazard + liability) for the condo association.', '2026-02-26 18:03:40'),
(57, 56, 'document_upload', 'Attach Document', 'file_pdf', NULL, 1, NULL, NULL, 0, 'Attach all signed lease agreements currently in effect for each rental unit in the property. Include lease start/end dates and monthly rent amounts.', '2026-02-26 18:03:40'),
(58, 57, 'document_upload', 'Attach Document', 'file_pdf', NULL, 1, NULL, NULL, 0, 'Attach the last 2 years of income statements and balance sheets for the business operating at or owning the commercial property. CPA-prepared preferred.', '2026-02-26 18:03:40'),
(66, 58, 'document_upload', 'Attach Document', 'file_pdf', NULL, 1, NULL, NULL, 0, 'Attach the last two months of all bank account statements. Must show account holder name, partial account number, and all transactions.', '2026-03-04 20:24:14'),
(67, 59, 'document_upload', 'Attach Document', 'file_pdf', NULL, 1, NULL, NULL, 0, 'Attach your most recent consecutive pay stubs covering at least one month. Must show employer name, gross pay, deductions, and year-to-date totals.', '2026-03-04 20:24:14'),
(68, 60, 'document_upload', 'Attach Document', 'file_pdf', NULL, 1, NULL, NULL, 0, 'Attach your complete and signed federal tax returns (Form 1040) or Schedule C for the last two tax years. Include all schedules and attachments.', '2026-03-04 20:24:14'),
(69, 61, 'document_upload', 'Attach Document', 'file_pdf', NULL, 1, NULL, NULL, 0, 'Attach your most recent mortgage statement showing outstanding balance, monthly payment, lender name, and property address.', '2026-03-04 20:24:14'),
(70, 62, 'document_upload', 'Attach Document', 'file_pdf', NULL, 1, NULL, NULL, 0, 'Attach the current insurance policy (declaration page). Must include policy number, coverage amounts, property address, named insured, and effective dates.', '2026-03-04 20:24:14'),
(71, 63, 'document_upload', 'Attach Document', 'file_pdf', NULL, 1, NULL, NULL, 0, 'Attach your most recent mortgage statement or an official payoff letter from your lender. Must show current balance, monthly payment, and lender contact information.', '2026-03-04 20:24:14');

-- --------------------------------------------------------

--
-- Table structure for table `task_form_responses`
--

CREATE TABLE `task_form_responses` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `task_id` int(11) NOT NULL,
  `field_id` int(11) NOT NULL,
  `field_value` text COLLATE utf8mb4_unicode_ci COMMENT 'Text value for non-file fields',
  `submitted_by_user_id` int(11) DEFAULT NULL,
  `submitted_by_broker_id` int(11) DEFAULT NULL,
  `submitted_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Submitted responses for task form fields';

-- --------------------------------------------------------

--
-- Table structure for table `task_signatures`
--

CREATE TABLE `task_signatures` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) NOT NULL DEFAULT '1',
  `task_id` int(11) NOT NULL COMMENT 'References tasks.id (task instance)',
  `sign_document_id` int(11) NOT NULL COMMENT 'References task_sign_documents.id',
  `zone_id` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Zone identifier from signature_zones JSON',
  `signature_data` longtext COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Base64 encoded PNG from signature canvas',
  `signed_by_user_id` int(11) DEFAULT NULL COMMENT 'Client user who signed',
  `signed_at` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Client signature responses for document signing tasks';

--
-- Dumping data for table `task_signatures`
--

INSERT INTO `task_signatures` (`id`, `tenant_id`, `task_id`, `sign_document_id`, `zone_id`, `signature_data`, `signed_by_user_id`, `signed_at`) VALUES
(1, 1, 30, 1, 'zone_1771724626618', 'data:image/png;base64,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', 18, '2026-02-21 20:10:26'),
(2, 1, 35, 2, 'zone_1771892195218', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAcIAAAC0CAYAAAAHFCwtAAAQAElEQVR4AeydTbLcxnKFAa7CI5GO8OBRo/fGYoTIlUheCcWV2FoJ74sQPX1vJHrgCIuaeBeE8wC3mmg0/gr1l1l1GLe60QCqKvPLQp4qNHjvi47/SMAYgd6YvTSXBEhANwEKoe740LoVAsPKPu4qTICzk8IBYPchBCiEIfSs1aW9JJCKwM7shBqZCjrbjUWgHSFUfjUqN29nvNm1fMcpHopIYEcjI/bCpkjgOoF2hFD51ajcvJ0RZtfyHadqOEQfSIAEThJoRwhPAuFpgQS4QAwEyOokQAK5CRgSQmbY3IPjUn9cIE7YOFwnDnzNQ4C9BBEwJITtZNjVHLq6Myj2rJySQDvD9TxFjuHzrHhmVgKGhDArl6KdrebQ1Z1FzWTnJOBHgGP4JC/OGE6CinaaMSGM5jcbIoGGCDCx2gq2rRlDDaMrihDWAMLWhUJrScCHgK3E6uMZzy1PoIbRFUUIawBRfjjRgiUBfiYBEiCBHASiCOFkKNeFEwdbr4ya/ngxRvpjVLeF9Y/ARyG87DPXhUUuhsvxmqxl1CYOml/biJHmCLRuW/0j8FEI6/e5rlHNeNUVT3pDAlYJBE7KS7r9KIQlrWHfJEACJEACOgj4CpvHpFyHg9+sSCSEvgS/GcQtEiABywR47VuO3p3thoXtzo8THxIJYUMET0DmKSTQDgFb1z5lu5GReRDoRELYCNwjN3mcBEhANYF92T7Inqo9o3F3BPYD3VUghBysdwHnBxIggUgEDrJnjF6YvmJQDG6jAiHMMFiDMbOBBgjQRRLwJ6AwfaXT5nQt+4O/r1GBEN47dPdJL/c7M/mBBEiABLQQUKjNydHULYQtRjT5kFl2wNnGkgg/N0CALl4goDchVyCETMSHIzIpIr2D+5ALTyABEiABIRAuhEmTrFh4+MNETESHBHgCCZAACWwSOBDCzXrfDlCHvrHgFglUQaD47LYKiiqcaCSUoW6GC6GKaNMIEiCBeAQ4u43HsnBLjYQy1E0KYeFxqql7W7aEzgFteUtrSYAE0hGgEKZjy5aTEgidAyY1jo2TAAkYIkAhNBQsmlo3gbxr3LpZ0jsS8CFAIfShxXNJICEB/WtcSnXC8LPpggQohAXhs2sSsEVAv1Tb4pnPWva0T4BCuM+HRysmwPVNxcGlazsEOPKXcAoKIYOxDMb9Z/K55xH/E9c38ZmqbJGX0iIsHPkLICX/DFNgMNYG99I7zZ8P7Q/ko9l32kYCOQlEvJQOL9ucfrGvaAQKrggDfYg4uAMtuVbduv3XvGYtEjBNIM9lS7n1HSShxOwKoS8pnl8bAfpDApUSyCO3NcELJUYhrGk00BcSaIFA6PS/BUb00YsAhdAL19bJvDK3yNSxn/EtHse5AaHT/3lb3FZAoPz1RSGMMgx4ZUbBqLYRxldtaGhYBQTKX18UwgqGEV0gAesEyq8JrBOsyv7szlAIYyHnlRyLJNtpkED5NUGD0OnyjQCF8IYicINXciBAVs9PgLO3/MxP9sjQnAQV5zQKYRyOl1phJRIoS4Czt7L8d3pnaHbgxD9EIbzAlJO1C9BYJToBjsPoSNlgowQohBcCz8naBWjNV4kPgOMwPtO8LXIqk5f3dm8Uwm02PEICJEACCQlwKrMFN/cUgUK4FQnuJwESIIGLBFgtjEDuKUJxIcyt/GHhYW0SIAESIIHaCBQXwtzKX1sA6Q8JmCewMxveOWTe7XMOkMA5TmFnhQlhWN+sXQUBXqhVhLGkEzuz4Z1DJS3O2DcJ5IBNIcxBueo+eKFWHd7CznGaVTgAAd37xs73/ADTHqpSCB+QcMcGAe4mgewEOM3Kjjxah76x8z0/mqHSEIVQIPCHBEiABEigXQKZhbDk4rfdINNzEvAmwAqJCDAHJgIb1Ow1Ibwcy5KL3yBOrEwCJEACEQgwB0aAGL2Ja0JoNJaX9Ts6djaYkwDjnpM2+zJIoHmTrwmhWmyLlLf4aFS/1dK2YljLcV9cAlZCRjtJICuByoRwkfIWH7OSZWckoIAALwEFQaAJ6glUJoT7vHmUBEjgAgEuKy9AYxVLBCiElqJVqa3Z8my2jioLFJeVlQWU7iwJUAiXRPg5O4E0eXbFjWwdrfTNXSRAAmoJUAjVhoaGkQAJkEBBAg3dQTEqhA1FqOB10GTXHFomw06jExBo6A6KUSFsKEIJxjeb3CHAobUDR8MhzlQ0RKE2G4wKYW1hoD8kQALnCNQxU6Gcn4v2+lnx91II4zNliyRAAiSwS6AOOd910dRBCqGpcNHYJQHOrJdE+JkESMCXAIXQl1i+8w32lF+W1M6s86MwOF5osi4C7Q5a00L48vUPH7/7/s0vugZTy9aolaX8QSGK/Mwb7DGudLU7aM0KIQRQwva2G4b3r/7y5m2KayDuIEthIdv0InAY0MMTvLrzOrm1k4k6SsQlB0Zpp/VGzAphjsBxkOWgvNFHikR5GNDDEzaMrXx3kVhMTFN0PbXMV20ESsa6CiH8479/e9IWVNoTSCBQk0peVIGe66seGIsQhwp2HWL2UV0eXyFQMtZ2hVBuia6w5C4SGAmUvKhGA/giBDgdEQj8MUDApBDi+0HHVi41rgYdDCvvEjQrptLOEAJnpiMcDCGEbdXVG+ukQpgjSEPf/z1HPyF96A1/iFc+dRcEzuRHn+Z5rmECHAyGg+dput5YmxTCfhh+dBF48bVTvyLUG/4u079YBBaCmsl6dkMCJFA3ARFCe8lF0mqS/y5Rd6hTe5ejfYl8jm7YBwmQQNfZk4bu6j8RQlvJZfl/Bod+eH/VedYjARIgARLYIGBLGjacOLdbhPDciVrPkli90mpbMrsamqklY8iGgwiwMgnURCCzEEoGl5/IAF8tV4mR29fXnKi/PqNqtij+oK2ZFn0jAWsEMguhZHD5iQ3p64uu6e8Mmaa7xP8SDNrEFrN5EohHoP6WMgthOFD8FhlJ/HdPis6fIg3vwV4LZ9K0MLPnGC3eJsCAbrPhERLwJGBOCNf8EyF4qz8vlLVQGK2h4z5jBG6jKGNA8dUDSjlUN6/LmWCgZ1K6HiSTQtgP/Yelyy/D/wLFssnInzNmrsiWszk9BFKPIggeCn570/hnzl7/MHzth48o2F+GRGqvy3gVu1dSuk7UpBBedxc1OW8CBRYjBDIMVwjcUvTw580ksbrv3v8ArRq+i7/52uLfMc0wljBOHkqpfh8M2d5hUgjxPeHSpfP/n1Au72Vlfm6PgBWPEw3XmyA8r/ikGyd6IxnJXU8vhv7dn58/9bI9CuGfv//2y3jQ2IvzFWKPle3o6zC8x35jroSZK46HNXCxdrZ+ZaReNNGkEMJXcfnugRnsCyvSYlgDrK2OAGM6DwkSP8TguxPi9+Xzp3eYcKKO5LE7kZy3qXUbdqOIr//rxG/pB/zTaj/tukJAInylmtTRL4Qnc5kgCLxYpQUBkvrnpDupzWik/TwxdTCReF3Bvvk2PpcqsAMC6ARhaYeMyXH158Rvfnzou9sqEO10iv/BPviJAl9RxFz8wg15m37gKwpWu9MevpJA1xURwt6H/EYuW3tgBheCT9Mlzt1wp4Qp7NOTAMaXe4gEyRZFVhyDK0i8rmDffBufxyLfTaENFLTnaYLX6WgfNsIOGXd3E0W5Bkfxw63PNQF0HQ3dMN4WxWe04+xG267M9+G8nMXZMPdz6Lo7Xzv55/yFryhcDQoU/twIRBdCGXC3xrc2ZKBuHeJ+EihOwCVXJHgk2FHAnm8nuodIZAy/RfE2Vr6bQhso8r32f4xtizh6t7NTAXajXQjX0ka5PkcBPCsGsnL6z7uuxH60Oy/wxX1Gv/MCfvOydwzn4TjeXYEvLh5zO7AP57h+l366c8X+8XvOs/66enw3TOCC6dGFUAbkBTP8q6zN6CSx8Bdwn0YpKfH0ufWeiISKgqSKgkTskisSvIznh9XFGg2h+YTS9f2HeUEi3ipyV+PfxzoiLmtt+uxzPsB+2L2si35gh68g4DpDvWV7Zz+D37zM6833u20cd9t4hy8uHvDt5fc//OO712/+D/vG46iwViQOWO3C/rXD3EcCcwLRhXDeeOptXNyp+6i3fUkj9Tr34BmEwhUIHgoSKxIqitA4vcLDuEOBQKAg4UJgUPBk5bwgEe8V9DsK54PF53bAJ/jifFjWcnbCNtixPH7mM+rBR9iJ9qTsVxOn9k+4dhT9DkP3164b/qVb+SfHx9UubEUMVk7hLhJYJaBQCGU4r5r6uHPo+7u/Ti/X36nZ+2NLFvfQ5jUCEAYU3FKDQKDMBc8Jhs9YkRE5Jtil6EEgUNbsONo32ii3W9H2laSN+vDN+bPsD+3C3hABXLYJO9GelB5to0Ac5wX99n338ER33w3jink83nWr2/N2bttd92vXdf8jpRvwslLQZicrQLFrfNJ15RTuIoFdAgqFcGu4P/rx4mv3cMEhQXT8Vx0BxNUViBwKhGBe5oKHW2oykk6v8gAMCdUVJPlxZfH5U+8S7FXRQ9vzAj8gYNgnt0c/4P1sQV34jPrwb1kP9sN2Z/PyeKzPYIECcZwX9Ivi2Ln3L5//6x3275V5O6Od0y3jn2T736Q8/Mx9Rd2HE1raITBacje2rwqF8LyLuBDPn80ztRFAUl8WCBwKkr0rc4GDAEDkUCAE8+Ljn+SN26oEwoEyT9Kpxhb8HX0QY9Hn2X5QDzxQFz5L9bsf+IP24MPZNu8aMPJB/PxDyrhCr91Xr5DIoJjOFzrTBl89CJgWQvgpYb9bFXo/MCMNoB2WcAJI1suyFDUkcwgbCpL6skDgUOS6HldzeA+1TEL8hFtnKBALrFKQRF2BcKCE9nNUHyzgL86DDUd9guXL12+eHKs1FvANPsGXo/bQr5Uyv9sjPv4TsQMz8fNfpfAW6GYgZZRsHuOBLQL2hXDxC7hlGPh9TygVtuDUvB9Jdl6QpLcKxGtekJjXCpL8sixFTXD7xWcvCNKYOyzJclzhIWGiQBxQnpPnO9w6QyklFuAHFrAXNuF9qyAuOB8sh274cXkefIWPaKdWUUCc4B9iKD7+DbFbcqj3Mz3LTcC8EK4BQyJZ29/iPiRUFAgX3lGwjSQ7L2OSxncyK0X05rY6w3ZKjkjyKOgD764g8cu+X5EYUcYk2fXv3LYky/E7KCRMFCRSFKlT/AfMHTfYvWUQxi3ORVzc+fNzwQL+wlf4OD9W67aWGNbKl35NBMwLIS4UJIjJHb7OCWCFh4SKgv14R8G2K8LObV5+lzam1Zi04Lbx3vX9B7yjYNsVJPN5gTi4giSPgs94dwWJX/b9jHijSFcd3lGwrbVA2BxzsV9QPFp6KIB990/wAgvt/j56xz0koJ9ASSGMRmf55J3394TRLNHVkPuepe+6p07+4d0VJ0qDiBW2kWiPChL5WkGCRsExvLsC8Zpv4zMKkvm8iGlV/sxFEGyXTh4JoIvLl98//Q28lvX5mQRIIA6BKoRwmSTcDDwOIrutgIsTJ/e+VelKqQAACndJREFUJkxr4oS6y2KXRH7LRQT/4cYhRBAsnRV7AoiJCgQQ8XJxcfX4TgIkkIZAFUIINGMCwcZzQbJ53uRbBgLCf7+Xho4+35L+67PLv85FUATy49d++OhE8vmcTvg9dbI6x0QFAuj2850ESCA9gXqEcPn0aD+8T4+PPTgCktjdZtPvEMHxwSOhAHGTld3PmJRhPx5SEk53T83iHAqgwOIPCRQkUI0QYtY9JpWCMNk1CTgRBAkRvS9uBTjfj2NjqXcFOLrHFxKwQqAaIQTw+UMzkoTeYiaO/SwkkIMAVnyzfvB3/H7COJztmzZFAGWl2Ld+C1QmrhMPvpJAYQJVCeFyVcinRwuPLq/ubadF/AaYhbuvFp873AKlAHa3fzJJuG1zwzCBCkwvK4QRc59rar4qrCA+DblgOy2u/QYYBE/G5fh7MSmAoMFCAjoJlBXCiLnPNfVtVSipqet4e1TnuDNglUiYn5X4c0FjDak5/oIB/LcJPAWKMTke4Eu7BGRQtOv8tudasJQVwm0+QUemVeGEON7t0SCTWNkcATe1Ome4rPh+ljL+nT6IHwoF8By7Js7yG05NIIGTWrBUKYRIQCKDT8+g7x5Xxz4WEjgmICPo+KSHMzD2HnZyBwmQgGoCVQohiE+rQmx1HZ8enTjw9TyBrtMyV/WxmeeSAAlcIeAlhNfmyFfMCq8zzsz7/gNa4u1RUGAhgZoJWMpONcfBpm9eQmhtjux+6TRCw1UhKLCQQK0EQrJTrUzo11kCXkJ4tlEt52FVKPPEJ7lE3n7th5+12EU7SEAfAblSQowKrB7SNeuSQCiBqoUQcPD0Ht6l/CSFPy0TYLLeif6wc+zEocDqJ3rgKSQQhcBaI9UL4ej083eFvD060mjrZS5+TNZtxZ7eksBJAteEcJ5cTnZU8jT3XSEfmikZhUJ9U/wKgWe3JGCHwDUhNJZc5t8VNrMqtDMGaSkJkEBCAtrWLdrsAfprQoiaxor7rpCrQmOBo7kkQAJBBLStW7TZA7jNCCGclZnI+AQpV4WgkbMI+ZzdtdcXPSYBEggg0JYQDvwP9gFjJaCqxjlggDusSgIkUBWBpoSQ3xVWNXbpDAlUSuDgDoomrw2ZuoetKSEECPc7SPldIWiwkEAAgUqSYACBRFUN3UE5aar2odKcEGJV2PX9B4kf/1ZhosuYzTZCQC6iRjylm4EEtA8VxUIYSH6nurr/V6h9urTDsqVDDFML0T4T5TPntMCqHh+bFEKsCmUo53+CVDpdHTrap0urRoft3EIR1mra2g2GKS1Qla2fifKZcxI5Z/HCSYQiZrNNCiEAFvmusOD1A581lSUKTbbRln0CzMX7fJIe5YWTBG+zQohVIb8rTDKm2GjlBJiLKw9wYvf2J1L7R1OZ1qwQAqi67wphVE2lzJiuiWClvhR0i2OyIPyp6/2J1P7RqYX4r00LIVaFcl3k/65wL45i0N5hU8fKjGlTiGhsZgIck5mB2+iuaSFEiFJ9V3hZz3ihIiws6glcHuHqPaOBcQlYaK15IUy1KtzXMyYRCxeHFht1jpb9Ea6FHe0ggTMEmhdCQHKrwq/98BGf05drSURnQkxPy1IPKWJ0bbRYokZbSaAsgehCOCWC6bWsa+d7x6oQT5Cixnffv/kF794lQwUmxAyQA7tgjAIBsnqDBMrrRXQhnBLB9Gopon/+/tskgMPw3pLdtJUESKAtAoeycXiCNl7l9SK6EGpD7GVPP/2ZJk2rQnNj2gu42ZPLGN7UYKjY2UDXDmXj8IQyw1dzrxTCWXSwKpQx+tTJqvDVX968nR0qtskxXQy9vo6bGgylnJUMkDrypVxL7Vep9iOEjEK4CJ57cIZ/pmkBhh9JoAkCKyrVhN+GnYwQMgrhIv54cEYmGE/Cln+macGGH8sQkPFYpmP2SgKNEKAQrgSaq8IVKAe7vJK118kHHTdwWCZlDXh54CLHzAGgBIcbYj4TwgQgjTaJVSH+O4UkoLeaHpy54VQ4QIXVzbzDDa+TD1vjCS0Q8B0zCq8Rc2HyZW7OwW8GUwi/sbjb0vjgzM3AhgbozWdukIAPAV4jPrQSnmtjRkIh3BkC52+R2gj23FVukwAJkEB6AjZmJBTCnZGAW6QicScenLER7B1X2zgkwWzDUXpJAiTgQ4BCeEDr/KrwoCEeLk+g2flKefS0gARSEgid41IID6KDVaHqB2cO7OfhMAKhF9il3ot0esnS50rmDH62m2+1EAid41IIT4wE1Q/OnLB/75QphU2ve+e1eiz0ArvErUinlyx9rmTOYLG73jEvzvHHkwCF8CSwWm+RTilsej2JQv9p1eS4ahxROGYqG/MKCVsyiUJ4Mlq4Rfpi6N/J5aPz/xae9MPvNKOJWILk56f/2XnIZHDE33XWIIHqCFwTwjxZYB92gaMQQ3Fd1S/lTovBViKW2KTFMWvdFpmZ4dwkARJ4IHBNCBvOArXeIn0YGQZ3NDwsDUaLJpOAHgLXhFCP/dktwarQPUWq5U81ZYeQv0P2mJBAzpV0QjfYdDCBdkcChfDC4HFPkX7th48XqrMKCZQlsMh3XEmXDYee3tsdCRTCi6Pwy+dP71D15esfKIYAwWKHgPZ8Z4ckLa2EAIUwIJDuKVLeIg2AyKokQAIkUJgAhTAgAPi+UO4yPWm6RSr2BHjEqioIVBbEytyZhkiVTk2uZX5V0d15IWTgVwOGp0gFzZOWv1vIu16rYbK101AQZewfsjXkzqEvtxOqdOrmXXMb54WQgV8dHFgVDn3/924Y3vMW6Soi7qyYANNCxcFtyLXzQtgQFF9X3VOkQz+836rL/STQBoEza8Q2SNBLOwQohJFi5Z4i5aowElA2E5dANn2arxGzdRqXlcLWSDJtUCiEEfniFikenKEYRoRqsimFRs/1KZt5RTrN5l3OjqokqUjdKYQRR3OKW6SKxkpEUmyKBEigeQKK1J1CGHk0xr5FqmisRCbF5khgnYC1yd+6F9xriQCFMEG0xlukL7q3vEWaAC6brJ5A/skfpbf6QXXgIIXwANCVw7hFinpfRQzxztIOAaZUi7EOl17G3WLcv9l8Xgi/1eHWCQIvvnZP/TD82F34l/OiytnXBRTXqhR0KjylXnOZtcoSYNzL8g/tnUIYSnCjPv6jPX7rzJXfOJPzogrvq6DqbLDvwp3aapn7SaApAgqv7iT8KYRJsE6NQgzdbdJpj5lXD0OpOh6weKoj0EqGdf4afW/l6s4mhBz3Rq8Emk0CKQi0kmFTsGOb0QlkE0KO++ixY4MkEIcAWyEBswTiLLGyCaFZzjScBEiABFQTiCMGql3cNC7OEotCeAPc8mC6QeAGCZDAFgG1KcJLDLa8a3o/hfAWfg6mGwpukAAJPBJginhkUskeCmElgWzeDbWz9eYjQwAkoJ5AtUKonjwNjEuAs/W4PNkaCTREgEJYcbC5SJLgEoJA4A8JpCZg+0IzIYRlEYf3vt/C/tGQ4dvOImmHEiHswOEhEohFwPaFZkIIyyIO732/hf2jsYYp22mNQLoJVmsk6W/9BEwIYf1hoIetEkgnV/VOsNSNlXRBVOdqrQb9PwAAAP//1Cl6lgAAAAZJREFUAwBpsFHjr7HyIAAAAABJRU5ErkJggg==', 21, '2026-02-23 18:20:03'),
(3, 1, 35, 2, 'zone_1771892208373', 'data:image/png;base64,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', 21, '2026-02-23 18:20:03');

-- --------------------------------------------------------

--
-- Table structure for table `task_sign_documents`
--

CREATE TABLE `task_sign_documents` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) NOT NULL DEFAULT '1',
  `task_template_id` int(11) NOT NULL COMMENT 'References task_templates.id',
  `file_path` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Full URL or path on external server (disruptinglabs)',
  `original_filename` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_size` bigint(20) DEFAULT NULL COMMENT 'File size in bytes',
  `signature_zones` json DEFAULT NULL COMMENT 'Array of zone objects [{id, page, x, y, width, height, label}]',
  `uploaded_by_broker_id` int(11) NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='PDF documents with signature zone definitions for signing task templates';

--
-- Dumping data for table `task_sign_documents`
--

INSERT INTO `task_sign_documents` (`id`, `tenant_id`, `task_template_id`, `file_path`, `original_filename`, `file_size`, `signature_zones`, `uploaded_by_broker_id`, `created_at`, `updated_at`) VALUES
(1, 1, 32, 'https://disruptinglabs.com/data/api/data/encore-sign-templates/90001/pdfs/adquiramexico_com_mx_multipagos_portal_payment_voucher_tr_YXgeVjQzpFmulnzaMCJhdBUeEEAmulava_dp_ZmFsc2U_3D_699a5f45bd973.pdf', 'adquiramexico.com.mx_multipagos_portal_payment_voucher_tr=YXgeVjQzpFmulnzaMCJhdBUeEEAmulava&dp=ZmFsc2U%3D.pdf', 93081, '[{\"x\": 26.692307692307693, \"y\": 83.70986920332936, \"id\": \"zone_1771724626618\", \"page\": 1, \"label\": \"Signature 1\", \"width\": 47.38461538461539, \"height\": 10.344827586206904}]', 1, '2026-02-21 19:44:00', '2026-02-21 19:44:00'),
(2, 1, 33, 'https://disruptinglabs.com/data/api/data/encore-sign-templates/90001/pdfs/adquiramexico_com_mx_multipagos_portal_payment_voucher_tr_YXgeVjQzpFmulnzaMCJhdBUeEEAmulava_dp_ZmFsc2U_3D_699cedddcde22.pdf', 'adquiramexico.com.mx_multipagos_portal_payment_voucher_tr=YXgeVjQzpFmulnzaMCJhdBUeEEAmulava&dp=ZmFsc2U%3D.pdf', 93081, '[{\"x\": 29.69230769230769, \"y\": 83.23424494649228, \"id\": \"zone_1771892195218\", \"page\": 1, \"label\": \"Signature 1\", \"width\": 37.69230769230769, \"height\": 9.274673008323418}, {\"x\": 72.61538461538461, \"y\": 83.47205707491082, \"id\": \"zone_1771892208373\", \"page\": 1, \"label\": \"Signature 2\", \"width\": 24, \"height\": 8.561236623067785}]', 1, '2026-02-23 18:16:59', '2026-02-23 18:16:59');

-- --------------------------------------------------------

--
-- Table structure for table `task_templates`
--

CREATE TABLE `task_templates` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) NOT NULL DEFAULT '1',
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `task_type` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Custom task type from wizard',
  `priority` enum('low','medium','high','urgent') COLLATE utf8mb4_unicode_ci DEFAULT 'medium',
  `default_due_days` int(11) DEFAULT NULL COMMENT 'Days after loan creation to set as due date (NULL = no due date)',
  `order_index` int(11) DEFAULT '0' COMMENT 'Order in the loan workflow (lower = earlier in process)',
  `is_active` tinyint(1) DEFAULT '1' COMMENT 'Only active templates are used for new loans',
  `created_by_broker_id` int(11) NOT NULL COMMENT 'Broker who created this template',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `requires_documents` tinyint(1) DEFAULT '0' COMMENT 'Whether this task requires document uploads',
  `document_instructions` text COLLATE utf8mb4_unicode_ci COMMENT 'Instructions for required documents',
  `has_custom_form` tinyint(1) DEFAULT '0' COMMENT 'Whether this task has custom form fields',
  `has_signing` tinyint(1) DEFAULT '0' COMMENT 'Whether this task requires document signing (has signing zones)'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Reusable task templates for loan workflows';

--
-- Dumping data for table `task_templates`
--

INSERT INTO `task_templates` (`id`, `tenant_id`, `title`, `description`, `task_type`, `priority`, `default_due_days`, `order_index`, `is_active`, `created_by_broker_id`, `created_at`, `updated_at`, `requires_documents`, `document_instructions`, `has_custom_form`, `has_signing`) VALUES
(34, 1, 'Government-Issued ID', 'Provide a valid government-issued photo identification.', 'document_verification', 'high', 7, 10, 1, 1, '2026-02-25 20:23:05', '2026-02-25 20:23:05', 1, 'Attach a clear photo or scan of your valid government-issued ID (passport, driver license, state ID, etc.).', 0, 0),
(35, 1, 'Driver\'s License', 'Provide your valid driver\'s license as a form of identification.', 'document_verification', 'high', 7, 11, 1, 1, '2026-02-25 20:23:05', '2026-02-25 20:23:05', 1, 'Attach a clear photo or scan of your valid driver\'s license (front and back).', 0, 0),
(36, 1, 'Green Card (Permanent Resident Card)', 'Provide your valid Permanent Resident Card (Form I-551).', 'document_verification', 'high', 7, 12, 1, 1, '2026-02-25 20:23:05', '2026-02-25 20:23:05', 1, 'Attach a clear photo or scan of your valid Green Card (front and back).', 0, 0),
(37, 1, 'Social Security Card (SSN)', 'Provide your Social Security card issued by the Social Security Administration (SSA).', 'document_verification', 'high', 7, 13, 1, 1, '2026-02-25 20:23:05', '2026-02-25 20:23:05', 1, 'Attach a clear photo or scan of your Social Security card. Make sure the number is clearly visible.', 0, 0),
(38, 1, 'Housing Payment Statement (2 Months)', 'Provide the last two months of bank or mortgage statements showing your housing payment.', 'document_verification', 'medium', 14, 14, 1, 1, '2026-02-25 20:23:05', '2026-02-25 20:23:05', 1, 'Attach the last two months of bank or mortgage statements. They must clearly show the account holder name, partial account number, and housing payment transactions.', 0, 0),
(39, 1, 'Homeowner\'s Insurance Policy', 'Provide the current homeowner\'s insurance policy for the property.', 'document_verification', 'medium', 14, 15, 1, 1, '2026-02-25 20:23:05', '2026-02-25 20:23:05', 1, 'Attach the active homeowner\'s insurance policy. It must include the policy number, coverage details, insured name, and effective dates.', 0, 0),
(40, 1, 'W-2 Form', 'Provide your W-2 form(s) for the most recent tax year.', 'document_verification', 'high', 14, 16, 1, 1, '2026-02-25 20:23:05', '2026-02-25 20:23:05', 1, 'Attach all W-2 forms from the most recent tax year. If you have multiple employers, include the W-2 from each one.', 0, 0),
(41, 1, '1099 Forms (Last 2 Years)', 'Provide all 1099 forms received in the last two tax years.', 'document_verification', 'high', 14, 20, 1, 1, '2026-02-25 21:40:00', '2026-02-25 21:40:00', 1, 'Attach all 1099 forms (1099-MISC, 1099-NEC, 1099-INT, etc.) for the last two tax years. Include all issuers.', 0, 0),
(42, 1, 'Federal Tax Returns Last 2 Years Including Business Tax Returns', 'Provide signed federal tax returns (Form 1040) for the last two years, including all business tax returns (Schedule C, 1120-S, 1065, etc.) and all schedules.', 'document_verification', 'high', 14, 21, 1, 1, '2026-02-25 21:40:00', '2026-03-04 20:24:13', 1, 'Attach complete and signed IRS Form 1040 with all business tax returns (Schedule C, 1120-S, 1065, etc.) for the last two tax years.', 0, 0),
(43, 1, 'Business License', 'Provide a copy of your current business license or registration.', 'document_verification', 'medium', 10, 22, 1, 1, '2026-02-25 21:40:00', '2026-02-25 21:40:00', 1, 'Attach a copy of your valid business license, DBA registration, or LLC/corporation certificate.', 0, 0),
(44, 1, 'Profit & Loss Statement (Current Year)', 'Provide a year-to-date profit & loss statement for your business.', 'document_verification', 'high', 10, 23, 1, 1, '2026-02-25 21:40:00', '2026-02-25 21:40:00', 1, 'Attach a YTD profit & loss statement prepared by a CPA or bookkeeper. Must include revenue, expenses, and net income.', 0, 0),
(45, 1, 'Business Bank Statements (3 Months)', 'Provide the last 3 months of business bank statements.', 'document_verification', 'high', 14, 24, 1, 1, '2026-02-25 21:40:00', '2026-02-25 21:40:00', 1, 'Attach the last 3 months of all business bank statements. Must show account holder name, account number (partial), and all transactions.', 0, 0),
(46, 1, 'Investment / Brokerage Account Statements (2 Months)', 'Provide the last 2 months of investment or brokerage account statements.', 'document_verification', 'medium', 14, 25, 1, 1, '2026-02-25 21:40:00', '2026-02-25 21:40:00', 1, 'Attach the last 2 months of all investment, brokerage, or retirement account statements (401k, IRA, etc.).', 0, 0),
(47, 1, 'Pension / Retirement Award Letter', 'Provide a pension or retirement benefit award letter showing monthly income.', 'document_verification', 'medium', 14, 26, 1, 1, '2026-02-25 21:40:00', '2026-02-25 21:40:00', 1, 'Attach the most recent pension or retirement award/benefit letter. It must show the monthly payment amount and the issuing organization.', 0, 0),
(48, 1, 'Social Security Award Letter', 'Provide the most recent Social Security benefits award letter.', 'document_verification', 'medium', 14, 27, 1, 1, '2026-02-25 21:40:00', '2026-02-25 21:40:00', 1, 'Attach your most recent Social Security award letter showing your monthly benefit amount. You can obtain it from ssa.gov.', 0, 0),
(49, 1, 'Visa / Work Authorization Document', 'Provide a copy of your current visa or work authorization document (I-94, EAD, H-1B, etc.).', 'document_verification', 'high', 7, 28, 1, 1, '2026-02-25 21:40:00', '2026-02-25 21:40:00', 1, 'Attach a clear copy of your valid visa, I-94 Arrival/Departure Record, Employment Authorization Document (EAD), or other immigration status document.', 0, 0),
(50, 1, 'ITIN Assignment Letter', 'Provide the IRS ITIN assignment letter (CP565 notice).', 'document_verification', 'medium', 7, 29, 1, 1, '2026-02-25 21:40:00', '2026-02-25 21:40:00', 1, 'Attach your IRS ITIN assignment letter (Notice CP565) showing your Individual Taxpayer Identification Number.', 0, 0),
(51, 1, 'Current Mortgage Statement', 'Provide the most recent monthly mortgage statement for the property being refinanced.', 'document_verification', 'high', 7, 30, 1, 1, '2026-02-25 21:40:00', '2026-02-25 21:40:00', 1, 'Attach your most recent mortgage statement showing the current balance, monthly payment, and lender information.', 0, 0),
(52, 1, 'Most Recent Property Tax Bill', 'Provide the most recent property tax bill for the subject property.', 'document_verification', 'medium', 14, 31, 1, 1, '2026-02-25 21:40:00', '2026-02-25 21:40:00', 1, 'Attach the most recent property tax assessment or bill from your county/city assessor.', 0, 0),
(53, 1, 'Purchase Agreement / Offer Letter', 'Provide a fully executed purchase agreement or offer letter for the property.', 'document_verification', 'high', 5, 32, 1, 1, '2026-02-25 21:40:00', '2026-02-25 21:40:00', 1, 'Attach the signed purchase agreement (sales contract) including all addenda and counteroffers.', 0, 0),
(54, 1, 'Construction Plans & Builder Contract', 'Provide the construction plans and a signed contract with your builder.', 'document_verification', 'high', 10, 33, 1, 1, '2026-02-25 21:40:00', '2026-02-25 21:40:00', 1, 'Attach the architectural/engineering plans for the construction project and the signed builder contract including total cost breakdown.', 0, 0),
(55, 1, 'HOA Statement & Master Insurance Policy', 'Provide the current HOA statement and the master insurance policy for the condo community.', 'document_verification', 'medium', 14, 34, 1, 1, '2026-02-25 21:40:00', '2026-02-25 21:40:00', 1, 'Attach the current HOA dues statement and the master/blanket insurance policy (hazard + liability) for the condo association.', 0, 0),
(56, 1, 'Existing Lease Agreements', 'Provide copies of all current lease agreements for the rental units.', 'document_verification', 'medium', 14, 35, 1, 1, '2026-02-25 21:40:00', '2026-02-25 21:40:00', 1, 'Attach all signed lease agreements currently in effect for each rental unit in the property. Include lease start/end dates and monthly rent amounts.', 0, 0),
(57, 1, 'Business Financial Statements', 'Provide the last 2 years of business financial statements (income statement & balance sheet).', 'document_verification', 'high', 14, 36, 1, 1, '2026-02-25 21:40:00', '2026-02-25 21:40:00', 1, 'Attach the last 2 years of income statements and balance sheets for the business operating at or owning the commercial property. CPA-prepared preferred.', 0, 0),
(58, 1, '2 Months Bank Statements', 'Provide your last two months of bank statements for all accounts.', 'document_verification', 'medium', 14, 14, 1, 1, '2026-03-04 20:24:13', '2026-03-04 20:24:13', 1, 'Attach the last two months of all bank account statements. Must show account holder name, partial account number, and all transactions.', 0, 0),
(59, 1, 'Most Recent Pay-Stubs (1 Month)', 'Provide your most recent one month of consecutive pay stubs from your employer.', 'document_verification', 'high', 10, 17, 1, 1, '2026-03-04 20:24:13', '2026-03-04 20:24:13', 1, 'Attach your most recent consecutive pay stubs covering at least one month. Must show employer name, gross pay, deductions, and year-to-date totals.', 0, 0),
(60, 1, 'Federal Tax Returns (Last 2 Years) or Schedule C (Last 2 Years)', 'Provide your federal income tax returns or Schedule C for the last two tax years.', 'document_verification', 'high', 14, 22, 1, 1, '2026-03-04 20:24:13', '2026-03-04 20:24:13', 1, 'Attach your complete and signed federal tax returns (Form 1040) or Schedule C for the last two tax years. Include all schedules and attachments.', 0, 0),
(61, 1, 'Mortgage Statement', 'Provide the most recent mortgage statement for the subject property.', 'document_verification', 'medium', 10, 31, 1, 1, '2026-03-04 20:24:13', '2026-03-04 20:24:13', 1, 'Attach your most recent mortgage statement showing outstanding balance, monthly payment, lender name, and property address.', 0, 0),
(62, 1, 'Insurance Policy', 'Provide the current homeowners or property insurance policy for the subject property.', 'document_verification', 'medium', 14, 32, 1, 1, '2026-03-04 20:24:13', '2026-03-04 20:24:13', 1, 'Attach the current insurance policy (declaration page). Must include policy number, coverage amounts, property address, named insured, and effective dates.', 0, 0),
(63, 1, 'Current Mortgage Statement / Payoff Letter', 'Provide the most recent mortgage statement or an official payoff letter for the property being refinanced.', 'document_verification', 'high', 7, 33, 1, 1, '2026-03-04 20:24:13', '2026-03-04 20:24:13', 1, 'Attach your most recent mortgage statement or an official payoff letter from your lender. Must show current balance, monthly payment, and lender contact information.', 0, 0);

-- --------------------------------------------------------

--
-- Table structure for table `templates`
--

CREATE TABLE `templates` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) NOT NULL DEFAULT '1',
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `template_type` enum('email','sms','whatsapp') COLLATE utf8mb4_unicode_ci NOT NULL,
  `category` enum('welcome','reminder','update','follow_up','marketing','system') COLLATE utf8mb4_unicode_ci DEFAULT 'system',
  `subject` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'For email templates',
  `body` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `variables` json DEFAULT NULL COMMENT 'Available template variables',
  `is_active` tinyint(1) DEFAULT '1',
  `usage_count` int(11) DEFAULT '0',
  `created_by_broker_id` int(11) NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `templates`
--

INSERT INTO `templates` (`id`, `tenant_id`, `name`, `description`, `template_type`, `category`, `subject`, `body`, `variables`, `is_active`, `usage_count`, `created_by_broker_id`, `created_at`, `updated_at`) VALUES
(1, 1, 'Welcome Email', 'Welcome new clients to the loan process', 'email', 'welcome', 'Welcome to Encore Mortgage - Your Loan Application', 'Dear {{client_name}},\n\nWelcome to Encore Mortgage! We\'re excited to help you with your loan application.\n\nYour application ID is: {{application_id}}\n\nNext steps:\n1. Complete all required documents\n2. Schedule your initial consultation\n3. We\'ll review your application within 24-48 hours\n\nIf you have any questions, please don\'t hesitate to contact us.\n\nBest regards,\n{{broker_name}}\nEncore Mortgage', '[\"client_name\", \"application_id\", \"broker_name\"]', 1, 0, 1, '2026-02-04 15:11:33', '2026-02-04 15:11:33'),
(2, 1, 'Document Reminder SMS', 'Remind clients about pending documents', 'sms', 'reminder', NULL, 'Hi {{client_name}}, this is {{broker_name}} from Encore Mortgage. You have {{document_count}} pending documents for your loan application. Please upload them at your earliest convenience.', '[\"client_name\", \"broker_name\", \"document_count\"]', 1, 0, 1, '2026-02-04 15:11:33', '2026-03-24 22:36:04'),
(3, 1, 'Application Update WhatsApp', 'Update clients on application status via WhatsApp', 'whatsapp', 'update', NULL, 'Hi {{client_name}} 👋\n\nGreat news! Your loan application status has been updated to: *{{status}}*\n\n{{additional_notes}}\n\nNext steps: {{next_steps}}\n\nFeel free to reply with any questions!\n\n- {{broker_name}} at Encore Mortgage', '[\"client_name\", \"status\", \"additional_notes\", \"next_steps\", \"broker_name\"]', 1, 0, 1, '2026-02-04 15:11:33', '2026-02-04 15:11:33'),
(4, 1, 'Loan Approved Email', 'Congratulate clients on loan approval', 'email', 'update', 'Congratulations! Your Loan Has Been Approved', 'Dear {{client_name}},\n\nCongratulations! 🎉\n\nWe\'re thrilled to inform you that your loan application #{{application_id}} has been APPROVED!\n\nLoan Details:\n- Loan Amount: ${{loan_amount}}\n- Interest Rate: {{interest_rate}}%\n- Closing Date: {{closing_date}}\n\nNext Steps:\n1. Review the loan documents we\'ll send shortly\n2. Schedule your closing appointment\n3. Prepare for your new home!\n\nThank you for choosing Encore Mortgage. We\'re excited to be part of your homeownership journey!\n\nBest regards,\n{{broker_name}}\nEncore Mortgage', '[\"client_name\", \"application_id\", \"loan_amount\", \"interest_rate\", \"closing_date\", \"broker_name\"]', 1, 0, 1, '2026-02-04 15:11:33', '2026-02-04 15:11:33'),
(5, 1, 'Quick Update SMS', 'Send quick status updates via SMS', 'sms', 'update', NULL, 'Hi {{client_name}}! Quick update on your loan app #{{application_id}}: {{status_message}}. Questions? Call us! - {{broker_name}} at Encore Mortgage', '[\"client_name\", \"application_id\", \"status_message\", \"broker_name\"]', 1, 0, 1, '2026-02-04 15:11:33', '2026-02-04 15:11:33'),
(6, 1, 'Document Upload Reminder WhatsApp', 'Friendly WhatsApp reminder for documents', 'whatsapp', 'reminder', NULL, 'Hi {{client_name}} 👋\n\nFriendly reminder: We\'re still waiting for {{missing_documents}} for your loan application.\n\nYou can upload them easily through your client portal: {{portal_link}}\n\nNeed help? Just reply here and I\'ll assist you right away!\n\n📋 Missing: {{missing_documents}}\n⏰ Needed by: {{due_date}}\n\nThanks!\n{{broker_name}} 🏠', '[\"client_name\", \"missing_documents\", \"portal_link\", \"due_date\", \"broker_name\"]', 1, 0, 1, '2026-02-04 15:11:33', '2026-02-04 15:11:33'),
(7, 1, 'App Sent – Purchase Welcome Email', 'First email sent when a purchase loan application is received', 'email', 'follow_up', '🏠 Your Home Purchase Loan Application Has Been Received!', 'Hi {{first_name}},\n\nWe\'re excited to let you know that your home *purchase* loan application has been received and is now under review.\n\nApplication #: {{application_number}}\n\nHere\'s what happens next:\n1. Our team will review your information within 1 business day.\n2. We\'ll reach out if we need any additional documents.\n3. You\'ll receive updates at every step of the process.\n\nIf you have any questions or need assistance, reply to this email or call us anytime.\n\nLooking forward to helping you get those keys! 🔑\n\n{{broker_name}}\nEncore Mortgage', '[\"first_name\", \"application_number\", \"broker_name\"]', 1, 0, 1, '2026-03-12 21:56:35', '2026-03-12 21:56:35'),
(8, 1, 'App Sent – Purchase Confirmation SMS', 'Quick SMS confirmation after purchase application is received', 'sms', 'follow_up', NULL, 'Hi {{first_name}}! ✅ We received your home purchase application (#{{application_number}}). Our team is already on it! Questions? Just reply. – {{broker_name}}, Encore Mortgage.', '[\"first_name\", \"application_number\", \"broker_name\"]', 1, 0, 1, '2026-03-12 21:56:35', '2026-03-24 22:36:04'),
(9, 1, 'App Sent – Purchase Follow-Up Email', 'Follow-up email for purchase loan, same day', 'email', 'follow_up', 'Next Steps for Your Home Purchase Loan', 'Hi {{first_name}},\n\nJust following up on your home purchase loan application (#{{application_number}}).\n\nTo keep things moving smoothly, please make sure the following are ready:\n• Government-issued photo ID\n• Last 2 months of pay stubs\n• Last 2 years of W-2s or tax returns\n• Last 2 months of bank statements\n\nYou can upload documents directly through your client portal. If you haven\'t logged in yet, check the link in your welcome email.\n\nWe\'re with you every step of the way. Don\'t hesitate to reach out!\n\n{{broker_name}}\nEncore Mortgage', '[\"first_name\", \"application_number\", \"broker_name\"]', 1, 0, 1, '2026-03-12 21:56:35', '2026-03-12 21:56:35'),
(10, 1, 'App Sent – Purchase Day-3 Reminder SMS', 'SMS reminder 3 days after purchase application received', 'sms', 'reminder', NULL, 'Hi {{first_name}}, it\'s {{broker_name}} from Encore Mortgage. Checking in on your purchase loan app (#{{application_number}}). Have you had a chance to upload your documents? We\'re here to help – just reply!', '[\"first_name\", \"application_number\", \"broker_name\"]', 1, 0, 1, '2026-03-12 21:56:35', '2026-03-24 22:36:04'),
(11, 1, 'App Sent – Purchase Day-6 Final SMS', 'Final SMS nudge 6 days after purchase application received', 'sms', 'reminder', NULL, 'Hi {{first_name}}! 👋 Still here to help with your home purchase loan (#{{application_number}}). A quick call could get you one step closer to those keys! Call or reply anytime. – {{broker_name}}, Encore Mortgage.', '[\"first_name\", \"application_number\", \"broker_name\"]', 1, 0, 1, '2026-03-12 21:56:35', '2026-03-24 22:36:04'),
(12, 1, 'App Sent – Refi Welcome Email', 'First email sent when a refinance loan application is received', 'email', 'follow_up', '🔄 Your Refinance Application Has Been Received!', 'Hi {{first_name}},\n\nGreat news — your refinance loan application has been received and is now under review.\n\nApplication #: {{application_number}}\n\nRefinancing can save you money, lower your payment, or help you access equity. We\'re here to make the process as smooth as possible.\n\nWhat to expect next:\n1. We\'ll review your application within 1 business day.\n2. We may reach out for additional documents.\n3. We\'ll keep you updated every step of the way.\n\nQuestions? Just reply to this email!\n\n{{broker_name}}\nEncore Mortgage', '[\"first_name\", \"application_number\", \"broker_name\"]', 1, 0, 1, '2026-03-12 21:56:35', '2026-03-12 21:56:35'),
(13, 1, 'App Sent – Refi Confirmation SMS', 'Quick SMS confirmation after refinance application is received', 'sms', 'follow_up', NULL, 'Hi {{first_name}}! ✅ We received your refinance application (#{{application_number}}). We\'re reviewing it now! Questions? Just reply. – {{broker_name}}, Encore Mortgage.', '[\"first_name\", \"application_number\", \"broker_name\"]', 1, 0, 1, '2026-03-12 21:56:35', '2026-03-24 22:36:04'),
(14, 1, 'App Sent – Refi Follow-Up Email', 'Follow-up email for refi loan, same day', 'email', 'follow_up', 'Next Steps for Your Refinance', 'Hi {{first_name}},\n\nFollowing up on your refinance application (#{{application_number}}).\n\nTo keep things moving, please have these documents ready:\n• Government-issued photo ID\n• Last 2 months of pay stubs\n• Last 2 years of W-2s or tax returns\n• Last 2 months of bank statements\n• Most recent mortgage statement\n\nYou can upload everything securely through your client portal.\n\nWe\'re committed to making your refinance as fast and painless as possible.\n\n{{broker_name}}\nEncore Mortgage', '[\"first_name\", \"application_number\", \"broker_name\"]', 1, 0, 1, '2026-03-12 21:56:35', '2026-03-12 21:56:35'),
(15, 1, 'App Sent – Refi Day-3 Reminder SMS', 'SMS reminder 3 days after refinance application received', 'sms', 'reminder', NULL, 'Hi {{first_name}}, it\'s {{broker_name}} from Encore Mortgage. Just checking in on your refinance app (#{{application_number}}). Have questions or need help with documents? Reply anytime!', '[\"first_name\", \"application_number\", \"broker_name\"]', 1, 0, 1, '2026-03-12 21:56:35', '2026-03-24 22:36:04'),
(16, 1, 'App Sent – Refi Day-6 Final SMS', 'Final SMS nudge 6 days after refinance application received', 'sms', 'reminder', NULL, 'Hi {{first_name}}! 👋 Your refinance application (#{{application_number}}) is still open. Lock in your rate now — give us a call or reply here. We\'re ready when you are! – {{broker_name}}, Encore Mortgage.', '[\"first_name\", \"application_number\", \"broker_name\"]', 1, 0, 1, '2026-03-12 21:56:35', '2026-03-24 22:36:04'),
(17, 1, 'App Sent – Default Welcome Email', 'First email when loan type is not yet classified', 'email', 'follow_up', '📋 Your Loan Application Has Been Received!', 'Hi {{first_name}},\n\nWe\'ve received your loan application and our team is reviewing it now.\n\nApplication #: {{application_number}}\n\nNext steps:\n1. Our team will review your details within 1 business day.\n2. We\'ll reach out if we need anything else from you.\n3. You\'ll receive updates throughout the process.\n\nIf you have any questions, just reply to this email or give us a call.\n\n{{broker_name}}\nEncore Mortgage', '[\"first_name\", \"application_number\", \"broker_name\"]', 1, 0, 1, '2026-03-12 21:56:35', '2026-03-12 21:56:35'),
(18, 1, 'App Sent – Default Day-3 SMS', 'First SMS reminder 3 days after application received (no loan type)', 'sms', 'reminder', NULL, 'Hi {{first_name}}, it\'s {{broker_name}} from Encore Mortgage. Checking in on your loan application (#{{application_number}}). Any questions or documents you need help with? Reply anytime!', '[\"first_name\", \"application_number\", \"broker_name\"]', 1, 0, 1, '2026-03-12 21:56:35', '2026-03-24 22:36:04'),
(19, 1, 'App Sent – Default Day-10 SMS', 'Second SMS reminder 10 days after application received (no loan type)', 'sms', 'reminder', NULL, 'Hi {{first_name}}, we want to make sure your loan application (#{{application_number}}) keeps moving forward. Give us a call or reply here — we\'d love to help! – {{broker_name}}, Encore Mortgage.', '[\"first_name\", \"application_number\", \"broker_name\"]', 1, 0, 1, '2026-03-12 21:56:35', '2026-03-24 22:36:04'),
(20, 1, 'App Sent – Default Follow-Up Email', 'Follow-up email 10 days after application (no loan type)', 'email', 'follow_up', 'We\'re Still Here to Help with Your Loan', 'Hi {{first_name}},\n\nWe noticed your loan application (#{{application_number}}) still has some pending items. We want to make sure you get the best possible outcome.\n\nOur team is ready to walk you through every step — documents, questions, timelines — whatever you need.\n\nWould you be available for a quick call this week? Just reply and we\'ll set it up.\n\n{{broker_name}}\nEncore Mortgage', '[\"first_name\", \"application_number\", \"broker_name\"]', 1, 0, 1, '2026-03-12 21:56:35', '2026-03-12 21:56:35'),
(21, 1, 'App Sent – Default Day-17 Final SMS', 'Final SMS reminder 17 days after application (no loan type)', 'sms', 'reminder', NULL, 'Hi {{first_name}}, last check-in on your loan application (#{{application_number}}). We\'re still here and ready to help. Don\'t let this opportunity pass — reply or call us today! – {{broker_name}}, Encore Mortgage.', '[\"first_name\", \"application_number\", \"broker_name\"]', 1, 0, 1, '2026-03-12 21:56:35', '2026-03-24 22:36:04'),
(22, 1, 'App Sent – Partner Internal Notification', 'Internal notification to the assigned partner after default follow-up sequence completes', 'email', 'system', '[ACTION NEEDED] Loan Application Requires Partner Follow-Up', 'Hello,\n\nThis is an automated internal alert.\n\nClient {{client_name}} has completed the automated App Sent reminder sequence without responding. Their loan application (#{{application_number}}) may need personal outreach from the assigned partner.\n\nApplication details:\n• Client: {{client_name}}\n• Application #: {{application_number}}\n• Loan Type: {{loan_type}}\n\nPlease follow up directly with the client at your earliest convenience.\n\n— Encore Mortgage Automation', '[\"client_name\", \"application_number\", \"loan_type\"]', 1, 0, 1, '2026-03-12 21:56:35', '2026-03-12 21:56:35'),
(23, 1, 'App Received – Purchase Welcome SMS', 'Immediate SMS confirmation when a purchase loan application is received', 'sms', 'follow_up', NULL, 'Hi {{first_name}}! 🏠 Great news — we received your home purchase application (#{{application_number}}) and our team is already reviewing it. Questions? Just reply! – {{broker_name}}, Encore Mortgage.', '[\"first_name\", \"application_number\", \"broker_name\"]', 1, 0, 1, '2026-03-12 22:05:45', '2026-03-24 22:36:04'),
(24, 1, 'App Received – Purchase Welcome Email', 'Immediate welcome email for purchase loan once application is fully received', 'email', 'follow_up', '🏠 We\'ve Received Your Purchase Loan Application!', 'Hi {{first_name}},\n\nExciting news! Your home purchase loan application has been officially received and is now in our system.\n\nApplication #: {{application_number}}\n\nOur team will begin a thorough review right away. Here\'s what to expect:\n\n• We\'ll contact you within 1 business day with next steps.\n• You may be asked to provide supporting documents through your client portal.\n• We\'ll keep you updated every step of the way.\n\nWe\'re thrilled to be part of your homeownership journey. Don\'t hesitate to reach out with any questions!\n\n{{broker_name}}\nEncore Mortgage', '[\"first_name\", \"application_number\", \"broker_name\"]', 1, 0, 1, '2026-03-12 22:05:46', '2026-03-12 22:05:46'),
(25, 1, 'App Received – Purchase 10-Min Follow-Up Email', 'Follow-up email sent ~10 minutes after application received (purchase)', 'email', 'follow_up', 'What Happens Next with Your Purchase Loan (#{{application_number}})', 'Hi {{first_name}},\n\nJust following up! Now that we have your application (#{{application_number}}), here\'s a quick checklist of documents you\'ll want to have ready:\n\n✅ Government-issued photo ID (driver\'s license or passport)\n✅ Last 2 months of pay stubs\n✅ Last 2 years of W-2s or tax returns\n✅ Last 2–3 months of bank statements\n✅ Any gift letters (if applicable)\n\nYou can upload everything securely through your client portal. Getting these in early will help us move faster!\n\nReady to chat? Reply to this email or give us a call — we\'re here.\n\n{{broker_name}}\nEncore Mortgage', '[\"first_name\", \"application_number\", \"broker_name\"]', 1, 0, 1, '2026-03-12 22:05:46', '2026-03-12 22:05:46'),
(26, 1, 'App Received – Purchase Day-2 Follow-Up SMS', 'SMS follow-up 2 days after purchase application received', 'sms', 'reminder', NULL, 'Hi {{first_name}}, it\'s {{broker_name}} from Encore Mortgage. Checking in on your purchase loan app (#{{application_number}}) — have you had a chance to log in to your portal and review your checklist? We\'re here if you need anything!', '[\"first_name\", \"application_number\", \"broker_name\"]', 1, 0, 1, '2026-03-12 22:05:46', '2026-03-24 22:36:04'),
(27, 1, 'App Received – Refi Welcome SMS', 'Immediate SMS confirmation when a refinance loan application is received', 'sms', 'follow_up', NULL, 'Hi {{first_name}}! 🔄 We received your refinance application (#{{application_number}}) and are reviewing it now. We\'ll follow up shortly — reply anytime with questions! – {{broker_name}}, Encore Mortgage.', '[\"first_name\", \"application_number\", \"broker_name\"]', 1, 0, 1, '2026-03-12 22:05:46', '2026-03-24 22:36:04'),
(28, 1, 'App Received – Refi Welcome Email', 'Immediate welcome email for refinance loan once application is fully received', 'email', 'follow_up', '🔄 Your Refinance Application Has Been Received!', 'Hi {{first_name}},\n\nYour refinance application is officially in — and our team has already started the review process.\n\nApplication #: {{application_number}}\n\nRefinancing is one of the smartest financial moves you can make, and we\'re here to make it seamless.\n\nWhat to expect:\n• We\'ll review your application and reach out within 1 business day.\n• We may request supporting documents through your secure client portal.\n• You\'ll receive updates at key milestones.\n\nHave questions? Just reply to this email — we\'re happy to help.\n\n{{broker_name}}\nEncore Mortgage', '[\"first_name\", \"application_number\", \"broker_name\"]', 1, 0, 1, '2026-03-12 22:05:46', '2026-03-12 22:05:46'),
(29, 1, 'App Received – Refi 10-Min Follow-Up Email', 'Follow-up email sent ~10 minutes after refinance application received', 'email', 'follow_up', 'Quick Checklist for Your Refinance (#{{application_number}})', 'Hi {{first_name}},\n\nGreat start! To keep your refinance moving as quickly as possible, here are the documents we\'ll need:\n\n✅ Government-issued photo ID\n✅ Last 2 months of pay stubs\n✅ Last 2 years of W-2s or tax returns\n✅ Last 2–3 months of bank statements\n✅ Most recent mortgage statement\n✅ Homeowners insurance declaration page\n\nUpload them securely through your client portal whenever you\'re ready. Getting ahead on documents can save days in processing.\n\nQuestions? We\'re a reply or call away.\n\n{{broker_name}}\nEncore Mortgage', '[\"first_name\", \"application_number\", \"broker_name\"]', 1, 0, 1, '2026-03-12 22:05:46', '2026-03-12 22:05:46'),
(30, 1, 'App Received – Refi Day-2 Follow-Up SMS', 'SMS follow-up 2 days after refinance application received', 'sms', 'reminder', NULL, 'Hi {{first_name}}, {{broker_name}} here from Encore Mortgage. Just checking in on your refinance app (#{{application_number}}). Have you had a chance to review your document checklist in the portal? We\'re here to help make this easy!', '[\"first_name\", \"application_number\", \"broker_name\"]', 1, 0, 1, '2026-03-12 22:05:46', '2026-03-24 22:36:04'),
(31, 1, 'Prequalified – Purchase SMS 1', 'Initial SMS on prequalification (purchase)', 'sms', 'follow_up', NULL, 'Hi {{first_name}}! 🎉 Great news — you\'ve been prequalified for your home purchase loan (#{{application_number}})! Our team is ready to guide you through the next steps. Questions? Just reply! – {{broker_name}}, Encore Mortgage.', '[\"first_name\", \"application_number\", \"broker_name\"]', 1, 0, 1, '2026-03-12 22:34:43', '2026-03-24 22:36:04'),
(32, 1, 'Prequalified – Purchase Email 1', 'Initial welcome email on prequalification (purchase)', 'email', 'follow_up', '🏠 You\'re Prequalified! Here\'s What\'s Next', 'Hi {{first_name}},\n\nFantastic news — you\'ve been *prequalified* for your home purchase loan!\n\nApplication #: {{application_number}}\n\nBeing prequalified is a major milestone. Here\'s what comes next:\n\n1. We\'ll review your full application and documents.\n2. A formal pre-approval letter will follow once we confirm your details.\n3. You\'ll be in a strong position to make offers on homes!\n\nIf you have any questions or want to discuss your options, just reply to this email — we\'re here every step of the way.\n\n{{broker_name}}\nEncore Mortgage', '[\"first_name\", \"application_number\", \"broker_name\"]', 1, 0, 1, '2026-03-12 22:34:43', '2026-03-12 22:34:43'),
(33, 1, 'Prequalified – Purchase SMS 2', 'Day-2 follow-up SMS (purchase)', 'sms', 'reminder', NULL, 'Hi {{first_name}}, it\'s {{broker_name}} from Encore Mortgage. You\'re prequalified for your home purchase (#{{application_number}}) — don\'t let this momentum slow down! Ready to talk next steps? Reply here or give us a call.', '[\"first_name\", \"application_number\", \"broker_name\"]', 1, 0, 1, '2026-03-12 22:34:43', '2026-03-24 22:36:04'),
(34, 1, 'Prequalified – Purchase SMS 3', 'Day-4 check-in SMS (purchase)', 'sms', 'reminder', NULL, 'Hi {{first_name}}! 👋 Quick check-in from {{broker_name}} at Encore Mortgage. Your prequalification for loan #{{application_number}} is still active. Are you actively looking for homes? We can help you move fast when you find the one. Reply anytime!', '[\"first_name\", \"application_number\", \"broker_name\"]', 1, 0, 1, '2026-03-12 22:34:43', '2026-03-24 22:36:04'),
(35, 1, 'Prequalified – Purchase Email 2', 'Day-4 follow-up email with resources (purchase)', 'email', 'follow_up', 'Still Looking for the Right Home? We\'re Here When You\'re Ready', 'Hi {{first_name}},\n\nJust circling back on your prequalification (#{{application_number}}).\n\nWe know home shopping takes time — and we want you to know we\'re here whenever you\'re ready to move forward. Whether you have questions about the process, want to understand your buying power, or are ready to lock in your rate, we\'re just a reply away.\n\nA few things to keep in mind:\n• Your prequalification is still active.\n• Interest rates can change — locking in sooner can save you money.\n• We can issue a pre-approval letter the moment you find the right home.\n\nLet\'s keep this moving!\n\n{{broker_name}}\nEncore Mortgage', '[\"first_name\", \"application_number\", \"broker_name\"]', 1, 0, 1, '2026-03-12 22:34:43', '2026-03-12 22:34:43'),
(36, 1, 'Prequalified – Purchase SMS 4', 'Day-7 nudge SMS (purchase)', 'sms', 'reminder', NULL, 'Hi {{first_name}}, {{broker_name}} here. Your home purchase prequalification (#{{application_number}}) is ready and waiting! Once you find a home you love, we can move quickly. Have questions about your max purchase price or next steps? Reply and I\'ll help!', '[\"first_name\", \"application_number\", \"broker_name\"]', 1, 0, 1, '2026-03-12 22:34:43', '2026-03-24 22:36:04'),
(37, 1, 'Prequalified – Purchase SMS 5', 'Day-11 re-engagement SMS (purchase)', 'sms', 'reminder', NULL, 'Hey {{first_name}}! 🏡 Still thinking about buying a home? Your prequalification (#{{application_number}}) is still active. I\'d love to help you get to the finish line. Let\'s connect — reply or call me today! – {{broker_name}}, Encore Mortgage.', '[\"first_name\", \"application_number\", \"broker_name\"]', 1, 0, 1, '2026-03-12 22:34:43', '2026-03-24 22:36:04'),
(38, 1, 'Prequalified – Purchase Email 3', 'Day-14 re-engagement email (purchase)', 'email', 'follow_up', 'Your Home Purchase Prequalification Is Still Active — Let\'s Talk', 'Hi {{first_name}},\n\nI wanted to personally reach out regarding your prequalification (#{{application_number}}).\n\nBuying a home is one of the biggest decisions you\'ll make — and I want to make sure you feel fully supported. If anything has changed in your situation, or if you have concerns about the process, I\'m here to help.\n\nAre you:\n• Still searching for the right home?\n• Unsure about your budget or buying power?\n• Waiting on something specific before moving forward?\n\nJust reply to this email and let\'s have a quick conversation. No pressure — just here to help.\n\n{{broker_name}}\nEncore Mortgage', '[\"first_name\", \"application_number\", \"broker_name\"]', 1, 0, 1, '2026-03-12 22:34:43', '2026-03-12 22:34:43'),
(39, 1, 'Prequalified – Purchase SMS 6', 'Day-17 final SMS before last sequence (purchase)', 'sms', 'reminder', NULL, 'Hi {{first_name}}, {{broker_name}} from Encore Mortgage. I\'ve been trying to connect about your home purchase prequalification (#{{application_number}}). I\'d love to help make your homeownership dream a reality. This is my last automated check-in — reply anytime and I\'ll pick it right up!', '[\"first_name\", \"application_number\", \"broker_name\"]', 1, 0, 1, '2026-03-12 22:34:43', '2026-03-24 22:36:04'),
(40, 1, 'Prequalified – Purchase SMS 7', 'Day-20 final attempt SMS (purchase)', 'sms', 'reminder', NULL, 'Hi {{first_name}}, one final note from {{broker_name}} at Encore Mortgage about your home purchase prequalification (#{{application_number}}). Rates are always moving — if you\'re ready to act, we\'re ready to move fast for you. Reply or call us today.', '[\"first_name\", \"application_number\", \"broker_name\"]', 1, 0, 1, '2026-03-12 22:34:43', '2026-03-24 22:36:04'),
(41, 1, 'Prequalified – Purchase Email 4', 'Day-25 final email before internal notification (purchase)', 'email', 'follow_up', 'A Final Note on Your Home Purchase Prequalification', 'Hi {{first_name}},\n\nThis is our final automated message regarding your home purchase prequalification (#{{application_number}}).\n\nWe\'ve reached out several times and want to make sure you know we\'re still here. If now isn\'t the right time, that\'s completely okay — just know that when you\'re ready, we\'ll be ready too.\n\nFeel free to reach out at any time. Your prequalification can be updated and a pre-approval can be issued quickly when the moment is right.\n\nWishing you all the best,\n\n{{broker_name}}\nEncore Mortgage', '[\"first_name\", \"application_number\", \"broker_name\"]', 1, 0, 1, '2026-03-12 22:34:43', '2026-03-12 22:34:43'),
(42, 1, 'Prequalified – Refi SMS 1', 'Initial SMS on prequalification (refi)', 'sms', 'follow_up', NULL, 'Hi {{first_name}}! 🔄 You\'ve been prequalified for your refinance (#{{application_number}})! We\'re ready to help you lock in a better rate or access your equity. Questions? Reply anytime! – {{broker_name}}, Encore Mortgage.', '[\"first_name\", \"application_number\", \"broker_name\"]', 1, 0, 1, '2026-03-12 22:34:43', '2026-03-24 22:36:04'),
(43, 1, 'Prequalified – Refi Email 1', 'Initial welcome email on prequalification (refi)', 'email', 'follow_up', '🔄 You\'re Prequalified to Refinance — Here\'s What\'s Next', 'Hi {{first_name}},\n\nExcellent news — you\'ve been *prequalified* for your refinance!\n\nApplication #: {{application_number}}\n\nYour prequalification means we\'ve reviewed your initial information and you\'re in a great position to move forward. Here\'s what to expect next:\n\n1. We\'ll complete a full review of your application.\n2. An appraisal may be required depending on your loan program.\n3. We\'ll guide you through locking in your rate at the right moment.\n\nRefinancing now could mean significant monthly savings. Let\'s get this done!\n\nReply to this email with any questions — we\'re ready to move quickly.\n\n{{broker_name}}\nEncore Mortgage', '[\"first_name\", \"application_number\", \"broker_name\"]', 1, 0, 1, '2026-03-12 22:34:43', '2026-03-12 22:34:43'),
(44, 1, 'Prequalified – Refi SMS 2', 'Day-2 follow-up SMS (refi)', 'sms', 'reminder', NULL, 'Hi {{first_name}}, {{broker_name}} from Encore Mortgage here. Your refinance prequalification (#{{application_number}}) is ready to move forward. Rates are shifting — locking in now could save you thousands. Ready to take the next step? Reply here!', '[\"first_name\", \"application_number\", \"broker_name\"]', 1, 0, 1, '2026-03-12 22:34:43', '2026-03-24 22:36:04'),
(45, 1, 'Prequalified – Refi SMS 3', 'Day-4 check-in SMS (refi)', 'sms', 'reminder', NULL, 'Hi {{first_name}}! Quick check-in from {{broker_name}} at Encore Mortgage. Your refinance prequalification (#{{application_number}}) is active and your potential savings are waiting. Have questions about the process or your rate options? Just reply!', '[\"first_name\", \"application_number\", \"broker_name\"]', 1, 0, 1, '2026-03-12 22:34:43', '2026-03-24 22:36:04'),
(46, 1, 'Prequalified – Refi Email 2', 'Day-4 follow-up email (refi)', 'email', 'follow_up', 'Your Refinance Prequalification Is Active — Don\'t Miss This Window', 'Hi {{first_name}},\n\nFollowing up on your refinance prequalification (#{{application_number}}).\n\nWith rates constantly changing, acting sooner rather than later can make a real difference in your monthly payment and total interest paid. Here\'s a quick snapshot of how refinancing can help:\n\n💰 Lower your monthly payment\n🔒 Lock in a fixed rate for stability\n💵 Access home equity for renovations or debt consolidation\n📅 Shorten your loan term\n\nWe can run the numbers with you at no cost. Just reply and we\'ll set up a quick call.\n\n{{broker_name}}\nEncore Mortgage', '[\"first_name\", \"application_number\", \"broker_name\"]', 1, 0, 1, '2026-03-12 22:34:43', '2026-03-12 22:34:43'),
(47, 1, 'Prequalified – Refi SMS 4', 'Day-7 nudge SMS (refi)', 'sms', 'reminder', NULL, 'Hi {{first_name}}, {{broker_name}} here from Encore Mortgage. Still thinking about your refinance (#{{application_number}})? No pressure — but I want to make sure you don\'t miss out on a favorable rate. I\'m here whenever you\'re ready. Reply anytime!', '[\"first_name\", \"application_number\", \"broker_name\"]', 1, 0, 1, '2026-03-12 22:34:43', '2026-03-24 22:36:04'),
(48, 1, 'Prequalified – Refi SMS 5', 'Day-11 re-engagement SMS (refi)', 'sms', 'reminder', NULL, 'Hey {{first_name}}! 💰 Your refinance prequalification (#{{application_number}}) is still open. Homeowners who refinance at the right time can save hundreds per month. Let\'s find out what\'s possible for you — reply or call me today! – {{broker_name}}, Encore Mortgage.', '[\"first_name\", \"application_number\", \"broker_name\"]', 1, 0, 1, '2026-03-12 22:34:43', '2026-03-24 22:36:04'),
(49, 1, 'Prequalified – Refi Email 3', 'Day-14 re-engagement email (refi)', 'email', 'follow_up', 'Still Thinking About Refinancing? Let\'s Talk', 'Hi {{first_name}},\n\nI wanted to personally reach out about your refinance prequalification (#{{application_number}}).\n\nI understand refinancing can feel like a big decision. I\'m here to simplify it for you and make sure you\'re making the best move for your financial situation.\n\nSome questions I can help answer:\n• How much could I save monthly by refinancing?\n• Is now a good time to lock in a rate?\n• What documents will I need?\n• How long does the process take?\n\nJust reply to this email and let\'s get on a quick 10-minute call. There\'s no obligation — just clarity.\n\n{{broker_name}}\nEncore Mortgage', '[\"first_name\", \"application_number\", \"broker_name\"]', 1, 0, 1, '2026-03-12 22:34:43', '2026-03-12 22:34:43'),
(50, 1, 'Prequalified – Refi SMS 6', 'Day-17 final SMS before last sequence (refi)', 'sms', 'reminder', NULL, 'Hi {{first_name}}, {{broker_name}} from Encore Mortgage. I\'ve been following up on your refinance prequalification (#{{application_number}}) and I really want to help. This is my last automated message — reply anytime and I\'ll be happy to pick up right where we left off.', '[\"first_name\", \"application_number\", \"broker_name\"]', 1, 0, 1, '2026-03-12 22:34:43', '2026-03-24 22:36:04'),
(51, 1, 'Prequalified – Refi SMS 7', 'Day-20 final attempt SMS (refi)', 'sms', 'reminder', NULL, 'Hi {{first_name}}, one final note from {{broker_name}} at Encore Mortgage on your refinance prequalification (#{{application_number}}). Whether you want to lower your rate, reduce your term, or tap equity — we\'re ready when you are. Call or reply today.', '[\"first_name\", \"application_number\", \"broker_name\"]', 1, 0, 1, '2026-03-12 22:34:43', '2026-03-24 22:36:04'),
(52, 1, 'Prequalified – Refi Email 4', 'Day-25 final email before internal notification (refi)', 'email', 'follow_up', 'A Final Note on Your Refinance Prequalification', 'Hi {{first_name}},\n\nThis is our final automated message about your refinance prequalification (#{{application_number}}).\n\nWe\'ve genuinely enjoyed the opportunity to work with you and hope we\'ll hear from you when the time is right. Refinancing is always on the table — rates and programs change, and we\'ll be here.\n\nIf you ever want a fresh look at your options, don\'t hesitate to reach out.\n\nWishing you all the best,\n\n{{broker_name}}\nEncore Mortgage', '[\"first_name\", \"application_number\", \"broker_name\"]', 1, 0, 1, '2026-03-12 22:34:43', '2026-03-12 22:34:43'),
(53, 1, 'Prequalified – Internal All-User Notification', 'Internal notification to all users after full prequalified sequence without response', 'email', 'system', '[ACTION NEEDED] Prequalified Client Has Not Responded — Full Sequence Completed', 'Hello Team,\n\nThis is an automated internal alert.\n\nClient {{client_name}} completed the full Prequalified automated reminder sequence without responding. Personal outreach is now recommended.\n\nApplication Details:\n• Client: {{client_name}}\n• Application #: {{application_number}}\n• Loan Type: {{loan_type}}\n• Status: Prequalified\n\nPlease coordinate internally and assign a team member to follow up directly.\n\n— Encore Mortgage Automation', '[\"client_name\", \"application_number\", \"loan_type\"]', 1, 0, 1, '2026-03-12 22:34:43', '2026-03-12 22:34:43'),
(54, 1, 'Preapproved – Purchase SMS 1', 'Initial SMS on pre-approval (purchase)', 'sms', 'follow_up', NULL, 'Hi {{first_name}}! 🏡 Big news — you\'ve been *pre-approved* for your home purchase loan (#{{application_number}})! This is a major step. Your pre-approval letter is ready and you can start making offers confidently. Questions? Reply anytime! – {{broker_name}}, Encore Mortgage.', '[\"first_name\", \"application_number\", \"broker_name\"]', 1, 0, 1, '2026-03-12 22:47:43', '2026-03-24 22:36:04'),
(55, 1, 'Preapproved – Purchase Email 1', 'Initial welcome email on pre-approval (purchase)', 'email', 'follow_up', '🎉 Congratulations — You\'re Pre-Approved to Buy a Home!', 'Hi {{first_name}},\n\nExciting news — you have been officially *pre-approved* for your home purchase loan!\n\nApplication #: {{application_number}}\n\nThis is a significant milestone. Here\'s what your pre-approval means for you:\n\n✅ You know exactly how much you can borrow\n✅ Sellers will take your offers seriously\n✅ We can issue your pre-approval letter the moment you need it\n✅ You\'re one step closer to the keys!\n\nHere\'s what comes next:\n1. Start touring homes confidently within your budget.\n2. When you find the one, notify us immediately — we move fast.\n3. We\'ll guide you through the offer, appraisal, and closing process.\n\nHave questions about your pre-approval or the buying process? Reply to this email — we\'re here for you.\n\n{{broker_name}}\nEncore Mortgage', '[\"first_name\", \"application_number\", \"broker_name\"]', 1, 0, 1, '2026-03-12 22:47:43', '2026-03-12 22:47:43'),
(56, 1, 'Preapproved – Refi SMS 1', 'Initial SMS on pre-approval (refi)', 'sms', 'follow_up', NULL, 'Hi {{first_name}}! 🔄 Great news — you\'ve been *pre-approved* for your refinance (#{{application_number}})! We\'re ready to lock in your rate and move forward. Want to schedule a quick call to review your options? Reply here! – {{broker_name}}, Encore Mortgage.', '[\"first_name\", \"application_number\", \"broker_name\"]', 1, 0, 1, '2026-03-12 22:47:43', '2026-03-24 22:36:04'),
(57, 1, 'Preapproved – Refi Email 1', 'Initial welcome email on pre-approval (refi)', 'email', 'follow_up', '🎉 Congratulations — You\'re Pre-Approved to Refinance!', 'Hi {{first_name}},\n\nGreat news — you\'ve been officially *pre-approved* for your refinance!\n\nApplication #: {{application_number}}\n\nHere\'s what this means for you:\n\n💰 Your new rate and payment have been estimated\n🔒 You\'re ready to lock in your rate at any time\n📋 We\'ve reviewed your financials and documents look good\n⚡ We can move quickly once you give the go-ahead\n\nNext steps:\n1. Review your pre-approval terms (we\'ll walk you through them).\n2. Decide when you\'d like to lock in your rate.\n3. Authorize us to order the appraisal if applicable.\n\nRefinancing now could reduce your monthly payment, shorten your loan term, or give you access to cash equity. Let\'s get this done!\n\nReply to this email with any questions.\n\n{{broker_name}}\nEncore Mortgage', '[\"first_name\", \"application_number\", \"broker_name\"]', 1, 0, 1, '2026-03-12 22:47:43', '2026-03-12 22:47:43'),
(58, 1, 'Preapproved – SMS Follow-Up 02', 'Day-2 check-in SMS', 'sms', 'reminder', NULL, 'Hi {{first_name}}, {{broker_name}} here from Encore Mortgage. Just checking in on your pre-approval (#{{application_number}}). Do you have any questions or need help with the next steps? We\'re ready to move fast when you are. Reply anytime!', '[\"first_name\", \"application_number\", \"broker_name\"]', 1, 0, 1, '2026-03-12 22:47:43', '2026-03-24 22:36:04'),
(59, 1, 'Preapproved – SMS Follow-Up 03', 'Day-4 SMS (before email)', 'sms', 'reminder', NULL, 'Hey {{first_name}}! Quick reminder from {{broker_name}} at Encore Mortgage — your pre-approval (#{{application_number}}) is active and ready. Are you actively working with a realtor? I can recommend one if needed or help coordinate the offer process. Just reply!', '[\"first_name\", \"application_number\", \"broker_name\"]', 1, 0, 1, '2026-03-12 22:47:43', '2026-03-24 22:36:04'),
(60, 1, 'Preapproved – Email Follow-Up 02', 'Day-4 email follow-up', 'email', 'follow_up', 'Your Pre-Approval Is Active — Here\'s How We Can Help You Move Faster', 'Hi {{first_name}},\n\nJust following up on your pre-approval (#{{application_number}}).\n\nWe know the home search can take time — and we\'re here to support you through every step.\n\nHere\'s how Encore Mortgage can help you move faster:\n\n🏡 We can issue pre-approval letters on demand (even on weekends)\n📞 We\'re available to speak with listing agents to strengthen your offer\n⚡ We offer fast closings that sellers love\n📊 We can run updated rate scenarios based on your target price range\n\nJust reply or call us whenever you\'re ready. We move at your pace!\n\n{{broker_name}}\nEncore Mortgage', '[\"first_name\", \"application_number\", \"broker_name\"]', 1, 0, 1, '2026-03-12 22:47:43', '2026-03-12 22:47:43'),
(61, 1, 'Preapproved – SMS Follow-Up 04', 'Day-6 SMS (before wait3d)', 'sms', 'reminder', NULL, 'Hi {{first_name}}, {{broker_name}} from Encore Mortgage. Your pre-approval (#{{application_number}}) is still fully active. Remember — sellers love buyers who already have pre-approval in hand! Let us know if you need a letter for a specific property. Reply anytime.', '[\"first_name\", \"application_number\", \"broker_name\"]', 1, 0, 1, '2026-03-12 22:47:43', '2026-03-24 22:36:04'),
(62, 1, 'Preapproved – SMS Follow-Up 05', 'Day-9 SMS (after wait3d)', 'sms', 'reminder', NULL, 'Hi {{first_name}}! 👋 {{broker_name}} here. Checking in again on your pre-approval (#{{application_number}}). Have you found any properties you\'re interested in? Even if you\'re just starting to look, I can help you understand what fits your budget. Reply and let\'s chat!', '[\"first_name\", \"application_number\", \"broker_name\"]', 1, 0, 1, '2026-03-12 22:47:43', '2026-03-24 22:36:04'),
(63, 1, 'Preapproved – Email Follow-Up 03', 'Day-9 email follow-up', 'email', 'follow_up', 'Tips for Making the Most of Your Pre-Approval', 'Hi {{first_name}},\n\nI wanted to share a few tips to help you make the most of your pre-approval (#{{application_number}}) while you search for the right home.\n\n**Do\'s while your pre-approval is active:**\n✅ Continue monitoring listings in your target area\n✅ Keep your finances stable (avoid large purchases or new credit)\n✅ Stay in touch with your realtor on new inventory\n✅ Contact us immediately when you find a home you want to offer on\n\n**Don\'ts:**\n❌ Don\'t open new credit cards or take on new debt\n❌ Don\'t change jobs without letting us know\n❌ Don\'t make large cash deposits without documentation\n\nKeeping these in mind will help ensure a smooth closing when the time comes. Any questions? I\'m always here.\n\n{{broker_name}}\nEncore Mortgage', '[\"first_name\", \"application_number\", \"broker_name\"]', 1, 0, 1, '2026-03-12 22:47:43', '2026-03-12 22:47:43'),
(64, 1, 'Preapproved – SMS Follow-Up 06', 'Day-12 SMS (after wait3d, before email)', 'sms', 'reminder', NULL, 'Hi {{first_name}}, it\'s {{broker_name}} from Encore Mortgage. Still thinking about your loan (#{{application_number}})? Rates can change week to week — if you\'re close to making an offer, now might be a great time to discuss locking in your rate. Reply or call me today!', '[\"first_name\", \"application_number\", \"broker_name\"]', 1, 0, 1, '2026-03-12 22:47:43', '2026-03-24 22:36:04'),
(65, 1, 'Preapproved – Email Follow-Up 04', 'Day-12 email follow-up', 'email', 'follow_up', 'Have You Considered Locking In Your Rate?', 'Hi {{first_name}},\n\nFollowing up on your pre-approval (#{{application_number}}).\n\nOne of the most important decisions in your mortgage journey is *when* to lock in your rate. A rate lock protects you from increases while you finalize your home purchase or refinance.\n\nHere\'s what you should know:\n\n📌 Rate locks are typically 30–60 days\n📌 Locking in now could protect you from rising rates\n📌 We monitor the market daily to advise the best timing\n\nWould you like to discuss your rate lock options? Just reply to this email or give me a call and we\'ll walk through the numbers together.\n\n{{broker_name}}\nEncore Mortgage', '[\"first_name\", \"application_number\", \"broker_name\"]', 1, 0, 1, '2026-03-12 22:47:43', '2026-03-12 22:47:43'),
(66, 1, 'Preapproved – SMS Follow-Up 07', 'Day-15 SMS (after wait3d)', 'sms', 'reminder', NULL, 'Hey {{first_name}}! 📲 {{broker_name}} from Encore Mortgage. Two weeks since your pre-approval (#{{application_number}}) — just wanted to check in. Is there anything we can do to help your home search move forward? We\'re here to support you however we can. Reply!', '[\"first_name\", \"application_number\", \"broker_name\"]', 1, 0, 1, '2026-03-12 22:47:43', '2026-03-24 22:36:04'),
(67, 1, 'Preapproved – SMS Follow-Up 08', 'Day-17 SMS (after wait2d)', 'sms', 'reminder', NULL, 'Hi {{first_name}}, {{broker_name}} here. Just a quick note — your pre-approval (#{{application_number}}) is still ready for action. The market moves fast; when you\'re ready to make an offer, we can provide a same-day pre-approval letter. Don\'t hesitate to reach out!', '[\"first_name\", \"application_number\", \"broker_name\"]', 1, 0, 1, '2026-03-12 22:47:43', '2026-03-24 22:36:04'),
(68, 1, 'Preapproved – SMS Follow-Up 09', 'Day-19 SMS (after wait2d)', 'sms', 'reminder', NULL, 'Hi {{first_name}}! {{broker_name}} from Encore Mortgage checking in. It\'s been a couple of weeks since your pre-approval (#{{application_number}}). How\'s the home search going? Whether you\'re close to an offer or still browsing, I\'m here to help. Reply anytime!', '[\"first_name\", \"application_number\", \"broker_name\"]', 1, 0, 1, '2026-03-12 22:47:43', '2026-03-24 22:36:04'),
(69, 1, 'Preapproved – SMS Follow-Up 10', 'Day-21 SMS (after wait2d)', 'sms', 'reminder', NULL, 'Hello {{first_name}}! Quick check from {{broker_name}} at Encore Mortgage. Your pre-approval (#{{application_number}}) is still active. If you\'ve been hesitant about the process or costs, let\'s talk — I can walk you through everything with no pressure. Reply here!', '[\"first_name\", \"application_number\", \"broker_name\"]', 1, 0, 1, '2026-03-12 22:47:43', '2026-03-24 22:36:04'),
(70, 1, 'Preapproved – SMS Follow-Up 11', 'Day-23 SMS (after wait2d)', 'sms', 'reminder', NULL, 'Hi {{first_name}}, {{broker_name}} from Encore Mortgage. I know life gets busy — just a friendly reminder that your pre-approval (#{{application_number}}) is still here and ready. When you find the right home, we\'ll be ready to move instantly. Reply or call anytime!', '[\"first_name\", \"application_number\", \"broker_name\"]', 1, 0, 1, '2026-03-12 22:47:43', '2026-03-24 22:36:04'),
(71, 1, 'Preapproved – SMS Follow-Up 12', 'Day-28 SMS (after wait5d, before email)', 'sms', 'reminder', NULL, 'Hi {{first_name}}! It\'s been about 4 weeks since your pre-approval (#{{application_number}}). {{broker_name}} here from Encore Mortgage — I just wanted to personally check in. Have your needs or circumstances changed? I can update your pre-approval at any time. Reply here or call me!', '[\"first_name\", \"application_number\", \"broker_name\"]', 1, 0, 1, '2026-03-12 22:47:43', '2026-03-24 22:36:04'),
(72, 1, 'Preapproved – Email Follow-Up 05', 'Day-28 email (after wait5d)', 'email', 'follow_up', 'One Month In — Your Pre-Approval Remains Ready', 'Hi {{first_name}},\n\nA month has passed since your pre-approval (#{{application_number}}), and we\'re still here cheering you on!\n\nWe understand that finding the right home takes time, and we never want to rush a decision this important. But we do want to make sure you have all the support you need.\n\nA few things worth knowing at this stage:\n\n📅 Pre-approvals are typically valid for 60–90 days from the credit check date. If yours is approaching expiration, we can refresh it quickly with a soft update.\n\n📊 Have your income, employment, or finances changed? Let us know and we\'ll update your file accordingly.\n\n🏠 If you\'ve been looking at properties outside your current pre-approved range, we can explore options.\n\nJust reply to this email and let\'s review where things stand.\n\n{{broker_name}}\nEncore Mortgage', '[\"first_name\", \"application_number\", \"broker_name\"]', 1, 0, 1, '2026-03-12 22:47:43', '2026-03-12 22:47:43'),
(73, 1, 'Preapproved – Email Follow-Up 06', 'Day-38 email (after wait10d)', 'email', 'follow_up', 'Week 5 Check-In: Your Mortgage Questions Answered', 'Hi {{first_name}},\n\nHope you\'re well! We\'re still here to support your loan process (#{{application_number}}).\n\nWe thought we\'d take a moment to answer some of the most common questions we hear at this stage:\n\n**Q: Is my pre-approval letter still valid?**\nA: Pre-approvals are typically good for 60–90 days. Let us know if you\'re approaching that window.\n\n**Q: What if I find a home over my pre-approved amount?**\nA: We can review your financials and potentially increase your pre-approval. Just reach out.\n\n**Q: How quickly can we close once I have a signed contract?**\nA: We strive for 21–30 day closings for our prepared clients like you.\n\n**Q: What if interest rates have changed since my pre-approval?**\nA: We\'ll run updated numbers before you make an offer — no surprises.\n\nHave a question not listed here? Just reply — we\'re happy to help.\n\n{{broker_name}}\nEncore Mortgage', '[\"first_name\", \"application_number\", \"broker_name\"]', 1, 0, 1, '2026-03-12 22:47:43', '2026-03-12 22:47:43'),
(74, 1, 'Preapproved – Email Follow-Up 07', 'Day-48 email (after wait10d)', 'email', 'follow_up', 'Week 7 — Still Here, Still Ready to Help You Close', 'Hi {{first_name}},\n\nJust checking in on your loan file #{{application_number}}.\n\nWe know life happens — whether it\'s been a competitive market, shifting personal priorities, or simply taking the time to find the right fit, we\'re here without judgment.\n\nAt Encore Mortgage, our goal is simple: to be your trusted partner when you\'re ready to move. There\'s no pressure and no deadline from our side.\n\nThat said, if there\'s anything slowing you down — financing questions, budget concerns, or uncertainty about the process — we\'d love to help clear it up.\n\nJust hit reply and let\'s talk.\n\n{{broker_name}}\nEncore Mortgage', '[\"first_name\", \"application_number\", \"broker_name\"]', 1, 0, 1, '2026-03-12 22:47:43', '2026-03-12 22:47:43'),
(75, 1, 'Preapproved – Email Follow-Up 08', 'Day-63 email (after wait15d)', 'email', 'follow_up', 'Two Months Since Your Pre-Approval — Let\'s Reconnect', 'Hi {{first_name}},\n\nIt\'s been about two months since your pre-approval for loan #{{application_number}}.\n\nWe want to be straightforward with you: pre-approvals have an expiration date, and if yours is close to expiring, we\'d recommend we reconnect to refresh your file. This is typically a quick and painless process.\n\nHere\'s what a refreshed pre-approval means:\n✅ Updated rate quotes based on current market conditions\n✅ Confirms your financial picture is still on track\n✅ Gives you renewed confidence heading into offers\n\nAlternatively, if your plans have changed or if this simply isn\'t the right time, we understand completely — just let us know so we can properly update your file.\n\nReply to this email to reconnect. We\'d love to hear from you.\n\n{{broker_name}}\nEncore Mortgage', '[\"first_name\", \"application_number\", \"broker_name\"]', 1, 0, 1, '2026-03-12 22:47:43', '2026-03-12 22:47:43'),
(76, 1, 'Preapproved – Email Follow-Up 09', 'Day-73 email (after wait10d)', 'email', 'follow_up', 'Week 10 — A Personal Note From Your Loan Officer', 'Hi {{first_name}},\n\nI wanted to reach out personally about your loan file #{{application_number}}.\n\nYour pre-approval was an important step and I\'ve been following your file closely. I know the home buying (or refinancing) journey can be full of unexpected twists, and I want you to know I\'m in your corner.\n\nIf there\'s anything — questions, concerns, change in plans, or if you\'re finally ready to move — please don\'t hesitate to reply or call me directly.\n\nYour goals matter to us. We\'re not just processing loans — we\'re helping families achieve something meaningful. I\'d be honored to help you get to the finish line.\n\n{{broker_name}}\nEncore Mortgage', '[\"first_name\", \"application_number\", \"broker_name\"]', 1, 0, 1, '2026-03-12 22:47:43', '2026-03-12 22:47:43');
INSERT INTO `templates` (`id`, `tenant_id`, `name`, `description`, `template_type`, `category`, `subject`, `body`, `variables`, `is_active`, `usage_count`, `created_by_broker_id`, `created_at`, `updated_at`) VALUES
(77, 1, 'Preapproved – Email Follow-Up 10', 'Day-88 email (after wait15d)', 'email', 'follow_up', 'Final Reminder: Your Pre-Approval May Be Expiring Soon', 'Hi {{first_name}},\n\nThis is an important update regarding your pre-approval for loan #{{application_number}}.\n\nMost pre-approvals are valid for 60–90 days from the initial credit check. If we haven\'t reconnected recently, your pre-approval may be approaching or have passed its expiration date.\n\nThis doesn\'t mean you\'re out of options — it simply means we\'ll need to do a quick refresh of your file to issue a current pre-approval letter.\n\nOptions moving forward:\n1. **Renew your pre-approval** — quick process, usually same-day\n2. **Update your file** if circumstances have changed\n3. **Let us know if you\'d like to pause** — we\'ll note your file accordingly\n\nPlease reply to this email so we can best support you from here.\n\n{{broker_name}}\nEncore Mortgage', '[\"first_name\", \"application_number\", \"broker_name\"]', 1, 0, 1, '2026-03-12 22:47:43', '2026-03-12 22:47:43'),
(78, 1, 'Preapproved – Email Final', 'Final email after full sequence (no wait before this)', 'email', 'follow_up', 'We\'re Here Whenever You\'re Ready — No Pressure', 'Hi {{first_name}},\n\nThis is our final automated message regarding your pre-approval for loan #{{application_number}}.\n\nWe\'ve reached out multiple times over the past few months because we genuinely believe in helping you achieve your goals. But we also respect your timeline and understand that life has its own pace.\n\nWhenever you\'re ready — whether it\'s tomorrow or six months from now — we will be here. Just reach out and we\'ll pick up right where we left off.\n\nThank you for giving Encore Mortgage the opportunity to serve you. We look forward to celebrating your success when the time is right.\n\nWarm regards,\n\n{{broker_name}}\nEncore Mortgage', '[\"first_name\", \"application_number\", \"broker_name\"]', 1, 0, 1, '2026-03-12 22:47:43', '2026-03-12 22:47:43'),
(79, 1, 'Under Contract/Loan Set Up – SMS', 'Immediate SMS when loan enters Under Contract / Loan Set Up status', 'sms', 'follow_up', NULL, 'Hi {{first_name}}! 🎉 Congratulations — you\'re officially under contract! Your loan (#{{application_number}}) is now in the setup phase and we\'re working hard to keep things moving. We\'ll keep you updated every step of the way. Questions? Reply anytime! – {{broker_name}}, Encore Mortgage.', '[\"first_name\", \"application_number\", \"broker_name\"]', 1, 0, 1, '2026-03-12 22:50:22', '2026-03-24 22:36:04'),
(80, 1, 'Under Contract/Loan Set Up – Email', 'Immediate email when loan enters Under Contract / Loan Set Up status', 'email', 'follow_up', '🏡 You\'re Under Contract — Here\'s What Happens Next', 'Hi {{first_name}},\n\nCongratulations — you\'re officially under contract! This is an exciting milestone, and our team at Encore Mortgage is fully focused on making your closing as smooth as possible.\n\nApplication #: {{application_number}}\n\nHere\'s what we\'re working on during the Loan Set Up phase:\n\n📋 **Loan File Review** — We\'re organizing and verifying all your documentation.\n🏠 **Appraisal Coordination** — We\'ll be ordering or scheduling your home appraisal shortly.\n🔒 **Rate Lock** — If you haven\'t locked your rate yet, now is the time. Let\'s discuss!\n📑 **Title & Escrow** — We\'re coordinating with title and escrow to ensure a clean transaction.\n\n**What you need to do right now:**\n1. Avoid opening new lines of credit or making large purchases.\n2. Keep your employment and income situation stable.\n3. Respond quickly to any document requests from our team — speed matters!\n4. Keep your phone and email accessible; we may need to reach you quickly.\n\n**Your estimated closing timeline** starts from today. We\'ll provide regular updates as we move through underwriting and approvals.\n\nIf you have any questions at any point, please don\'t hesitate to reach out. We\'re here for you through every step.\n\n{{broker_name}}\nEncore Mortgage', '[\"first_name\", \"application_number\", \"broker_name\"]', 1, 0, 1, '2026-03-12 22:50:22', '2026-03-12 22:50:22'),
(81, 1, 'Submitted to Underwriting – SMS', 'Immediate SMS when loan is submitted to underwriting', 'sms', 'follow_up', NULL, 'Hi {{first_name}}! 📋 Great news — your loan (#{{application_number}}) has been submitted to underwriting! This is a key milestone. Our underwriters will review your full file and we\'ll keep you posted on any updates. Hang tight — we\'re on it! – {{broker_name}}, Encore Mortgage.', '[\"first_name\", \"application_number\", \"broker_name\"]', 1, 0, 1, '2026-03-12 22:51:53', '2026-03-24 22:36:04'),
(82, 1, 'Submitted to Underwriting – Email', 'Immediate email when loan is submitted to underwriting', 'email', 'follow_up', '📋 Your Loan Has Been Submitted to Underwriting', 'Hi {{first_name}},\n\nWe have an important update on your loan (#{{application_number}}) — your file has been officially submitted to underwriting!\n\nThis is one of the most critical stages of the mortgage process, and we want to make sure you know exactly what to expect.\n\n**What is underwriting?**\nAn underwriter is a specialist who thoroughly reviews your loan file — including your income, assets, credit, and the property details — to make a final lending decision.\n\n**What happens during underwriting:**\n🔍 **Document Review** — The underwriter will verify all submitted documents.\n🏡 **Appraisal Review** — The property appraisal will be evaluated against the loan amount.\n💳 **Credit & Income Analysis** — Employment, income, and credit history are assessed in detail.\n⚖️ **Risk Assessment** — The underwriter determines if the loan meets all program guidelines.\n\n**Typical underwriting timeline:** 3–7 business days (can vary based on file complexity and lender volume).\n\n**What you can do to help speed things up:**\n✅ Respond immediately to any requests for additional documents or explanations.\n✅ Do NOT make any major financial changes — no new credit, large purchases, or job changes.\n✅ Keep your phone and email accessible in case we need to reach you urgently.\n✅ If you receive a \"Conditions\" list, gather those items as fast as possible.\n\n**What comes after underwriting?**\nOnce the underwriter reviews your file, you\'ll receive one of three outcomes:\n- ✅ **Approved** — Congratulations! We move to closing.\n- ⚠️ **Approved with Conditions** — Minor items needed before final approval.\n- ❌ **Suspended/Denied** — We\'ll discuss options if this happens (it\'s rare for well-prepared files like yours).\n\nWe\'re working hard and will keep you updated. If you have any questions in the meantime, don\'t hesitate to reach out.\n\n{{broker_name}}\nEncore Mortgage', '[\"first_name\", \"application_number\", \"broker_name\"]', 1, 0, 1, '2026-03-12 22:51:53', '2026-03-12 22:51:53'),
(83, 1, 'Approved with Conditions – SMS', 'Immediate SMS when loan is approved with conditions', 'sms', 'follow_up', NULL, 'Hi {{first_name}}! 🎉 Your loan (#{{application_number}}) has been *approved with conditions*! This means the underwriter has approved your loan pending a few items we need to clear. We\'ll send you details by email shortly. Don\'t worry — this is very common and we\'ll guide you through every item. – {{broker_name}}, Encore Mortgage.', '[\"first_name\", \"application_number\", \"broker_name\"]', 1, 0, 1, '2026-03-12 22:55:02', '2026-03-24 22:36:04'),
(84, 1, 'Approved with Conditions – Email', 'Immediate email when loan is approved with conditions', 'email', 'follow_up', '✅ Your Loan Is Approved — With Conditions', 'Hi {{first_name}},\n\nGreat news — your loan (#{{application_number}}) has been reviewed by underwriting and you have been issued an **Approval with Conditions**!\n\nThis is a very common and positive outcome. It means the underwriter has approved your loan in principle, but requires a few additional items before issuing a final clear-to-close.\n\n**What \"Approved with Conditions\" means:**\n✅ The core of your loan file has passed underwriting review.\n⚠️ There are specific conditions (items) that must be satisfied before final approval.\n📋 Once all conditions are cleared, you\'ll receive a \"Clear to Close\" — the final milestone before signing!\n\n**Common conditions may include:**\n• Additional income documentation (pay stubs, tax returns, letters of explanation)\n• Updated bank statements\n• Clarification letters on large deposits or inquiries\n• Homeowner\'s insurance confirmation\n• Title commitments or HOA documents\n• Property repair requirements from the appraisal\n\n**What you need to do RIGHT NOW:**\n1. Watch for a follow-up message or call from our team with your specific conditions list.\n2. Gather and submit the required documents as quickly as possible — speed is critical at this stage.\n3. Do NOT make any financial changes — no new credit, large purchases, or job changes.\n4. Contact your homeowner\'s insurance agent immediately if not already done.\n\n**Timeline:** Once all conditions are submitted and reviewed, final approval typically happens within 1–3 business days.\n\nWe\'re so close to the finish line! Our team is working hard on your behalf. If you have any questions about your specific conditions, please reply or call us right away.\n\n{{broker_name}}\nEncore Mortgage', '[\"first_name\", \"application_number\", \"broker_name\"]', 1, 0, 1, '2026-03-12 22:55:02', '2026-03-12 22:55:02'),
(85, 1, 'Approved with Conditions – Notify Buyer Agent (Internal)', 'Internal notification to contact the buyer\'s agent about the approval with conditions', 'email', 'system', '[ACTION] Notify Buyer Agent — Loan Approved with Conditions', 'Hello Team,\n\nThis is an automated internal alert.\n\nLoan #{{application_number}} for client {{client_name}} has been **Approved with Conditions** by underwriting.\n\nAction Required: Please contact the **Buyer\'s Agent** immediately to inform them of the conditional approval and update them on the conditions that need to be cleared before a Clear to Close can be issued.\n\nKey points to communicate to the Buyer\'s Agent:\n• The loan has passed underwriting review with conditions\n• Conditions must be cleared promptly to meet the closing timeline\n• Any cooperation needed (e.g. addenda, HOA docs) should be addressed immediately\n• Keep the seller\'s agent informed as needed to avoid closing delays\n\nLoan Details:\n• Client: {{client_name}}\n• Application #: {{application_number}}\n• Loan Type: {{loan_type}}\n• Status: Approved with Conditions\n\nPlease log your outreach in the system once completed.\n\n— Encore Mortgage Automation', '[\"client_name\", \"application_number\", \"loan_type\"]', 1, 0, 1, '2026-03-12 22:55:02', '2026-03-12 22:55:02'),
(86, 1, 'Approved with Conditions – Notify Listing Agent (Internal)', 'Internal notification to contact the listing agent about the approval with conditions', 'email', 'system', '[ACTION] Notify Listing Agent — Loan Approved with Conditions', 'Hello Team,\n\nThis is an automated internal alert.\n\nLoan #{{application_number}} for client {{client_name}} has been **Approved with Conditions** by underwriting.\n\nAction Required: Please contact the **Listing Agent** to inform them of the current loan status and manage expectations around the closing timeline.\n\nKey points to communicate to the Listing Agent:\n• The loan is progressing and has received a conditional approval\n• Conditions are being worked on and we expect to clear them promptly\n• We are committed to meeting the agreed closing date\n• If any contract extensions or accommodations are needed, they should be discussed now\n\nLoan Details:\n• Client: {{client_name}}\n• Application #: {{application_number}}\n• Loan Type: {{loan_type}}\n• Status: Approved with Conditions\n\nPlease log your outreach in the system once completed.\n\n— Encore Mortgage Automation', '[\"client_name\", \"application_number\", \"loan_type\"]', 1, 0, 1, '2026-03-12 22:55:02', '2026-03-12 22:55:02'),
(87, 1, 'Approved with Conditions – Notify Title Agent (Internal)', 'Internal notification to contact the title agent about the approval with conditions', 'email', 'system', '[ACTION] Notify Title Agent — Loan Approved with Conditions', 'Hello Team,\n\nThis is an automated internal alert.\n\nLoan #{{application_number}} for client {{client_name}} has been **Approved with Conditions** by underwriting.\n\nAction Required: Please contact the **Title Agent / Title Company** to ensure all title-related conditions are on their radar and to coordinate any outstanding title requirements.\n\nKey points to communicate to the Title Agent:\n• Loan is in conditional approval status — a Clear to Close is pending\n• Confirm the title commitment is current and all requirements have been submitted to underwriting\n• Verify any lien releases, HOA certifications, or survey items have been addressed\n• Confirm the title company is ready to schedule closing upon CTC issuance\n• Request a preliminary Closing Disclosure (CD) if not yet prepared\n\nLoan Details:\n• Client: {{client_name}}\n• Application #: {{application_number}}\n• Loan Type: {{loan_type}}\n• Status: Approved with Conditions\n\nPlease log your outreach in the system once completed.\n\n— Encore Mortgage Automation', '[\"client_name\", \"application_number\", \"loan_type\"]', 1, 0, 1, '2026-03-12 22:55:03', '2026-03-12 22:55:03'),
(88, 1, 'Clear to Close – SMS', 'Immediate SMS when loan reaches Clear to Close status', 'sms', 'follow_up', NULL, 'Hi {{first_name}}! 🎉🏡 YOU ARE CLEAR TO CLOSE! Your loan (#{{application_number}}) has officially been cleared by underwriting — this is the final green light! We\'re scheduling your closing now and will send you all the details. Get ready to sign and celebrate! – {{broker_name}}, Encore Mortgage.', '[\"first_name\", \"application_number\", \"broker_name\"]', 1, 0, 1, '2026-03-12 22:57:51', '2026-03-24 22:36:04'),
(89, 1, 'Clear to Close – Purchase Email', 'Clear to Close email for home purchase loans', 'email', 'follow_up', '🎉 Clear to Close — You\'re Almost a Homeowner!', 'Hi {{first_name}},\n\nThis is the message you\'ve been waiting for — your loan (#{{application_number}}) is officially **Clear to Close**!\n\nUnderwriting has completed its review, all conditions have been satisfied, and you are cleared to sign your closing documents. You are about to become a homeowner — congratulations!\n\n**What \"Clear to Close\" means:**\n✅ All loan conditions have been fully satisfied\n✅ The lender has given final approval\n✅ Your loan is ready to fund at closing\n✅ You\'re one signing appointment away from getting your keys!\n\n**What happens next — your closing checklist:**\n\n📋 **Review your Closing Disclosure (CD)**\nYou should have received (or will receive soon) a Closing Disclosure with the final loan terms, monthly payment, and all closing costs. Review it carefully. You have the right to review this document at least 3 business days before closing.\n\n💰 **Prepare your closing funds**\nYour CD will show the exact amount you need to bring to closing. This must typically be wired or brought as a cashier\'s check — personal checks are usually NOT accepted. Contact us right away if you have questions about this amount.\n\n🪪 **Bring a valid government-issued photo ID**\nYou\'ll need this to sign your closing documents. Make sure your name matches exactly what\'s on the loan documents.\n\n🏠 **Final walkthrough**\nCoordinate with your realtor to do a final walkthrough of the property before your closing appointment — ideally the day before or morning of closing.\n\n📞 **Do NOT make any financial changes**\nUntil the loan has funded and recorded, please avoid any new credit, large purchases, job changes, or large bank transfers. Even at this stage, these can delay or jeopardize your closing.\n\n**Your closing appointment details** will be confirmed by our team shortly. Please keep your schedule flexible and respond promptly to any final requests.\n\nThank you for trusting Encore Mortgage with your home purchase. We\'re so excited to hand you the keys!\n\n{{broker_name}}\nEncore Mortgage', '[\"first_name\", \"application_number\", \"broker_name\"]', 1, 0, 1, '2026-03-12 22:57:51', '2026-03-12 22:57:51'),
(90, 1, 'Clear to Close – Refi Email', 'Clear to Close email for refinance loans', 'email', 'follow_up', '🎉 Clear to Close — Your Refinance Is Almost Done!', 'Hi {{first_name}},\n\nFantastic news — your refinance loan (#{{application_number}}) is officially **Clear to Close**!\n\nUnderwriting has given the final approval and all conditions have been satisfied. We\'re now in the home stretch — just a signing appointment stands between you and your new loan!\n\n**What \"Clear to Close\" means for your refinance:**\n✅ All conditions have been cleared\n✅ Your new interest rate and loan terms are locked and confirmed\n✅ The lender is ready to fund\n✅ You\'re about to start saving on your mortgage!\n\n**What happens next — your refinance closing checklist:**\n\n📋 **Review your Closing Disclosure (CD)**\nYou should receive a final Closing Disclosure with your new loan terms, closing costs, and any cash out or cash in required at closing. Review it carefully — you have 3 business days to review before we can close.\n\n💰 **Closing costs / cash to close**\nFor most refinances, closing costs are either rolled into the loan or deducted from proceeds. Your CD will show exactly what (if anything) you need to bring or will receive. Let us know if you have questions.\n\n📅 **Right of Rescission (if applicable)**\nFor owner-occupied refinances (non-purchase), federal law gives you 3 business days after signing to cancel the transaction if you change your mind. Your loan will not fund until this period has passed.\n\n🪪 **Bring a valid government-issued photo ID**\nTo sign your closing documents, you\'ll need a current, valid photo ID matching your name on the loan.\n\n📞 **Do NOT make any financial changes**\nUntil your loan has funded and recorded, avoid any changes to your finances — no new credit, large purchases, or job changes.\n\n**Your signing appointment details** will be confirmed shortly. A notary or title agent will coordinate with you directly.\n\nThank you for choosing Encore Mortgage for your refinance. We look forward to completing this transaction and delivering your savings!\n\n{{broker_name}}\nEncore Mortgage', '[\"first_name\", \"application_number\", \"broker_name\"]', 1, 0, 1, '2026-03-12 22:57:51', '2026-03-12 22:57:51'),
(91, 1, 'Loan Funded – SMS', 'SMS sent on the close date when the loan funds', 'sms', 'follow_up', NULL, 'Hi {{first_name}}! 🎉🔑 YOUR LOAN HAS FUNDED! Congratulations — your loan (#{{application_number}}) is officially closed and the keys are yours! It has been a pleasure working with you. Wishing you many happy years in your new home! – {{broker_name}}, Encore Mortgage.', '[\"first_name\", \"application_number\", \"broker_name\"]', 1, 0, 1, '2026-03-12 23:02:15', '2026-03-24 22:36:04'),
(92, 1, 'Loan Funded – Email', 'Email sent on the close date when the loan funds', 'email', 'follow_up', '🎉 Your Loan Has Funded — Congratulations!', 'Hi {{first_name}},\n\nThis is the moment you\'ve been working toward — **your loan has officially funded and closed!** 🎊\n\nApplication #: {{application_number}}\n\nOn behalf of the entire team at Encore Mortgage, we want to say **congratulations** and thank you for trusting us with such an important milestone in your life.\n\n**Here\'s a summary of what just happened:**\n✅ Your loan documents were signed and notarized\n✅ The lender wired the funds to the title company\n✅ The title company recorded the transaction with the county\n✅ Ownership has been officially transferred — the property is YOURS\n\n**What to expect next:**\n\n📬 **Loan documents** — You\'ll receive your complete closing package by mail within 1–2 weeks. Keep these documents in a safe place — you\'ll need them for tax purposes.\n\n💳 **Your first mortgage payment** — Your first payment is typically due on the 1st of the month following 30 days after closing. Watch for your welcome letter from your loan servicer with payment instructions.\n\n🏠 **Loan servicer** — Your loan may be transferred to a loan servicer (which may differ from the lender). You\'ll receive a notification if this happens — it doesn\'t affect your loan terms.\n\n🧾 **Tax benefits** — Mortgage interest and property taxes may be deductible. Consult your tax advisor for details.\n\n📞 **We\'re still here** — If you ever need a refinance, have questions, or want to refer a friend or family member who needs a mortgage, we\'re always here for you.\n\nThank you again for choosing Encore Mortgage. We\'re so proud to have been part of your journey.\n\nWith warm congratulations,\n\n{{broker_name}}\nEncore Mortgage', '[\"first_name\", \"application_number\", \"broker_name\"]', 1, 0, 1, '2026-03-12 23:02:15', '2026-03-12 23:02:15');

-- --------------------------------------------------------

--
-- Table structure for table `tenants`
--

CREATE TABLE `tenants` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `slug` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'URL-friendly identifier (e.g., encore, acme)',
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Display name of tenant',
  `domain` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Custom domain (optional)',
  `status` enum('active','inactive','suspended') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `is_default` tinyint(1) DEFAULT '0' COMMENT 'Default tenant for root domain access',
  `logo_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `favicon_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `primary_color` varchar(7) COLLATE utf8mb4_unicode_ci DEFAULT '#667eea' COMMENT 'Hex color code',
  `secondary_color` varchar(7) COLLATE utf8mb4_unicode_ci DEFAULT '#764ba2' COMMENT 'Hex color code',
  `accent_color` varchar(7) COLLATE utf8mb4_unicode_ci DEFAULT '#f59e0b' COMMENT 'Hex color code',
  `background_color` varchar(7) COLLATE utf8mb4_unicode_ci DEFAULT '#ffffff' COMMENT 'Hex color code',
  `text_color` varchar(7) COLLATE utf8mb4_unicode_ci DEFAULT '#1f2937' COMMENT 'Hex color code',
  `font_family` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT 'Inter, sans-serif',
  `font_size_base` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT '16px',
  `font_weight_normal` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT '400',
  `font_weight_bold` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT '600',
  `border_radius` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT '8px',
  `border_width` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT '1px',
  `shadow_sm` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  `shadow_md` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT '0 4px 6px -1px rgb(0 0 0 / 0.1)',
  `shadow_lg` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT '0 10px 15px -3px rgb(0 0 0 / 0.1)',
  `company_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `contact_email` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `contact_phone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` text COLLATE utf8mb4_unicode_ci,
  `custom_css` text COLLATE utf8mb4_unicode_ci,
  `custom_js` text COLLATE utf8mb4_unicode_ci,
  `settings` json DEFAULT NULL COMMENT 'Additional tenant-specific settings',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `tenants`
--

INSERT INTO `tenants` (`id`, `slug`, `name`, `domain`, `status`, `is_default`, `logo_url`, `favicon_url`, `primary_color`, `secondary_color`, `accent_color`, `background_color`, `text_color`, `font_family`, `font_size_base`, `font_weight_normal`, `font_weight_bold`, `border_radius`, `border_width`, `shadow_sm`, `shadow_md`, `shadow_lg`, `company_name`, `contact_email`, `contact_phone`, `address`, `custom_css`, `custom_js`, `settings`, `created_at`, `updated_at`) VALUES
(1, 'encore', 'Encore Mortgage', 'https://real-state-one-omega.vercel.app/', 'active', 1, 'https://disruptinglabs.com/data/encore/assets/images/logo.png', 'https://disruptinglabs.com/data/encore/assets/images/favicon/favicon.ico', '#D32F2F', '#000000', '#D32F2F', '#F9F9F9', '#222222', 'Inter, sans-serif', '16px', '400', '600', '8px', '1px', '0 1px 2px 0 rgb(0 0 0 / 0.05)', '0 4px 6px -1px rgb(0 0 0 / 0.1)', '0 10px 15px -3px rgb(0 0 0 / 0.1)', 'Encore Mortgage', 'contact@encoremortgage.org', NULL, NULL, NULL, NULL, NULL, '2026-02-02 14:24:21', '2026-02-02 17:43:16'),
(2, 'themortgageprofessionals', 'The Mortgage Professionals', 'themortgageprofessionals.net', 'active', 0, 'https://disruptinglabs.com/data/themortgageprofessionals/assets/images/logo.png', 'https://disruptinglabs.com/data/themortgageprofessionals/assets/images/favicon/favicon.ico', '#1e40af', '#3b82f6', '#f59e0b', '#ffffff', '#1f2937', 'Inter, sans-serif', '16px', '400', '600', '8px', '1px', '0 1px 2px 0 rgb(0 0 0 / 0.05)', '0 4px 6px -1px rgb(0 0 0 / 0.1)', '0 10px 15px -3px rgb(0 0 0 / 0.1)', 'The Mortgage Professionals', 'contact@themortgageprofessionals.net', NULL, NULL, NULL, NULL, NULL, '2026-02-02 17:09:27', '2026-02-02 17:18:20');

-- --------------------------------------------------------

--
-- Table structure for table `user_profiles`
--

CREATE TABLE `user_profiles` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `date_of_birth` date DEFAULT NULL,
  `ssn_last_four` varchar(4) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address_line1` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address_line2` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `city` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `state` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `zip_code` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `country` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT 'USA',
  `employment_status` enum('employed','self_employed','unemployed','retired','retired_with_pension') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
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
  `id` int(11) NOT NULL AUTO_INCREMENT,
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
-- Indexes for table `admin_section_controls`
--
ALTER TABLE `admin_section_controls`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_tenant_section` (`tenant_id`,`section_id`);

--
-- Indexes for table `application_status_history`
--
ALTER TABLE `application_status_history`
  ADD PRIMARY KEY (`id`),
  ADD KEY `changed_by_broker_id` (`changed_by_broker_id`),
  ADD KEY `idx_application_id` (`application_id`),
  ADD KEY `idx_created_at` (`created_at`),
  ADD KEY `tenant_id` (`tenant_id`);

--
-- Indexes for table `audit_logs`
--
ALTER TABLE `audit_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_broker_id` (`broker_id`),
  ADD KEY `idx_entity` (`entity_type`,`entity_id`),
  ADD KEY `idx_created_at` (`created_at`),
  ADD KEY `idx_actor_type` (`actor_type`),
  ADD KEY `idx_action` (`action`),
  ADD KEY `idx_entity_type` (`entity_type`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_request_id` (`request_id`),
  ADD KEY `tenant_id` (`tenant_id`);

--
-- Indexes for table `brokers`
--
ALTER TABLE `brokers`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_tenant_email` (`tenant_id`,`email`),
  ADD UNIQUE KEY `uk_brokers_public_token` (`public_token`),
  ADD UNIQUE KEY `uq_broker_twilio_phone` (`tenant_id`,`twilio_phone_sid`),
  ADD KEY `idx_email` (`email`),
  ADD KEY `idx_role` (`role`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `tenant_id` (`tenant_id`),
  ADD KEY `idx_brokers_created_by` (`created_by_broker_id`),
  ADD KEY `idx_broker_voice_available` (`tenant_id`,`status`,`voice_available`);

--
-- Indexes for table `broker_monthly_metrics`
--
ALTER TABLE `broker_monthly_metrics`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_tenant_broker_year_month` (`tenant_id`,`broker_id`,`year`,`month`),
  ADD KEY `idx_tenant_id` (`tenant_id`),
  ADD KEY `idx_broker_id` (`broker_id`);

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
  ADD KEY `created_by_broker_id` (`created_by_broker_id`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_campaign_type` (`campaign_type`),
  ADD KEY `tenant_id` (`tenant_id`),
  ADD KEY `idx_template_id` (`template_id`);

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
  ADD UNIQUE KEY `unique_tenant_email` (`tenant_id`,`email`),
  ADD KEY `idx_email` (`email`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_assigned_broker` (`assigned_broker_id`),
  ADD KEY `idx_income_type` (`income_type`),
  ADD KEY `tenant_id` (`tenant_id`),
  ADD KEY `idx_clients_citizenship` (`citizenship_status`);

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
  ADD KEY `idx_created_at` (`created_at`),
  ADD KEY `tenant_id` (`tenant_id`),
  ADD KEY `idx_conversation_id` (`conversation_id`),
  ADD KEY `idx_thread_id` (`thread_id`),
  ADD KEY `idx_reply_to_id` (`reply_to_id`),
  ADD KEY `idx_message_type` (`message_type`),
  ADD KEY `idx_delivery_status` (`delivery_status`),
  ADD KEY `idx_delivery_timestamp` (`delivery_timestamp`),
  ADD KEY `idx_communications_conversation` (`conversation_id`,`tenant_id`),
  ADD KEY `idx_communications_type` (`communication_type`,`tenant_id`),
  ADD KEY `idx_communications_status` (`status`,`delivery_status`),
  ADD KEY `idx_communications_created` (`created_at`),
  ADD KEY `idx_comm_source_exec` (`source_execution_id`);

--
-- Indexes for table `compliance_checklists`
--
ALTER TABLE `compliance_checklists`
  ADD PRIMARY KEY (`id`),
  ADD KEY `completed_by_broker_id` (`completed_by_broker_id`),
  ADD KEY `idx_application_id` (`application_id`),
  ADD KEY `tenant_id` (`tenant_id`);

--
-- Indexes for table `compliance_checklist_items`
--
ALTER TABLE `compliance_checklist_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `completed_by_broker_id` (`completed_by_broker_id`),
  ADD KEY `idx_checklist_id` (`checklist_id`);

--
-- Indexes for table `contact_submissions`
--
ALTER TABLE `contact_submissions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_contact_tenant` (`tenant_id`),
  ADD KEY `idx_contact_is_read` (`is_read`),
  ADD KEY `idx_contact_created_at` (`created_at`);

--
-- Indexes for table `conversation_threads`
--
ALTER TABLE `conversation_threads`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `idx_conversation_id` (`conversation_id`),
  ADD KEY `idx_tenant_application` (`tenant_id`,`application_id`),
  ADD KEY `idx_tenant_lead` (`tenant_id`,`lead_id`),
  ADD KEY `idx_tenant_client` (`tenant_id`,`client_id`),
  ADD KEY `idx_broker_id` (`broker_id`),
  ADD KEY `idx_last_message_at` (`last_message_at`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_priority` (`priority`),
  ADD KEY `fk_conversation_threads_application` (`application_id`),
  ADD KEY `fk_conversation_threads_lead` (`lead_id`),
  ADD KEY `fk_conversation_threads_client` (`client_id`),
  ADD KEY `idx_conversations_tenant_broker` (`tenant_id`,`broker_id`),
  ADD KEY `idx_conversations_status` (`status`,`tenant_id`),
  ADD KEY `idx_conversations_priority` (`priority`,`tenant_id`),
  ADD KEY `idx_conversations_last_message` (`last_message_at`);

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
  ADD KEY `idx_status` (`status`),
  ADD KEY `tenant_id` (`tenant_id`);

--
-- Indexes for table `environment_keys`
--
ALTER TABLE `environment_keys`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `leads`
--
ALTER TABLE `leads`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_assigned_broker` (`assigned_broker_id`),
  ADD KEY `idx_created_at` (`created_at`),
  ADD KEY `tenant_id` (`tenant_id`);

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
  ADD KEY `idx_created_at` (`created_at`),
  ADD KEY `tenant_id` (`tenant_id`),
  ADD KEY `idx_loan_applications_broker_token` (`broker_token`),
  ADD KEY `idx_loan_apps_citizenship` (`citizenship_status`),
  ADD KEY `idx_partner_broker` (`partner_broker_id`);

--
-- Indexes for table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_is_read` (`is_read`),
  ADD KEY `idx_created_at` (`created_at`),
  ADD KEY `tenant_id` (`tenant_id`);

--
-- Indexes for table `pipeline_step_templates`
--
ALTER TABLE `pipeline_step_templates`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_tenant_step_channel` (`tenant_id`,`pipeline_step`,`communication_type`),
  ADD KEY `idx_pipeline_step_templates_tenant` (`tenant_id`),
  ADD KEY `idx_pipeline_step_templates_step` (`pipeline_step`),
  ADD KEY `fk_pst_template` (`template_id`);

--
-- Indexes for table `pre_approval_letters`
--
ALTER TABLE `pre_approval_letters`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_pre_approval_per_loan` (`application_id`,`tenant_id`) COMMENT 'One active letter per loan per tenant',
  ADD KEY `idx_pre_approval_tenant` (`tenant_id`),
  ADD KEY `idx_pre_approval_application` (`application_id`),
  ADD KEY `idx_pre_approval_created_by` (`created_by_broker_id`);

--
-- Indexes for table `reminder_flows`
--
ALTER TABLE `reminder_flows`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_reminder_flows_tenant` (`tenant_id`),
  ADD KEY `idx_reminder_flows_active` (`is_active`),
  ADD KEY `fk_reminder_flows_broker` (`created_by_broker_id`),
  ADD KEY `idx_reminder_flows_trigger_loantype` (`trigger_event`,`loan_type_filter`,`is_active`);

--
-- Indexes for table `reminder_flow_connections`
--
ALTER TABLE `reminder_flow_connections`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_flow_connections_flow` (`flow_id`);

--
-- Indexes for table `reminder_flow_executions`
--
ALTER TABLE `reminder_flow_executions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_executions_flow` (`flow_id`),
  ADD KEY `idx_executions_loan` (`loan_application_id`),
  ADD KEY `idx_executions_client` (`client_id`),
  ADD KEY `idx_executions_status` (`status`),
  ADD KEY `idx_executions_next_exec` (`next_execution_at`),
  ADD KEY `idx_executions_responded` (`responded_at`),
  ADD KEY `idx_rfe_conv_id` (`tenant_id`,`conversation_id`);

--
-- Indexes for table `reminder_flow_steps`
--
ALTER TABLE `reminder_flow_steps`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_flow_steps_flow` (`flow_id`);

--
-- Indexes for table `scheduled_meetings`
--
ALTER TABLE `scheduled_meetings`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_meetings_broker_date` (`broker_id`,`meeting_date`),
  ADD KEY `idx_meetings_booking_token` (`booking_token`),
  ADD KEY `idx_meetings_status` (`status`);

--
-- Indexes for table `scheduler_availability`
--
ALTER TABLE `scheduler_availability`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_availability_broker_day` (`broker_id`,`day_of_week`);

--
-- Indexes for table `scheduler_settings`
--
ALTER TABLE `scheduler_settings`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_scheduler_broker` (`tenant_id`,`broker_id`),
  ADD KEY `fk_scheduler_settings_broker` (`broker_id`);

--
-- Indexes for table `system_settings`
--
ALTER TABLE `system_settings`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `setting_key` (`setting_key`),
  ADD KEY `tenant_id` (`tenant_id`);

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
  ADD KEY `idx_application_status` (`application_id`,`status`),
  ADD KEY `idx_tasks_form_completed` (`form_completed`),
  ADD KEY `idx_tasks_documents_uploaded` (`documents_uploaded`),
  ADD KEY `fk_tasks_approved_by` (`approved_by_broker_id`),
  ADD KEY `fk_tasks_reopened_by` (`reopened_by_broker_id`),
  ADD KEY `tenant_id` (`tenant_id`),
  ADD KEY `fk_tasks_status_changed_by_broker` (`status_changed_by_broker_id`),
  ADD KEY `idx_tasks_status_changes` (`status_changed_at`,`status_changed_by_broker_id`),
  ADD KEY `idx_tasks_audit_tracking` (`status`,`status_changed_at`,`application_id`);

--
-- Indexes for table `task_documents`
--
ALTER TABLE `task_documents`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_task_id` (`task_id`),
  ADD KEY `idx_field_id` (`field_id`),
  ADD KEY `idx_uploaded_at` (`uploaded_at`);

--
-- Indexes for table `task_form_fields`
--
ALTER TABLE `task_form_fields`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_task_template_id` (`task_template_id`),
  ADD KEY `idx_order_index` (`order_index`);

--
-- Indexes for table `task_form_responses`
--
ALTER TABLE `task_form_responses`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_task_field_response` (`task_id`,`field_id`),
  ADD KEY `idx_task_id` (`task_id`),
  ADD KEY `idx_field_id` (`field_id`);

--
-- Indexes for table `task_signatures`
--
ALTER TABLE `task_signatures`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_task_zone` (`task_id`,`zone_id`),
  ADD KEY `idx_task_id` (`task_id`),
  ADD KEY `idx_sign_document_id` (`sign_document_id`),
  ADD KEY `idx_tenant_id` (`tenant_id`);

--
-- Indexes for table `task_sign_documents`
--
ALTER TABLE `task_sign_documents`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_task_template_id` (`task_template_id`),
  ADD KEY `idx_tenant_id` (`tenant_id`);

--
-- Indexes for table `task_templates`
--
ALTER TABLE `task_templates`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_created_by_broker` (`created_by_broker_id`),
  ADD KEY `idx_active_order` (`is_active`,`order_index`),
  ADD KEY `idx_task_templates_requires_documents` (`requires_documents`),
  ADD KEY `idx_task_templates_has_custom_form` (`has_custom_form`),
  ADD KEY `idx_task_templates_tenant` (`tenant_id`),
  ADD KEY `idx_task_templates_has_signing` (`has_signing`);

--
-- Indexes for table `templates`
--
ALTER TABLE `templates`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_tenant_type` (`tenant_id`,`template_type`),
  ADD KEY `idx_category` (`category`),
  ADD KEY `idx_active` (`is_active`),
  ADD KEY `idx_created_by` (`created_by_broker_id`),
  ADD KEY `idx_templates_type` (`template_type`,`tenant_id`),
  ADD KEY `idx_templates_active` (`is_active`,`tenant_id`),
  ADD KEY `idx_templates_category` (`category`,`tenant_id`);

--
-- Indexes for table `tenants`
--
ALTER TABLE `tenants`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `slug` (`slug`),
  ADD UNIQUE KEY `domain` (`domain`),
  ADD KEY `status` (`status`);

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
-- AUTO_INCREMENT for table `admin_section_controls`
--
ALTER TABLE `admin_section_controls` AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `application_status_history`
--
ALTER TABLE `application_status_history` AUTO_INCREMENT=134;

--
-- AUTO_INCREMENT for table `audit_logs`
--
ALTER TABLE `audit_logs` AUTO_INCREMENT=218;

--
-- AUTO_INCREMENT for table `brokers`
--
ALTER TABLE `brokers` AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `broker_monthly_metrics`
--

--
-- AUTO_INCREMENT for table `broker_profiles`
--
ALTER TABLE `broker_profiles` AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `broker_sessions`
--
ALTER TABLE `broker_sessions` AUTO_INCREMENT=159;

--
-- AUTO_INCREMENT for table `campaigns`
--

--
-- AUTO_INCREMENT for table `campaign_recipients`
--

--
-- AUTO_INCREMENT for table `clients`
--
ALTER TABLE `clients` AUTO_INCREMENT=34;

--
-- AUTO_INCREMENT for table `communications`
--
ALTER TABLE `communications` AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT for table `compliance_checklists`
--

--
-- AUTO_INCREMENT for table `compliance_checklist_items`
--

--
-- AUTO_INCREMENT for table `contact_submissions`
--

--
-- AUTO_INCREMENT for table `conversation_threads`
--
ALTER TABLE `conversation_threads` AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `documents`
--
ALTER TABLE `documents` AUTO_INCREMENT=22;

--
-- AUTO_INCREMENT for table `environment_keys`
--
ALTER TABLE `environment_keys` AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `leads`
--

--
-- AUTO_INCREMENT for table `lead_activities`
--

--
-- AUTO_INCREMENT for table `loan_applications`
--
ALTER TABLE `loan_applications` AUTO_INCREMENT=40;

--
-- AUTO_INCREMENT for table `notifications`
--
ALTER TABLE `notifications` AUTO_INCREMENT=106;

--
-- AUTO_INCREMENT for table `pipeline_step_templates`
--

--
-- AUTO_INCREMENT for table `pre_approval_letters`
--
ALTER TABLE `pre_approval_letters` AUTO_INCREMENT=22;

--
-- AUTO_INCREMENT for table `reminder_flows`
--
ALTER TABLE `reminder_flows` AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `reminder_flow_connections`
--
ALTER TABLE `reminder_flow_connections` AUTO_INCREMENT=242;

--
-- AUTO_INCREMENT for table `reminder_flow_executions`
--
ALTER TABLE `reminder_flow_executions` AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `reminder_flow_steps`
--
ALTER TABLE `reminder_flow_steps` AUTO_INCREMENT=246;

--
-- AUTO_INCREMENT for table `scheduled_meetings`
--

--
-- AUTO_INCREMENT for table `scheduler_availability`
--
ALTER TABLE `scheduler_availability` AUTO_INCREMENT=64;

--
-- AUTO_INCREMENT for table `scheduler_settings`
--
ALTER TABLE `scheduler_settings` AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT for table `system_settings`
--
ALTER TABLE `system_settings` AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `tasks`
--
ALTER TABLE `tasks` AUTO_INCREMENT=133;

--
-- AUTO_INCREMENT for table `task_documents`
--
ALTER TABLE `task_documents` AUTO_INCREMENT=72;

--
-- AUTO_INCREMENT for table `task_form_fields`
--
ALTER TABLE `task_form_fields` AUTO_INCREMENT=72;

--
-- AUTO_INCREMENT for table `task_form_responses`
--

--
-- AUTO_INCREMENT for table `task_signatures`
--
ALTER TABLE `task_signatures` AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `task_sign_documents`
--
ALTER TABLE `task_sign_documents` AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `task_templates`
--
ALTER TABLE `task_templates` AUTO_INCREMENT=64;

--
-- AUTO_INCREMENT for table `templates`
--
ALTER TABLE `templates` AUTO_INCREMENT=93;

--
-- AUTO_INCREMENT for table `tenants`
--
ALTER TABLE `tenants` AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `user_profiles`
--

--
-- AUTO_INCREMENT for table `user_sessions`
--
ALTER TABLE `user_sessions` AUTO_INCREMENT=23;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `application_status_history`
--
ALTER TABLE `application_status_history`
  ADD CONSTRAINT `application_status_history_ibfk_1` FOREIGN KEY (`application_id`) REFERENCES `loan_applications` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `application_status_history_ibfk_2` FOREIGN KEY (`changed_by_broker_id`) REFERENCES `brokers` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_application_status_history_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `audit_logs`
--
ALTER TABLE `audit_logs`
  ADD CONSTRAINT `audit_logs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `clients` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `audit_logs_ibfk_2` FOREIGN KEY (`broker_id`) REFERENCES `brokers` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_audit_logs_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `brokers`
--
ALTER TABLE `brokers`
  ADD CONSTRAINT `fk_brokers_created_by` FOREIGN KEY (`created_by_broker_id`) REFERENCES `brokers` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_brokers_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE;

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
  ADD CONSTRAINT `campaigns_ibfk_3` FOREIGN KEY (`created_by_broker_id`) REFERENCES `brokers` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_campaigns_template` FOREIGN KEY (`template_id`) REFERENCES `templates` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_campaigns_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `campaign_recipients`
--
ALTER TABLE `campaign_recipients`
  ADD CONSTRAINT `campaign_recipients_ibfk_1` FOREIGN KEY (`campaign_id`) REFERENCES `campaigns` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `campaign_recipients_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `clients` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `campaign_recipients_ibfk_3` FOREIGN KEY (`lead_id`) REFERENCES `leads` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `clients`
--
ALTER TABLE `clients`
  ADD CONSTRAINT `fk_clients_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `communications`
--
ALTER TABLE `communications`
  ADD CONSTRAINT `communications_ibfk_1` FOREIGN KEY (`application_id`) REFERENCES `loan_applications` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `communications_ibfk_2` FOREIGN KEY (`lead_id`) REFERENCES `leads` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `communications_ibfk_3` FOREIGN KEY (`from_user_id`) REFERENCES `clients` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `communications_ibfk_4` FOREIGN KEY (`from_broker_id`) REFERENCES `brokers` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `communications_ibfk_5` FOREIGN KEY (`to_user_id`) REFERENCES `clients` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `communications_ibfk_6` FOREIGN KEY (`to_broker_id`) REFERENCES `brokers` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_communications_reply_to` FOREIGN KEY (`reply_to_id`) REFERENCES `communications` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_communications_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `compliance_checklists`
--
ALTER TABLE `compliance_checklists`
  ADD CONSTRAINT `compliance_checklists_ibfk_1` FOREIGN KEY (`application_id`) REFERENCES `loan_applications` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `compliance_checklists_ibfk_2` FOREIGN KEY (`completed_by_broker_id`) REFERENCES `brokers` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_compliance_checklists_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `compliance_checklist_items`
--
ALTER TABLE `compliance_checklist_items`
  ADD CONSTRAINT `compliance_checklist_items_ibfk_1` FOREIGN KEY (`checklist_id`) REFERENCES `compliance_checklists` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `compliance_checklist_items_ibfk_2` FOREIGN KEY (`completed_by_broker_id`) REFERENCES `brokers` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `conversation_threads`
--
ALTER TABLE `conversation_threads`
  ADD CONSTRAINT `fk_conversation_threads_application` FOREIGN KEY (`application_id`) REFERENCES `loan_applications` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_conversation_threads_broker` FOREIGN KEY (`broker_id`) REFERENCES `brokers` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_conversation_threads_client` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_conversation_threads_lead` FOREIGN KEY (`lead_id`) REFERENCES `leads` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_conversation_threads_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `documents`
--
ALTER TABLE `documents`
  ADD CONSTRAINT `documents_ibfk_1` FOREIGN KEY (`application_id`) REFERENCES `loan_applications` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `documents_ibfk_2` FOREIGN KEY (`uploaded_by_user_id`) REFERENCES `clients` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `documents_ibfk_3` FOREIGN KEY (`uploaded_by_broker_id`) REFERENCES `brokers` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `documents_ibfk_4` FOREIGN KEY (`reviewed_by_broker_id`) REFERENCES `brokers` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_documents_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `leads`
--
ALTER TABLE `leads`
  ADD CONSTRAINT `fk_leads_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE,
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
  ADD CONSTRAINT `fk_loan_applications_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `loan_applications_ibfk_1` FOREIGN KEY (`client_user_id`) REFERENCES `clients` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `loan_applications_ibfk_2` FOREIGN KEY (`broker_user_id`) REFERENCES `brokers` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `loan_applications_partner_ibfk` FOREIGN KEY (`partner_broker_id`) REFERENCES `brokers` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `notifications`
--
ALTER TABLE `notifications`
  ADD CONSTRAINT `fk_notifications_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `clients` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `pipeline_step_templates`
--
ALTER TABLE `pipeline_step_templates`
  ADD CONSTRAINT `fk_pst_template` FOREIGN KEY (`template_id`) REFERENCES `templates` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `reminder_flow_connections`
--
ALTER TABLE `reminder_flow_connections`
  ADD CONSTRAINT `fk_flow_connections_flow` FOREIGN KEY (`flow_id`) REFERENCES `reminder_flows` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `reminder_flow_executions`
--
ALTER TABLE `reminder_flow_executions`
  ADD CONSTRAINT `fk_executions_flow` FOREIGN KEY (`flow_id`) REFERENCES `reminder_flows` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_executions_client` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_executions_loan` FOREIGN KEY (`loan_application_id`) REFERENCES `loan_applications` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `reminder_flow_steps`
--
ALTER TABLE `reminder_flow_steps`
  ADD CONSTRAINT `fk_flow_steps_flow` FOREIGN KEY (`flow_id`) REFERENCES `reminder_flows` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `scheduled_meetings`
--
ALTER TABLE `scheduled_meetings`
  ADD CONSTRAINT `fk_scheduled_meetings_broker` FOREIGN KEY (`broker_id`) REFERENCES `brokers` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `scheduler_availability`
--
ALTER TABLE `scheduler_availability`
  ADD CONSTRAINT `fk_scheduler_availability_broker` FOREIGN KEY (`broker_id`) REFERENCES `brokers` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `scheduler_settings`
--
ALTER TABLE `scheduler_settings`
  ADD CONSTRAINT `fk_scheduler_settings_broker` FOREIGN KEY (`broker_id`) REFERENCES `brokers` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `system_settings`
--
ALTER TABLE `system_settings`
  ADD CONSTRAINT `fk_system_settings_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `tasks`
--
ALTER TABLE `tasks`
  ADD CONSTRAINT `fk_task_template` FOREIGN KEY (`template_id`) REFERENCES `task_templates` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_tasks_approved_by` FOREIGN KEY (`approved_by_broker_id`) REFERENCES `brokers` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_tasks_reopened_by` FOREIGN KEY (`reopened_by_broker_id`) REFERENCES `brokers` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_tasks_status_changed_by_broker` FOREIGN KEY (`status_changed_by_broker_id`) REFERENCES `brokers` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_tasks_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `tasks_ibfk_1` FOREIGN KEY (`application_id`) REFERENCES `loan_applications` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `tasks_ibfk_3` FOREIGN KEY (`assigned_to_user_id`) REFERENCES `clients` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `tasks_ibfk_4` FOREIGN KEY (`assigned_to_broker_id`) REFERENCES `brokers` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `tasks_ibfk_5` FOREIGN KEY (`created_by_broker_id`) REFERENCES `brokers` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `task_documents`
--
ALTER TABLE `task_documents`
  ADD CONSTRAINT `fk_task_documents_field` FOREIGN KEY (`field_id`) REFERENCES `task_form_fields` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_task_documents_task` FOREIGN KEY (`task_id`) REFERENCES `tasks` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `task_form_fields`
--
ALTER TABLE `task_form_fields`
  ADD CONSTRAINT `fk_task_form_fields_template` FOREIGN KEY (`task_template_id`) REFERENCES `task_templates` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `task_form_responses`
--
ALTER TABLE `task_form_responses`
  ADD CONSTRAINT `fk_task_form_responses_field` FOREIGN KEY (`field_id`) REFERENCES `task_form_fields` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_task_form_responses_task` FOREIGN KEY (`task_id`) REFERENCES `tasks` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `task_templates`
--
ALTER TABLE `task_templates`
  ADD CONSTRAINT `fk_task_template_broker` FOREIGN KEY (`created_by_broker_id`) REFERENCES `brokers` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_task_templates_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `templates`
--
ALTER TABLE `templates`
  ADD CONSTRAINT `fk_templates_broker` FOREIGN KEY (`created_by_broker_id`) REFERENCES `brokers` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_templates_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE;

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
