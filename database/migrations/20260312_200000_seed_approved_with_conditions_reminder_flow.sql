-- Migration: Approved with Conditions Reminder Flow — seed templates + flow
-- Date: 2026-03-12
-- Compatible with MySQL 8.0 (HostGator)
-- Description:
--   Creates the "Approved with Conditions" reminder flow.
--   No loan-type branching. Immediate linear sequence:
--   (immediate) SMS → Email → Notify Buyer Agent → Notify Listing Agent → Notify Title Agent → END
--
--   The three internal notifications alert the broker team to proactively
--   reach out to the respective agents with the conditions update.

-- ============================================================
-- PART 1 — Templates
-- ============================================================

-- Client-facing SMS
INSERT INTO `templates` (`tenant_id`,`name`,`description`,`template_type`,`category`,`subject`,`body`,`variables`,`is_active`,`usage_count`,`created_by_broker_id`) VALUES (
  1,
  'Approved with Conditions – SMS',
  'Immediate SMS when loan is approved with conditions',
  'sms','follow_up',NULL,
  'Hi {{first_name}}! 🎉 Your loan (#{{application_number}}) has been *approved with conditions*! This means the underwriter has approved your loan pending a few items we need to clear. We\'ll send you details by email shortly. Don\'t worry — this is very common and we\'ll guide you through every item. – {{broker_name}}, Encore Mortgage. Reply STOP to opt out.',
  '["first_name","application_number","broker_name"]',1,0,1);
SET @awc_sms := LAST_INSERT_ID();

-- Client-facing Email
INSERT INTO `templates` (`tenant_id`,`name`,`description`,`template_type`,`category`,`subject`,`body`,`variables`,`is_active`,`usage_count`,`created_by_broker_id`) VALUES (
  1,
  'Approved with Conditions – Email',
  'Immediate email when loan is approved with conditions',
  'email','follow_up',
  '✅ Your Loan Is Approved — With Conditions',
  'Hi {{first_name}},\n\nGreat news — your loan (#{{application_number}}) has been reviewed by underwriting and you have been issued an **Approval with Conditions**!\n\nThis is a very common and positive outcome. It means the underwriter has approved your loan in principle, but requires a few additional items before issuing a final clear-to-close.\n\n**What "Approved with Conditions" means:**\n✅ The core of your loan file has passed underwriting review.\n⚠️ There are specific conditions (items) that must be satisfied before final approval.\n📋 Once all conditions are cleared, you\'ll receive a "Clear to Close" — the final milestone before signing!\n\n**Common conditions may include:**\n• Additional income documentation (pay stubs, tax returns, letters of explanation)\n• Updated bank statements\n• Clarification letters on large deposits or inquiries\n• Homeowner\'s insurance confirmation\n• Title commitments or HOA documents\n• Property repair requirements from the appraisal\n\n**What you need to do RIGHT NOW:**\n1. Watch for a follow-up message or call from our team with your specific conditions list.\n2. Gather and submit the required documents as quickly as possible — speed is critical at this stage.\n3. Do NOT make any financial changes — no new credit, large purchases, or job changes.\n4. Contact your homeowner\'s insurance agent immediately if not already done.\n\n**Timeline:** Once all conditions are submitted and reviewed, final approval typically happens within 1–3 business days.\n\nWe\'re so close to the finish line! Our team is working hard on your behalf. If you have any questions about your specific conditions, please reply or call us right away.\n\n{{broker_name}}\nEncore Mortgage',
  '["first_name","application_number","broker_name"]',1,0,1);
SET @awc_email := LAST_INSERT_ID();

