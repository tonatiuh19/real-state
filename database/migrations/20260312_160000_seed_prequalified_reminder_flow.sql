-- Migration: Prequalified Reminder Flow — seed templates + flow
-- Date: 2026-03-12
-- Compatible with MySQL 8.0 (HostGator)
-- Description:
--   Creates the "Prequalified" reminder flow.
--   Branches by loan_type (Purchase / Refi / Default→Purchase).
--   Both branches share the same cadence structure with type-specific templates.
--
--   Full cadence per branch (P = Purchase example, identical structure for Refi):
--
--   SMS → Email → wait 10min → wait_for_response(3h)
--     responded  → END
--     no_response → wait 2d → SMS → wait 10min → wait_for_response(3h)
--       responded  → END
--       no_response → wait 2d → SMS → Email → wait 10min → wait_for_response(3h)
--         responded  → END
--         no_response → wait 3d → SMS → wait 10min → wait_for_response(3h)
--           responded  → END
--           no_response → wait 4d → SMS → wait 10min → wait_for_response(3h)
--             responded  → END
--             no_response → wait 3d → Email → wait 10min → wait_for_response(3h)
--               responded  → END
--               no_response → wait 3d → SMS → wait 10min → wait_for_response(3h)
--                 responded  → END
--                 no_response → wait 3d → SMS → wait 5d → Email → Notify All → END

-- ============================================================
-- PART 1 — Templates
-- ============================================================

-- ─── PURCHASE templates ──────────────────────────────────────

-- Round 1: initial SMS
INSERT INTO `templates` (`tenant_id`,`name`,`description`,`template_type`,`category`,`subject`,`body`,`variables`,`is_active`,`usage_count`,`created_by_broker_id`) VALUES (
  1,'Prequalified – Purchase SMS 1','Initial SMS on prequalification (purchase)','sms','follow_up',NULL,
  'Hi {{first_name}}! 🎉 Great news — you\'ve been prequalified for your home purchase loan (#{{application_number}})! Our team is ready to guide you through the next steps. Questions? Just reply! – {{broker_name}}, Encore Mortgage. Reply STOP to opt out.',
  '["first_name","application_number","broker_name"]',1,0,1);
SET @pq_p_sms1 := LAST_INSERT_ID();

-- Round 1: initial Email
INSERT INTO `templates` (`tenant_id`,`name`,`description`,`template_type`,`category`,`subject`,`body`,`variables`,`is_active`,`usage_count`,`created_by_broker_id`) VALUES (
  1,'Prequalified – Purchase Email 1','Initial welcome email on prequalification (purchase)','email','follow_up',
  '🏠 You\'re Prequalified! Here\'s What\'s Next',
  'Hi {{first_name}},\n\nFantastic news — you\'ve been *prequalified* for your home purchase loan!\n\nApplication #: {{application_number}}\n\nBeing prequalified is a major milestone. Here\'s what comes next:\n\n1. We\'ll review your full application and documents.\n2. A formal pre-approval letter will follow once we confirm your details.\n3. You\'ll be in a strong position to make offers on homes!\n\nIf you have any questions or want to discuss your options, just reply to this email — we\'re here every step of the way.\n\n{{broker_name}}\nEncore Mortgage',
  '["first_name","application_number","broker_name"]',1,0,1);
SET @pq_p_email1 := LAST_INSERT_ID();

-- Round 2: SMS (after 2 days no response)
INSERT INTO `templates` (`tenant_id`,`name`,`description`,`template_type`,`category`,`subject`,`body`,`variables`,`is_active`,`usage_count`,`created_by_broker_id`) VALUES (
  1,'Prequalified – Purchase SMS 2','Day-2 follow-up SMS (purchase)','sms','reminder',NULL,
  'Hi {{first_name}}, it\'s {{broker_name}} from Encore Mortgage. You\'re prequalified for your home purchase (#{{application_number}}) — don\'t let this momentum slow down! Ready to talk next steps? Reply here or give us a call. Reply STOP to opt out.',
  '["first_name","application_number","broker_name"]',1,0,1);
SET @pq_p_sms2 := LAST_INSERT_ID();

-- Round 3: SMS + Email (after 2 more days no response)
INSERT INTO `templates` (`tenant_id`,`name`,`description`,`template_type`,`category`,`subject`,`body`,`variables`,`is_active`,`usage_count`,`created_by_broker_id`) VALUES (
  1,'Prequalified – Purchase SMS 3','Day-4 check-in SMS (purchase)','sms','reminder',NULL,
  'Hi {{first_name}}! 👋 Quick check-in from {{broker_name}} at Encore Mortgage. Your prequalification for loan #{{application_number}} is still active. Are you actively looking for homes? We can help you move fast when you find the one. Reply anytime! Reply STOP to opt out.',
  '["first_name","application_number","broker_name"]',1,0,1);
SET @pq_p_sms3 := LAST_INSERT_ID();

INSERT INTO `templates` (`tenant_id`,`name`,`description`,`template_type`,`category`,`subject`,`body`,`variables`,`is_active`,`usage_count`,`created_by_broker_id`) VALUES (
  1,'Prequalified – Purchase Email 2','Day-4 follow-up email with resources (purchase)','email','follow_up',
  'Still Looking for the Right Home? We\'re Here When You\'re Ready',
  'Hi {{first_name}},\n\nJust circling back on your prequalification (#{{application_number}}).\n\nWe know home shopping takes time — and we want you to know we\'re here whenever you\'re ready to move forward. Whether you have questions about the process, want to understand your buying power, or are ready to lock in your rate, we\'re just a reply away.\n\nA few things to keep in mind:\n• Your prequalification is still active.\n• Interest rates can change — locking in sooner can save you money.\n• We can issue a pre-approval letter the moment you find the right home.\n\nLet\'s keep this moving!\n\n{{broker_name}}\nEncore Mortgage',
  '["first_name","application_number","broker_name"]',1,0,1);
SET @pq_p_email2 := LAST_INSERT_ID();

