-- Migration: App Sent Reminder Flow — seed templates + flow
-- Date: 2026-03-12
-- Compatible with MySQL 8.0 (HostGator)
-- Description:
--   Creates the "App Sent" reminder flow with:
--     • branch by loan_type (purchase / refinance / default)
--     • 16 message templates (email + sms per branch)
--     • internal partner notification at end of default branch
--   NOTE: The "add tag (APP_email_sent)" node shown in the design wireframe
--         is not yet a supported step type; it is omitted here and can be
--         added once a future migration adds the 'assign_tag' step_type enum.

-- ============================================================
-- PART 1 — Templates
-- ============================================================

-- ── Purchase branch ─────────────────────────────────────────

INSERT INTO `templates`
  (`tenant_id`, `name`, `description`, `template_type`, `category`, `subject`, `body`, `variables`, `is_active`, `usage_count`, `created_by_broker_id`)
VALUES (
  1,
  'App Sent – Purchase Welcome Email',
  'First email sent when a purchase loan application is received',
  'email', 'follow_up',
  '🏠 Your Home Purchase Loan Application Has Been Received!',
  'Hi {{first_name}},\n\nWe\'re excited to let you know that your home *purchase* loan application has been received and is now under review.\n\nApplication #: {{application_number}}\n\nHere\'s what happens next:\n1. Our team will review your information within 1 business day.\n2. We\'ll reach out if we need any additional documents.\n3. You\'ll receive updates at every step of the process.\n\nIf you have any questions or need assistance, reply to this email or call us anytime.\n\nLooking forward to helping you get those keys! 🔑\n\n{{broker_name}}\nEncore Mortgage',
  '["first_name","application_number","broker_name"]',
  1, 0, 1
);
SET @t_purchase_email_1 := LAST_INSERT_ID();

INSERT INTO `templates`
  (`tenant_id`, `name`, `description`, `template_type`, `category`, `subject`, `body`, `variables`, `is_active`, `usage_count`, `created_by_broker_id`)
VALUES (
  1,
  'App Sent – Purchase Confirmation SMS',
  'Quick SMS confirmation after purchase application is received',
  'sms', 'follow_up',
  NULL,
  'Hi {{first_name}}! ✅ We received your home purchase application (#{{application_number}}). Our team is already on it! Questions? Just reply. – {{broker_name}}, Encore Mortgage. Reply STOP to opt out.',
  '["first_name","application_number","broker_name"]',
  1, 0, 1
);
SET @t_purchase_sms_1 := LAST_INSERT_ID();

INSERT INTO `templates`
  (`tenant_id`, `name`, `description`, `template_type`, `category`, `subject`, `body`, `variables`, `is_active`, `usage_count`, `created_by_broker_id`)
VALUES (
  1,
  'App Sent – Purchase Follow-Up Email',
  'Follow-up email for purchase loan, same day',
  'email', 'follow_up',
  'Next Steps for Your Home Purchase Loan',
  'Hi {{first_name}},\n\nJust following up on your home purchase loan application (#{{application_number}}).\n\nTo keep things moving smoothly, please make sure the following are ready:\n• Government-issued photo ID\n• Last 2 months of pay stubs\n• Last 2 years of W-2s or tax returns\n• Last 2 months of bank statements\n\nYou can upload documents directly through your client portal. If you haven\'t logged in yet, check the link in your welcome email.\n\nWe\'re with you every step of the way. Don\'t hesitate to reach out!\n\n{{broker_name}}\nEncore Mortgage',
  '["first_name","application_number","broker_name"]',
  1, 0, 1
);
SET @t_purchase_email_2 := LAST_INSERT_ID();

INSERT INTO `templates`
  (`tenant_id`, `name`, `description`, `template_type`, `category`, `subject`, `body`, `variables`, `is_active`, `usage_count`, `created_by_broker_id`)
VALUES (
  1,
  'App Sent – Purchase Day-3 Reminder SMS',
  'SMS reminder 3 days after purchase application received',
  'sms', 'reminder',
  NULL,
  'Hi {{first_name}}, it\'s {{broker_name}} from Encore Mortgage. Checking in on your purchase loan app (#{{application_number}}). Have you had a chance to upload your documents? We\'re here to help – just reply! Reply STOP to opt out.',
  '["first_name","application_number","broker_name"]',
  1, 0, 1
);
SET @t_purchase_sms_2 := LAST_INSERT_ID();

