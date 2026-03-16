-- Migration: Preapproved Reminder Flow — seed templates + flow
-- Date: 2026-03-12
-- Compatible with MySQL 8.0 (HostGator)
-- Description:
--   Creates the "Preapproved" reminder flow.
--   Branches by loan_type (Purchase / Refi / Default→Purchase).
--   This is a pure time-based drip — NO wait_for_response gates.
--   Both branches start with immediate SMS+Email, then share the
--   same generic escalating sequence of 12 SMS + 11 Email over ~90 days.
--
--   Full cadence per branch (using Purchase as reference):
--
--   (immediate) SMS → Email
--   → wait 2d → SMS
--   → wait 2d → SMS → Email
--   → wait 2d → SMS → wait 3d → SMS → Email
--   → wait 3d → SMS → Email
--   → wait 3d → SMS → wait 2d → SMS
--   → wait 2d → SMS → wait 2d → SMS
--   → wait 2d → SMS
--   → wait 5d → SMS → Email
--   → wait 10d → Email
--   → wait 10d → Email
--   → wait 15d → Email
--   → wait 10d → Email
--   → wait 15d → Email → Email (back to back)
--   → END

-- ============================================================
-- PART 1 — Templates
-- ============================================================

-- ─── PURCHASE branch-specific (round 1) ─────────────────────

INSERT INTO `templates` (`tenant_id`,`name`,`description`,`template_type`,`category`,`subject`,`body`,`variables`,`is_active`,`usage_count`,`created_by_broker_id`) VALUES (
  1,'Preapproved – Purchase SMS 1','Initial SMS on pre-approval (purchase)','sms','follow_up',NULL,
  'Hi {{first_name}}! 🏡 Big news — you\'ve been *pre-approved* for your home purchase loan (#{{application_number}})! This is a major step. Your pre-approval letter is ready and you can start making offers confidently. Questions? Reply anytime! – {{broker_name}}, Encore Mortgage. Reply STOP to opt out.',
  '["first_name","application_number","broker_name"]',1,0,1);
SET @pa_p_sms1 := LAST_INSERT_ID();

INSERT INTO `templates` (`tenant_id`,`name`,`description`,`template_type`,`category`,`subject`,`body`,`variables`,`is_active`,`usage_count`,`created_by_broker_id`) VALUES (
  1,'Preapproved – Purchase Email 1','Initial welcome email on pre-approval (purchase)','email','follow_up',
  '🎉 Congratulations — You\'re Pre-Approved to Buy a Home!',
  'Hi {{first_name}},\n\nExciting news — you have been officially *pre-approved* for your home purchase loan!\n\nApplication #: {{application_number}}\n\nThis is a significant milestone. Here\'s what your pre-approval means for you:\n\n✅ You know exactly how much you can borrow\n✅ Sellers will take your offers seriously\n✅ We can issue your pre-approval letter the moment you need it\n✅ You\'re one step closer to the keys!\n\nHere\'s what comes next:\n1. Start touring homes confidently within your budget.\n2. When you find the one, notify us immediately — we move fast.\n3. We\'ll guide you through the offer, appraisal, and closing process.\n\nHave questions about your pre-approval or the buying process? Reply to this email — we\'re here for you.\n\n{{broker_name}}\nEncore Mortgage',
  '["first_name","application_number","broker_name"]',1,0,1);
SET @pa_p_email1 := LAST_INSERT_ID();

-- ─── REFI branch-specific (round 1) ──────────────────────────

INSERT INTO `templates` (`tenant_id`,`name`,`description`,`template_type`,`category`,`subject`,`body`,`variables`,`is_active`,`usage_count`,`created_by_broker_id`) VALUES (
  1,'Preapproved – Refi SMS 1','Initial SMS on pre-approval (refi)','sms','follow_up',NULL,
  'Hi {{first_name}}! 🔄 Great news — you\'ve been *pre-approved* for your refinance (#{{application_number}})! We\'re ready to lock in your rate and move forward. Want to schedule a quick call to review your options? Reply here! – {{broker_name}}, Encore Mortgage. Reply STOP to opt out.',
  '["first_name","application_number","broker_name"]',1,0,1);
SET @pa_r_sms1 := LAST_INSERT_ID();

INSERT INTO `templates` (`tenant_id`,`name`,`description`,`template_type`,`category`,`subject`,`body`,`variables`,`is_active`,`usage_count`,`created_by_broker_id`) VALUES (
  1,'Preapproved – Refi Email 1','Initial welcome email on pre-approval (refi)','email','follow_up',
  '🎉 Congratulations — You\'re Pre-Approved to Refinance!',
  'Hi {{first_name}},\n\nGreat news — you\'ve been officially *pre-approved* for your refinance!\n\nApplication #: {{application_number}}\n\nHere\'s what this means for you:\n\n💰 Your new rate and payment have been estimated\n🔒 You\'re ready to lock in your rate at any time\n📋 We\'ve reviewed your financials and documents look good\n⚡ We can move quickly once you give the go-ahead\n\nNext steps:\n1. Review your pre-approval terms (we\'ll walk you through them).\n2. Decide when you\'d like to lock in your rate.\n3. Authorize us to order the appraisal if applicable.\n\nRefinancing now could reduce your monthly payment, shorten your loan term, or give you access to cash equity. Let\'s get this done!\n\nReply to this email with any questions.\n\n{{broker_name}}\nEncore Mortgage',
  '["first_name","application_number","broker_name"]',1,0,1);
SET @pa_r_email1 := LAST_INSERT_ID();

-- ─── Shared generic follow-up SMS templates ──────────────────

INSERT INTO `templates` (`tenant_id`,`name`,`description`,`template_type`,`category`,`subject`,`body`,`variables`,`is_active`,`usage_count`,`created_by_broker_id`) VALUES (
  1,'Preapproved – SMS Follow-Up 02','Day-2 check-in SMS','sms','reminder',NULL,
  'Hi {{first_name}}, {{broker_name}} here from Encore Mortgage. Just checking in on your pre-approval (#{{application_number}}). Do you have any questions or need help with the next steps? We\'re ready to move fast when you are. Reply anytime! Reply STOP to opt out.',
  '["first_name","application_number","broker_name"]',1,0,1);
SET @pa_sms2 := LAST_INSERT_ID();