-- Round 4: SMS (after 3 days no response)
INSERT INTO `templates` (`tenant_id`,`name`,`description`,`template_type`,`category`,`subject`,`body`,`variables`,`is_active`,`usage_count`,`created_by_broker_id`) VALUES (
  1,'Prequalified – Purchase SMS 4','Day-7 nudge SMS (purchase)','sms','reminder',NULL,
  'Hi {{first_name}}, {{broker_name}} here. Your home purchase prequalification (#{{application_number}}) is ready and waiting! Once you find a home you love, we can move quickly. Have questions about your max purchase price or next steps? Reply and I\'ll help! Reply STOP to opt out.',
  '["first_name","application_number","broker_name"]',1,0,1);
SET @pq_p_sms4 := LAST_INSERT_ID();

-- Round 5: SMS (after 4 days no response)
INSERT INTO `templates` (`tenant_id`,`name`,`description`,`template_type`,`category`,`subject`,`body`,`variables`,`is_active`,`usage_count`,`created_by_broker_id`) VALUES (
  1,'Prequalified – Purchase SMS 5','Day-11 re-engagement SMS (purchase)','sms','reminder',NULL,
  'Hey {{first_name}}! 🏡 Still thinking about buying a home? Your prequalification (#{{application_number}}) is still active. I\'d love to help you get to the finish line. Let\'s connect — reply or call me today! – {{broker_name}}, Encore Mortgage. Reply STOP to opt out.',
  '["first_name","application_number","broker_name"]',1,0,1);
SET @pq_p_sms5 := LAST_INSERT_ID();

-- Round 6: Email (after 3 days no response)
INSERT INTO `templates` (`tenant_id`,`name`,`description`,`template_type`,`category`,`subject`,`body`,`variables`,`is_active`,`usage_count`,`created_by_broker_id`) VALUES (
  1,'Prequalified – Purchase Email 3','Day-14 re-engagement email (purchase)','email','follow_up',
  'Your Home Purchase Prequalification Is Still Active — Let\'s Talk',
  'Hi {{first_name}},\n\nI wanted to personally reach out regarding your prequalification (#{{application_number}}).\n\nBuying a home is one of the biggest decisions you\'ll make — and I want to make sure you feel fully supported. If anything has changed in your situation, or if you have concerns about the process, I\'m here to help.\n\nAre you:\n• Still searching for the right home?\n• Unsure about your budget or buying power?\n• Waiting on something specific before moving forward?\n\nJust reply to this email and let\'s have a quick conversation. No pressure — just here to help.\n\n{{broker_name}}\nEncore Mortgage',
  '["first_name","application_number","broker_name"]',1,0,1);
SET @pq_p_email3 := LAST_INSERT_ID();

-- Round 7: SMS (after 3 days no response)
INSERT INTO `templates` (`tenant_id`,`name`,`description`,`template_type`,`category`,`subject`,`body`,`variables`,`is_active`,`usage_count`,`created_by_broker_id`) VALUES (
  1,'Prequalified – Purchase SMS 6','Day-17 final SMS before last sequence (purchase)','sms','reminder',NULL,
  'Hi {{first_name}}, {{broker_name}} from Encore Mortgage. I\'ve been trying to connect about your home purchase prequalification (#{{application_number}}). I\'d love to help make your homeownership dream a reality. This is my last automated check-in — reply anytime and I\'ll pick it right up! Reply STOP to opt out.',
  '["first_name","application_number","broker_name"]',1,0,1);
SET @pq_p_sms6 := LAST_INSERT_ID();

-- Round 8: SMS (after 3 days no response — second-to-last)
INSERT INTO `templates` (`tenant_id`,`name`,`description`,`template_type`,`category`,`subject`,`body`,`variables`,`is_active`,`usage_count`,`created_by_broker_id`) VALUES (
  1,'Prequalified – Purchase SMS 7','Day-20 final attempt SMS (purchase)','sms','reminder',NULL,
  'Hi {{first_name}}, one final note from {{broker_name}} at Encore Mortgage about your home purchase prequalification (#{{application_number}}). Rates are always moving — if you\'re ready to act, we\'re ready to move fast for you. Reply or call us today. Reply STOP to opt out.',
  '["first_name","application_number","broker_name"]',1,0,1);
SET @pq_p_sms7 := LAST_INSERT_ID();

-- Round 8: Final Email (after 5 days)
INSERT INTO `templates` (`tenant_id`,`name`,`description`,`template_type`,`category`,`subject`,`body`,`variables`,`is_active`,`usage_count`,`created_by_broker_id`) VALUES (
  1,'Prequalified – Purchase Email 4','Day-25 final email before internal notification (purchase)','email','follow_up',
  'A Final Note on Your Home Purchase Prequalification',
  'Hi {{first_name}},\n\nThis is our final automated message regarding your home purchase prequalification (#{{application_number}}).\n\nWe\'ve reached out several times and want to make sure you know we\'re still here. If now isn\'t the right time, that\'s completely okay — just know that when you\'re ready, we\'ll be ready too.\n\nFeel free to reach out at any time. Your prequalification can be updated and a pre-approval can be issued quickly when the moment is right.\n\nWishing you all the best,\n\n{{broker_name}}\nEncore Mortgage',
  '["first_name","application_number","broker_name"]',1,0,1);
SET @pq_p_email4 := LAST_INSERT_ID();

-- ─── REFI templates ──────────────────────────────────────────

-- Round 1: initial SMS
INSERT INTO `templates` (`tenant_id`,`name`,`description`,`template_type`,`category`,`subject`,`body`,`variables`,`is_active`,`usage_count`,`created_by_broker_id`) VALUES (
  1,'Prequalified – Refi SMS 1','Initial SMS on prequalification (refi)','sms','follow_up',NULL,
  'Hi {{first_name}}! 🔄 You\'ve been prequalified for your refinance (#{{application_number}})! We\'re ready to help you lock in a better rate or access your equity. Questions? Reply anytime! – {{broker_name}}, Encore Mortgage. Reply STOP to opt out.',
  '["first_name","application_number","broker_name"]',1,0,1);
SET @pq_r_sms1 := LAST_INSERT_ID();

