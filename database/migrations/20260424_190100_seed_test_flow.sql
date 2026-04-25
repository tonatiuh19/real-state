-- ============================================================================
-- Migration: 20260424_190100_seed_test_flow.sql
-- Purpose:   Seed a 4-day multi-touch reminder flow restricted to Alex Gomez
--            (broker_id=1), with parallel SMS+Email at 8 touchpoints. Also
--            creates a test loan for Xavi Hernandez (client_id=420017) and
--            an active execution row so the engine starts processing on the
--            next cron tick.
--
-- Flow shape (one straight path, 26 nodes, 25 edges):
--   trigger
--     -> wait_TP1 (0h)   -> sms_TP1 -> email_TP1
--     -> wait_TP2 (4h)   -> sms_TP2 -> email_TP2
--     -> wait_TP3 (4h)   -> sms_TP3 -> email_TP3
--     -> wait_TP4 (17h)  -> sms_TP4 -> email_TP4   (~end of Day 1)
--     -> wait_TP5 (6h)   -> sms_TP5 -> email_TP5
--     -> wait_TP6 (18h)  -> sms_TP6 -> email_TP6   (~Day 2)
--     -> wait_TP7 (6h)   -> sms_TP7 -> email_TP7
--     -> wait_TP8 (17h)  -> sms_TP8 -> email_TP8   (~Day 4)
--     -> end_test
-- ============================================================================

-- 1) Create the flow ----------------------------------------------------------

INSERT INTO reminder_flows (
  tenant_id, name, description, trigger_event, trigger_delay_days,
  is_active, apply_to_all_loans, loan_type_filter, flow_category,
  created_by_broker_id, restricted_to_broker_id, enable_trace_logging
) VALUES (
  1,
  '🧪 [TEST] 4-Day Multi-Touch Flow — Alex Only',
  'Test-only flow restricted to Alex Gomez. Sends 8 SMS + 8 Email touches over a 4-day window with varied delays. All messages are clearly labeled as TEST. Trace logging is enabled so every step writes to reminder_flow_step_logs for live debugging.',
  'app_sent',
  0,
  1,
  0,
  'all',
  'loan',
  1,
  1,
  1
);

SET @flow_id = LAST_INSERT_ID();

-- 2) Insert 26 steps ----------------------------------------------------------