INSERT INTO `templates` (`tenant_id`,`name`,`description`,`template_type`,`category`,`subject`,`body`,`variables`,`is_active`,`usage_count`,`created_by_broker_id`) VALUES (
  1,'Preapproved – SMS Follow-Up 03','Day-4 SMS (before email)','sms','reminder',NULL,
  'Hey {{first_name}}! Quick reminder from {{broker_name}} at Encore Mortgage — your pre-approval (#{{application_number}}) is active and ready. Are you actively working with a realtor? I can recommend one if needed or help coordinate the offer process. Just reply! Reply STOP to opt out.',
  '["first_name","application_number","broker_name"]',1,0,1);
SET @pa_sms3 := LAST_INSERT_ID();

INSERT INTO `templates` (`tenant_id`,`name`,`description`,`template_type`,`category`,`subject`,`body`,`variables`,`is_active`,`usage_count`,`created_by_broker_id`) VALUES (
  1,'Preapproved – Email Follow-Up 02','Day-4 email follow-up','email','follow_up',
  'Your Pre-Approval Is Active — Here\'s How We Can Help You Move Faster',
  'Hi {{first_name}},\n\nJust following up on your pre-approval (#{{application_number}}).\n\nWe know the home search can take time — and we\'re here to support you through every step.\n\nHere\'s how Encore Mortgage can help you move faster:\n\n🏡 We can issue pre-approval letters on demand (even on weekends)\n📞 We\'re available to speak with listing agents to strengthen your offer\n⚡ We offer fast closings that sellers love\n📊 We can run updated rate scenarios based on your target price range\n\nJust reply or call us whenever you\'re ready. We move at your pace!\n\n{{broker_name}}\nEncore Mortgage',
  '["first_name","application_number","broker_name"]',1,0,1);
SET @pa_email2 := LAST_INSERT_ID();

INSERT INTO `templates` (`tenant_id`,`name`,`description`,`template_type`,`category`,`subject`,`body`,`variables`,`is_active`,`usage_count`,`created_by_broker_id`) VALUES (
  1,'Preapproved – SMS Follow-Up 04','Day-6 SMS (before wait3d)','sms','reminder',NULL,
  'Hi {{first_name}}, {{broker_name}} from Encore Mortgage. Your pre-approval (#{{application_number}}) is still fully active. Remember — sellers love buyers who already have pre-approval in hand! Let us know if you need a letter for a specific property. Reply anytime. Reply STOP to opt out.',
  '["first_name","application_number","broker_name"]',1,0,1);
SET @pa_sms4 := LAST_INSERT_ID();

INSERT INTO `templates` (`tenant_id`,`name`,`description`,`template_type`,`category`,`subject`,`body`,`variables`,`is_active`,`usage_count`,`created_by_broker_id`) VALUES (
  1,'Preapproved – SMS Follow-Up 05','Day-9 SMS (after wait3d)','sms','reminder',NULL,
  'Hi {{first_name}}! 👋 {{broker_name}} here. Checking in again on your pre-approval (#{{application_number}}). Have you found any properties you\'re interested in? Even if you\'re just starting to look, I can help you understand what fits your budget. Reply and let\'s chat! Reply STOP to opt out.',
  '["first_name","application_number","broker_name"]',1,0,1);
SET @pa_sms5 := LAST_INSERT_ID();

INSERT INTO `templates` (`tenant_id`,`name`,`description`,`template_type`,`category`,`subject`,`body`,`variables`,`is_active`,`usage_count`,`created_by_broker_id`) VALUES (
  1,'Preapproved – Email Follow-Up 03','Day-9 email follow-up','email','follow_up',
  'Tips for Making the Most of Your Pre-Approval',
  'Hi {{first_name}},\n\nI wanted to share a few tips to help you make the most of your pre-approval (#{{application_number}}) while you search for the right home.\n\n**Do\'s while your pre-approval is active:**\n✅ Continue monitoring listings in your target area\n✅ Keep your finances stable (avoid large purchases or new credit)\n✅ Stay in touch with your realtor on new inventory\n✅ Contact us immediately when you find a home you want to offer on\n\n**Don\'ts:**\n❌ Don\'t open new credit cards or take on new debt\n❌ Don\'t change jobs without letting us know\n❌ Don\'t make large cash deposits without documentation\n\nKeeping these in mind will help ensure a smooth closing when the time comes. Any questions? I\'m always here.\n\n{{broker_name}}\nEncore Mortgage',
  '["first_name","application_number","broker_name"]',1,0,1);
SET @pa_email3 := LAST_INSERT_ID();

INSERT INTO `templates` (`tenant_id`,`name`,`description`,`template_type`,`category`,`subject`,`body`,`variables`,`is_active`,`usage_count`,`created_by_broker_id`) VALUES (
  1,'Preapproved – SMS Follow-Up 06','Day-12 SMS (after wait3d, before email)','sms','reminder',NULL,
  'Hi {{first_name}}, it\'s {{broker_name}} from Encore Mortgage. Still thinking about your loan (#{{application_number}})? Rates can change week to week — if you\'re close to making an offer, now might be a great time to discuss locking in your rate. Reply or call me today! Reply STOP to opt out.',
  '["first_name","application_number","broker_name"]',1,0,1);
SET @pa_sms6 := LAST_INSERT_ID();

INSERT INTO `templates` (`tenant_id`,`name`,`description`,`template_type`,`category`,`subject`,`body`,`variables`,`is_active`,`usage_count`,`created_by_broker_id`) VALUES (
  1,'Preapproved – Email Follow-Up 04','Day-12 email follow-up','email','follow_up',
  'Have You Considered Locking In Your Rate?',
  'Hi {{first_name}},\n\nFollowing up on your pre-approval (#{{application_number}}).\n\nOne of the most important decisions in your mortgage journey is *when* to lock in your rate. A rate lock protects you from increases while you finalize your home purchase or refinance.\n\nHere\'s what you should know:\n\n📌 Rate locks are typically 30–60 days\n📌 Locking in now could protect you from rising rates\n📌 We monitor the market daily to advise the best timing\n\nWould you like to discuss your rate lock options? Just reply to this email or give me a call and we\'ll walk through the numbers together.\n\n{{broker_name}}\nEncore Mortgage',
  '["first_name","application_number","broker_name"]',1,0,1);
SET @pa_email4 := LAST_INSERT_ID();

INSERT INTO `templates` (`tenant_id`,`name`,`description`,`template_type`,`category`,`subject`,`body`,`variables`,`is_active`,`usage_count`,`created_by_broker_id`) VALUES (
  1,'Preapproved – SMS Follow-Up 07','Day-15 SMS (after wait3d)','sms','reminder',NULL,
  'Hey {{first_name}}! 📲 {{broker_name}} from Encore Mortgage. Two weeks since your pre-approval (#{{application_number}}) — just wanted to check in. Is there anything we can do to help your home search move forward? We\'re here to support you however we can. Reply! Reply STOP to opt out.',
  '["first_name","application_number","broker_name"]',1,0,1);