-- Round 1: initial Email
INSERT INTO `templates` (`tenant_id`,`name`,`description`,`template_type`,`category`,`subject`,`body`,`variables`,`is_active`,`usage_count`,`created_by_broker_id`) VALUES (
  1,'Prequalified – Refi Email 1','Initial welcome email on prequalification (refi)','email','follow_up',
  '🔄 You\'re Prequalified to Refinance — Here\'s What\'s Next',
  'Hi {{first_name}},\n\nExcellent news — you\'ve been *prequalified* for your refinance!\n\nApplication #: {{application_number}}\n\nYour prequalification means we\'ve reviewed your initial information and you\'re in a great position to move forward. Here\'s what to expect next:\n\n1. We\'ll complete a full review of your application.\n2. An appraisal may be required depending on your loan program.\n3. We\'ll guide you through locking in your rate at the right moment.\n\nRefinancing now could mean significant monthly savings. Let\'s get this done!\n\nReply to this email with any questions — we\'re ready to move quickly.\n\n{{broker_name}}\nEncore Mortgage',
  '["first_name","application_number","broker_name"]',1,0,1);
SET @pq_r_email1 := LAST_INSERT_ID();

-- Round 2: SMS
INSERT INTO `templates` (`tenant_id`,`name`,`description`,`template_type`,`category`,`subject`,`body`,`variables`,`is_active`,`usage_count`,`created_by_broker_id`) VALUES (
  1,'Prequalified – Refi SMS 2','Day-2 follow-up SMS (refi)','sms','reminder',NULL,
  'Hi {{first_name}}, {{broker_name}} from Encore Mortgage here. Your refinance prequalification (#{{application_number}}) is ready to move forward. Rates are shifting — locking in now could save you thousands. Ready to take the next step? Reply here! Reply STOP to opt out.',
  '["first_name","application_number","broker_name"]',1,0,1);
SET @pq_r_sms2 := LAST_INSERT_ID();

-- Round 3: SMS + Email
INSERT INTO `templates` (`tenant_id`,`name`,`description`,`template_type`,`category`,`subject`,`body`,`variables`,`is_active`,`usage_count`,`created_by_broker_id`) VALUES (
  1,'Prequalified – Refi SMS 3','Day-4 check-in SMS (refi)','sms','reminder',NULL,
  'Hi {{first_name}}! Quick check-in from {{broker_name}} at Encore Mortgage. Your refinance prequalification (#{{application_number}}) is active and your potential savings are waiting. Have questions about the process or your rate options? Just reply! Reply STOP to opt out.',
  '["first_name","application_number","broker_name"]',1,0,1);
SET @pq_r_sms3 := LAST_INSERT_ID();

INSERT INTO `templates` (`tenant_id`,`name`,`description`,`template_type`,`category`,`subject`,`body`,`variables`,`is_active`,`usage_count`,`created_by_broker_id`) VALUES (
  1,'Prequalified – Refi Email 2','Day-4 follow-up email (refi)','email','follow_up',
  'Your Refinance Prequalification Is Active — Don\'t Miss This Window',
  'Hi {{first_name}},\n\nFollowing up on your refinance prequalification (#{{application_number}}).\n\nWith rates constantly changing, acting sooner rather than later can make a real difference in your monthly payment and total interest paid. Here\'s a quick snapshot of how refinancing can help:\n\n💰 Lower your monthly payment\n🔒 Lock in a fixed rate for stability\n💵 Access home equity for renovations or debt consolidation\n📅 Shorten your loan term\n\nWe can run the numbers with you at no cost. Just reply and we\'ll set up a quick call.\n\n{{broker_name}}\nEncore Mortgage',
  '["first_name","application_number","broker_name"]',1,0,1);
SET @pq_r_email2 := LAST_INSERT_ID();

-- Round 4: SMS
INSERT INTO `templates` (`tenant_id`,`name`,`description`,`template_type`,`category`,`subject`,`body`,`variables`,`is_active`,`usage_count`,`created_by_broker_id`) VALUES (
  1,'Prequalified – Refi SMS 4','Day-7 nudge SMS (refi)','sms','reminder',NULL,
  'Hi {{first_name}}, {{broker_name}} here from Encore Mortgage. Still thinking about your refinance (#{{application_number}})? No pressure — but I want to make sure you don\'t miss out on a favorable rate. I\'m here whenever you\'re ready. Reply anytime! Reply STOP to opt out.',
  '["first_name","application_number","broker_name"]',1,0,1);
SET @pq_r_sms4 := LAST_INSERT_ID();

-- Round 5: SMS
INSERT INTO `templates` (`tenant_id`,`name`,`description`,`template_type`,`category`,`subject`,`body`,`variables`,`is_active`,`usage_count`,`created_by_broker_id`) VALUES (
  1,'Prequalified – Refi SMS 5','Day-11 re-engagement SMS (refi)','sms','reminder',NULL,
  'Hey {{first_name}}! 💰 Your refinance prequalification (#{{application_number}}) is still open. Homeowners who refinance at the right time can save hundreds per month. Let\'s find out what\'s possible for you — reply or call me today! – {{broker_name}}, Encore Mortgage. Reply STOP to opt out.',
  '["first_name","application_number","broker_name"]',1,0,1);
SET @pq_r_sms5 := LAST_INSERT_ID();

-- Round 6: Email
INSERT INTO `templates` (`tenant_id`,`name`,`description`,`template_type`,`category`,`subject`,`body`,`variables`,`is_active`,`usage_count`,`created_by_broker_id`) VALUES (
  1,'Prequalified – Refi Email 3','Day-14 re-engagement email (refi)','email','follow_up',
  'Still Thinking About Refinancing? Let\'s Talk',
  'Hi {{first_name}},\n\nI wanted to personally reach out about your refinance prequalification (#{{application_number}}).\n\nI understand refinancing can feel like a big decision. I\'m here to simplify it for you and make sure you\'re making the best move for your financial situation.\n\nSome questions I can help answer:\n• How much could I save monthly by refinancing?\n• Is now a good time to lock in a rate?\n• What documents will I need?\n• How long does the process take?\n\nJust reply to this email and let\'s get on a quick 10-minute call. There\'s no obligation — just clarity.\n\n{{broker_name}}\nEncore Mortgage',
  '["first_name","application_number","broker_name"]',1,0,1);