INSERT INTO reminder_flow_steps (flow_id, step_key, step_type, label, description, config, position_x, position_y) VALUES
  (@flow_id, 'trigger',  'trigger',    '[TEST] Trigger — App Sent', 'Fires when loan status becomes app_sent for Alex Gomez loans only.', NULL, 400, 50),

  (@flow_id, 'wait_TP1', 'wait',       'Wait — TP1 (immediate)',     NULL, JSON_OBJECT('delay_hours', 0),  400, 180),
  (@flow_id, 'sms_TP1',  'send_sms',   '[TEST-SMS 1/8]',             NULL, JSON_OBJECT('message', '🧪 [TEST-SMS 1/8] Hi {{client_name}} — automated test SMS #1 from Alex. Please ignore.'), 400, 310),
  (@flow_id, 'email_TP1','send_email', '[TEST-EMAIL 1/8]',           NULL, JSON_OBJECT('subject', '[TEST-EMAIL 1/8] Multi-touch flow ping', 'message', '<p>Hi {{client_name}},</p><p>This is automated test email <strong>#1 of 8</strong> from the Alex-only test flow. No action needed.</p>'), 400, 440),

  (@flow_id, 'wait_TP2', 'wait',       'Wait — TP2 (+4h)',           NULL, JSON_OBJECT('delay_hours', 4),  400, 570),
  (@flow_id, 'sms_TP2',  'send_sms',   '[TEST-SMS 2/8]',             NULL, JSON_OBJECT('message', '🧪 [TEST-SMS 2/8] Hi {{client_name}} — automated test SMS #2 from Alex. Please ignore.'), 400, 700),
  (@flow_id, 'email_TP2','send_email', '[TEST-EMAIL 2/8]',           NULL, JSON_OBJECT('subject', '[TEST-EMAIL 2/8] Multi-touch flow ping', 'message', '<p>Hi {{client_name}},</p><p>This is automated test email <strong>#2 of 8</strong>. No action needed.</p>'), 400, 830),

  (@flow_id, 'wait_TP3', 'wait',       'Wait — TP3 (+4h)',           NULL, JSON_OBJECT('delay_hours', 4),  400, 960),
  (@flow_id, 'sms_TP3',  'send_sms',   '[TEST-SMS 3/8]',             NULL, JSON_OBJECT('message', '🧪 [TEST-SMS 3/8] Hi {{client_name}} — automated test SMS #3 from Alex. Please ignore.'), 400, 1090),
  (@flow_id, 'email_TP3','send_email', '[TEST-EMAIL 3/8]',           NULL, JSON_OBJECT('subject', '[TEST-EMAIL 3/8] Multi-touch flow ping', 'message', '<p>Hi {{client_name}},</p><p>This is automated test email <strong>#3 of 8</strong>. No action needed.</p>'), 400, 1220),

  (@flow_id, 'wait_TP4', 'wait',       'Wait — TP4 (+17h, end Day 1)', NULL, JSON_OBJECT('delay_hours', 17), 400, 1350),
  (@flow_id, 'sms_TP4',  'send_sms',   '[TEST-SMS 4/8]',             NULL, JSON_OBJECT('message', '🧪 [TEST-SMS 4/8] Hi {{client_name}} — automated test SMS #4 from Alex. End of Day 1.'), 400, 1480),
  (@flow_id, 'email_TP4','send_email', '[TEST-EMAIL 4/8]',           NULL, JSON_OBJECT('subject', '[TEST-EMAIL 4/8] End of Day 1 — multi-touch flow', 'message', '<p>Hi {{client_name}},</p><p>This is automated test email <strong>#4 of 8</strong>. End of Day 1.</p>'), 400, 1610),

  (@flow_id, 'wait_TP5', 'wait',       'Wait — TP5 (+6h)',           NULL, JSON_OBJECT('delay_hours', 6),  400, 1740),
  (@flow_id, 'sms_TP5',  'send_sms',   '[TEST-SMS 5/8]',             NULL, JSON_OBJECT('message', '🧪 [TEST-SMS 5/8] Hi {{client_name}} — automated test SMS #5 from Alex. Day 2 morning.'), 400, 1870),
  (@flow_id, 'email_TP5','send_email', '[TEST-EMAIL 5/8]',           NULL, JSON_OBJECT('subject', '[TEST-EMAIL 5/8] Day 2 morning — multi-touch flow', 'message', '<p>Hi {{client_name}},</p><p>This is automated test email <strong>#5 of 8</strong>. Day 2 morning.</p>'), 400, 2000),

  (@flow_id, 'wait_TP6', 'wait',       'Wait — TP6 (+18h, into Day 2 evening)', NULL, JSON_OBJECT('delay_hours', 18), 400, 2130),
  (@flow_id, 'sms_TP6',  'send_sms',   '[TEST-SMS 6/8]',             NULL, JSON_OBJECT('message', '🧪 [TEST-SMS 6/8] Hi {{client_name}} — automated test SMS #6 from Alex. Day 2 evening.'), 400, 2260),
  (@flow_id, 'email_TP6','send_email', '[TEST-EMAIL 6/8]',           NULL, JSON_OBJECT('subject', '[TEST-EMAIL 6/8] Day 2 evening — multi-touch flow', 'message', '<p>Hi {{client_name}},</p><p>This is automated test email <strong>#6 of 8</strong>. Day 2 evening.</p>'), 400, 2390),

  (@flow_id, 'wait_TP7', 'wait',       'Wait — TP7 (+6h)',           NULL, JSON_OBJECT('delay_hours', 6),  400, 2520),
  (@flow_id, 'sms_TP7',  'send_sms',   '[TEST-SMS 7/8]',             NULL, JSON_OBJECT('message', '🧪 [TEST-SMS 7/8] Hi {{client_name}} — automated test SMS #7 from Alex. Day 3.'), 400, 2650),
  (@flow_id, 'email_TP7','send_email', '[TEST-EMAIL 7/8]',           NULL, JSON_OBJECT('subject', '[TEST-EMAIL 7/8] Day 3 — multi-touch flow', 'message', '<p>Hi {{client_name}},</p><p>This is automated test email <strong>#7 of 8</strong>. Day 3.</p>'), 400, 2780),

  (@flow_id, 'wait_TP8', 'wait',       'Wait — TP8 (+17h, into Day 4)', NULL, JSON_OBJECT('delay_hours', 17), 400, 2910),
  (@flow_id, 'sms_TP8',  'send_sms',   '[TEST-SMS 8/8]',             NULL, JSON_OBJECT('message', '🧪 [TEST-SMS 8/8] Hi {{client_name}} — automated test SMS #8 from Alex. Final touchpoint.'), 400, 3040),
  (@flow_id, 'email_TP8','send_email', '[TEST-EMAIL 8/8]',           NULL, JSON_OBJECT('subject', '[TEST-EMAIL 8/8] Final — multi-touch flow', 'message', '<p>Hi {{client_name}},</p><p>This is automated test email <strong>#8 of 8</strong>. Final touchpoint — flow ends after this.</p>'), 400, 3170),

  (@flow_id, 'end_test', 'end',        '[TEST] End',                 'Flow complete after 8 SMS + 8 Email touches over ~4 days.', NULL, 400, 3300);

-- 3) Insert 25 connections (linear chain) -------------------------------------