INSERT INTO `templates`
  (`tenant_id`, `name`, `description`, `template_type`, `category`, `subject`, `body`, `variables`, `is_active`, `usage_count`, `created_by_broker_id`)
VALUES (
  1,
  'App Sent – Purchase Day-6 Final SMS',
  'Final SMS nudge 6 days after purchase application received',
  'sms', 'reminder',
  NULL,
  'Hi {{first_name}}! 👋 Still here to help with your home purchase loan (#{{application_number}}). A quick call could get you one step closer to those keys! Call or reply anytime. – {{broker_name}}, Encore Mortgage. Reply STOP to opt out.',
  '["first_name","application_number","broker_name"]',
  1, 0, 1
);
SET @t_purchase_sms_3 := LAST_INSERT_ID();

-- ── Refinance branch ─────────────────────────────────────────

INSERT INTO `templates`
  (`tenant_id`, `name`, `description`, `template_type`, `category`, `subject`, `body`, `variables`, `is_active`, `usage_count`, `created_by_broker_id`)
VALUES (
  1,
  'App Sent – Refi Welcome Email',
  'First email sent when a refinance loan application is received',
  'email', 'follow_up',
  '🔄 Your Refinance Application Has Been Received!',
  'Hi {{first_name}},\n\nGreat news — your refinance loan application has been received and is now under review.\n\nApplication #: {{application_number}}\n\nRefinancing can save you money, lower your payment, or help you access equity. We\'re here to make the process as smooth as possible.\n\nWhat to expect next:\n1. We\'ll review your application within 1 business day.\n2. We may reach out for additional documents.\n3. We\'ll keep you updated every step of the way.\n\nQuestions? Just reply to this email!\n\n{{broker_name}}\nEncore Mortgage',
  '["first_name","application_number","broker_name"]',
  1, 0, 1
);
SET @t_refi_email_1 := LAST_INSERT_ID();

INSERT INTO `templates`
  (`tenant_id`, `name`, `description`, `template_type`, `category`, `subject`, `body`, `variables`, `is_active`, `usage_count`, `created_by_broker_id`)
VALUES (
  1,
  'App Sent – Refi Confirmation SMS',
  'Quick SMS confirmation after refinance application is received',
  'sms', 'follow_up',
  NULL,
  'Hi {{first_name}}! ✅ We received your refinance application (#{{application_number}}). We\'re reviewing it now! Questions? Just reply. – {{broker_name}}, Encore Mortgage. Reply STOP to opt out.',
  '["first_name","application_number","broker_name"]',
  1, 0, 1
);
SET @t_refi_sms_1 := LAST_INSERT_ID();

INSERT INTO `templates`
  (`tenant_id`, `name`, `description`, `template_type`, `category`, `subject`, `body`, `variables`, `is_active`, `usage_count`, `created_by_broker_id`)
VALUES (
  1,
  'App Sent – Refi Follow-Up Email',
  'Follow-up email for refi loan, same day',
  'email', 'follow_up',
  'Next Steps for Your Refinance',
  'Hi {{first_name}},\n\nFollowing up on your refinance application (#{{application_number}}).\n\nTo keep things moving, please have these documents ready:\n• Government-issued photo ID\n• Last 2 months of pay stubs\n• Last 2 years of W-2s or tax returns\n• Last 2 months of bank statements\n• Most recent mortgage statement\n\nYou can upload everything securely through your client portal.\n\nWe\'re committed to making your refinance as fast and painless as possible.\n\n{{broker_name}}\nEncore Mortgage',
  '["first_name","application_number","broker_name"]',
  1, 0, 1
);
SET @t_refi_email_2 := LAST_INSERT_ID();

INSERT INTO `templates`
  (`tenant_id`, `name`, `description`, `template_type`, `category`, `subject`, `body`, `variables`, `is_active`, `usage_count`, `created_by_broker_id`)
VALUES (
  1,
  'App Sent – Refi Day-3 Reminder SMS',
  'SMS reminder 3 days after refinance application received',
  'sms', 'reminder',
  NULL,
  'Hi {{first_name}}, it\'s {{broker_name}} from Encore Mortgage. Just checking in on your refinance app (#{{application_number}}). Have questions or need help with documents? Reply anytime! Reply STOP to opt out.',
  '["first_name","application_number","broker_name"]',
  1, 0, 1
);
SET @t_refi_sms_2 := LAST_INSERT_ID();

INSERT INTO `templates`
  (`tenant_id`, `name`, `description`, `template_type`, `category`, `subject`, `body`, `variables`, `is_active`, `usage_count`, `created_by_broker_id`)
