-- Migration: Clear to Close Reminder Flow — seed templates + flow
-- Date: 2026-03-12
-- Compatible with MySQL 8.0 (HostGator)
-- Description:
--   Creates the "Clear to Close" reminder flow.
--   Sequence: (immediate) SMS → branch by loan type → Email (Purchase or Refi) → END
--   Default/Nada edge routes to the Purchase email.

-- ============================================================
-- PART 1 — Templates
-- ============================================================

-- Shared immediate SMS (sent before branching)
INSERT INTO `templates` (`tenant_id`,`name`,`description`,`template_type`,`category`,`subject`,`body`,`variables`,`is_active`,`usage_count`,`created_by_broker_id`) VALUES (
  1,
  'Clear to Close – SMS',
  'Immediate SMS when loan reaches Clear to Close status',
  'sms','follow_up',NULL,
  'Hi {{first_name}}! 🎉🏡 YOU ARE CLEAR TO CLOSE! Your loan (#{{application_number}}) has officially been cleared by underwriting — this is the final green light! We\'re scheduling your closing now and will send you all the details. Get ready to sign and celebrate! – {{broker_name}}, Encore Mortgage. Reply STOP to opt out.',
  '["first_name","application_number","broker_name"]',1,0,1);
SET @ctc_sms := LAST_INSERT_ID();

-- Purchase-specific Email
INSERT INTO `templates` (`tenant_id`,`name`,`description`,`template_type`,`category`,`subject`,`body`,`variables`,`is_active`,`usage_count`,`created_by_broker_id`) VALUES (
  1,
  'Clear to Close – Purchase Email',
  'Clear to Close email for home purchase loans',
  'email','follow_up',
  '🎉 Clear to Close — You\'re Almost a Homeowner!',
  'Hi {{first_name}},\n\nThis is the message you\'ve been waiting for — your loan (#{{application_number}}) is officially **Clear to Close**!\n\nUnderwriting has completed its review, all conditions have been satisfied, and you are cleared to sign your closing documents. You are about to become a homeowner — congratulations!\n\n**What "Clear to Close" means:**\n✅ All loan conditions have been fully satisfied\n✅ The lender has given final approval\n✅ Your loan is ready to fund at closing\n✅ You\'re one signing appointment away from getting your keys!\n\n**What happens next — your closing checklist:**\n\n📋 **Review your Closing Disclosure (CD)**\nYou should have received (or will receive soon) a Closing Disclosure with the final loan terms, monthly payment, and all closing costs. Review it carefully. You have the right to review this document at least 3 business days before closing.\n\n💰 **Prepare your closing funds**\nYour CD will show the exact amount you need to bring to closing. This must typically be wired or brought as a cashier\'s check — personal checks are usually NOT accepted. Contact us right away if you have questions about this amount.\n\n🪪 **Bring a valid government-issued photo ID**\nYou\'ll need this to sign your closing documents. Make sure your name matches exactly what\'s on the loan documents.\n\n🏠 **Final walkthrough**\nCoordinate with your realtor to do a final walkthrough of the property before your closing appointment — ideally the day before or morning of closing.\n\n📞 **Do NOT make any financial changes**\nUntil the loan has funded and recorded, please avoid any new credit, large purchases, job changes, or large bank transfers. Even at this stage, these can delay or jeopardize your closing.\n\n**Your closing appointment details** will be confirmed by our team shortly. Please keep your schedule flexible and respond promptly to any final requests.\n\nThank you for trusting Encore Mortgage with your home purchase. We\'re so excited to hand you the keys!\n\n{{broker_name}}\nEncore Mortgage',
  '["first_name","application_number","broker_name"]',1,0,1);
SET @ctc_p_email := LAST_INSERT_ID();

-- Refi-specific Email
INSERT INTO `templates` (`tenant_id`,`name`,`description`,`template_type`,`category`,`subject`,`body`,`variables`,`is_active`,`usage_count`,`created_by_broker_id`) VALUES (
  1,
  'Clear to Close – Refi Email',
  'Clear to Close email for refinance loans',
  'email','follow_up',
  '🎉 Clear to Close — Your Refinance Is Almost Done!',
  'Hi {{first_name}},\n\nFantastic news — your refinance loan (#{{application_number}}) is officially **Clear to Close**!\n\nUnderwriting has given the final approval and all conditions have been satisfied. We\'re now in the home stretch — just a signing appointment stands between you and your new loan!\n\n**What "Clear to Close" means for your refinance:**\n✅ All conditions have been cleared\n✅ Your new interest rate and loan terms are locked and confirmed\n✅ The lender is ready to fund\n✅ You\'re about to start saving on your mortgage!\n\n**What happens next — your refinance closing checklist:**\n\n📋 **Review your Closing Disclosure (CD)**\nYou should receive a final Closing Disclosure with your new loan terms, closing costs, and any cash out or cash in required at closing. Review it carefully — you have 3 business days to review before we can close.\n\n💰 **Closing costs / cash to close**\nFor most refinances, closing costs are either rolled into the loan or deducted from proceeds. Your CD will show exactly what (if anything) you need to bring or will receive. Let us know if you have questions.\n\n📅 **Right of Rescission (if applicable)**\nFor owner-occupied refinances (non-purchase), federal law gives you 3 business days after signing to cancel the transaction if you change your mind. Your loan will not fund until this period has passed.\n\n🪪 **Bring a valid government-issued photo ID**\nTo sign your closing documents, you\'ll need a current, valid photo ID matching your name on the loan.\n\n📞 **Do NOT make any financial changes**\nUntil your loan has funded and recorded, avoid any changes to your finances — no new credit, large purchases, or job changes.\n\n**Your signing appointment details** will be confirmed shortly. A notary or title agent will coordinate with you directly.\n\nThank you for choosing Encore Mortgage for your refinance. We look forward to completing this transaction and delivering your savings!\n\n{{broker_name}}\nEncore Mortgage',
  '["first_name","application_number","broker_name"]',1,0,1);
