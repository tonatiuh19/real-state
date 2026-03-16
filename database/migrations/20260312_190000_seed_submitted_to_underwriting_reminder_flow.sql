-- Migration: Submitted to Underwriting Reminder Flow — seed templates + flow
-- Date: 2026-03-12
-- Compatible with MySQL 8.0 (HostGator)
-- Description:
--   Creates the "Submitted to Underwriting" reminder flow.
--   No loan-type branching. Pure immediate sequence:
--   (immediate) SMS → Email → END

-- ============================================================
-- PART 1 — Templates
-- ============================================================

INSERT INTO `templates` (`tenant_id`,`name`,`description`,`template_type`,`category`,`subject`,`body`,`variables`,`is_active`,`usage_count`,`created_by_broker_id`) VALUES (
  1,
  'Submitted to Underwriting – SMS',
  'Immediate SMS when loan is submitted to underwriting',
  'sms','follow_up',NULL,
  'Hi {{first_name}}! 📋 Great news — your loan (#{{application_number}}) has been submitted to underwriting! This is a key milestone. Our underwriters will review your full file and we\'ll keep you posted on any updates. Hang tight — we\'re on it! – {{broker_name}}, Encore Mortgage. Reply STOP to opt out.',
  '["first_name","application_number","broker_name"]',1,0,1);
SET @su_sms := LAST_INSERT_ID();

INSERT INTO `templates` (`tenant_id`,`name`,`description`,`template_type`,`category`,`subject`,`body`,`variables`,`is_active`,`usage_count`,`created_by_broker_id`) VALUES (
  1,
  'Submitted to Underwriting – Email',
  'Immediate email when loan is submitted to underwriting',
  'email','follow_up',
  '📋 Your Loan Has Been Submitted to Underwriting',
  'Hi {{first_name}},\n\nWe have an important update on your loan (#{{application_number}}) — your file has been officially submitted to underwriting!\n\nThis is one of the most critical stages of the mortgage process, and we want to make sure you know exactly what to expect.\n\n**What is underwriting?**\nAn underwriter is a specialist who thoroughly reviews your loan file — including your income, assets, credit, and the property details — to make a final lending decision.\n\n**What happens during underwriting:**\n🔍 **Document Review** — The underwriter will verify all submitted documents.\n🏡 **Appraisal Review** — The property appraisal will be evaluated against the loan amount.\n💳 **Credit & Income Analysis** — Employment, income, and credit history are assessed in detail.\n⚖️ **Risk Assessment** — The underwriter determines if the loan meets all program guidelines.\n\n**Typical underwriting timeline:** 3–7 business days (can vary based on file complexity and lender volume).\n\n**What you can do to help speed things up:**\n✅ Respond immediately to any requests for additional documents or explanations.\n✅ Do NOT make any major financial changes — no new credit, large purchases, or job changes.\n✅ Keep your phone and email accessible in case we need to reach you urgently.\n✅ If you receive a "Conditions" list, gather those items as fast as possible.\n\n**What comes after underwriting?**\nOnce the underwriter reviews your file, you\'ll receive one of three outcomes:\n- ✅ **Approved** — Congratulations! We move to closing.\n- ⚠️ **Approved with Conditions** — Minor items needed before final approval.\n- ❌ **Suspended/Denied** — We\'ll discuss options if this happens (it\'s rare for well-prepared files like yours).\n\nWe\'re working hard and will keep you updated. If you have any questions in the meantime, don\'t hesitate to reach out.\n\n{{broker_name}}\nEncore Mortgage',
  '["first_name","application_number","broker_name"]',1,0,1);
SET @su_email := LAST_INSERT_ID();

-- ============================================================
-- PART 2 — Reminder Flow
-- ============================================================

INSERT INTO `reminder_flows`
  (`tenant_id`,`name`,`description`,`trigger_event`,`trigger_delay_days`,`is_active`,`apply_to_all_loans`,`loan_type_filter`,`created_by_broker_id`)
VALUES (
  1,
  'Submitted to Underwriting — Notification Sequence',
  'Triggered immediately when loan status becomes submitted_to_underwriting. Sends an SMS and an Email explaining the underwriting process and what the client should expect. No branching.',
  'submitted_to_underwriting', 0, 1, 1, 'all', 1
);
SET @su_flow := LAST_INSERT_ID();

-- ============================================================
-- PART 3 — Steps
-- ============================================================

INSERT INTO `reminder_flow_steps`
  (`flow_id`,`step_key`,`step_type`,`label`,`description`,`config`,`position_x`,`position_y`)
VALUES
(@su_flow,'trigger','trigger',  'Submitted to Underwriting Trigger',NULL,NULL,                         500,  50),
(@su_flow,'sms',    'send_sms', 'Underwriting SMS',  NULL, CONCAT('{"template_id":',@su_sms,'}'),     500, 200),
(@su_flow,'email',  'send_email','Underwriting Email',NULL, CONCAT('{"template_id":',@su_email,'}'),   500, 330),
(@su_flow,'end',    'end',      'End',               NULL, NULL,                                       500, 460);

-- ============================================================
-- PART 4 — Connections
-- ============================================================

INSERT INTO `reminder_flow_connections`
  (`flow_id`,`edge_key`,`source_step_key`,`target_step_key`,`label`,`edge_type`)
VALUES
(@su_flow,'e_trigger_sms', 'trigger','sms',   NULL,'default'),
(@su_flow,'e_sms_email',   'sms',    'email', NULL,'default'),
(@su_flow,'e_email_end',   'email',  'end',   NULL,'default');

-- ============================================================
-- PART 5 — Audit log
-- ============================================================
INSERT INTO `audit_logs` (
  `tenant_id`,`user_id`,`broker_id`,`actor_type`,`action`,
  `entity_type`,`entity_id`,`changes`,`status`,`created_at`
) VALUES (
  1, NULL, NULL, 'user', 'schema_migration',
  'reminder_flows', NULL,
  '{"migration":"20260312_190000_seed_submitted_to_underwriting_reminder_flow","description":"Created Submitted to Underwriting reminder flow: immediate SMS + Email explaining the underwriting process, no branching"}',
  'success', NOW()
);