VALUES (
  1,
  'App Sent – Refi Day-6 Final SMS',
  'Final SMS nudge 6 days after refinance application received',
  'sms', 'reminder',
  NULL,
  'Hi {{first_name}}! 👋 Your refinance application (#{{application_number}}) is still open. Lock in your rate now — give us a call or reply here. We\'re ready when you are! – {{broker_name}}, Encore Mortgage. Reply STOP to opt out.',
  '["first_name","application_number","broker_name"]',
  1, 0, 1
);
SET @t_refi_sms_3 := LAST_INSERT_ID();

-- ── Default / No Loan Type branch ────────────────────────────

INSERT INTO `templates`
  (`tenant_id`, `name`, `description`, `template_type`, `category`, `subject`, `body`, `variables`, `is_active`, `usage_count`, `created_by_broker_id`)
VALUES (
  1,
  'App Sent – Default Welcome Email',
  'First email when loan type is not yet classified',
  'email', 'follow_up',
  '📋 Your Loan Application Has Been Received!',
  'Hi {{first_name}},\n\nWe\'ve received your loan application and our team is reviewing it now.\n\nApplication #: {{application_number}}\n\nNext steps:\n1. Our team will review your details within 1 business day.\n2. We\'ll reach out if we need anything else from you.\n3. You\'ll receive updates throughout the process.\n\nIf you have any questions, just reply to this email or give us a call.\n\n{{broker_name}}\nEncore Mortgage',
  '["first_name","application_number","broker_name"]',
  1, 0, 1
);
SET @t_default_email_1 := LAST_INSERT_ID();

INSERT INTO `templates`
  (`tenant_id`, `name`, `description`, `template_type`, `category`, `subject`, `body`, `variables`, `is_active`, `usage_count`, `created_by_broker_id`)
VALUES (
  1,
  'App Sent – Default Day-3 SMS',
  'First SMS reminder 3 days after application received (no loan type)',
  'sms', 'reminder',
  NULL,
  'Hi {{first_name}}, it\'s {{broker_name}} from Encore Mortgage. Checking in on your loan application (#{{application_number}}). Any questions or documents you need help with? Reply anytime! Reply STOP to opt out.',
  '["first_name","application_number","broker_name"]',
  1, 0, 1
);
SET @t_default_sms_1 := LAST_INSERT_ID();

INSERT INTO `templates`
  (`tenant_id`, `name`, `description`, `template_type`, `category`, `subject`, `body`, `variables`, `is_active`, `usage_count`, `created_by_broker_id`)
VALUES (
  1,
  'App Sent – Default Day-10 SMS',
  'Second SMS reminder 10 days after application received (no loan type)',
  'sms', 'reminder',
  NULL,
  'Hi {{first_name}}, we want to make sure your loan application (#{{application_number}}) keeps moving forward. Give us a call or reply here — we\'d love to help! – {{broker_name}}, Encore Mortgage. Reply STOP to opt out.',
  '["first_name","application_number","broker_name"]',
  1, 0, 1
);
SET @t_default_sms_2 := LAST_INSERT_ID();

INSERT INTO `templates`
  (`tenant_id`, `name`, `description`, `template_type`, `category`, `subject`, `body`, `variables`, `is_active`, `usage_count`, `created_by_broker_id`)
VALUES (
  1,
  'App Sent – Default Follow-Up Email',
  'Follow-up email 10 days after application (no loan type)',
  'email', 'follow_up',
  'We\'re Still Here to Help with Your Loan',
  'Hi {{first_name}},\n\nWe noticed your loan application (#{{application_number}}) still has some pending items. We want to make sure you get the best possible outcome.\n\nOur team is ready to walk you through every step — documents, questions, timelines — whatever you need.\n\nWould you be available for a quick call this week? Just reply and we\'ll set it up.\n\n{{broker_name}}\nEncore Mortgage',
  '["first_name","application_number","broker_name"]',
  1, 0, 1
);
SET @t_default_email_2 := LAST_INSERT_ID();

INSERT INTO `templates`
  (`tenant_id`, `name`, `description`, `template_type`, `category`, `subject`, `body`, `variables`, `is_active`, `usage_count`, `created_by_broker_id`)
