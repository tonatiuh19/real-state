-- ============================================================================
-- Migration: 20260512_120000_seed_waiting_for_1st_deal_prospect_flow.sql
-- Purpose:   (1) Add prospect_id column to reminder_flow_executions so
--                realtor-prospect executions can be linked without hijacking
--                the client FK.
--            (2) Seed a "Waiting For 1st Deal" reminder flow for the
--                realtor_prospecting category, matching the no-answer
--                follow-up cadence shown in the GHL workflow image:
--                  trigger → notify broker (create/update opportunity)
--                          → wait 2 days
--                          → notify broker (manual call reminder)
--                          → end
--
-- Compatible with TiDB Cloud Serverless (MySQL 8.0).
-- ============================================================================

-- ── PART 1: Schema – add prospect_id to executions ───────────────────────────

ALTER TABLE `reminder_flow_executions`
  ADD COLUMN `prospect_id` int DEFAULT NULL
    COMMENT 'realtor_prospects.id — set for realtor_prospecting flows; NULL for loan flows'
  AFTER `loan_application_id`;

ALTER TABLE `reminder_flow_executions`
  ADD KEY `idx_executions_prospect` (`prospect_id`);

ALTER TABLE `reminder_flow_executions`
  ADD CONSTRAINT `fk_executions_prospect`
    FOREIGN KEY (`prospect_id`) REFERENCES `realtor_prospects` (`id`)
    ON DELETE CASCADE;

-- ── PART 2: Flow seed ─────────────────────────────────────────────────────────

INSERT INTO `reminder_flows`
  (tenant_id, name, description, trigger_event, trigger_delay_days,
   is_active, apply_to_all_loans, loan_type_filter, flow_category,
   created_by_broker_id)
VALUES (
  1,
  'Waiting For 1st Deal — Realtor Nurture',
  'Fires when a realtor prospect is moved to the "Waiting For 1st Deal" pipeline stage. Immediately notifies the owner broker to create/update the opportunity, then sends a 2-day manual-call reminder. Mirrors the GHL no-answer follow-up cadence for Realtor contacts tagged "realtor prospecting".',
  'prospect_waiting_for_1st_deal',
  0,      -- trigger immediately on stage change
  1,      -- is_active
  0,      -- apply_to_all_loans (N/A for prospect flows)
  'all',  -- loan_type_filter (N/A)
  'realtor_prospecting',
  1       -- created_by_broker_id (superadmin)
);

SET @flow_id = LAST_INSERT_ID();

-- ── Steps ────────────────────────────────────────────────────────────────────

INSERT INTO `reminder_flow_steps`
  (flow_id, step_key, step_type, label, description, config, position_x, position_y)
VALUES
  -- 1. Trigger
  (@flow_id,
   'trigger',
   'trigger',
   'Prospect → Waiting For 1st Deal',
   'Fires when a realtor prospect is dragged into the Waiting For 1st Deal stage.',
   NULL,
   400, 50),

  -- 2. Immediate broker notification: create / update opportunity
  (@flow_id,
   'notif_opportunity',
   'send_notification',
   'Notify Broker — Create/Update Opportunity',
   'Alerts the owner broker to log or update the opportunity in the CRM.',
   JSON_OBJECT(
     'subject',     '🏡 {{contact_name}} — Create or Update Opportunity',
     'message',     '{{contact_name}} ({{opportunity_name}}) just moved to Waiting For 1st Deal. Log or update the opportunity in your CRM and plan your outreach strategy.',
     'notify_broker', TRUE,
     'action_url',  '/realtor-prospecting'
   ),
   400, 200),

  -- 3. Wait 2 days (mirrors "2 Days" wait in GHL workflow)
  (@flow_id,
   'wait_2d',
   'wait',
   'Wait — 2 Days',
   'Hold for 2 days before sending the manual-call reminder.',
   JSON_OBJECT('delay_days', 2),
   400, 350),

  -- 4. 2-day broker notification: manual call reminder
  (@flow_id,
   'notif_call',
   'send_notification',
   'Notify Broker — Manual Call Reminder',
   '2-day follow-up: prompts the broker to make a manual call to the realtor.',
   JSON_OBJECT(
     'subject',     '📞 Day 2 Check-In: Call {{contact_name}}',
     'message',     'It has been 2 days since {{contact_name}} ({{opportunity_name}}) entered Waiting For 1st Deal. Make a personal call to stay top-of-mind and ask about any upcoming buyer leads.',
     'notify_broker', TRUE,
     'action_url',  '/realtor-prospecting'
   ),
   400, 500),

  -- 5. End
  (@flow_id,
   'end',
   'end',
   'End',
   'Flow complete.',
   NULL,
   400, 650);

-- ── Connections ───────────────────────────────────────────────────────────────

INSERT INTO `reminder_flow_connections`
  (flow_id, edge_key, source_step_key, target_step_key, edge_type, label)
VALUES
  (@flow_id, 'e_trigger_notif',  'trigger',           'notif_opportunity', 'default', NULL),
  (@flow_id, 'e_notif_wait',     'notif_opportunity', 'wait_2d',           'default', NULL),
  (@flow_id, 'e_wait_call',      'wait_2d',           'notif_call',        'default', NULL),
  (@flow_id, 'e_call_end',       'notif_call',        'end',               'default', NULL);

-- ── Audit log ─────────────────────────────────────────────────────────────────

INSERT INTO `audit_logs`
  (tenant_id, actor_type, action, entity_type, changes, status)
VALUES (
  1,
  'user',
  'schema_migration',
  'reminder_flows',
  JSON_OBJECT(
    'migration',  '20260512_120000_seed_waiting_for_1st_deal_prospect_flow',
    'description','Added prospect_id column to reminder_flow_executions; seeded Waiting For 1st Deal realtor-prospecting reminder flow (trigger → notify broker → wait 2d → notify broker → end).'
  ),
  'success'
);