SET @pa_sms7 := LAST_INSERT_ID();

INSERT INTO `templates` (`tenant_id`,`name`,`description`,`template_type`,`category`,`subject`,`body`,`variables`,`is_active`,`usage_count`,`created_by_broker_id`) VALUES (
  1,'Preapproved – SMS Follow-Up 08','Day-17 SMS (after wait2d)','sms','reminder',NULL,
  'Hi {{first_name}}, {{broker_name}} here. Just a quick note — your pre-approval (#{{application_number}}) is still ready for action. The market moves fast; when you\'re ready to make an offer, we can provide a same-day pre-approval letter. Don\'t hesitate to reach out! Reply STOP to opt out.',
  '["first_name","application_number","broker_name"]',1,0,1);
SET @pa_sms8 := LAST_INSERT_ID();

INSERT INTO `templates` (`tenant_id`,`name`,`description`,`template_type`,`category`,`subject`,`body`,`variables`,`is_active`,`usage_count`,`created_by_broker_id`) VALUES (
  1,'Preapproved – SMS Follow-Up 09','Day-19 SMS (after wait2d)','sms','reminder',NULL,
  'Hi {{first_name}}! {{broker_name}} from Encore Mortgage checking in. It\'s been a couple of weeks since your pre-approval (#{{application_number}}). How\'s the home search going? Whether you\'re close to an offer or still browsing, I\'m here to help. Reply anytime! Reply STOP to opt out.',
  '["first_name","application_number","broker_name"]',1,0,1);
SET @pa_sms9 := LAST_INSERT_ID();

INSERT INTO `templates` (`tenant_id`,`name`,`description`,`template_type`,`category`,`subject`,`body`,`variables`,`is_active`,`usage_count`,`created_by_broker_id`) VALUES (
  1,'Preapproved – SMS Follow-Up 10','Day-21 SMS (after wait2d)','sms','reminder',NULL,
  'Hello {{first_name}}! Quick check from {{broker_name}} at Encore Mortgage. Your pre-approval (#{{application_number}}) is still active. If you\'ve been hesitant about the process or costs, let\'s talk — I can walk you through everything with no pressure. Reply here! Reply STOP to opt out.',
  '["first_name","application_number","broker_name"]',1,0,1);
SET @pa_sms10 := LAST_INSERT_ID();

INSERT INTO `templates` (`tenant_id`,`name`,`description`,`template_type`,`category`,`subject`,`body`,`variables`,`is_active`,`usage_count`,`created_by_broker_id`) VALUES (
  1,'Preapproved – SMS Follow-Up 11','Day-23 SMS (after wait2d)','sms','reminder',NULL,
  'Hi {{first_name}}, {{broker_name}} from Encore Mortgage. I know life gets busy — just a friendly reminder that your pre-approval (#{{application_number}}) is still here and ready. When you find the right home, we\'ll be ready to move instantly. Reply or call anytime! Reply STOP to opt out.',
  '["first_name","application_number","broker_name"]',1,0,1);
SET @pa_sms11 := LAST_INSERT_ID();

INSERT INTO `templates` (`tenant_id`,`name`,`description`,`template_type`,`category`,`subject`,`body`,`variables`,`is_active`,`usage_count`,`created_by_broker_id`) VALUES (
  1,'Preapproved – SMS Follow-Up 12','Day-28 SMS (after wait5d, before email)','sms','reminder',NULL,
  'Hi {{first_name}}! It\'s been about 4 weeks since your pre-approval (#{{application_number}}). {{broker_name}} here from Encore Mortgage — I just wanted to personally check in. Have your needs or circumstances changed? I can update your pre-approval at any time. Reply here or call me! Reply STOP to opt out.',
  '["first_name","application_number","broker_name"]',1,0,1);
SET @pa_sms12 := LAST_INSERT_ID();

-- ─── Shared generic follow-up Email templates ────────────────

INSERT INTO `templates` (`tenant_id`,`name`,`description`,`template_type`,`category`,`subject`,`body`,`variables`,`is_active`,`usage_count`,`created_by_broker_id`) VALUES (
  1,'Preapproved – Email Follow-Up 05','Day-28 email (after wait5d)','email','follow_up',
  'One Month In — Your Pre-Approval Remains Ready',
  'Hi {{first_name}},\n\nA month has passed since your pre-approval (#{{application_number}}), and we\'re still here cheering you on!\n\nWe understand that finding the right home takes time, and we never want to rush a decision this important. But we do want to make sure you have all the support you need.\n\nA few things worth knowing at this stage:\n\n📅 Pre-approvals are typically valid for 60–90 days from the credit check date. If yours is approaching expiration, we can refresh it quickly with a soft update.\n\n📊 Have your income, employment, or finances changed? Let us know and we\'ll update your file accordingly.\n\n🏠 If you\'ve been looking at properties outside your current pre-approved range, we can explore options.\n\nJust reply to this email and let\'s review where things stand.\n\n{{broker_name}}\nEncore Mortgage',
  '["first_name","application_number","broker_name"]',1,0,1);
SET @pa_email5 := LAST_INSERT_ID();

INSERT INTO `templates` (`tenant_id`,`name`,`description`,`template_type`,`category`,`subject`,`body`,`variables`,`is_active`,`usage_count`,`created_by_broker_id`) VALUES (
  1,'Preapproved – Email Follow-Up 06','Day-38 email (after wait10d)','email','follow_up',
  'Week 5 Check-In: Your Mortgage Questions Answered',
  'Hi {{first_name}},\n\nHope you\'re well! We\'re still here to support your loan process (#{{application_number}}).\n\nWe thought we\'d take a moment to answer some of the most common questions we hear at this stage:\n\n**Q: Is my pre-approval letter still valid?**\nA: Pre-approvals are typically good for 60–90 days. Let us know if you\'re approaching that window.\n\n**Q: What if I find a home over my pre-approved amount?**\nA: We can review your financials and potentially increase your pre-approval. Just reach out.\n\n**Q: How quickly can we close once I have a signed contract?**\nA: We strive for 21–30 day closings for our prepared clients like you.\n\n**Q: What if interest rates have changed since my pre-approval?**\nA: We\'ll run updated numbers before you make an offer — no surprises.\n\nHave a question not listed here? Just reply — we\'re happy to help.\n\n{{broker_name}}\nEncore Mortgage',
  '["first_name","application_number","broker_name"]',1,0,1);
