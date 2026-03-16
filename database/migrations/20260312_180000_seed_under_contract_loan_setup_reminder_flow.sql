-- Migration: Under Contract / Loan Set Up Reminder Flow — seed templates + flow
-- Date: 2026-03-12
-- Compatible with MySQL 8.0 (HostGator)
-- Description:
--   Creates the "Under Contract / Loan Set Up" reminder flow.
--   No loan-type branching. Pure immediate sequence:
--   (immediate) SMS → Email → END

-- ============================================================
-- PART 1 — Templates
-- ============================================================

INSERT INTO `templates` (`tenant_id`,`name`,`description`,`template_type`,`category`,`subject`,`body`,`variables`,`is_active`,`usage_count`,`created_by_broker_id`) VALUES (
  1,
  'Under Contract/Loan Set Up – SMS',
  'Immediate SMS when loan enters Under Contract / Loan Set Up status',
  'sms','follow_up',NULL,
  'Hi {{first_name}}! 🎉 Congratulations — you\'re officially under contract! Your loan (#{{application_number}}) is now in the setup phase and we\'re working hard to keep things moving. We\'ll keep you updated every step of the way. Questions? Reply anytime! – {{broker_name}}, Encore Mortgage. Reply STOP to opt out.',
  '["first_name","application_number","broker_name"]',1,0,1);
SET @uc_sms := LAST_INSERT_ID();

INSERT INTO `templates` (`tenant_id`,`name`,`description`,`template_type`,`category`,`subject`,`body`,`variables`,`is_active`,`usage_count`,`created_by_broker_id`) VALUES (
  1,
  'Under Contract/Loan Set Up – Email',
  'Immediate email when loan enters Under Contract / Loan Set Up status',
  'email','follow_up',
  '🏡 You\'re Under Contract — Here\'s What Happens Next',
  'Hi {{first_name}},\n\nCongratulations — you\'re officially under contract! This is an exciting milestone, and our team at Encore Mortgage is fully focused on making your closing as smooth as possible.\n\nApplication #: {{application_number}}\n\nHere\'s what we\'re working on during the Loan Set Up phase:\n\n📋 **Loan File Review** — We\'re organizing and verifying all your documentation.\n🏠 **Appraisal Coordination** — We\'ll be ordering or scheduling your home appraisal shortly.\n🔒 **Rate Lock** — If you haven\'t locked your rate yet, now is the time. Let\'s discuss!\n📑 **Title & Escrow** — We\'re coordinating with title and escrow to ensure a clean transaction.\n\n**What you need to do right now:**\n1. Avoid opening new lines of credit or making large purchases.\n2. Keep your employment and income situation stable.\n3. Respond quickly to any document requests from our team — speed matters!\n4. Keep your phone and email accessible; we may need to reach you quickly.\n\n**Your estimated closing timeline** starts from today. We\'ll provide regular updates as we move through underwriting and approvals.\n\nIf you have any questions at any point, please don\'t hesitate to reach out. We\'re here for you through every step.\n\n{{broker_name}}\nEncore Mortgage',
  '["first_name","application_number","broker_name"]',1,0,1);
SET @uc_email := LAST_INSERT_ID();

-- ============================================================
-- PART 2 — Reminder Flow
-- ============================================================

INSERT INTO `reminder_flows`
  (`tenant_id`,`name`,`description`,`trigger_event`,`trigger_delay_days`,`is_active`,`apply_to_all_loans`,`loan_type_filter`,`created_by_broker_id`)
VALUES (
  1,
  'Under Contract/Loan Set Up — Welcome Sequence',
  'Triggered immediately when loan status becomes under_contract_loan_setup. Sends an SMS followed by an Email with details on next steps. No branching.',
  'under_contract_loan_setup', 0, 1, 1, 'all', 1
);
SET @uc_flow := LAST_INSERT_ID();

-- ============================================================
-- PART 3 — Steps
-- ============================================================

INSERT INTO `reminder_flow_steps`
  (`flow_id`,`step_key`,`step_type`,`label`,`description`,`config`,`position_x`,`position_y`)
VALUES
(@uc_flow,'trigger','trigger','Under Contract/Loan Set Up Trigger',NULL,NULL,                            500,  50),
(@uc_flow,'sms',    'send_sms',  'Welcome SMS',  NULL, CONCAT('{"template_id":',@uc_sms,'}'),           500, 200),
(@uc_flow,'email',  'send_email','Welcome Email', NULL, CONCAT('{"template_id":',@uc_email,'}'),         500, 330),
(@uc_flow,'end',    'end',       'End',           NULL, NULL,                                            500, 460);

-- ============================================================
-- PART 4 — Connections
-- ============================================================

INSERT INTO `reminder_flow_connections`
  (`flow_id`,`edge_key`,`source_step_key`,`target_step_key`,`label`,`edge_type`)
VALUES
(@uc_flow,'e_trigger_sms',  'trigger','sms',   NULL,'default'),
(@uc_flow,'e_sms_email',    'sms',    'email', NULL,'default'),
(@uc_flow,'e_email_end',    'email',  'end',   NULL,'default');

-- ============================================================
-- PART 5 — Audit log
-- ============================================================
INSERT INTO `audit_logs` (
  `tenant_id`,`user_id`,`broker_id`,`actor_type`,`action`,
  `entity_type`,`entity_id`,`changes`,`status`,`created_at`
) VALUES (
  1, NULL, NULL, 'user', 'schema_migration',
  'reminder_flows', NULL,
  '{"migration":"20260312_180000_seed_under_contract_loan_setup_reminder_flow","description":"Created Under Contract/Loan Set Up reminder flow: immediate SMS + Email, no branching"}',
  'success', NOW()
);
