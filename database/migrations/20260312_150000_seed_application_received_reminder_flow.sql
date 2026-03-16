-- Migration: Application Received Reminder Flow — seed templates + flow
-- Date: 2026-03-12
-- Compatible with MySQL 8.0 (HostGator)
-- Description:
--   Creates the "Application Received" reminder flow with:
--     • condition: loan status is NOT adverse (condition_yes = safe to continue)
--     • branch by loan_type: Purchase / Refi / Default (Nada merges to Purchase)
--     • 8 message templates (SMS + email per branch)
--   Flow cadence per branch:
--     SMS → Email → Wait 10 min → Email → Wait 2 days → SMS → End

-- ============================================================
-- PART 1 — Templates
-- ============================================================

-- ── Purchase branch ─────────────────────────────────────────

INSERT INTO `templates`
  (`tenant_id`, `name`, `description`, `template_type`, `category`, `subject`, `body`, `variables`, `is_active`, `usage_count`, `created_by_broker_id`)
VALUES (
  1,
  'App Received – Purchase Welcome SMS',
  'Immediate SMS confirmation when a purchase loan application is received',
  'sms', 'follow_up',
  NULL,
  'Hi {{first_name}}! 🏠 Great news — we received your home purchase application (#{{application_number}}) and our team is already reviewing it. Questions? Just reply! – {{broker_name}}, Encore Mortgage. Reply STOP to opt out.',
  '["first_name","application_number","broker_name"]',
  1, 0, 1
);
SET @t_ar_purchase_sms_1 := LAST_INSERT_ID();

INSERT INTO `templates`
  (`tenant_id`, `name`, `description`, `template_type`, `category`, `subject`, `body`, `variables`, `is_active`, `usage_count`, `created_by_broker_id`)
VALUES (
  1,
  'App Received – Purchase Welcome Email',
  'Immediate welcome email for purchase loan once application is fully received',
  'email', 'follow_up',
  '🏠 We\'ve Received Your Purchase Loan Application!',
  'Hi {{first_name}},\n\nExciting news! Your home purchase loan application has been officially received and is now in our system.\n\nApplication #: {{application_number}}\n\nOur team will begin a thorough review right away. Here\'s what to expect:\n\n• We\'ll contact you within 1 business day with next steps.\n• You may be asked to provide supporting documents through your client portal.\n• We\'ll keep you updated every step of the way.\n\nWe\'re thrilled to be part of your homeownership journey. Don\'t hesitate to reach out with any questions!\n\n{{broker_name}}\nEncore Mortgage',
  '["first_name","application_number","broker_name"]',
  1, 0, 1
);
SET @t_ar_purchase_email_1 := LAST_INSERT_ID();

INSERT INTO `templates`
  (`tenant_id`, `name`, `description`, `template_type`, `category`, `subject`, `body`, `variables`, `is_active`, `usage_count`, `created_by_broker_id`)
VALUES (
  1,
  'App Received – Purchase 10-Min Follow-Up Email',
  'Follow-up email sent ~10 minutes after application received (purchase)',
  'email', 'follow_up',
  'What Happens Next with Your Purchase Loan (#{{application_number}})',
  'Hi {{first_name}},\n\nJust following up! Now that we have your application (#{{application_number}}), here\'s a quick checklist of documents you\'ll want to have ready:\n\n✅ Government-issued photo ID (driver\'s license or passport)\n✅ Last 2 months of pay stubs\n✅ Last 2 years of W-2s or tax returns\n✅ Last 2–3 months of bank statements\n✅ Any gift letters (if applicable)\n\nYou can upload everything securely through your client portal. Getting these in early will help us move faster!\n\nReady to chat? Reply to this email or give us a call — we\'re here.\n\n{{broker_name}}\nEncore Mortgage',
  '["first_name","application_number","broker_name"]',
  1, 0, 1
);
SET @t_ar_purchase_email_2 := LAST_INSERT_ID();

INSERT INTO `templates`
  (`tenant_id`, `name`, `description`, `template_type`, `category`, `subject`, `body`, `variables`, `is_active`, `usage_count`, `created_by_broker_id`)