INSERT INTO reminder_flow_connections (flow_id, edge_key, source_step_key, target_step_key, label, edge_type) VALUES
  (@flow_id, 'e_trig_w1',     'trigger',  'wait_TP1', NULL, 'default'),
  (@flow_id, 'e_w1_s1',       'wait_TP1', 'sms_TP1',  NULL, 'default'),
  (@flow_id, 'e_s1_e1',       'sms_TP1',  'email_TP1', NULL, 'default'),
  (@flow_id, 'e_e1_w2',       'email_TP1','wait_TP2', NULL, 'default'),

  (@flow_id, 'e_w2_s2',       'wait_TP2', 'sms_TP2',  NULL, 'default'),
  (@flow_id, 'e_s2_e2',       'sms_TP2',  'email_TP2', NULL, 'default'),
  (@flow_id, 'e_e2_w3',       'email_TP2','wait_TP3', NULL, 'default'),

  (@flow_id, 'e_w3_s3',       'wait_TP3', 'sms_TP3',  NULL, 'default'),
  (@flow_id, 'e_s3_e3',       'sms_TP3',  'email_TP3', NULL, 'default'),
  (@flow_id, 'e_e3_w4',       'email_TP3','wait_TP4', NULL, 'default'),

  (@flow_id, 'e_w4_s4',       'wait_TP4', 'sms_TP4',  NULL, 'default'),
  (@flow_id, 'e_s4_e4',       'sms_TP4',  'email_TP4', NULL, 'default'),
  (@flow_id, 'e_e4_w5',       'email_TP4','wait_TP5', NULL, 'default'),

  (@flow_id, 'e_w5_s5',       'wait_TP5', 'sms_TP5',  NULL, 'default'),
  (@flow_id, 'e_s5_e5',       'sms_TP5',  'email_TP5', NULL, 'default'),
  (@flow_id, 'e_e5_w6',       'email_TP5','wait_TP6', NULL, 'default'),

  (@flow_id, 'e_w6_s6',       'wait_TP6', 'sms_TP6',  NULL, 'default'),
  (@flow_id, 'e_s6_e6',       'sms_TP6',  'email_TP6', NULL, 'default'),
  (@flow_id, 'e_e6_w7',       'email_TP6','wait_TP7', NULL, 'default'),

  (@flow_id, 'e_w7_s7',       'wait_TP7', 'sms_TP7',  NULL, 'default'),
  (@flow_id, 'e_s7_e7',       'sms_TP7',  'email_TP7', NULL, 'default'),
  (@flow_id, 'e_e7_w8',       'email_TP7','wait_TP8', NULL, 'default'),

  (@flow_id, 'e_w8_s8',       'wait_TP8', 'sms_TP8',  NULL, 'default'),
  (@flow_id, 'e_s8_e8',       'sms_TP8',  'email_TP8', NULL, 'default'),
  (@flow_id, 'e_e8_end',      'email_TP8','end_test', NULL, 'default');

-- 4) Create the test loan -----------------------------------------------------
-- Xavi Hernandez (client_id 420017, assigned_broker_id 1) — Alex Gomez owns it.

INSERT INTO loan_applications (
  tenant_id, application_number, client_user_id, broker_user_id,
  loan_type, loan_amount, status, current_step, total_steps, priority, notes
) VALUES (
  1,
  CONCAT('LATEST', LPAD(FLOOR(RAND() * 1000000), 6, '0')),
  420017,
  1,
  'purchase',
  500000.00,
  'app_sent',
  1,
  8,
  'medium',
  'TEST loan auto-created by 20260424_190100_seed_test_flow.sql for the Alex-only multi-touch test flow.'
);

SET @loan_id = LAST_INSERT_ID();

-- 5) Manually seed an active execution row so the engine begins on next tick --
-- (Skips the triggerReminderFlows call; conversation_id matches the convention
--  used by the engine for client-only conversations.)

INSERT INTO reminder_flow_executions (
  tenant_id, flow_id, loan_application_id, client_id, conversation_id,
  current_step_key, status, next_execution_at, completed_steps, context_data
) VALUES (
  1,
  @flow_id,
  @loan_id,
  420017,
  CONCAT('conv_client_420017_loan_', @loan_id, '_flow_', @flow_id),
  'trigger',
  'active',
  NOW(),
  JSON_ARRAY(),
  JSON_OBJECT(
    'client_name', 'Xavi Hernandez',
    'client_email', 'tonatiuh.gom@gmail.com',
    'client_phone', '3234756240',
    'loan_id', @loan_id,
    'client_id', 420017,
    'broker_id', 1,
    'broker_name', 'Alex Gomez',
    'loan_type', 'purchase',
    'loan_status', 'app_sent'
  )
);

-- 6) Done. Verify with:
--   SELECT id, name, restricted_to_broker_id, enable_trace_logging FROM reminder_flows ORDER BY id DESC LIMIT 1;
--   SELECT COUNT(*) AS steps FROM reminder_flow_steps WHERE flow_id = (SELECT MAX(id) FROM reminder_flows);
--   SELECT COUNT(*) AS edges FROM reminder_flow_connections WHERE flow_id = (SELECT MAX(id) FROM reminder_flows);
--   SELECT * FROM reminder_flow_executions ORDER BY id DESC LIMIT 1;