VALUES (
  1,
  'App Sent – Default Day-17 Final SMS',
  'Final SMS reminder 17 days after application (no loan type)',
  'sms', 'reminder',
  NULL,
  'Hi {{first_name}}, last check-in on your loan application (#{{application_number}}). We\'re still here and ready to help. Don\'t let this opportunity pass — reply or call us today! – {{broker_name}}, Encore Mortgage. Reply STOP to opt out.',
  '["first_name","application_number","broker_name"]',
  1, 0, 1
);
SET @t_default_sms_3 := LAST_INSERT_ID();

INSERT INTO `templates`
  (`tenant_id`, `name`, `description`, `template_type`, `category`, `subject`, `body`, `variables`, `is_active`, `usage_count`, `created_by_broker_id`)
VALUES (
  1,
  'App Sent – Partner Internal Notification',
  'Internal notification to the assigned partner after default follow-up sequence completes',
  'email', 'system',
  '[ACTION NEEDED] Loan Application Requires Partner Follow-Up',
  'Hello,\n\nThis is an automated internal alert.\n\nClient {{client_name}} has completed the automated App Sent reminder sequence without responding. Their loan application (#{{application_number}}) may need personal outreach from the assigned partner.\n\nApplication details:\n• Client: {{client_name}}\n• Application #: {{application_number}}\n• Loan Type: {{loan_type}}\n\nPlease follow up directly with the client at your earliest convenience.\n\n— Encore Mortgage Automation',
  '["client_name","application_number","loan_type"]',
  1, 0, 1
);
SET @t_partner_notify := LAST_INSERT_ID();

-- ============================================================
-- PART 2 — Reminder Flow
-- ============================================================

INSERT INTO `reminder_flows`
  (`tenant_id`, `name`, `description`, `trigger_event`, `trigger_delay_days`,
   `is_active`, `apply_to_all_loans`, `loan_type_filter`, `created_by_broker_id`)
VALUES (
  1,
  'App Sent — Full Reminder Sequence',
  'Triggered when a loan application is sent (app_sent). Branches by loan type: Purchase and Refi get an immediate welcome email + SMS cadence; Default (unclassified) gets a longer nurture sequence ending with a partner notification.',
  'app_sent', 0,
  1, 1, 'all', 1
);
SET @flow_id := LAST_INSERT_ID();

-- ============================================================
-- PART 3 — Flow Steps
-- ============================================================

INSERT INTO `reminder_flow_steps`
  (`flow_id`, `step_key`, `step_type`, `label`, `description`, `config`, `position_x`, `position_y`)
VALUES
-- Trigger node
(@flow_id, 'trigger',            'trigger',  'App Sent Trigger',       'Fires when loan status becomes app_sent', NULL, 400, 50),

-- Branch by loan type
(@flow_id, 'branch_loan_type',   'branch',   'Loan Type Branch',       'Routes to Purchase, Refi, or Default sequence',
  '{"condition_type":"loan_type"}', 400, 220),

-- ── PURCHASE branch ──────────────────────────────────────────
(@flow_id, 'purchase_email_1',   'send_email', 'Welcome Email (Purchase)',  'Initial welcome email for purchase loans',
  CONCAT('{"template_id":', @t_purchase_email_1, '}'), 150, 450),

(@flow_id, 'purchase_wait_1min', 'wait',      'Wait 1 Minute',         'Short pause before SMS confirmation',
  '{"delay_minutes":1}', 150, 600),

(@flow_id, 'purchase_sms_1',     'send_sms',  'Confirmation SMS (Purchase)', 'Quick SMS confirmation',
  CONCAT('{"template_id":', @t_purchase_sms_1, '}'), 150, 750),

(@flow_id, 'purchase_email_2',   'send_email', 'Follow-Up Email (Purchase)', 'Same-day follow-up with document checklist',
  CONCAT('{"template_id":', @t_purchase_email_2, '}'), 150, 900),

(@flow_id, 'purchase_wait_3d_1', 'wait',      'Wait 3 Days',           NULL, '{"delay_days":3}', 150, 1050),

(@flow_id, 'purchase_sms_2',     'send_sms',  'Day-3 Reminder SMS (Purchase)', 'Reminder to upload documents',
  CONCAT('{"template_id":', @t_purchase_sms_2, '}'), 150, 1200),

(@flow_id, 'purchase_wait_3d_2', 'wait',      'Wait 3 More Days',      NULL, '{"delay_days":3}', 150, 1350),

(@flow_id, 'purchase_sms_3',     'send_sms',  'Day-6 Final SMS (Purchase)', 'Final nudge SMS',
  CONCAT('{"template_id":', @t_purchase_sms_3, '}'), 150, 1500),