SET @pq_r_email3 := LAST_INSERT_ID();

-- Round 7: SMS
INSERT INTO `templates` (`tenant_id`,`name`,`description`,`template_type`,`category`,`subject`,`body`,`variables`,`is_active`,`usage_count`,`created_by_broker_id`) VALUES (
  1,'Prequalified – Refi SMS 6','Day-17 final SMS before last sequence (refi)','sms','reminder',NULL,
  'Hi {{first_name}}, {{broker_name}} from Encore Mortgage. I\'ve been following up on your refinance prequalification (#{{application_number}}) and I really want to help. This is my last automated message — reply anytime and I\'ll be happy to pick up right where we left off. Reply STOP to opt out.',
  '["first_name","application_number","broker_name"]',1,0,1);
SET @pq_r_sms6 := LAST_INSERT_ID();

-- Round 8: SMS
INSERT INTO `templates` (`tenant_id`,`name`,`description`,`template_type`,`category`,`subject`,`body`,`variables`,`is_active`,`usage_count`,`created_by_broker_id`) VALUES (
  1,'Prequalified – Refi SMS 7','Day-20 final attempt SMS (refi)','sms','reminder',NULL,
  'Hi {{first_name}}, one final note from {{broker_name}} at Encore Mortgage on your refinance prequalification (#{{application_number}}). Whether you want to lower your rate, reduce your term, or tap equity — we\'re ready when you are. Call or reply today. Reply STOP to opt out.',
  '["first_name","application_number","broker_name"]',1,0,1);
SET @pq_r_sms7 := LAST_INSERT_ID();

-- Round 8: Final Email
INSERT INTO `templates` (`tenant_id`,`name`,`description`,`template_type`,`category`,`subject`,`body`,`variables`,`is_active`,`usage_count`,`created_by_broker_id`) VALUES (
  1,'Prequalified – Refi Email 4','Day-25 final email before internal notification (refi)','email','follow_up',
  'A Final Note on Your Refinance Prequalification',
  'Hi {{first_name}},\n\nThis is our final automated message about your refinance prequalification (#{{application_number}}).\n\nWe\'ve genuinely enjoyed the opportunity to work with you and hope we\'ll hear from you when the time is right. Refinancing is always on the table — rates and programs change, and we\'ll be here.\n\nIf you ever want a fresh look at your options, don\'t hesitate to reach out.\n\nWishing you all the best,\n\n{{broker_name}}\nEncore Mortgage',
  '["first_name","application_number","broker_name"]',1,0,1);
SET @pq_r_email4 := LAST_INSERT_ID();

-- ─── Shared internal notification ────────────────────────────
INSERT INTO `templates` (`tenant_id`,`name`,`description`,`template_type`,`category`,`subject`,`body`,`variables`,`is_active`,`usage_count`,`created_by_broker_id`) VALUES (
  1,'Prequalified – Internal All-User Notification','Internal notification to all users after full prequalified sequence without response','email','system',
  '[ACTION NEEDED] Prequalified Client Has Not Responded — Full Sequence Completed',
  'Hello Team,\n\nThis is an automated internal alert.\n\nClient {{client_name}} completed the full Prequalified automated reminder sequence without responding. Personal outreach is now recommended.\n\nApplication Details:\n• Client: {{client_name}}\n• Application #: {{application_number}}\n• Loan Type: {{loan_type}}\n• Status: Prequalified\n\nPlease coordinate internally and assign a team member to follow up directly.\n\n— Encore Mortgage Automation',
  '["client_name","application_number","loan_type"]',1,0,1);
SET @pq_notify_all := LAST_INSERT_ID();

-- ============================================================
-- PART 2 — Reminder Flow
-- ============================================================

INSERT INTO `reminder_flows`
  (`tenant_id`,`name`,`description`,`trigger_event`,`trigger_delay_days`,`is_active`,`apply_to_all_loans`,`loan_type_filter`,`created_by_broker_id`)
VALUES (
  1,
  'Prequalified — Full Nurture Sequence',
  'Triggered when loan status becomes prequalified. Branches by loan type (Purchase/Refi/Default→Purchase). Each branch runs 8 rounds of SMS/Email with wait_for_response(3h) gates. Responded → exit. No response → escalate with longer waits. Final round ends with an internal all-user notification.',
  'prequalified', 0, 1, 1, 'all', 1
);
SET @pq_flow := LAST_INSERT_ID();

-- ============================================================
-- PART 3 — Steps
-- Naming convention:
--   p_ = purchase branch   r_ = refi branch
--   sN = send step N       wN = wait step N   wfrN = wait_for_response N
--   end_p_N = end on responded at round N
-- ============================================================

INSERT INTO `reminder_flow_steps`
  (`flow_id`,`step_key`,`step_type`,`label`,`description`,`config`,`position_x`,`position_y`)
VALUES

-- ── TRIGGER + BRANCH ─────────────────────────────────────────
(@pq_flow,'trigger',        'trigger','Prequalified Trigger',NULL,NULL,500,50),
(@pq_flow,'branch',         'branch', 'Loan Type Branch','Routes to Purchase or Refi sequence','{"condition_type":"loan_type"}',500,200),

-- ═══════════════════════════════════════════════════════════
-- PURCHASE BRANCH (x=200)
-- ═══════════════════════════════════════════════════════════

-- Round 1
(@pq_flow,'p_s1', 'send_sms',  'SMS 1 (Purchase)',  NULL, CONCAT('{"template_id":',@pq_p_sms1,'}'),   200, 380),
(@pq_flow,'p_s2', 'send_email','Email 1 (Purchase)', NULL, CONCAT('{"template_id":',@pq_p_email1,'}'), 200, 510),
(@pq_flow,'p_w1', 'wait',      'Wait 10 min',        NULL, '{"delay_minutes":10}',                     200, 640),
(@pq_flow,'p_wfr1','wait_for_response','Wait 3h or Response',NULL,'{"response_timeout_hours":3}',       200, 770),
(@pq_flow,'p_end1','end',      'End – Responded R1 (Purchase)',NULL,NULL,                               50,  900),

