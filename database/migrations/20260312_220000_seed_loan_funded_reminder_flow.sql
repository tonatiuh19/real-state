-- Migration: Loan Funded Reminder Flow — seed templates + flow
-- Date: 2026-03-12
-- Compatible with MySQL 8.0 (HostGator)
-- Description:
--   Creates the "Loan Funded" reminder flow.
--   Checks if actual_close_date is set on the loan:
--     YES → wait_until_date (actual_close_date) → SMS → Email → END
--     NO  (Nada) → END (no action taken — no date to schedule against)
--
--   The wait_until_date step resolves immediately if the date is in the past
--   (same-day funded), or waits until the exact close_date timestamp.

-- ============================================================
-- PART 1 — Templates
-- ============================================================

INSERT INTO `templates` (`tenant_id`,`name`,`description`,`template_type`,`category`,`subject`,`body`,`variables`,`is_active`,`usage_count`,`created_by_broker_id`) VALUES (
  1,
  'Loan Funded – SMS',
  'SMS sent on the close date when the loan funds',
  'sms','follow_up',NULL,
  'Hi {{first_name}}! 🎉🔑 YOUR LOAN HAS FUNDED! Congratulations — your loan (#{{application_number}}) is officially closed and the keys are yours! It has been a pleasure working with you. Wishing you many happy years in your new home! – {{broker_name}}, Encore Mortgage. Reply STOP to opt out.',
  '["first_name","application_number","broker_name"]',1,0,1);
SET @lf_sms := LAST_INSERT_ID();

INSERT INTO `templates` (`tenant_id`,`name`,`description`,`template_type`,`category`,`subject`,`body`,`variables`,`is_active`,`usage_count`,`created_by_broker_id`) VALUES (
  1,
  'Loan Funded – Email',
  'Email sent on the close date when the loan funds',
  'email','follow_up',
  '🎉 Your Loan Has Funded — Congratulations!',
  'Hi {{first_name}},\n\nThis is the moment you\'ve been working toward — **your loan has officially funded and closed!** 🎊\n\nApplication #: {{application_number}}\n\nOn behalf of the entire team at Encore Mortgage, we want to say **congratulations** and thank you for trusting us with such an important milestone in your life.\n\n**Here\'s a summary of what just happened:**\n✅ Your loan documents were signed and notarized\n✅ The lender wired the funds to the title company\n✅ The title company recorded the transaction with the county\n✅ Ownership has been officially transferred — the property is YOURS\n\n**What to expect next:**\n\n📬 **Loan documents** — You\'ll receive your complete closing package by mail within 1–2 weeks. Keep these documents in a safe place — you\'ll need them for tax purposes.\n\n💳 **Your first mortgage payment** — Your first payment is typically due on the 1st of the month following 30 days after closing. Watch for your welcome letter from your loan servicer with payment instructions.\n\n🏠 **Loan servicer** — Your loan may be transferred to a loan servicer (which may differ from the lender). You\'ll receive a notification if this happens — it doesn\'t affect your loan terms.\n\n🧾 **Tax benefits** — Mortgage interest and property taxes may be deductible. Consult your tax advisor for details.\n\n📞 **We\'re still here** — If you ever need a refinance, have questions, or want to refer a friend or family member who needs a mortgage, we\'re always here for you.\n\nThank you again for choosing Encore Mortgage. We\'re so proud to have been part of your journey.\n\nWith warm congratulations,\n\n{{broker_name}}\nEncore Mortgage',
  '["first_name","application_number","broker_name"]',1,0,1);
SET @lf_email := LAST_INSERT_ID();

-- ============================================================
-- PART 2 — Reminder Flow
-- ============================================================

INSERT INTO `reminder_flows`
  (`tenant_id`,`name`,`description`,`trigger_event`,`trigger_delay_days`,`is_active`,`apply_to_all_loans`,`loan_type_filter`,`created_by_broker_id`)
VALUES (
  1,
  'Loan Funded — Closing Day Congratulations',
  'Triggered when loan status becomes loan_funded. Checks if actual_close_date is set. If yes, waits until the close date then sends a congratulatory SMS + Email. If no close date is set (Nada), the flow ends without sending.',
  'loan_funded', 0, 1, 1, 'all', 1
);
SET @lf_flow := LAST_INSERT_ID();

-- ============================================================
-- PART 3 — Steps
-- ============================================================

INSERT INTO `reminder_flow_steps`
  (`flow_id`,`step_key`,`step_type`,`label`,`description`,`config`,`position_x`,`position_y`)
VALUES
(@lf_flow,'trigger',        'trigger',         'Loan Funded Trigger',            NULL, NULL,                                                      500,  50),
(@lf_flow,'branch',         'condition',       'Has Close Date?',                'Check if actual_close_date is set on the loan',
                                                                                        '{"condition_type":"field_not_empty","field_name":"actual_close_date"}',
                                                                                                                                                   500, 200),
(@lf_flow,'wait_close_date','wait_until_date', 'Wait Until Close Date',          'Waits until actual_close_date, then continues',
                                                                                        '{"date_field":"actual_close_date"}',                      250, 370),
(@lf_flow,'sms',            'send_sms',        'Funded Congratulations SMS',     NULL, CONCAT('{"template_id":',@lf_sms,'}'),                      250, 500),
(@lf_flow,'email',          'send_email',      'Funded Congratulations Email',   NULL, CONCAT('{"template_id":',@lf_email,'}'),                    250, 630),
(@lf_flow,'end',            'end',             'End',                            NULL, NULL,                                                       250, 760),
(@lf_flow,'end_no_date',    'end',             'End (No Close Date)',            NULL, NULL,                                                       750, 370);

-- ============================================================
-- PART 4 — Connections
-- ============================================================

INSERT INTO `reminder_flow_connections`
  (`flow_id`,`edge_key`,`source_step_key`,`target_step_key`,`label`,`edge_type`)
VALUES
(@lf_flow,'e_trigger_branch',       'trigger',         'branch',         NULL,              'default'),
-- condition: close date is set → wait until it
(@lf_flow,'e_branch_yes',           'branch',          'wait_close_date','Close Date Set',  'condition_yes'),
-- condition: no close date → end immediately (Nada)
(@lf_flow,'e_branch_no',            'branch',          'end_no_date',    'Nada',            'condition_no'),
(@lf_flow,'e_branch_default',       'branch',          'end_no_date',    'Default',         'default'),
-- after waiting → SMS → Email → END
(@lf_flow,'e_wait_sms',             'wait_close_date', 'sms',            NULL,              'default'),
(@lf_flow,'e_sms_email',            'sms',             'email',          NULL,              'default'),
(@lf_flow,'e_email_end',            'email',           'end',            NULL,              'default');

-- ============================================================
-- PART 5 — Audit log
-- ============================================================
INSERT INTO `audit_logs` (
  `tenant_id`,`user_id`,`broker_id`,`actor_type`,`action`,
  `entity_type`,`entity_id`,`changes`,`status`,`created_at`
) VALUES (
  1, NULL, NULL, 'user', 'schema_migration',
  'reminder_flows', NULL,
  '{"migration":"20260312_220000_seed_loan_funded_reminder_flow","description":"Created Loan Funded reminder flow: condition on actual_close_date (field_not_empty), wait_until_date then SMS + Email. Nada branch ends silently. Also added wait_until_date step type and field_not_empty/field_empty condition types to engine and shared types."}',
  'success', NOW()
);