VALUES (
  1,
  'App Received – Purchase Day-2 Follow-Up SMS',
  'SMS follow-up 2 days after purchase application received',
  'sms', 'reminder',
  NULL,
  'Hi {{first_name}}, it\'s {{broker_name}} from Encore Mortgage. Checking in on your purchase loan app (#{{application_number}}) — have you had a chance to log in to your portal and review your checklist? We\'re here if you need anything! Reply STOP to opt out.',
  '["first_name","application_number","broker_name"]',
  1, 0, 1
);
SET @t_ar_purchase_sms_2 := LAST_INSERT_ID();

-- ── Refinance branch ─────────────────────────────────────────

INSERT INTO `templates`
  (`tenant_id`, `name`, `description`, `template_type`, `category`, `subject`, `body`, `variables`, `is_active`, `usage_count`, `created_by_broker_id`)
VALUES (
  1,
  'App Received – Refi Welcome SMS',
  'Immediate SMS confirmation when a refinance loan application is received',
  'sms', 'follow_up',
  NULL,
  'Hi {{first_name}}! 🔄 We received your refinance application (#{{application_number}}) and are reviewing it now. We\'ll follow up shortly — reply anytime with questions! – {{broker_name}}, Encore Mortgage. Reply STOP to opt out.',
  '["first_name","application_number","broker_name"]',
  1, 0, 1
);
SET @t_ar_refi_sms_1 := LAST_INSERT_ID();

INSERT INTO `templates`
  (`tenant_id`, `name`, `description`, `template_type`, `category`, `subject`, `body`, `variables`, `is_active`, `usage_count`, `created_by_broker_id`)
VALUES (
  1,
  'App Received – Refi Welcome Email',
  'Immediate welcome email for refinance loan once application is fully received',
  'email', 'follow_up',
  '🔄 Your Refinance Application Has Been Received!',
  'Hi {{first_name}},\n\nYour refinance application is officially in — and our team has already started the review process.\n\nApplication #: {{application_number}}\n\nRefinancing is one of the smartest financial moves you can make, and we\'re here to make it seamless.\n\nWhat to expect:\n• We\'ll review your application and reach out within 1 business day.\n• We may request supporting documents through your secure client portal.\n• You\'ll receive updates at key milestones.\n\nHave questions? Just reply to this email — we\'re happy to help.\n\n{{broker_name}}\nEncore Mortgage',
  '["first_name","application_number","broker_name"]',
  1, 0, 1
);
SET @t_ar_refi_email_1 := LAST_INSERT_ID();

INSERT INTO `templates`
  (`tenant_id`, `name`, `description`, `template_type`, `category`, `subject`, `body`, `variables`, `is_active`, `usage_count`, `created_by_broker_id`)
VALUES (
  1,
  'App Received – Refi 10-Min Follow-Up Email',
  'Follow-up email sent ~10 minutes after refinance application received',
  'email', 'follow_up',
  'Quick Checklist for Your Refinance (#{{application_number}})',
  'Hi {{first_name}},\n\nGreat start! To keep your refinance moving as quickly as possible, here are the documents we\'ll need:\n\n✅ Government-issued photo ID\n✅ Last 2 months of pay stubs\n✅ Last 2 years of W-2s or tax returns\n✅ Last 2–3 months of bank statements\n✅ Most recent mortgage statement\n✅ Homeowners insurance declaration page\n\nUpload them securely through your client portal whenever you\'re ready. Getting ahead on documents can save days in processing.\n\nQuestions? We\'re a reply or call away.\n\n{{broker_name}}\nEncore Mortgage',
  '["first_name","application_number","broker_name"]',
  1, 0, 1
);
SET @t_ar_refi_email_2 := LAST_INSERT_ID();

INSERT INTO `templates`
  (`tenant_id`, `name`, `description`, `template_type`, `category`, `subject`, `body`, `variables`, `is_active`, `usage_count`, `created_by_broker_id`)
VALUES (
  1,
  'App Received – Refi Day-2 Follow-Up SMS',
  'SMS follow-up 2 days after refinance application received',
  'sms', 'reminder',
  NULL,
  'Hi {{first_name}}, {{broker_name}} here from Encore Mortgage. Just checking in on your refinance app (#{{application_number}}). Have you had a chance to review your document checklist in the portal? We\'re here to help make this easy! Reply STOP to opt out.',
  '["first_name","application_number","broker_name"]',
  1, 0, 1
);
SET @t_ar_refi_sms_2 := LAST_INSERT_ID();

-- ============================================================
-- PART 2 — Reminder Flow
-- ============================================================