-- Round 2 (no response → wait 2d)
(@pq_flow,'p_w2d1','wait',     'Wait 2 Days',        NULL, '{"delay_days":2}',                         200, 900),
(@pq_flow,'p_s3',  'send_sms', 'SMS 2 (Purchase)',   NULL, CONCAT('{"template_id":',@pq_p_sms2,'}'),   200, 1030),
(@pq_flow,'p_w2',  'wait',     'Wait 10 min',        NULL, '{"delay_minutes":10}',                     200, 1160),
(@pq_flow,'p_wfr2','wait_for_response','Wait 3h or Response',NULL,'{"response_timeout_hours":3}',       200, 1290),
(@pq_flow,'p_end2','end',      'End – Responded R2 (Purchase)',NULL,NULL,                               50,  1420),

-- Round 3 (no response → wait 2d, SMS + Email)
(@pq_flow,'p_w2d2','wait',     'Wait 2 Days',        NULL, '{"delay_days":2}',                         200, 1420),
(@pq_flow,'p_s4',  'send_sms', 'SMS 3 (Purchase)',   NULL, CONCAT('{"template_id":',@pq_p_sms3,'}'),   200, 1550),
(@pq_flow,'p_s5',  'send_email','Email 2 (Purchase)', NULL, CONCAT('{"template_id":',@pq_p_email2,'}'), 200, 1680),
(@pq_flow,'p_w3',  'wait',     'Wait 10 min',        NULL, '{"delay_minutes":10}',                     200, 1810),
(@pq_flow,'p_wfr3','wait_for_response','Wait 3h or Response',NULL,'{"response_timeout_hours":3}',       200, 1940),
(@pq_flow,'p_end3','end',      'End – Responded R3 (Purchase)',NULL,NULL,                               50,  2070),

-- Round 4 (no response → wait 3d)
(@pq_flow,'p_w3d1','wait',     'Wait 3 Days',        NULL, '{"delay_days":3}',                         200, 2070),
(@pq_flow,'p_s6',  'send_sms', 'SMS 4 (Purchase)',   NULL, CONCAT('{"template_id":',@pq_p_sms4,'}'),   200, 2200),
(@pq_flow,'p_w4',  'wait',     'Wait 10 min',        NULL, '{"delay_minutes":10}',                     200, 2330),
(@pq_flow,'p_wfr4','wait_for_response','Wait 3h or Response',NULL,'{"response_timeout_hours":3}',       200, 2460),
(@pq_flow,'p_end4','end',      'End – Responded R4 (Purchase)',NULL,NULL,                               50,  2590),

-- Round 5 (no response → wait 4d)
(@pq_flow,'p_w4d1','wait',     'Wait 4 Days',        NULL, '{"delay_days":4}',                         200, 2590),
(@pq_flow,'p_s7',  'send_sms', 'SMS 5 (Purchase)',   NULL, CONCAT('{"template_id":',@pq_p_sms5,'}'),   200, 2720),
(@pq_flow,'p_w5',  'wait',     'Wait 10 min',        NULL, '{"delay_minutes":10}',                     200, 2850),
(@pq_flow,'p_wfr5','wait_for_response','Wait 3h or Response',NULL,'{"response_timeout_hours":3}',       200, 2980),
(@pq_flow,'p_end5','end',      'End – Responded R5 (Purchase)',NULL,NULL,                               50,  3110),

-- Round 6 (no response → wait 3d, Email only)
(@pq_flow,'p_w3d2','wait',     'Wait 3 Days',        NULL, '{"delay_days":3}',                         200, 3110),
(@pq_flow,'p_s8',  'send_email','Email 3 (Purchase)', NULL, CONCAT('{"template_id":',@pq_p_email3,'}'), 200, 3240),
(@pq_flow,'p_w6',  'wait',     'Wait 10 min',        NULL, '{"delay_minutes":10}',                     200, 3370),
(@pq_flow,'p_wfr6','wait_for_response','Wait 3h or Response',NULL,'{"response_timeout_hours":3}',       200, 3500),
(@pq_flow,'p_end6','end',      'End – Responded R6 (Purchase)',NULL,NULL,                               50,  3630),

-- Round 7 (no response → wait 3d)
(@pq_flow,'p_w3d3','wait',     'Wait 3 Days',        NULL, '{"delay_days":3}',                         200, 3630),
(@pq_flow,'p_s9',  'send_sms', 'SMS 6 (Purchase)',   NULL, CONCAT('{"template_id":',@pq_p_sms6,'}'),   200, 3760),
(@pq_flow,'p_w7',  'wait',     'Wait 10 min',        NULL, '{"delay_minutes":10}',                     200, 3890),
(@pq_flow,'p_wfr7','wait_for_response','Wait 3h or Response',NULL,'{"response_timeout_hours":3}',       200, 4020),
(@pq_flow,'p_end7','end',      'End – Responded R7 (Purchase)',NULL,NULL,                               50,  4150),

-- Round 8 (no response → wait 3d, SMS → wait 5d → Email → Notify → End)
(@pq_flow,'p_w3d4','wait',     'Wait 3 Days',        NULL, '{"delay_days":3}',                         200, 4150),
(@pq_flow,'p_s10', 'send_sms', 'SMS 7 (Purchase)',   NULL, CONCAT('{"template_id":',@pq_p_sms7,'}'),   200, 4280),
(@pq_flow,'p_w5d1','wait',     'Wait 5 Days',        NULL, '{"delay_days":5}',                         200, 4410),
(@pq_flow,'p_s11', 'send_email','Email 4 (Purchase)', NULL, CONCAT('{"template_id":',@pq_p_email4,'}'), 200, 4540),
(@pq_flow,'p_notify','send_notification','Notify All Users (Purchase)',NULL,CONCAT('{"template_id":',@pq_notify_all,',"subject":"[ACTION NEEDED] Prequalified Client Needs Follow-Up"}'),200,4670),
(@pq_flow,'p_end8','end',      'End – Full Sequence Complete (Purchase)',NULL,NULL,                      200, 4800),