(@flow_id, 'end_purchase',       'end',       'End (Purchase)',         'Purchase sequence complete', NULL, 150, 1650),

-- ── REFI branch ───────────────────────────────────────────────
(@flow_id, 'refi_email_1',       'send_email', 'Welcome Email (Refi)',  'Initial welcome email for refi loans',
  CONCAT('{"template_id":', @t_refi_email_1, '}'), 430, 450),

(@flow_id, 'refi_wait_1min',     'wait',      'Wait 1 Minute',         'Short pause before SMS confirmation',
  '{"delay_minutes":1}', 430, 600),

(@flow_id, 'refi_sms_1',         'send_sms',  'Confirmation SMS (Refi)', 'Quick SMS confirmation',
  CONCAT('{"template_id":', @t_refi_sms_1, '}'), 430, 750),

(@flow_id, 'refi_email_2',       'send_email', 'Follow-Up Email (Refi)', 'Same-day follow-up with document checklist',
  CONCAT('{"template_id":', @t_refi_email_2, '}'), 430, 900),

(@flow_id, 'refi_wait_3d_1',     'wait',      'Wait 3 Days',           NULL, '{"delay_days":3}', 430, 1050),

(@flow_id, 'refi_sms_2',         'send_sms',  'Day-3 Reminder SMS (Refi)', 'Reminder to upload documents',
  CONCAT('{"template_id":', @t_refi_sms_2, '}'), 430, 1200),

(@flow_id, 'refi_wait_3d_2',     'wait',      'Wait 3 More Days',      NULL, '{"delay_days":3}', 430, 1350),

(@flow_id, 'refi_sms_3',         'send_sms',  'Day-6 Final SMS (Refi)', 'Final nudge SMS',
  CONCAT('{"template_id":', @t_refi_sms_3, '}'), 430, 1500),

(@flow_id, 'end_refi',           'end',       'End (Refi)',             'Refi sequence complete', NULL, 430, 1650),

-- ── DEFAULT / No loan type branch ────────────────────────────
(@flow_id, 'default_email_1',    'send_email', 'Welcome Email (Default)', 'General welcome email',
  CONCAT('{"template_id":', @t_default_email_1, '}'), 720, 450),

(@flow_id, 'default_wait_3d_1',  'wait',      'Wait 3 Days',           NULL, '{"delay_days":3}', 720, 600),

(@flow_id, 'default_sms_1',      'send_sms',  'Day-3 SMS (Default)',   'First SMS check-in',
  CONCAT('{"template_id":', @t_default_sms_1, '}'), 720, 750),

(@flow_id, 'default_wait_7d_1',  'wait',      'Wait 7 Days',           NULL, '{"delay_days":7}', 720, 900),

(@flow_id, 'default_sms_2',      'send_sms',  'Day-10 SMS (Default)',  'Second SMS nudge',
  CONCAT('{"template_id":', @t_default_sms_2, '}'), 720, 1050),

(@flow_id, 'default_email_2',    'send_email', 'Follow-Up Email (Default)', 'Mid-sequence follow-up email',
  CONCAT('{"template_id":', @t_default_email_2, '}'), 720, 1200),

(@flow_id, 'default_wait_7d_2',  'wait',      'Wait 7 More Days',      NULL, '{"delay_days":7}', 720, 1350),

(@flow_id, 'default_sms_3',      'send_sms',  'Day-17 Final SMS (Default)', 'Final SMS in default sequence',
  CONCAT('{"template_id":', @t_default_sms_3, '}'), 720, 1500),

-- Internal notification to partner (send_notification → in-app; upgrade to
-- partner email once the execution engine supports partner email targeting)
(@flow_id, 'default_notify_partner', 'send_notification', 'Notify Partner',
  'Internal alert to assigned partner after full sequence without response',
  CONCAT('{"template_id":', @t_partner_notify, ',"subject":"[ACTION NEEDED] Client Needs Partner Follow-Up"}'),
  720, 1650),

(@flow_id, 'end_default',        'end',       'End (Default)',          'Default sequence complete', NULL, 720, 1800);

-- ============================================================
-- PART 4 — Flow Connections
-- ============================================================

INSERT INTO `reminder_flow_connections`
  (`flow_id`, `edge_key`, `source_step_key`, `target_step_key`, `label`, `edge_type`)
VALUES
-- trigger → branch
(@flow_id, 'e_trigger_branch',          'trigger',              'branch_loan_type',       NULL,        'default'),