INSERT INTO `reminder_flows`
  (`tenant_id`, `name`, `description`, `trigger_event`, `trigger_delay_days`,
   `is_active`, `apply_to_all_loans`, `loan_type_filter`, `created_by_broker_id`)
VALUES (
  1,
  'Application Received — Nurture Sequence',
  'Triggered when a loan application status moves to application_received. Checks the application is not in an adverse state, then branches by loan type (Purchase / Refi). Default (unclassified) follows the Purchase sequence. Cadence: SMS → Email → 10-min wait → Email → 2-day wait → SMS.',
  'application_received', 0,
  1, 1, 'all', 1
);
SET @ar_flow_id := LAST_INSERT_ID();

-- ============================================================
-- PART 3 — Flow Steps
-- ============================================================

INSERT INTO `reminder_flow_steps`
  (`flow_id`, `step_key`, `step_type`, `label`, `description`, `config`, `position_x`, `position_y`)
VALUES
-- Trigger
(@ar_flow_id, 'trigger',
  'trigger', 'Application Received Trigger', NULL, NULL, 400, 50),

-- Condition 1: loan status is NOT adverse
-- condition_yes = no adverse flag → continue to loan type branch
-- condition_no  = has adverse status → end immediately
(@ar_flow_id, 'cond_not_adverse',
  'condition', 'Loan Status Check (Not Adverse)',
  'Verifies the loan is not in an adverse/blocked state before sending communications',
  '{"condition_type":"loan_status_ne","condition_value":"adverse"}',
  400, 220),

-- Adverse dead-end
(@ar_flow_id, 'end_adverse',
  'end', 'End (Adverse — No Action)', 'Application is in adverse state; skip all automations', NULL, 680, 380),

-- Branch 2: loan type
(@ar_flow_id, 'branch_loan_type',
  'branch', 'Loan Type Branch',
  'Routes Purchase and Default to left sequence; Refi to right sequence',
  '{"condition_type":"loan_type"}',
  400, 380),

-- ── PURCHASE / DEFAULT sequence ──────────────────────────────
(@ar_flow_id, 'purchase_sms_1',
  'send_sms', 'Welcome SMS (Purchase)',
  'Immediate SMS confirmation',
  CONCAT('{"template_id":', @t_ar_purchase_sms_1, '}'),
  200, 560),

(@ar_flow_id, 'purchase_email_1',
  'send_email', 'Welcome Email (Purchase)',
  'Immediate welcome email',
  CONCAT('{"template_id":', @t_ar_purchase_email_1, '}'),
  200, 710),

(@ar_flow_id, 'purchase_wait_10m',
  'wait', 'Wait 10 Minutes', NULL,
  '{"delay_minutes":10}',
  200, 860),

(@ar_flow_id, 'purchase_email_2',
  'send_email', 'Document Checklist Email (Purchase)',
  'Follow-up email with document checklist',
  CONCAT('{"template_id":', @t_ar_purchase_email_2, '}'),
  200, 1010),

(@ar_flow_id, 'purchase_wait_2d',
  'wait', 'Wait 2 Days', NULL,
  '{"delay_days":2}',
  200, 1160),

(@ar_flow_id, 'purchase_sms_2',
  'send_sms', 'Day-2 Follow-Up SMS (Purchase)',
  'Check-in SMS after 2 days',
  CONCAT('{"template_id":', @t_ar_purchase_sms_2, '}'),
  200, 1310),

(@ar_flow_id, 'end_purchase',
  'end', 'End (Purchase)', 'Purchase nurture sequence complete', NULL, 200, 1460),

-- ── REFI sequence ─────────────────────────────────────────────
(@ar_flow_id, 'refi_sms_1',
  'send_sms', 'Welcome SMS (Refi)',
  'Immediate SMS confirmation',
  CONCAT('{"template_id":', @t_ar_refi_sms_1, '}'),
  580, 560),

(@ar_flow_id, 'refi_email_1',
  'send_email', 'Welcome Email (Refi)',
  'Immediate welcome email',
  CONCAT('{"template_id":', @t_ar_refi_email_1, '}'),
  580, 710),

(@ar_flow_id, 'refi_wait_10m',
  'wait', 'Wait 10 Minutes', NULL,
  '{"delay_minutes":10}',
  580, 860),