-- ═══════════════════════════════════════════════════════════
-- REFI BRANCH (x=800)
-- ═══════════════════════════════════════════════════════════

-- Round 1
(@pq_flow,'r_s1', 'send_sms',  'SMS 1 (Refi)',  NULL, CONCAT('{"template_id":',@pq_r_sms1,'}'),   800, 380),
(@pq_flow,'r_s2', 'send_email','Email 1 (Refi)', NULL, CONCAT('{"template_id":',@pq_r_email1,'}'), 800, 510),
(@pq_flow,'r_w1', 'wait',      'Wait 10 min',    NULL, '{"delay_minutes":10}',                     800, 640),
(@pq_flow,'r_wfr1','wait_for_response','Wait 3h or Response',NULL,'{"response_timeout_hours":3}',   800, 770),
(@pq_flow,'r_end1','end',      'End – Responded R1 (Refi)',NULL,NULL,                               950, 900),

-- Round 2
(@pq_flow,'r_w2d1','wait',     'Wait 2 Days',    NULL, '{"delay_days":2}',                         800, 900),
(@pq_flow,'r_s3',  'send_sms', 'SMS 2 (Refi)',   NULL, CONCAT('{"template_id":',@pq_r_sms2,'}'),   800, 1030),
(@pq_flow,'r_w2',  'wait',     'Wait 10 min',    NULL, '{"delay_minutes":10}',                     800, 1160),
(@pq_flow,'r_wfr2','wait_for_response','Wait 3h or Response',NULL,'{"response_timeout_hours":3}',   800, 1290),
(@pq_flow,'r_end2','end',      'End – Responded R2 (Refi)',NULL,NULL,                               950, 1420),

-- Round 3
(@pq_flow,'r_w2d2','wait',     'Wait 2 Days',    NULL, '{"delay_days":2}',                         800, 1420),
(@pq_flow,'r_s4',  'send_sms', 'SMS 3 (Refi)',   NULL, CONCAT('{"template_id":',@pq_r_sms3,'}'),   800, 1550),
(@pq_flow,'r_s5',  'send_email','Email 2 (Refi)', NULL, CONCAT('{"template_id":',@pq_r_email2,'}'), 800, 1680),
(@pq_flow,'r_w3',  'wait',     'Wait 10 min',    NULL, '{"delay_minutes":10}',                     800, 1810),
(@pq_flow,'r_wfr3','wait_for_response','Wait 3h or Response',NULL,'{"response_timeout_hours":3}',   800, 1940),
(@pq_flow,'r_end3','end',      'End – Responded R3 (Refi)',NULL,NULL,                               950, 2070),

-- Round 4
(@pq_flow,'r_w3d1','wait',     'Wait 3 Days',    NULL, '{"delay_days":3}',                         800, 2070),
(@pq_flow,'r_s6',  'send_sms', 'SMS 4 (Refi)',   NULL, CONCAT('{"template_id":',@pq_r_sms4,'}'),   800, 2200),
(@pq_flow,'r_w4',  'wait',     'Wait 10 min',    NULL, '{"delay_minutes":10}',                     800, 2330),
(@pq_flow,'r_wfr4','wait_for_response','Wait 3h or Response',NULL,'{"response_timeout_hours":3}',   800, 2460),
(@pq_flow,'r_end4','end',      'End – Responded R4 (Refi)',NULL,NULL,                               950, 2590),

-- Round 5
(@pq_flow,'r_w4d1','wait',     'Wait 4 Days',    NULL, '{"delay_days":4}',                         800, 2590),
(@pq_flow,'r_s7',  'send_sms', 'SMS 5 (Refi)',   NULL, CONCAT('{"template_id":',@pq_r_sms5,'}'),   800, 2720),
(@pq_flow,'r_w5',  'wait',     'Wait 10 min',    NULL, '{"delay_minutes":10}',                     800, 2850),
(@pq_flow,'r_wfr5','wait_for_response','Wait 3h or Response',NULL,'{"response_timeout_hours":3}',   800, 2980),
(@pq_flow,'r_end5','end',      'End – Responded R5 (Refi)',NULL,NULL,                               950, 3110),

-- Round 6
(@pq_flow,'r_w3d2','wait',     'Wait 3 Days',    NULL, '{"delay_days":3}',                         800, 3110),
(@pq_flow,'r_s8',  'send_email','Email 3 (Refi)', NULL, CONCAT('{"template_id":',@pq_r_email3,'}'), 800, 3240),
(@pq_flow,'r_w6',  'wait',     'Wait 10 min',    NULL, '{"delay_minutes":10}',                     800, 3370),
(@pq_flow,'r_wfr6','wait_for_response','Wait 3h or Response',NULL,'{"response_timeout_hours":3}',   800, 3500),
(@pq_flow,'r_end6','end',      'End – Responded R6 (Refi)',NULL,NULL,                               950, 3630),

-- Round 7
(@pq_flow,'r_w3d3','wait',     'Wait 3 Days',    NULL, '{"delay_days":3}',                         800, 3630),
(@pq_flow,'r_s9',  'send_sms', 'SMS 6 (Refi)',   NULL, CONCAT('{"template_id":',@pq_r_sms6,'}'),   800, 3760),
(@pq_flow,'r_w7',  'wait',     'Wait 10 min',    NULL, '{"delay_minutes":10}',                     800, 3890),
(@pq_flow,'r_wfr7','wait_for_response','Wait 3h or Response',NULL,'{"response_timeout_hours":3}',   800, 4020),
(@pq_flow,'r_end7','end',      'End – Responded R7 (Refi)',NULL,NULL,                               950, 4150),