SET @ctc_r_email := LAST_INSERT_ID();

-- ============================================================
-- PART 2 — Reminder Flow
-- ============================================================

INSERT INTO `reminder_flows`
  (`tenant_id`,`name`,`description`,`trigger_event`,`trigger_delay_days`,`is_active`,`apply_to_all_loans`,`loan_type_filter`,`created_by_broker_id`)
VALUES (
  1,
  'Clear to Close — Closing Notification Sequence',
  'Triggered immediately when loan status becomes clear_to_close. Sends a shared SMS, then branches by loan type: Purchase gets a purchase-specific closing prep email, Refi gets a refi-specific closing prep email. Default (Nada) routes to the Purchase email.',
  'clear_to_close', 0, 1, 1, 'all', 1
);
SET @ctc_flow := LAST_INSERT_ID();

-- ============================================================
-- PART 3 — Steps
-- ============================================================

INSERT INTO `reminder_flow_steps`
  (`flow_id`,`step_key`,`step_type`,`label`,`description`,`config`,`position_x`,`position_y`)
VALUES
(@ctc_flow,'trigger', 'trigger','Clear to Close Trigger',   NULL,NULL,                                                                500,  50),
(@ctc_flow,'sms',     'send_sms','Shared CTC SMS',          NULL,CONCAT('{"template_id":',@ctc_sms,'}'),                              500, 200),
(@ctc_flow,'branch',  'branch',  'Loan Type Branch',        'Routes to Purchase or Refi email','{"condition_type":"loan_type"}',      500, 350),
(@ctc_flow,'p_email', 'send_email','CTC Email (Purchase)',  NULL,CONCAT('{"template_id":',@ctc_p_email,'}'),                          250, 500),
(@ctc_flow,'r_email', 'send_email','CTC Email (Refi)',      NULL,CONCAT('{"template_id":',@ctc_r_email,'}'),                          750, 500),
(@ctc_flow,'p_end',   'end',      'End (Purchase)',         NULL,NULL,                                                                250, 630),
(@ctc_flow,'r_end',   'end',      'End (Refi)',             NULL,NULL,                                                                750, 630);

-- ============================================================
-- PART 4 — Connections
-- ============================================================

INSERT INTO `reminder_flow_connections`
  (`flow_id`,`edge_key`,`source_step_key`,`target_step_key`,`label`,`edge_type`)
VALUES
(@ctc_flow,'e_trigger_sms',    'trigger', 'sms',     NULL,       'default'),
(@ctc_flow,'e_sms_branch',     'sms',     'branch',  NULL,       'default'),
-- branch edges (Nada/default → purchase)
(@ctc_flow,'e_branch_p',       'branch',  'p_email', 'Purchase', 'loan_type_purchase'),
(@ctc_flow,'e_branch_r',       'branch',  'r_email', 'Refi',     'loan_type_refinance'),
(@ctc_flow,'e_branch_def',     'branch',  'p_email', 'Other',    'default'),
-- email → end
(@ctc_flow,'e_p_email_end',    'p_email', 'p_end',   NULL,       'default'),
(@ctc_flow,'e_r_email_end',    'r_email', 'r_end',   NULL,       'default');

-- ============================================================
-- PART 5 — Audit log
-- ============================================================
INSERT INTO `audit_logs` (
  `tenant_id`,`user_id`,`broker_id`,`actor_type`,`action`,
  `entity_type`,`entity_id`,`changes`,`status`,`created_at`
) VALUES (
  1, NULL, NULL, 'user', 'schema_migration',
  'reminder_flows', NULL,
  '{"migration":"20260312_210000_seed_clear_to_close_reminder_flow","description":"Created Clear to Close reminder flow: shared SMS, branch by loan type, Purchase email (closing checklist for home buyer) or Refi email (right of rescission + refi closing checklist). Default routes to Purchase."}',
  'success', NOW()
);