SET @pa_email6 := LAST_INSERT_ID();

INSERT INTO `templates` (`tenant_id`,`name`,`description`,`template_type`,`category`,`subject`,`body`,`variables`,`is_active`,`usage_count`,`created_by_broker_id`) VALUES (
  1,'Preapproved – Email Follow-Up 07','Day-48 email (after wait10d)','email','follow_up',
  'Week 7 — Still Here, Still Ready to Help You Close',
  'Hi {{first_name}},\n\nJust checking in on your loan file #{{application_number}}.\n\nWe know life happens — whether it\'s been a competitive market, shifting personal priorities, or simply taking the time to find the right fit, we\'re here without judgment.\n\nAt Encore Mortgage, our goal is simple: to be your trusted partner when you\'re ready to move. There\'s no pressure and no deadline from our side.\n\nThat said, if there\'s anything slowing you down — financing questions, budget concerns, or uncertainty about the process — we\'d love to help clear it up.\n\nJust hit reply and let\'s talk.\n\n{{broker_name}}\nEncore Mortgage',
  '["first_name","application_number","broker_name"]',1,0,1);
SET @pa_email7 := LAST_INSERT_ID();

INSERT INTO `templates` (`tenant_id`,`name`,`description`,`template_type`,`category`,`subject`,`body`,`variables`,`is_active`,`usage_count`,`created_by_broker_id`) VALUES (
  1,'Preapproved – Email Follow-Up 08','Day-63 email (after wait15d)','email','follow_up',
  'Two Months Since Your Pre-Approval — Let\'s Reconnect',
  'Hi {{first_name}},\n\nIt\'s been about two months since your pre-approval for loan #{{application_number}}.\n\nWe want to be straightforward with you: pre-approvals have an expiration date, and if yours is close to expiring, we\'d recommend we reconnect to refresh your file. This is typically a quick and painless process.\n\nHere\'s what a refreshed pre-approval means:\n✅ Updated rate quotes based on current market conditions\n✅ Confirms your financial picture is still on track\n✅ Gives you renewed confidence heading into offers\n\nAlternatively, if your plans have changed or if this simply isn\'t the right time, we understand completely — just let us know so we can properly update your file.\n\nReply to this email to reconnect. We\'d love to hear from you.\n\n{{broker_name}}\nEncore Mortgage',
  '["first_name","application_number","broker_name"]',1,0,1);
SET @pa_email8 := LAST_INSERT_ID();

INSERT INTO `templates` (`tenant_id`,`name`,`description`,`template_type`,`category`,`subject`,`body`,`variables`,`is_active`,`usage_count`,`created_by_broker_id`) VALUES (
  1,'Preapproved – Email Follow-Up 09','Day-73 email (after wait10d)','email','follow_up',
  'Week 10 — A Personal Note From Your Loan Officer',
  'Hi {{first_name}},\n\nI wanted to reach out personally about your loan file #{{application_number}}.\n\nYour pre-approval was an important step and I\'ve been following your file closely. I know the home buying (or refinancing) journey can be full of unexpected twists, and I want you to know I\'m in your corner.\n\nIf there\'s anything — questions, concerns, change in plans, or if you\'re finally ready to move — please don\'t hesitate to reply or call me directly.\n\nYour goals matter to us. We\'re not just processing loans — we\'re helping families achieve something meaningful. I\'d be honored to help you get to the finish line.\n\n{{broker_name}}\nEncore Mortgage',
  '["first_name","application_number","broker_name"]',1,0,1);
SET @pa_email9 := LAST_INSERT_ID();

INSERT INTO `templates` (`tenant_id`,`name`,`description`,`template_type`,`category`,`subject`,`body`,`variables`,`is_active`,`usage_count`,`created_by_broker_id`) VALUES (
  1,'Preapproved – Email Follow-Up 10','Day-88 email (after wait15d)','email','follow_up',
  'Final Reminder: Your Pre-Approval May Be Expiring Soon',
  'Hi {{first_name}},\n\nThis is an important update regarding your pre-approval for loan #{{application_number}}.\n\nMost pre-approvals are valid for 60–90 days from the initial credit check. If we haven\'t reconnected recently, your pre-approval may be approaching or have passed its expiration date.\n\nThis doesn\'t mean you\'re out of options — it simply means we\'ll need to do a quick refresh of your file to issue a current pre-approval letter.\n\nOptions moving forward:\n1. **Renew your pre-approval** — quick process, usually same-day\n2. **Update your file** if circumstances have changed\n3. **Let us know if you\'d like to pause** — we\'ll note your file accordingly\n\nPlease reply to this email so we can best support you from here.\n\n{{broker_name}}\nEncore Mortgage',
  '["first_name","application_number","broker_name"]',1,0,1);
SET @pa_email10 := LAST_INSERT_ID();

INSERT INTO `templates` (`tenant_id`,`name`,`description`,`template_type`,`category`,`subject`,`body`,`variables`,`is_active`,`usage_count`,`created_by_broker_id`) VALUES (
  1,'Preapproved – Email Final','Final email after full sequence (no wait before this)','email','follow_up',
  'We\'re Here Whenever You\'re Ready — No Pressure',
  'Hi {{first_name}},\n\nThis is our final automated message regarding your pre-approval for loan #{{application_number}}.\n\nWe\'ve reached out multiple times over the past few months because we genuinely believe in helping you achieve your goals. But we also respect your timeline and understand that life has its own pace.\n\nWhenever you\'re ready — whether it\'s tomorrow or six months from now — we will be here. Just reach out and we\'ll pick up right where we left off.\n\nThank you for giving Encore Mortgage the opportunity to serve you. We look forward to celebrating your success when the time is right.\n\nWarm regards,\n\n{{broker_name}}\nEncore Mortgage',
  '["first_name","application_number","broker_name"]',1,0,1);
SET @pa_email11 := LAST_INSERT_ID();

-- ============================================================
-- PART 2 — Reminder Flow
-- ============================================================

INSERT INTO `reminder_flows`
  (`tenant_id`,`name`,`description`,`trigger_event`,`trigger_delay_days`,`is_active`,`apply_to_all_loans`,`loan_type_filter`,`created_by_broker_id`)