-- Round 8
(@pq_flow,'r_w3d4','wait',     'Wait 3 Days',    NULL, '{"delay_days":3}',                         800, 4150),
(@pq_flow,'r_s10', 'send_sms', 'SMS 7 (Refi)',   NULL, CONCAT('{"template_id":',@pq_r_sms7,'}'),   800, 4280),
(@pq_flow,'r_w5d1','wait',     'Wait 5 Days',    NULL, '{"delay_days":5}',                         800, 4410),
(@pq_flow,'r_s11', 'send_email','Email 4 (Refi)', NULL, CONCAT('{"template_id":',@pq_r_email4,'}'), 800, 4540),
(@pq_flow,'r_notify','send_notification','Notify All Users (Refi)',NULL,CONCAT('{"template_id":',@pq_notify_all,',"subject":"[ACTION NEEDED] Prequalified Client Needs Follow-Up"}'),800,4670),
(@pq_flow,'r_end8','end',      'End – Full Sequence Complete (Refi)',NULL,NULL,                      800, 4800);

-- ============================================================
-- PART 4 — Connections
-- ============================================================

INSERT INTO `reminder_flow_connections`
  (`flow_id`,`edge_key`,`source_step_key`,`target_step_key`,`label`,`edge_type`)
VALUES

-- trigger → branch
(@pq_flow,'e_trigger_branch',    'trigger',   'branch',    NULL,      'default'),

-- branch → trees (Default/Nada → purchase)
(@pq_flow,'e_branch_p',          'branch',    'p_s1',      'Purchase','loan_type_purchase'),
(@pq_flow,'e_branch_r',          'branch',    'r_s1',      'Refi',    'loan_type_refinance'),
(@pq_flow,'e_branch_def',        'branch',    'p_s1',      'Other',   'default'),

-- ═══ PURCHASE ═══

-- R1
(@pq_flow,'e_p_s1_s2',           'p_s1',      'p_s2',     NULL,'default'),
(@pq_flow,'e_p_s2_w1',           'p_s2',      'p_w1',     NULL,'default'),
(@pq_flow,'e_p_w1_wfr1',         'p_w1',      'p_wfr1',   NULL,'default'),
(@pq_flow,'e_p_wfr1_end1',       'p_wfr1',    'p_end1',   'Responded','responded'),
(@pq_flow,'e_p_wfr1_w2d1',       'p_wfr1',    'p_w2d1',   'No Response','no_response'),

-- R2
(@pq_flow,'e_p_w2d1_s3',         'p_w2d1',    'p_s3',     NULL,'default'),
(@pq_flow,'e_p_s3_w2',           'p_s3',      'p_w2',     NULL,'default'),
(@pq_flow,'e_p_w2_wfr2',         'p_w2',      'p_wfr2',   NULL,'default'),
(@pq_flow,'e_p_wfr2_end2',       'p_wfr2',    'p_end2',   'Responded','responded'),
(@pq_flow,'e_p_wfr2_w2d2',       'p_wfr2',    'p_w2d2',   'No Response','no_response'),

-- R3
(@pq_flow,'e_p_w2d2_s4',         'p_w2d2',    'p_s4',     NULL,'default'),
(@pq_flow,'e_p_s4_s5',           'p_s4',      'p_s5',     NULL,'default'),
(@pq_flow,'e_p_s5_w3',           'p_s5',      'p_w3',     NULL,'default'),
(@pq_flow,'e_p_w3_wfr3',         'p_w3',      'p_wfr3',   NULL,'default'),
(@pq_flow,'e_p_wfr3_end3',       'p_wfr3',    'p_end3',   'Responded','responded'),
(@pq_flow,'e_p_wfr3_w3d1',       'p_wfr3',    'p_w3d1',   'No Response','no_response'),

-- R4
(@pq_flow,'e_p_w3d1_s6',         'p_w3d1',    'p_s6',     NULL,'default'),
(@pq_flow,'e_p_s6_w4',           'p_s6',      'p_w4',     NULL,'default'),
(@pq_flow,'e_p_w4_wfr4',         'p_w4',      'p_wfr4',   NULL,'default'),
(@pq_flow,'e_p_wfr4_end4',       'p_wfr4',    'p_end4',   'Responded','responded'),
(@pq_flow,'e_p_wfr4_w4d1',       'p_wfr4',    'p_w4d1',   'No Response','no_response'),

-- R5
(@pq_flow,'e_p_w4d1_s7',         'p_w4d1',    'p_s7',     NULL,'default'),
(@pq_flow,'e_p_s7_w5',           'p_s7',      'p_w5',     NULL,'default'),
(@pq_flow,'e_p_w5_wfr5',         'p_w5',      'p_wfr5',   NULL,'default'),
(@pq_flow,'e_p_wfr5_end5',       'p_wfr5',    'p_end5',   'Responded','responded'),
(@pq_flow,'e_p_wfr5_w3d2',       'p_wfr5',    'p_w3d2',   'No Response','no_response'),

-- R6
(@pq_flow,'e_p_w3d2_s8',         'p_w3d2',    'p_s8',     NULL,'default'),
(@pq_flow,'e_p_s8_w6',           'p_s8',      'p_w6',     NULL,'default'),
(@pq_flow,'e_p_w6_wfr6',         'p_w6',      'p_wfr6',   NULL,'default'),
(@pq_flow,'e_p_wfr6_end6',       'p_wfr6',    'p_end6',   'Responded','responded'),
(@pq_flow,'e_p_wfr6_w3d3',       'p_wfr6',    'p_w3d3',   'No Response','no_response'),

-- R7
(@pq_flow,'e_p_w3d3_s9',         'p_w3d3',    'p_s9',     NULL,'default'),
(@pq_flow,'e_p_s9_w7',           'p_s9',      'p_w7',     NULL,'default'),
(@pq_flow,'e_p_w7_wfr7',         'p_w7',      'p_wfr7',   NULL,'default'),
(@pq_flow,'e_p_wfr7_end7',       'p_wfr7',    'p_end7',   'Responded','responded'),
(@pq_flow,'e_p_wfr7_w3d4',       'p_wfr7',    'p_w3d4',   'No Response','no_response'),