(@ar_flow_id, 'refi_email_2',
  'send_email', 'Document Checklist Email (Refi)',
  'Follow-up email with document checklist',
  CONCAT('{"template_id":', @t_ar_refi_email_2, '}'),
  580, 1010),

(@ar_flow_id, 'refi_wait_2d',
  'wait', 'Wait 2 Days', NULL,
  '{"delay_days":2}',
  580, 1160),

(@ar_flow_id, 'refi_sms_2',
  'send_sms', 'Day-2 Follow-Up SMS (Refi)',
  'Check-in SMS after 2 days',
  CONCAT('{"template_id":', @t_ar_refi_sms_2, '}'),
  580, 1310),

(@ar_flow_id, 'end_refi',
  'end', 'End (Refi)', 'Refi nurture sequence complete', NULL, 580, 1460);

-- ============================================================
-- PART 4 — Flow Connections
-- ============================================================

INSERT INTO `reminder_flow_connections`
  (`flow_id`, `edge_key`, `source_step_key`, `target_step_key`, `label`, `edge_type`)
VALUES
-- trigger → adverse check
(@ar_flow_id, 'e_trigger_adverse',        'trigger',           'cond_not_adverse',  NULL,         'default'),

-- adverse check → branch (no adverse) or end (adverse)
(@ar_flow_id, 'e_adverse_yes',            'cond_not_adverse',  'branch_loan_type',  'Not Adverse', 'condition_yes'),
(@ar_flow_id, 'e_adverse_no',             'cond_not_adverse',  'end_adverse',       'Adverse',     'condition_no'),

-- loan type branch → sequences
-- Purchase and Default (Nada) both route to purchase sequence
(@ar_flow_id, 'e_branch_purchase',        'branch_loan_type',  'purchase_sms_1',   'Purchase',    'loan_type_purchase'),
(@ar_flow_id, 'e_branch_refi',            'branch_loan_type',  'refi_sms_1',       'Refi',        'loan_type_refinance'),
(@ar_flow_id, 'e_branch_default',         'branch_loan_type',  'purchase_sms_1',   'Other',       'default'),

-- ── Purchase / Default chain ──────────────────────────────────
(@ar_flow_id, 'e_ps1_pe1',               'purchase_sms_1',    'purchase_email_1',  NULL,          'default'),
(@ar_flow_id, 'e_pe1_pw10m',             'purchase_email_1',  'purchase_wait_10m', NULL,          'default'),
(@ar_flow_id, 'e_pw10m_pe2',             'purchase_wait_10m', 'purchase_email_2',  NULL,          'default'),
(@ar_flow_id, 'e_pe2_pw2d',              'purchase_email_2',  'purchase_wait_2d',  NULL,          'default'),
(@ar_flow_id, 'e_pw2d_ps2',              'purchase_wait_2d',  'purchase_sms_2',    NULL,          'default'),
(@ar_flow_id, 'e_ps2_end_purchase',      'purchase_sms_2',    'end_purchase',      NULL,          'default'),

-- ── Refi chain ────────────────────────────────────────────────
(@ar_flow_id, 'e_rs1_re1',               'refi_sms_1',        'refi_email_1',      NULL,          'default'),
(@ar_flow_id, 'e_re1_rw10m',             'refi_email_1',      'refi_wait_10m',     NULL,          'default'),
(@ar_flow_id, 'e_rw10m_re2',             'refi_wait_10m',     'refi_email_2',      NULL,          'default'),
(@ar_flow_id, 'e_re2_rw2d',              'refi_email_2',      'refi_wait_2d',      NULL,          'default'),
(@ar_flow_id, 'e_rw2d_rs2',              'refi_wait_2d',      'refi_sms_2',        NULL,          'default'),
(@ar_flow_id, 'e_rs2_end_refi',          'refi_sms_2',        'end_refi',          NULL,          'default');

-- ============================================================
-- PART 5 — Audit log
-- ============================================================
INSERT INTO `audit_logs` (
  `tenant_id`, `user_id`, `broker_id`, `actor_type`, `action`,
  `entity_type`, `entity_id`, `changes`, `status`, `created_at`
) VALUES (
  1, NULL, NULL, 'user', 'schema_migration',
  'reminder_flows', NULL,
  '{"migration":"20260312_150000_seed_application_received_reminder_flow","description":"Created Application Received reminder flow with 8 templates, adverse status guard, and loan_type branch (Purchase/Refi/Default)"}',
  'success', NOW()
);