-- Internal notification – Buyer Agent
INSERT INTO `templates` (`tenant_id`,`name`,`description`,`template_type`,`category`,`subject`,`body`,`variables`,`is_active`,`usage_count`,`created_by_broker_id`) VALUES (
  1,
  'Approved with Conditions – Notify Buyer Agent (Internal)',
  'Internal notification to contact the buyer\'s agent about the approval with conditions',
  'email','system',
  '[ACTION] Notify Buyer Agent — Loan Approved with Conditions',
  'Hello Team,\n\nThis is an automated internal alert.\n\nLoan #{{application_number}} for client {{client_name}} has been **Approved with Conditions** by underwriting.\n\nAction Required: Please contact the **Buyer\'s Agent** immediately to inform them of the conditional approval and update them on the conditions that need to be cleared before a Clear to Close can be issued.\n\nKey points to communicate to the Buyer\'s Agent:\n• The loan has passed underwriting review with conditions\n• Conditions must be cleared promptly to meet the closing timeline\n• Any cooperation needed (e.g. addenda, HOA docs) should be addressed immediately\n• Keep the seller\'s agent informed as needed to avoid closing delays\n\nLoan Details:\n• Client: {{client_name}}\n• Application #: {{application_number}}\n• Loan Type: {{loan_type}}\n• Status: Approved with Conditions\n\nPlease log your outreach in the system once completed.\n\n— Encore Mortgage Automation',
  '["client_name","application_number","loan_type"]',1,0,1);
SET @awc_notify_buyer := LAST_INSERT_ID();

-- Internal notification – Listing Agent
INSERT INTO `templates` (`tenant_id`,`name`,`description`,`template_type`,`category`,`subject`,`body`,`variables`,`is_active`,`usage_count`,`created_by_broker_id`) VALUES (
  1,
  'Approved with Conditions – Notify Listing Agent (Internal)',
  'Internal notification to contact the listing agent about the approval with conditions',
  'email','system',
  '[ACTION] Notify Listing Agent — Loan Approved with Conditions',
  'Hello Team,\n\nThis is an automated internal alert.\n\nLoan #{{application_number}} for client {{client_name}} has been **Approved with Conditions** by underwriting.\n\nAction Required: Please contact the **Listing Agent** to inform them of the current loan status and manage expectations around the closing timeline.\n\nKey points to communicate to the Listing Agent:\n• The loan is progressing and has received a conditional approval\n• Conditions are being worked on and we expect to clear them promptly\n• We are committed to meeting the agreed closing date\n• If any contract extensions or accommodations are needed, they should be discussed now\n\nLoan Details:\n• Client: {{client_name}}\n• Application #: {{application_number}}\n• Loan Type: {{loan_type}}\n• Status: Approved with Conditions\n\nPlease log your outreach in the system once completed.\n\n— Encore Mortgage Automation',
  '["client_name","application_number","loan_type"]',1,0,1);
SET @awc_notify_listing := LAST_INSERT_ID();

-- Internal notification – Title Agent
INSERT INTO `templates` (`tenant_id`,`name`,`description`,`template_type`,`category`,`subject`,`body`,`variables`,`is_active`,`usage_count`,`created_by_broker_id`) VALUES (
  1,
  'Approved with Conditions – Notify Title Agent (Internal)',
  'Internal notification to contact the title agent about the approval with conditions',
  'email','system',
  '[ACTION] Notify Title Agent — Loan Approved with Conditions',
  'Hello Team,\n\nThis is an automated internal alert.\n\nLoan #{{application_number}} for client {{client_name}} has been **Approved with Conditions** by underwriting.\n\nAction Required: Please contact the **Title Agent / Title Company** to ensure all title-related conditions are on their radar and to coordinate any outstanding title requirements.\n\nKey points to communicate to the Title Agent:\n• Loan is in conditional approval status — a Clear to Close is pending\n• Confirm the title commitment is current and all requirements have been submitted to underwriting\n• Verify any lien releases, HOA certifications, or survey items have been addressed\n• Confirm the title company is ready to schedule closing upon CTC issuance\n• Request a preliminary Closing Disclosure (CD) if not yet prepared\n\nLoan Details:\n• Client: {{client_name}}\n• Application #: {{application_number}}\n• Loan Type: {{loan_type}}\n• Status: Approved with Conditions\n\nPlease log your outreach in the system once completed.\n\n— Encore Mortgage Automation',
  '["client_name","application_number","loan_type"]',1,0,1);