-- R8 (final)
(@pq_flow,'e_p_w3d4_s10',        'p_w3d4',    'p_s10',    NULL,'default'),
(@pq_flow,'e_p_s10_w5d1',        'p_s10',     'p_w5d1',   NULL,'default'),
(@pq_flow,'e_p_w5d1_s11',        'p_w5d1',    'p_s11',    NULL,'default'),
(@pq_flow,'e_p_s11_notify',      'p_s11',     'p_notify',  NULL,'default'),
(@pq_flow,'e_p_notify_end8',     'p_notify',  'p_end8',   NULL,'default'),

-- ═══ REFI ═══

-- R1
(@pq_flow,'e_r_s1_s2',           'r_s1',      'r_s2',     NULL,'default'),
(@pq_flow,'e_r_s2_w1',           'r_s2',      'r_w1',     NULL,'default'),
(@pq_flow,'e_r_w1_wfr1',         'r_w1',      'r_wfr1',   NULL,'default'),
(@pq_flow,'e_r_wfr1_end1',       'r_wfr1',    'r_end1',   'Responded','responded'),
(@pq_flow,'e_r_wfr1_w2d1',       'r_wfr1',    'r_w2d1',   'No Response','no_response'),

-- R2
(@pq_flow,'e_r_w2d1_s3',         'r_w2d1',    'r_s3',     NULL,'default'),
(@pq_flow,'e_r_s3_w2',           'r_s3',      'r_w2',     NULL,'default'),
(@pq_flow,'e_r_w2_wfr2',         'r_w2',      'r_wfr2',   NULL,'default'),
(@pq_flow,'e_r_wfr2_end2',       'r_wfr2',    'r_end2',   'Responded','responded'),
(@pq_flow,'e_r_wfr2_w2d2',       'r_wfr2',    'r_w2d2',   'No Response','no_response'),

-- R3
(@pq_flow,'e_r_w2d2_s4',         'r_w2d2',    'r_s4',     NULL,'default'),
(@pq_flow,'e_r_s4_s5',           'r_s4',      'r_s5',     NULL,'default'),
(@pq_flow,'e_r_s5_w3',           'r_s5',      'r_w3',     NULL,'default'),
(@pq_flow,'e_r_w3_wfr3',         'r_w3',      'r_wfr3',   NULL,'default'),
(@pq_flow,'e_r_wfr3_end3',       'r_wfr3',    'r_end3',   'Responded','responded'),
(@pq_flow,'e_r_wfr3_w3d1',       'r_wfr3',    'r_w3d1',   'No Response','no_response'),

-- R4
(@pq_flow,'e_r_w3d1_s6',         'r_w3d1',    'r_s6',     NULL,'default'),
(@pq_flow,'e_r_s6_w4',           'r_s6',      'r_w4',     NULL,'default'),
(@pq_flow,'e_r_w4_wfr4',         'r_w4',      'r_wfr4',   NULL,'default'),
(@pq_flow,'e_r_wfr4_end4',       'r_wfr4',    'r_end4',   'Responded','responded'),
(@pq_flow,'e_r_wfr4_w4d1',       'r_wfr4',    'r_w4d1',   'No Response','no_response'),

-- R5
(@pq_flow,'e_r_w4d1_s7',         'r_w4d1',    'r_s7',     NULL,'default'),
(@pq_flow,'e_r_s7_w5',           'r_s7',      'r_w5',     NULL,'default'),
(@pq_flow,'e_r_w5_wfr5',         'r_w5',      'r_wfr5',   NULL,'default'),
(@pq_flow,'e_r_wfr5_end5',       'r_wfr5',    'r_end5',   'Responded','responded'),
(@pq_flow,'e_r_wfr5_w3d2',       'r_wfr5',    'r_w3d2',   'No Response','no_response'),

-- R6
(@pq_flow,'e_r_w3d2_s8',         'r_w3d2',    'r_s8',     NULL,'default'),
(@pq_flow,'e_r_s8_w6',           'r_s8',      'r_w6',     NULL,'default'),
(@pq_flow,'e_r_w6_wfr6',         'r_w6',      'r_wfr6',   NULL,'default'),
(@pq_flow,'e_r_wfr6_end6',       'r_wfr6',    'r_end6',   'Responded','responded'),
(@pq_flow,'e_r_wfr6_w3d3',       'r_wfr6',    'r_w3d3',   'No Response','no_response'),

-- R7
(@pq_flow,'e_r_w3d3_s9',         'r_w3d3',    'r_s9',     NULL,'default'),
(@pq_flow,'e_r_s9_w7',           'r_s9',      'r_w7',     NULL,'default'),
(@pq_flow,'e_r_w7_wfr7',         'r_w7',      'r_wfr7',   NULL,'default'),
(@pq_flow,'e_r_wfr7_end7',       'r_wfr7',    'r_end7',   'Responded','responded'),
(@pq_flow,'e_r_wfr7_w3d4',       'r_wfr7',    'r_w3d4',   'No Response','no_response'),

-- R8 (final)
(@pq_flow,'e_r_w3d4_s10',        'r_w3d4',    'r_s10',    NULL,'default'),
(@pq_flow,'e_r_s10_w5d1',        'r_s10',     'r_w5d1',   NULL,'default'),
(@pq_flow,'e_r_w5d1_s11',        'r_w5d1',    'r_s11',    NULL,'default'),
(@pq_flow,'e_r_s11_notify',      'r_s11',     'r_notify',  NULL,'default'),
(@pq_flow,'e_r_notify_end8',     'r_notify',  'r_end8',   NULL,'default');

-- ============================================================
-- PART 5 — Audit log
-- ============================================================
INSERT INTO `audit_logs` (
  `tenant_id`,`user_id`,`broker_id`,`actor_type`,`action`,
  `entity_type`,`entity_id`,`changes`,`status`,`created_at`
) VALUES (
  1, NULL, NULL, 'user', 'schema_migration',
  'reminder_flows', NULL,
  '{"migration":"20260312_160000_seed_prequalified_reminder_flow","description":"Created Prequalified reminder flow with 21 templates, 8 response-gated rounds per branch (Purchase/Refi/Default), ending with all-user internal notification"}',
  'success', NOW()
);