-- branch → each sub-tree
(@flow_id, 'e_branch_purchase',         'branch_loan_type',     'purchase_email_1',       'Purchase',  'loan_type_purchase'),
(@flow_id, 'e_branch_refi',             'branch_loan_type',     'refi_email_1',           'Refi',      'loan_type_refinance'),
(@flow_id, 'e_branch_default',          'branch_loan_type',     'default_email_1',        'Other',     'default'),

-- ── Purchase chain ───────────────────────────────────────────
(@flow_id, 'e_pe1_pw1',                 'purchase_email_1',     'purchase_wait_1min',     NULL,        'default'),
(@flow_id, 'e_pw1_ps1',                 'purchase_wait_1min',   'purchase_sms_1',         NULL,        'default'),
(@flow_id, 'e_ps1_pe2',                 'purchase_sms_1',       'purchase_email_2',       NULL,        'default'),
(@flow_id, 'e_pe2_pw3d1',               'purchase_email_2',     'purchase_wait_3d_1',     NULL,        'default'),
(@flow_id, 'e_pw3d1_ps2',               'purchase_wait_3d_1',   'purchase_sms_2',         NULL,        'default'),
(@flow_id, 'e_ps2_pw3d2',               'purchase_sms_2',       'purchase_wait_3d_2',     NULL,        'default'),
(@flow_id, 'e_pw3d2_ps3',               'purchase_wait_3d_2',   'purchase_sms_3',         NULL,        'default'),
(@flow_id, 'e_ps3_end_purchase',        'purchase_sms_3',       'end_purchase',           NULL,        'default'),

-- ── Refi chain ───────────────────────────────────────────────
(@flow_id, 'e_re1_rw1',                 'refi_email_1',         'refi_wait_1min',         NULL,        'default'),
(@flow_id, 'e_rw1_rs1',                 'refi_wait_1min',       'refi_sms_1',             NULL,        'default'),
(@flow_id, 'e_rs1_re2',                 'refi_sms_1',           'refi_email_2',           NULL,        'default'),
(@flow_id, 'e_re2_rw3d1',               'refi_email_2',         'refi_wait_3d_1',         NULL,        'default'),
(@flow_id, 'e_rw3d1_rs2',               'refi_wait_3d_1',       'refi_sms_2',             NULL,        'default'),
(@flow_id, 'e_rs2_rw3d2',               'refi_sms_2',           'refi_wait_3d_2',         NULL,        'default'),
(@flow_id, 'e_rw3d2_rs3',               'refi_wait_3d_2',       'refi_sms_3',             NULL,        'default'),
(@flow_id, 'e_rs3_end_refi',            'refi_sms_3',           'end_refi',               NULL,        'default'),

-- ── Default chain ────────────────────────────────────────────
(@flow_id, 'e_de1_dw3d1',               'default_email_1',      'default_wait_3d_1',      NULL,        'default'),
(@flow_id, 'e_dw3d1_ds1',               'default_wait_3d_1',    'default_sms_1',          NULL,        'default'),
(@flow_id, 'e_ds1_dw7d1',               'default_sms_1',        'default_wait_7d_1',      NULL,        'default'),
(@flow_id, 'e_dw7d1_ds2',               'default_wait_7d_1',    'default_sms_2',          NULL,        'default'),
(@flow_id, 'e_ds2_de2',                 'default_sms_2',        'default_email_2',        NULL,        'default'),
(@flow_id, 'e_de2_dw7d2',               'default_email_2',      'default_wait_7d_2',      NULL,        'default'),
(@flow_id, 'e_dw7d2_ds3',               'default_wait_7d_2',    'default_sms_3',          NULL,        'default'),
(@flow_id, 'e_ds3_notify',              'default_sms_3',        'default_notify_partner', NULL,        'default'),
(@flow_id, 'e_notify_end_default',      'default_notify_partner','end_default',           NULL,        'default');

-- ============================================================
-- PART 5 — Audit log
-- ============================================================
INSERT INTO `audit_logs` (
  `tenant_id`, `user_id`, `broker_id`, `actor_type`, `action`,
  `entity_type`, `entity_id`, `changes`, `status`, `created_at`
) VALUES (
  1, NULL, NULL, 'user', 'schema_migration',
  'reminder_flows', NULL,
  '{"migration":"20260312_140000_seed_app_sent_reminder_flow","description":"Created App Sent reminder flow with 16 templates and 3 branches (purchase/refi/default)"}',
  'success', NOW()
);