VALUES (
  1,
  'Preapproved — Nurture Drip Sequence',
  'Triggered when loan status becomes preapproved. Branches by loan type (Purchase/Refi/Default→Purchase). Pure time-based drip — no response gates. 12 SMS + 11 Email over ~88 days. Both branches start with immediate SMS+Email, then share an escalating sequence.',
  'preapproved', 0, 1, 1, 'all', 1
);
SET @pa_flow := LAST_INSERT_ID();

-- ============================================================
-- PART 3 — Steps
-- Naming convention:
--   p_ = purchase branch   r_ = refi branch
--   sN = send SMS step N   eN = send Email step N
--   w  = wait step (with suffix for uniqueness)
-- ============================================================

INSERT INTO `reminder_flow_steps`
  (`flow_id`,`step_key`,`step_type`,`label`,`description`,`config`,`position_x`,`position_y`)
VALUES

-- ── TRIGGER + BRANCH ─────────────────────────────────────────
(@pa_flow,'trigger',  'trigger','Preapproved Trigger',NULL,NULL,500,50),
(@pa_flow,'branch',   'branch', 'Loan Type Branch','Routes to Purchase or Refi sequence','{"condition_type":"loan_type"}',500,200),

-- ═══════════════════════════════════════════════════════════
-- PURCHASE BRANCH (x=200)
-- ═══════════════════════════════════════════════════════════

-- Round 1 (immediate)
(@pa_flow,'p_s1',    'send_sms',  'SMS 1 (Purchase)',   NULL, CONCAT('{"template_id":',@pa_p_sms1,'}'),  200, 380),
(@pa_flow,'p_e1',    'send_email','Email 1 (Purchase)', NULL, CONCAT('{"template_id":',@pa_p_email1,'}'), 200, 510),

-- Round 2: wait 2d → SMS
(@pa_flow,'p_w2d1',  'wait','Wait 2 Days',NULL,'{"delay_days":2}',                                       200, 640),
(@pa_flow,'p_s2',    'send_sms',  'SMS 2 (Purchase)',   NULL, CONCAT('{"template_id":',@pa_sms2,'}'),     200, 770),

-- Round 3: wait 2d → SMS → Email
(@pa_flow,'p_w2d2',  'wait','Wait 2 Days',NULL,'{"delay_days":2}',                                       200, 900),
(@pa_flow,'p_s3',    'send_sms',  'SMS 3 (Purchase)',   NULL, CONCAT('{"template_id":',@pa_sms3,'}'),     200, 1030),
(@pa_flow,'p_e2',    'send_email','Email 2 (Purchase)', NULL, CONCAT('{"template_id":',@pa_email2,'}'),   200, 1160),

-- Round 4: wait 2d → SMS
(@pa_flow,'p_w2d3',  'wait','Wait 2 Days',NULL,'{"delay_days":2}',                                       200, 1290),
(@pa_flow,'p_s4',    'send_sms',  'SMS 4 (Purchase)',   NULL, CONCAT('{"template_id":',@pa_sms4,'}'),     200, 1420),

-- Round 5: wait 3d → SMS → Email
(@pa_flow,'p_w3d1',  'wait','Wait 3 Days',NULL,'{"delay_days":3}',                                       200, 1550),
(@pa_flow,'p_s5',    'send_sms',  'SMS 5 (Purchase)',   NULL, CONCAT('{"template_id":',@pa_sms5,'}'),     200, 1680),
(@pa_flow,'p_e3',    'send_email','Email 3 (Purchase)', NULL, CONCAT('{"template_id":',@pa_email3,'}'),   200, 1810),

-- Round 6: wait 3d → SMS → Email
(@pa_flow,'p_w3d2',  'wait','Wait 3 Days',NULL,'{"delay_days":3}',                                       200, 1940),
(@pa_flow,'p_s6',    'send_sms',  'SMS 6 (Purchase)',   NULL, CONCAT('{"template_id":',@pa_sms6,'}'),     200, 2070),
(@pa_flow,'p_e4',    'send_email','Email 4 (Purchase)', NULL, CONCAT('{"template_id":',@pa_email4,'}'),   200, 2200),

-- Round 7: wait 3d → SMS → wait 2d → SMS
(@pa_flow,'p_w3d3',  'wait','Wait 3 Days',NULL,'{"delay_days":3}',                                       200, 2330),
(@pa_flow,'p_s7',    'send_sms',  'SMS 7 (Purchase)',   NULL, CONCAT('{"template_id":',@pa_sms7,'}'),     200, 2460),
(@pa_flow,'p_w2d4',  'wait','Wait 2 Days',NULL,'{"delay_days":2}',                                       200, 2590),
(@pa_flow,'p_s8',    'send_sms',  'SMS 8 (Purchase)',   NULL, CONCAT('{"template_id":',@pa_sms8,'}'),     200, 2720),

-- Round 8: wait 2d → SMS → wait 2d → SMS
(@pa_flow,'p_w2d5',  'wait','Wait 2 Days',NULL,'{"delay_days":2}',                                       200, 2850),
(@pa_flow,'p_s9',    'send_sms',  'SMS 9 (Purchase)',   NULL, CONCAT('{"template_id":',@pa_sms9,'}'),     200, 2980),
(@pa_flow,'p_w2d6',  'wait','Wait 2 Days',NULL,'{"delay_days":2}',                                       200, 3110),
(@pa_flow,'p_s10',   'send_sms',  'SMS 10 (Purchase)',  NULL, CONCAT('{"template_id":',@pa_sms10,'}'),    200, 3240),

-- Round 9: wait 2d → SMS
(@pa_flow,'p_w2d7',  'wait','Wait 2 Days',NULL,'{"delay_days":2}',                                       200, 3370),
(@pa_flow,'p_s11',   'send_sms',  'SMS 11 (Purchase)',  NULL, CONCAT('{"template_id":',@pa_sms11,'}'),    200, 3500),

-- Round 10: wait 5d → SMS → Email
(@pa_flow,'p_w5d1',  'wait','Wait 5 Days',NULL,'{"delay_days":5}',                                       200, 3630),
(@pa_flow,'p_s12',   'send_sms',  'SMS 12 (Purchase)',  NULL, CONCAT('{"template_id":',@pa_sms12,'}'),    200, 3760),
(@pa_flow,'p_e5',    'send_email','Email 5 (Purchase)', NULL, CONCAT('{"template_id":',@pa_email5,'}'),   200, 3890),

-- Round 11: wait 10d → Email
(@pa_flow,'p_w10d1', 'wait','Wait 10 Days',NULL,'{"delay_days":10}',                                     200, 4020),
(@pa_flow,'p_e6',    'send_email','Email 6 (Purchase)', NULL, CONCAT('{"template_id":',@pa_email6,'}'),   200, 4150),

