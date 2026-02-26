-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Feb 25, 2026 at 08:30 PM
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
  `tenant_id` int(11) NOT NULL DEFAULT '1',
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
(80, 1, NULL, 3, 'broker', 'view_audit_logs', NULL, NULL, NULL, 'success', NULL, NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-02-24 16:50:45');

-- --------------------------------------------------------

--
-- Table structure for table `brokers`
--

CREATE TABLE `brokers` (
  `id` int(11) NOT NULL,
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
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `brokers`
--

INSERT INTO `brokers` (`id`, `tenant_id`, `email`, `first_name`, `last_name`, `phone`, `role`, `status`, `email_verified`, `last_login`, `license_number`, `specializations`, `public_token`, `created_at`, `updated_at`) VALUES
(1, 1, 'axgoomez@gmail.com', 'Alex', 'Gomez', NULL, 'admin', 'active', 1, '2026-02-24 18:31:45', NULL, '[]', '9b99af09-11e1-11f1-83cc-525400bd6b5d', '2026-01-20 18:56:12', '2026-02-24 20:59:43'),
(2, 1, 'tonatiuh.gom@gmail.com', 'Tonatiuh', 'Gomez', '4741400363', 'admin', 'active', 0, '2026-01-21 00:14:12', '123457890', '[\"First-Time Home Buyers\"]', '9b99b55c-11e1-11f1-83cc-525400bd6b5d', '2026-01-20 23:10:11', '2026-02-24 18:33:30'),
(3, 1, 'teamdc@encoremortgage.org', 'Daniel', 'Carrillo', '(562) 449-0000', 'admin', 'active', 0, '2026-02-24 16:50:22', '380277', NULL, '9b99b7b0-11e1-11f1-83cc-525400bd6b5d', '2026-01-21 00:08:17', '2026-02-24 18:33:30'),
(4, 1, 'hebert@trueduplora.com', 'Hebert', 'Montecinos', NULL, 'admin', 'active', 0, '2026-02-24 17:32:57', NULL, '[\"Investment Properties\", \"Refinancing\"]', '9b99c1b4-11e1-11f1-83cc-525400bd6b5d', '2026-01-21 00:08:54', '2026-02-24 18:33:30'),
(6, 2, 'axgoomez@gmail.com', 'Alex', 'Gomez', NULL, 'admin', 'active', 1, '2026-02-12 18:14:25', NULL, NULL, '9b99c454-11e1-11f1-83cc-525400bd6b5d', '2026-01-20 18:56:12', '2026-02-24 18:33:30'),
(7, 2, 'hebert@trueduplora.com', 'Hebert', 'Montecinos', NULL, 'admin', 'active', 0, '2026-02-13 00:04:37', NULL, NULL, '9b99c5ad-11e1-11f1-83cc-525400bd6b5d', '2026-02-03 14:59:53', '2026-02-24 18:33:30');

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

--
-- Dumping data for table `broker_profiles`
--

INSERT INTO `broker_profiles` (`id`, `broker_id`, `bio`, `office_address`, `office_city`, `office_state`, `office_zip`, `avatar_url`, `years_experience`, `total_loans_closed`, `created_at`, `updated_at`) VALUES
(1, 1, NULL, NULL, NULL, NULL, NULL, 'https://disruptinglabs.com/data/api/data/encore-profiles/profile-1/main_image/699e6506c5de0_1771988230.png', NULL, 0, '2026-02-24 20:53:50', '2026-02-24 20:59:43');

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
(44, 2, 510149, 1, NULL, NULL, '2026-02-03 06:39:20', '2026-02-03 08:24:20'),
(63, 6, 303837, 1, NULL, NULL, '2026-02-13 00:29:10', '2026-02-13 00:14:10'),
(76, 3, 368922, 1, NULL, NULL, '2026-02-24 23:04:54', '2026-02-24 22:49:54'),
(78, 4, 410414, 1, NULL, NULL, '2026-02-24 23:47:32', '2026-02-24 23:32:32'),
(79, 1, 698742, 1, NULL, NULL, '2026-02-25 00:46:29', '2026-02-25 00:31:29');

-- --------------------------------------------------------

--
-- Table structure for table `campaigns`
--

CREATE TABLE `campaigns` (
  `id` int(11) NOT NULL,
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
  `tenant_id` int(11) NOT NULL DEFAULT '1',
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

INSERT INTO `clients` (`id`, `tenant_id`, `email`, `password_hash`, `first_name`, `last_name`, `phone`, `alternate_phone`, `date_of_birth`, `ssn_encrypted`, `address_street`, `address_city`, `address_state`, `address_zip`, `employment_status`, `income_type`, `annual_income`, `credit_score`, `status`, `email_verified`, `phone_verified`, `last_login`, `assigned_broker_id`, `source`, `referral_code`, `created_at`, `updated_at`) VALUES
(14, 2, 'tonatiuh.gom@gmail.com', '', 'Tonatiuh', 'Gomez', '(555) 123-4567', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'W-2', NULL, NULL, 'active', 0, 0, NULL, 6, 'broker_created', NULL, '2026-02-11 21:03:41', '2026-02-11 21:03:41'),
(22, 1, 'Carrillodaniel@me.com', '', 'Daniel', 'Carrillo', '3237180001', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'W-2', NULL, NULL, 'active', 0, 0, '2026-02-24 17:48:05', 3, 'broker_created', NULL, '2026-02-24 16:53:10', '2026-02-24 17:48:05');

-- --------------------------------------------------------

--
-- Table structure for table `communications`
--

CREATE TABLE `communications` (
  `id` int(11) NOT NULL,
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
-- Triggers `communications`
--
DELIMITER $$
CREATE TRIGGER `update_conversation_thread` AFTER INSERT ON `communications` FOR EACH ROW BEGIN
    DECLARE client_name_var VARCHAR(255) DEFAULT NULL;
    DECLARE client_phone_var VARCHAR(20) DEFAULT NULL;
    DECLARE client_email_var VARCHAR(255) DEFAULT NULL;
    
    -- Get client information
    IF NEW.to_user_id IS NOT NULL THEN
        SELECT CONCAT(first_name, ' ', last_name), phone_number, email
        INTO client_name_var, client_phone_var, client_email_var
        FROM clients WHERE id = NEW.to_user_id;
    ELSEIF NEW.from_user_id IS NOT NULL THEN
        SELECT CONCAT(first_name, ' ', last_name), phone_number, email
        INTO client_name_var, client_phone_var, client_email_var
        FROM clients WHERE id = NEW.from_user_id;
    END IF;
    
    -- Upsert conversation thread
    INSERT INTO conversation_threads (
        tenant_id, conversation_id, application_id, lead_id, client_id, broker_id,
        client_name, client_phone, client_email, last_message_at, 
        last_message_preview, last_message_type, message_count, unread_count
    ) VALUES (
        NEW.tenant_id,
        COALESCE(NEW.conversation_id, CONCAT('conv_', NEW.id)),
        NEW.application_id,
        NEW.lead_id,
        COALESCE(NEW.to_user_id, NEW.from_user_id),
        COALESCE(NEW.from_broker_id, NEW.to_broker_id),
        client_name_var,
        client_phone_var,
        client_email_var,
        NEW.created_at,
        LEFT(NEW.body, 200),
        NEW.communication_type,
        1,
        CASE WHEN NEW.direction = 'inbound' THEN 1 ELSE 0 END
    ) ON DUPLICATE KEY UPDATE
        last_message_at = NEW.created_at,
        last_message_preview = LEFT(NEW.body, 200),
        last_message_type = NEW.communication_type,
        message_count = message_count + 1,
        unread_count = unread_count + CASE WHEN NEW.direction = 'inbound' THEN 1 ELSE 0 END,
        updated_at = NOW();
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `compliance_checklists`
--

CREATE TABLE `compliance_checklists` (
  `id` int(11) NOT NULL,
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
-- Table structure for table `conversation_threads`
--

CREATE TABLE `conversation_threads` (
  `id` int(11) NOT NULL,
  `tenant_id` int(11) NOT NULL DEFAULT '1',
  `conversation_id` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `application_id` int(11) DEFAULT NULL,
  `lead_id` int(11) DEFAULT NULL,
  `client_id` int(11) DEFAULT NULL,
  `broker_id` int(11) NOT NULL,
  `client_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `client_phone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `client_email` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
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

-- --------------------------------------------------------

--
-- Table structure for table `documents`
--

CREATE TABLE `documents` (
  `id` int(11) NOT NULL,
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
  `id` int(10) UNSIGNED NOT NULL,
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
(1, 'stripe', 'publishable', 'pk_test_REPLACE_WITH_YOUR_STRIPE_PUBLISHABLE_KEY', 1, '2026-02-23 23:50:30', '2026-02-23 23:50:30'),
(2, 'stripe', 'secret', 'sk_test_REPLACE_WITH_YOUR_STRIPE_SECRET_KEY', 1, '2026-02-23 23:50:30', '2026-02-23 23:50:30'),
(3, 'stripe', 'publishable', '', 0, '2026-02-23 23:50:30', '2026-02-23 23:50:30'),
(4, 'stripe', 'secret', '', 0, '2026-02-23 23:50:30', '2026-02-23 23:50:30');

-- --------------------------------------------------------

--
-- Table structure for table `leads`
--

CREATE TABLE `leads` (
  `id` int(11) NOT NULL,
  `tenant_id` int(11) NOT NULL DEFAULT '1',
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
  `tenant_id` int(11) NOT NULL DEFAULT '1',
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
  `broker_token` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Broker public_token used when client submitted via share link',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `submitted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `loan_applications`
--

INSERT INTO `loan_applications` (`id`, `tenant_id`, `application_number`, `client_user_id`, `broker_user_id`, `loan_type`, `loan_amount`, `property_value`, `property_address`, `property_city`, `property_state`, `property_zip`, `property_type`, `down_payment`, `loan_purpose`, `status`, `current_step`, `total_steps`, `priority`, `estimated_close_date`, `actual_close_date`, `interest_rate`, `loan_term_months`, `notes`, `broker_token`, `created_at`, `updated_at`, `submitted_at`) VALUES
(15, 2, 'LA65421662', 14, 6, 'purchase', 350000.00, 450000.00, '123 Main Street', 'San Francisco', 'CA', '94102', 'single_family', 100000.00, 'Primary residence purchase', 'submitted', 1, 8, 'medium', '2026-03-15', NULL, NULL, NULL, 'Test loan application for development', NULL, '2026-02-11 21:03:41', '2026-02-11 21:03:41', '2026-02-11 21:03:41'),
(23, 1, 'LA73590546', 22, 3, 'purchase', 800000.00, 1000000.00, 'TBD', 'Whittier', 'CA', '90603', 'single_family', 3.50, NULL, 'submitted', 1, 8, 'medium', NULL, NULL, NULL, NULL, NULL, NULL, '2026-02-24 16:53:10', '2026-02-24 16:53:10', '2026-02-24 16:53:10');

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

CREATE TABLE `notifications` (
  `id` int(11) NOT NULL,
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
  `id` int(11) NOT NULL,
  `tenant_id` int(11) NOT NULL DEFAULT '1',
  `pipeline_step` enum('draft','submitted','under_review','documents_pending','underwriting','conditional_approval','approved','denied','closed','cancelled') COLLATE utf8mb4_unicode_ci NOT NULL,
  `communication_type` enum('email','sms','whatsapp') COLLATE utf8mb4_unicode_ci NOT NULL,
  `template_id` int(11) NOT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_by_broker_id` int(11) DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `system_settings`
--

CREATE TABLE `system_settings` (
  `id` int(11) NOT NULL,
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
(1, 1, 'company_name', 'Loan Broker Pro', 'string', 'Company name', '2026-02-02 14:24:22'),
(2, 1, 'support_email', 'support@example.com', 'string', 'Support email address', '2026-02-02 14:24:22'),
(3, 1, 'max_file_upload_mb', '10', 'number', 'Maximum file upload size in MB', '2026-02-02 14:24:22'),
(4, 1, 'enable_sms', 'true', 'boolean', 'Enable SMS notifications', '2026-02-02 14:24:22'),
(5, 1, 'enable_email', 'true', 'boolean', 'Enable email notifications', '2026-02-02 14:24:22');

-- --------------------------------------------------------

--
-- Table structure for table `tasks`
--

CREATE TABLE `tasks` (
  `id` int(11) NOT NULL,
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
  `id` int(11) NOT NULL,
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
  `id` int(11) NOT NULL,
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

-- --------------------------------------------------------

--
-- Table structure for table `task_form_responses`
--

CREATE TABLE `task_form_responses` (
  `id` int(11) NOT NULL,
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
  `id` int(11) NOT NULL,
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
(2, 1, 35, 2, 'zone_1771892195218', 'data:image/png;base64,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', 21, '2026-02-23 18:20:03'),
(3, 1, 35, 2, 'zone_1771892208373', 'data:image/png;base64,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', 21, '2026-02-23 18:20:03');

-- --------------------------------------------------------

--
-- Table structure for table `task_sign_documents`
--

CREATE TABLE `task_sign_documents` (
  `id` int(11) NOT NULL,
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
  `id` int(11) NOT NULL,
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
(40, 1, 'W-2 Form', 'Provide your W-2 form(s) for the most recent tax year.', 'document_verification', 'high', 14, 16, 1, 1, '2026-02-25 20:23:05', '2026-02-25 20:23:05', 1, 'Attach all W-2 forms from the most recent tax year. If you have multiple employers, include the W-2 from each one.', 0, 0);

-- --------------------------------------------------------

--
-- Table structure for table `templates`
--

CREATE TABLE `templates` (
  `id` int(11) NOT NULL,
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
(2, 1, 'Document Reminder SMS', 'Remind clients about pending documents', 'sms', 'reminder', NULL, 'Hi {{client_name}}, this is {{broker_name}} from Encore Mortgage. You have {{document_count}} pending documents for your loan application. Please upload them at your earliest convenience. Reply STOP to opt out.', '[\"client_name\", \"broker_name\", \"document_count\"]', 1, 0, 1, '2026-02-04 15:11:33', '2026-02-04 15:11:33'),
(3, 1, 'Application Update WhatsApp', 'Update clients on application status via WhatsApp', 'whatsapp', 'update', NULL, 'Hi {{client_name}} 👋\n\nGreat news! Your loan application status has been updated to: *{{status}}*\n\n{{additional_notes}}\n\nNext steps: {{next_steps}}\n\nFeel free to reply with any questions!\n\n- {{broker_name}} at Encore Mortgage', '[\"client_name\", \"status\", \"additional_notes\", \"next_steps\", \"broker_name\"]', 1, 0, 1, '2026-02-04 15:11:33', '2026-02-04 15:11:33'),
(4, 1, 'Loan Approved Email', 'Congratulate clients on loan approval', 'email', 'update', 'Congratulations! Your Loan Has Been Approved', 'Dear {{client_name}},\n\nCongratulations! 🎉\n\nWe\'re thrilled to inform you that your loan application #{{application_id}} has been APPROVED!\n\nLoan Details:\n- Loan Amount: ${{loan_amount}}\n- Interest Rate: {{interest_rate}}%\n- Closing Date: {{closing_date}}\n\nNext Steps:\n1. Review the loan documents we\'ll send shortly\n2. Schedule your closing appointment\n3. Prepare for your new home!\n\nThank you for choosing Encore Mortgage. We\'re excited to be part of your homeownership journey!\n\nBest regards,\n{{broker_name}}\nEncore Mortgage', '[\"client_name\", \"application_id\", \"loan_amount\", \"interest_rate\", \"closing_date\", \"broker_name\"]', 1, 0, 1, '2026-02-04 15:11:33', '2026-02-04 15:11:33'),
(5, 1, 'Quick Update SMS', 'Send quick status updates via SMS', 'sms', 'update', NULL, 'Hi {{client_name}}! Quick update on your loan app #{{application_id}}: {{status_message}}. Questions? Call us! - {{broker_name}} at Encore Mortgage', '[\"client_name\", \"application_id\", \"status_message\", \"broker_name\"]', 1, 0, 1, '2026-02-04 15:11:33', '2026-02-04 15:11:33'),
(6, 1, 'Document Upload Reminder WhatsApp', 'Friendly WhatsApp reminder for documents', 'whatsapp', 'reminder', NULL, 'Hi {{client_name}} 👋\n\nFriendly reminder: We\'re still waiting for {{missing_documents}} for your loan application.\n\nYou can upload them easily through your client portal: {{portal_link}}\n\nNeed help? Just reply here and I\'ll assist you right away!\n\n📋 Missing: {{missing_documents}}\n⏰ Needed by: {{due_date}}\n\nThanks!\n{{broker_name}} 🏠', '[\"client_name\", \"missing_documents\", \"portal_link\", \"due_date\", \"broker_name\"]', 1, 0, 1, '2026-02-04 15:11:33', '2026-02-04 15:11:33');

-- --------------------------------------------------------

--
-- Table structure for table `tenants`
--

CREATE TABLE `tenants` (
  `id` int(11) NOT NULL,
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
-- Dumping data for table `user_sessions`
--

INSERT INTO `user_sessions` (`id`, `user_id`, `session_code`, `is_active`, `ip_address`, `user_agent`, `expires_at`, `created_at`) VALUES
(11, 22, 603385, 1, NULL, NULL, '2026-02-25 00:02:48', '2026-02-24 23:47:48');

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
  ADD KEY `idx_email` (`email`),
  ADD KEY `idx_role` (`role`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `tenant_id` (`tenant_id`);

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
  ADD KEY `tenant_id` (`tenant_id`);

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
  ADD KEY `idx_communications_created` (`created_at`);

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
  ADD KEY `idx_loan_applications_broker_token` (`broker_token`);

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
-- AUTO_INCREMENT for table `application_status_history`
--
ALTER TABLE `application_status_history`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=22;

--
-- AUTO_INCREMENT for table `audit_logs`
--
ALTER TABLE `audit_logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=81;

--
-- AUTO_INCREMENT for table `brokers`
--
ALTER TABLE `brokers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `broker_profiles`
--
ALTER TABLE `broker_profiles`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `broker_sessions`
--
ALTER TABLE `broker_sessions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=80;

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
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=23;

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
-- AUTO_INCREMENT for table `conversation_threads`
--
ALTER TABLE `conversation_threads`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `documents`
--
ALTER TABLE `documents`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `environment_keys`
--
ALTER TABLE `environment_keys`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

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
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=24;

--
-- AUTO_INCREMENT for table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=37;

--
-- AUTO_INCREMENT for table `pipeline_step_templates`
--
ALTER TABLE `pipeline_step_templates`
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
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=36;

--
-- AUTO_INCREMENT for table `task_documents`
--
ALTER TABLE `task_documents`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT for table `task_form_fields`
--
ALTER TABLE `task_form_fields`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=35;

--
-- AUTO_INCREMENT for table `task_form_responses`
--
ALTER TABLE `task_form_responses`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `task_signatures`
--
ALTER TABLE `task_signatures`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `task_sign_documents`
--
ALTER TABLE `task_sign_documents`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `task_templates`
--
ALTER TABLE `task_templates`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=41;

--
-- AUTO_INCREMENT for table `templates`
--
ALTER TABLE `templates`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `tenants`
--
ALTER TABLE `tenants`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `user_profiles`
--
ALTER TABLE `user_profiles`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `user_sessions`
--
ALTER TABLE `user_sessions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

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
  ADD CONSTRAINT `fk_conversation_threads_client` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE SET NULL,
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
  ADD CONSTRAINT `loan_applications_ibfk_2` FOREIGN KEY (`broker_user_id`) REFERENCES `brokers` (`id`) ON DELETE SET NULL;

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