SET @awc_notify_title := LAST_INSERT_ID();

-- ============================================================
-- PART 2 — Reminder Flow
-- ============================================================

INSERT INTO `reminder_flows`
  (`tenant_id`,`name`,`description`,`trigger_event`,`trigger_delay_days`,`is_active`,`apply_to_all_loans`,`loan_type_filter`,`created_by_broker_id`)
VALUES (
  1,
  'Approved with Conditions — Notification Sequence',
  'Triggered immediately when loan status becomes approved_with_conditions. Sends client an SMS + Email explaining the conditional approval. Then fires three internal notifications to alert the team to contact the Buyer Agent, Listing Agent, and Title Agent respectively.',
  'approved_with_conditions', 0, 1, 1, 'all', 1
);
SET @awc_flow := LAST_INSERT_ID();

-- ============================================================
-- PART 3 — Steps
-- ============================================================

INSERT INTO `reminder_flow_steps`
  (`flow_id`,`step_key`,`step_type`,`label`,`description`,`config`,`position_x`,`position_y`)
VALUES
(@awc_flow,'trigger',       'trigger',          'Approved with Conditions Trigger',NULL,NULL,                                                                                                                                                500,  50),
(@awc_flow,'sms',           'send_sms',         'Client SMS',                       NULL, CONCAT('{"template_id":',@awc_sms,'}'),                                                                                                          500, 200),
(@awc_flow,'email',         'send_email',       'Client Email',                     NULL, CONCAT('{"template_id":',@awc_email,'}'),                                                                                                         500, 330),
(@awc_flow,'notify_buyer',  'send_notification','Notify Buyer Agent (Internal)',     NULL, CONCAT('{"template_id":',@awc_notify_buyer,',"subject":"[ACTION] Notify Buyer Agent — Loan Approved with Conditions"}'),                         500, 460),
(@awc_flow,'notify_listing','send_notification','Notify Listing Agent (Internal)',   NULL, CONCAT('{"template_id":',@awc_notify_listing,',"subject":"[ACTION] Notify Listing Agent — Loan Approved with Conditions"}'),                     500, 590),
(@awc_flow,'notify_title',  'send_notification','Notify Title Agent (Internal)',     NULL, CONCAT('{"template_id":',@awc_notify_title,',"subject":"[ACTION] Notify Title Agent — Loan Approved with Conditions"}'),                        500, 720),
(@awc_flow,'end',           'end',              'End',                              NULL, NULL,                                                                                                                                             500, 850);

-- ============================================================
-- PART 4 — Connections
-- ============================================================

INSERT INTO `reminder_flow_connections`
  (`flow_id`,`edge_key`,`source_step_key`,`target_step_key`,`label`,`edge_type`)
VALUES
(@awc_flow,'e_trigger_sms',           'trigger',      'sms',           NULL,'default'),
(@awc_flow,'e_sms_email',             'sms',          'email',         NULL,'default'),
(@awc_flow,'e_email_notify_buyer',    'email',        'notify_buyer',  NULL,'default'),
(@awc_flow,'e_buyer_notify_listing',  'notify_buyer', 'notify_listing',NULL,'default'),
(@awc_flow,'e_listing_notify_title',  'notify_listing','notify_title', NULL,'default'),
(@awc_flow,'e_title_end',             'notify_title', 'end',           NULL,'default');

-- ============================================================
-- PART 5 — Audit log
-- ============================================================
INSERT INTO `audit_logs` (
  `tenant_id`,`user_id`,`broker_id`,`actor_type`,`action`,
  `entity_type`,`entity_id`,`changes`,`status`,`created_at`
) VALUES (
  1, NULL, NULL, 'user', 'schema_migration',
  'reminder_flows', NULL,
  '{"migration":"20260312_200000_seed_approved_with_conditions_reminder_flow","description":"Created Approved with Conditions reminder flow: immediate SMS + Email to client, then 3 internal notifications to alert team to contact Buyer Agent, Listing Agent, and Title Agent"}',
  'success', NOW()
);