-- Round 12: wait 10d → Email
(@pa_flow,'p_w10d2', 'wait','Wait 10 Days',NULL,'{"delay_days":10}',                                     200, 4280),
(@pa_flow,'p_e7',    'send_email','Email 7 (Purchase)', NULL, CONCAT('{"template_id":',@pa_email7,'}'),   200, 4410),

-- Round 13: wait 15d → Email
(@pa_flow,'p_w15d1', 'wait','Wait 15 Days',NULL,'{"delay_days":15}',                                     200, 4540),
(@pa_flow,'p_e8',    'send_email','Email 8 (Purchase)', NULL, CONCAT('{"template_id":',@pa_email8,'}'),   200, 4670),

-- Round 14: wait 10d → Email
(@pa_flow,'p_w10d3', 'wait','Wait 10 Days',NULL,'{"delay_days":10}',                                     200, 4800),
(@pa_flow,'p_e9',    'send_email','Email 9 (Purchase)', NULL, CONCAT('{"template_id":',@pa_email9,'}'),   200, 4930),

-- Round 15: wait 15d → Email → Email (back to back)
(@pa_flow,'p_w15d2', 'wait','Wait 15 Days',NULL,'{"delay_days":15}',                                     200, 5060),
(@pa_flow,'p_e10',   'send_email','Email 10 (Purchase)',NULL, CONCAT('{"template_id":',@pa_email10,'}'),  200, 5190),
(@pa_flow,'p_e11',   'send_email','Email 11 Final (Purchase)',NULL,CONCAT('{"template_id":',@pa_email11,'}'),200,5320),

(@pa_flow,'p_end',   'end','End – Purchase Sequence Complete',NULL,NULL,                                  200, 5450),

-- ═══════════════════════════════════════════════════════════
-- REFI BRANCH (x=800)
-- ═══════════════════════════════════════════════════════════

-- Round 1 (immediate)
(@pa_flow,'r_s1',    'send_sms',  'SMS 1 (Refi)',   NULL, CONCAT('{"template_id":',@pa_r_sms1,'}'),  800, 380),
(@pa_flow,'r_e1',    'send_email','Email 1 (Refi)', NULL, CONCAT('{"template_id":',@pa_r_email1,'}'), 800, 510),

-- Round 2
(@pa_flow,'r_w2d1',  'wait','Wait 2 Days',NULL,'{"delay_days":2}',                                   800, 640),
(@pa_flow,'r_s2',    'send_sms',  'SMS 2 (Refi)',   NULL, CONCAT('{"template_id":',@pa_sms2,'}'),    800, 770),

-- Round 3
(@pa_flow,'r_w2d2',  'wait','Wait 2 Days',NULL,'{"delay_days":2}',                                   800, 900),
(@pa_flow,'r_s3',    'send_sms',  'SMS 3 (Refi)',   NULL, CONCAT('{"template_id":',@pa_sms3,'}'),    800, 1030),
(@pa_flow,'r_e2',    'send_email','Email 2 (Refi)', NULL, CONCAT('{"template_id":',@pa_email2,'}'),  800, 1160),

-- Round 4
(@pa_flow,'r_w2d3',  'wait','Wait 2 Days',NULL,'{"delay_days":2}',                                   800, 1290),
(@pa_flow,'r_s4',    'send_sms',  'SMS 4 (Refi)',   NULL, CONCAT('{"template_id":',@pa_sms4,'}'),    800, 1420),

-- Round 5
(@pa_flow,'r_w3d1',  'wait','Wait 3 Days',NULL,'{"delay_days":3}',                                   800, 1550),
(@pa_flow,'r_s5',    'send_sms',  'SMS 5 (Refi)',   NULL, CONCAT('{"template_id":',@pa_sms5,'}'),    800, 1680),
(@pa_flow,'r_e3',    'send_email','Email 3 (Refi)', NULL, CONCAT('{"template_id":',@pa_email3,'}'),  800, 1810),

-- Round 6
(@pa_flow,'r_w3d2',  'wait','Wait 3 Days',NULL,'{"delay_days":3}',                                   800, 1940),
(@pa_flow,'r_s6',    'send_sms',  'SMS 6 (Refi)',   NULL, CONCAT('{"template_id":',@pa_sms6,'}'),    800, 2070),
(@pa_flow,'r_e4',    'send_email','Email 4 (Refi)', NULL, CONCAT('{"template_id":',@pa_email4,'}'),  800, 2200),

-- Round 7
(@pa_flow,'r_w3d3',  'wait','Wait 3 Days',NULL,'{"delay_days":3}',                                   800, 2330),
(@pa_flow,'r_s7',    'send_sms',  'SMS 7 (Refi)',   NULL, CONCAT('{"template_id":',@pa_sms7,'}'),    800, 2460),
(@pa_flow,'r_w2d4',  'wait','Wait 2 Days',NULL,'{"delay_days":2}',                                   800, 2590),
(@pa_flow,'r_s8',    'send_sms',  'SMS 8 (Refi)',   NULL, CONCAT('{"template_id":',@pa_sms8,'}'),    800, 2720),

-- Round 8
(@pa_flow,'r_w2d5',  'wait','Wait 2 Days',NULL,'{"delay_days":2}',                                   800, 2850),
(@pa_flow,'r_s9',    'send_sms',  'SMS 9 (Refi)',   NULL, CONCAT('{"template_id":',@pa_sms9,'}'),    800, 2980),
(@pa_flow,'r_w2d6',  'wait','Wait 2 Days',NULL,'{"delay_days":2}',                                   800, 3110),
(@pa_flow,'r_s10',   'send_sms',  'SMS 10 (Refi)',  NULL, CONCAT('{"template_id":',@pa_sms10,'}'),   800, 3240),

-- Round 9
(@pa_flow,'r_w2d7',  'wait','Wait 2 Days',NULL,'{"delay_days":2}',                                   800, 3370),
(@pa_flow,'r_s11',   'send_sms',  'SMS 11 (Refi)',  NULL, CONCAT('{"template_id":',@pa_sms11,'}'),   800, 3500),

-- Round 10
(@pa_flow,'r_w5d1',  'wait','Wait 5 Days',NULL,'{"delay_days":5}',                                   800, 3630),
(@pa_flow,'r_s12',   'send_sms',  'SMS 12 (Refi)',  NULL, CONCAT('{"template_id":',@pa_sms12,'}'),   800, 3760),
(@pa_flow,'r_e5',    'send_email','Email 5 (Refi)', NULL, CONCAT('{"template_id":',@pa_email5,'}'),  800, 3890),

-- Round 11
(@pa_flow,'r_w10d1', 'wait','Wait 10 Days',NULL,'{"delay_days":10}',                                 800, 4020),
(@pa_flow,'r_e6',    'send_email','Email 6 (Refi)', NULL, CONCAT('{"template_id":',@pa_email6,'}'),  800, 4150),

-- Round 12
(@pa_flow,'r_w10d2', 'wait','Wait 10 Days',NULL,'{"delay_days":10}',                                 800, 4280),
(@pa_flow,'r_e7',    'send_email','Email 7 (Refi)', NULL, CONCAT('{"template_id":',@pa_email7,'}'),  800, 4410),

-- Round 13
(@pa_flow,'r_w15d1', 'wait','Wait 15 Days',NULL,'{"delay_days":15}',                                 800, 4540),
(@pa_flow,'r_e8',    'send_email','Email 8 (Refi)', NULL, CONCAT('{"template_id":',@pa_email8,'}'),  800, 4670),

-- Round 14
(@pa_flow,'r_w10d3', 'wait','Wait 10 Days',NULL,'{"delay_days":10}',                                 800, 4800),
(@pa_flow,'r_e9',    'send_email','Email 9 (Refi)', NULL, CONCAT('{"template_id":',@pa_email9,'}'),  800, 4930),

-- Round 15
(@pa_flow,'r_w15d2', 'wait','Wait 15 Days',NULL,'{"delay_days":15}',                                 800, 5060),
(@pa_flow,'r_e10',   'send_email','Email 10 (Refi)',NULL, CONCAT('{"template_id":',@pa_email10,'}'), 800, 5190),
(@pa_flow,'r_e11',   'send_email','Email 11 Final (Refi)',NULL,CONCAT('{"template_id":',@pa_email11,'}'),800,5320),

(@pa_flow,'r_end',   'end','End – Refi Sequence Complete',NULL,NULL,                                  800, 5450);

-- ============================================================
-- PART 4 — Connections
-- ============================================================

INSERT INTO `reminder_flow_connections`
  (`flow_id`,`edge_key`,`source_step_key`,`target_step_key`,`label`,`edge_type`)
VALUES

-- trigger → branch
(@pa_flow,'e_trigger_branch',   'trigger', 'branch',   NULL,      'default'),

-- branch → trees (Default/Nada → purchase)
(@pa_flow,'e_branch_p',         'branch',  'p_s1',     'Purchase','loan_type_purchase'),
(@pa_flow,'e_branch_r',         'branch',  'r_s1',     'Refi',    'loan_type_refinance'),
(@pa_flow,'e_branch_def',       'branch',  'p_s1',     'Other',   'default'),

-- ═══ PURCHASE ═══

-- R1 (immediate)
(@pa_flow,'e_p_s1_e1',          'p_s1',    'p_e1',     NULL,'default'),
(@pa_flow,'e_p_e1_w2d1',        'p_e1',    'p_w2d1',   NULL,'default'),

-- R2
(@pa_flow,'e_p_w2d1_s2',        'p_w2d1',  'p_s2',     NULL,'default'),
(@pa_flow,'e_p_s2_w2d2',        'p_s2',    'p_w2d2',   NULL,'default'),

-- R3
(@pa_flow,'e_p_w2d2_s3',        'p_w2d2',  'p_s3',     NULL,'default'),
(@pa_flow,'e_p_s3_e2',          'p_s3',    'p_e2',     NULL,'default'),
(@pa_flow,'e_p_e2_w2d3',        'p_e2',    'p_w2d3',   NULL,'default'),

-- R4
(@pa_flow,'e_p_w2d3_s4',        'p_w2d3',  'p_s4',     NULL,'default'),
(@pa_flow,'e_p_s4_w3d1',        'p_s4',    'p_w3d1',   NULL,'default'),

-- R5
(@pa_flow,'e_p_w3d1_s5',        'p_w3d1',  'p_s5',     NULL,'default'),
(@pa_flow,'e_p_s5_e3',          'p_s5',    'p_e3',     NULL,'default'),
(@pa_flow,'e_p_e3_w3d2',        'p_e3',    'p_w3d2',   NULL,'default'),

-- R6
(@pa_flow,'e_p_w3d2_s6',        'p_w3d2',  'p_s6',     NULL,'default'),
(@pa_flow,'e_p_s6_e4',          'p_s6',    'p_e4',     NULL,'default'),
(@pa_flow,'e_p_e4_w3d3',        'p_e4',    'p_w3d3',   NULL,'default'),

-- R7
(@pa_flow,'e_p_w3d3_s7',        'p_w3d3',  'p_s7',     NULL,'default'),
(@pa_flow,'e_p_s7_w2d4',        'p_s7',    'p_w2d4',   NULL,'default'),
(@pa_flow,'e_p_w2d4_s8',        'p_w2d4',  'p_s8',     NULL,'default'),
(@pa_flow,'e_p_s8_w2d5',        'p_s8',    'p_w2d5',   NULL,'default'),

-- R8
(@pa_flow,'e_p_w2d5_s9',        'p_w2d5',  'p_s9',     NULL,'default'),
(@pa_flow,'e_p_s9_w2d6',        'p_s9',    'p_w2d6',   NULL,'default'),
(@pa_flow,'e_p_w2d6_s10',       'p_w2d6',  'p_s10',    NULL,'default'),
(@pa_flow,'e_p_s10_w2d7',       'p_s10',   'p_w2d7',   NULL,'default'),

-- R9
(@pa_flow,'e_p_w2d7_s11',       'p_w2d7',  'p_s11',    NULL,'default'),
(@pa_flow,'e_p_s11_w5d1',       'p_s11',   'p_w5d1',   NULL,'default'),

-- R10
(@pa_flow,'e_p_w5d1_s12',       'p_w5d1',  'p_s12',    NULL,'default'),
(@pa_flow,'e_p_s12_e5',         'p_s12',   'p_e5',     NULL,'default'),
(@pa_flow,'e_p_e5_w10d1',       'p_e5',    'p_w10d1',  NULL,'default'),

-- R11
(@pa_flow,'e_p_w10d1_e6',       'p_w10d1', 'p_e6',     NULL,'default'),
(@pa_flow,'e_p_e6_w10d2',       'p_e6',    'p_w10d2',  NULL,'default'),

-- R12
(@pa_flow,'e_p_w10d2_e7',       'p_w10d2', 'p_e7',     NULL,'default'),
(@pa_flow,'e_p_e7_w15d1',       'p_e7',    'p_w15d1',  NULL,'default'),

-- R13
(@pa_flow,'e_p_w15d1_e8',       'p_w15d1', 'p_e8',     NULL,'default'),
(@pa_flow,'e_p_e8_w10d3',       'p_e8',    'p_w10d3',  NULL,'default'),

-- R14
(@pa_flow,'e_p_w10d3_e9',       'p_w10d3', 'p_e9',     NULL,'default'),
(@pa_flow,'e_p_e9_w15d2',       'p_e9',    'p_w15d2',  NULL,'default'),

-- R15 (back-to-back)
(@pa_flow,'e_p_w15d2_e10',      'p_w15d2', 'p_e10',    NULL,'default'),
(@pa_flow,'e_p_e10_e11',        'p_e10',   'p_e11',    NULL,'default'),
(@pa_flow,'e_p_e11_end',        'p_e11',   'p_end',    NULL,'default'),

-- ═══ REFI ═══

-- R1 (immediate)
(@pa_flow,'e_r_s1_e1',          'r_s1',    'r_e1',     NULL,'default'),
(@pa_flow,'e_r_e1_w2d1',        'r_e1',    'r_w2d1',   NULL,'default'),

-- R2
(@pa_flow,'e_r_w2d1_s2',        'r_w2d1',  'r_s2',     NULL,'default'),
(@pa_flow,'e_r_s2_w2d2',        'r_s2',    'r_w2d2',   NULL,'default'),

-- R3
(@pa_flow,'e_r_w2d2_s3',        'r_w2d2',  'r_s3',     NULL,'default'),
(@pa_flow,'e_r_s3_e2',          'r_s3',    'r_e2',     NULL,'default'),
(@pa_flow,'e_r_e2_w2d3',        'r_e2',    'r_w2d3',   NULL,'default'),

-- R4
(@pa_flow,'e_r_w2d3_s4',        'r_w2d3',  'r_s4',     NULL,'default'),
(@pa_flow,'e_r_s4_w3d1',        'r_s4',    'r_w3d1',   NULL,'default'),

-- R5
(@pa_flow,'e_r_w3d1_s5',        'r_w3d1',  'r_s5',     NULL,'default'),
(@pa_flow,'e_r_s5_e3',          'r_s5',    'r_e3',     NULL,'default'),
(@pa_flow,'e_r_e3_w3d2',        'r_e3',    'r_w3d2',   NULL,'default'),

-- R6
(@pa_flow,'e_r_w3d2_s6',        'r_w3d2',  'r_s6',     NULL,'default'),
(@pa_flow,'e_r_s6_e4',          'r_s6',    'r_e4',     NULL,'default'),
(@pa_flow,'e_r_e4_w3d3',        'r_e4',    'r_w3d3',   NULL,'default'),

-- R7
(@pa_flow,'e_r_w3d3_s7',        'r_w3d3',  'r_s7',     NULL,'default'),
(@pa_flow,'e_r_s7_w2d4',        'r_s7',    'r_w2d4',   NULL,'default'),
(@pa_flow,'e_r_w2d4_s8',        'r_w2d4',  'r_s8',     NULL,'default'),
(@pa_flow,'e_r_s8_w2d5',        'r_s8',    'r_w2d5',   NULL,'default'),

-- R8
(@pa_flow,'e_r_w2d5_s9',        'r_w2d5',  'r_s9',     NULL,'default'),
(@pa_flow,'e_r_s9_w2d6',        'r_s9',    'r_w2d6',   NULL,'default'),
(@pa_flow,'e_r_w2d6_s10',       'r_w2d6',  'r_s10',    NULL,'default'),
(@pa_flow,'e_r_s10_w2d7',       'r_s10',   'r_w2d7',   NULL,'default'),

-- R9
(@pa_flow,'e_r_w2d7_s11',       'r_w2d7',  'r_s11',    NULL,'default'),
(@pa_flow,'e_r_s11_w5d1',       'r_s11',   'r_w5d1',   NULL,'default'),

-- R10
(@pa_flow,'e_r_w5d1_s12',       'r_w5d1',  'r_s12',    NULL,'default'),
(@pa_flow,'e_r_s12_e5',         'r_s12',   'r_e5',     NULL,'default'),
(@pa_flow,'e_r_e5_w10d1',       'r_e5',    'r_w10d1',  NULL,'default'),

-- R11
(@pa_flow,'e_r_w10d1_e6',       'r_w10d1', 'r_e6',     NULL,'default'),
(@pa_flow,'e_r_e6_w10d2',       'r_e6',    'r_w10d2',  NULL,'default'),

-- R12
(@pa_flow,'e_r_w10d2_e7',       'r_w10d2', 'r_e7',     NULL,'default'),
(@pa_flow,'e_r_e7_w15d1',       'r_e7',    'r_w15d1',  NULL,'default'),

-- R13
(@pa_flow,'e_r_w15d1_e8',       'r_w15d1', 'r_e8',     NULL,'default'),
(@pa_flow,'e_r_e8_w10d3',       'r_e8',    'r_w10d3',  NULL,'default'),

-- R14
(@pa_flow,'e_r_w10d3_e9',       'r_w10d3', 'r_e9',     NULL,'default'),
(@pa_flow,'e_r_e9_w15d2',       'r_e9',    'r_w15d2',  NULL,'default'),

-- R15 (back-to-back)
(@pa_flow,'e_r_w15d2_e10',      'r_w15d2', 'r_e10',    NULL,'default'),
(@pa_flow,'e_r_e10_e11',        'r_e10',   'r_e11',    NULL,'default'),
(@pa_flow,'e_r_e11_end',        'r_e11',   'r_end',    NULL,'default');

-- ============================================================
-- PART 5 — Audit log
-- ============================================================
INSERT INTO `audit_logs` (
  `tenant_id`,`user_id`,`broker_id`,`actor_type`,`action`,
  `entity_type`,`entity_id`,`changes`,`status`,`created_at`
) VALUES (
  1, NULL, NULL, 'user', 'schema_migration',
  'reminder_flows', NULL,
  '{"migration":"20260312_170000_seed_preapproved_reminder_flow","description":"Created Preapproved reminder flow with 19 templates, 2 branches (Purchase/Refi/Default→Purchase), pure time-based drip — 12 SMS + 11 Email over ~88 days per branch, no response gates"}',
  'success', NOW()
);
