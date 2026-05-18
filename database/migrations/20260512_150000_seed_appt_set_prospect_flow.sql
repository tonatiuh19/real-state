-- ============================================================================
-- Migration: 20260512_150000_seed_appt_set_prospect_flow.sql
-- Purpose:   Seed an "Appt Set" reminder flow for the
--            realtor_prospecting category.
--
-- Mirrors the GHL workflow in the screenshot:
--   Trigger  : Appointment Status → Event Type = "Normal"
--              AND Has Tag includes "realtor prospecting"
--   Condition: Contact Type = Realtor AND Tags includes "realtor prospecting"
--     ├─ condition_yes → Notify Broker: Create/Update Opportunity → END
--     └─ condition_no  → END (not a Realtor contact)
--
-- Compatible with TiDB Cloud Serverless (MySQL 8.0).
-- ============================================================================

-- ── Flow ─────────────────────────────────────────────────────────────────────

INSERT INTO `reminder_flows`
  (tenant_id, name, description, trigger_event, trigger_delay_days,
   is_active, apply_to_all_loans, loan_type_filter, flow_category,
   created_by_broker_id)
VALUES (
  1,
  'Appt Set — Realtor Opportunity',
  'Fires when a realtor prospect is moved to the "Appt Set" stage. Checks whether the contact is a Realtor prospect, then notifies the owner broker to create or update the CRM opportunity.',
  'prospect_appt_set',
  0,
  1,
  0,
  'all',
  'realtor_prospecting',
  1
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
   'Prospect → Appt Set',
   'Fires when a realtor prospect is moved to the Appt Set pipeline stage.',
   NULL,
   400, 50),

  -- 2. Condition: Contact Type = Realtor (AND has realtor prospecting tag)
  --    Using field_not_empty on opportunity_name as the Realtor proxy —
  --    same pattern as first/second deal funded flows.
  (@flow_id,
   'cond_realtor',
   'condition',
   'Contact Type = Realtor?',
   'Checks whether the prospect is a Realtor contact with the "realtor prospecting" tag via the opportunity_name proxy.',
   JSON_OBJECT(
     'condition_type', 'field_not_empty',
     'field_name',     'opportunity_name'
   ),
   400, 220),

  -- 3a. END — not a Realtor contact (None branch)
  (@flow_id,
   'end_not_realtor',
   'end',
   'End — Not a Realtor Contact',
   'Contact type does not match; flow stops here.',
   NULL,
   660, 220),

  -- 4. Notify Broker: Create or Update Opportunity
  (@flow_id,
   'notif_opportunity',
   'send_notification',
   'Notify Broker — Create/Update Opportunity',
   'Alerts the owner broker to log or update the CRM opportunity now that an appointment has been set.',
   JSON_OBJECT(
     'subject',       '📅 Appt Set: {{contact_name}} — Update Opportunity',
     'message',       '{{contact_name}} ({{opportunity_name}}) has an appointment set! Log or update this opportunity in your CRM to track the progress and keep the realtor nurture pipeline active.',
     'notify_broker', TRUE,
     'action_url',    '/realtor-prospecting'
   ),
   400, 400),

  -- 5. END
  (@flow_id,
   'end',
   'end',
   'End',
   'Flow complete.',
   NULL,
   400, 560);

-- ── Connections ───────────────────────────────────────────────────────────────

INSERT INTO `reminder_flow_connections`
  (flow_id, edge_key, source_step_key, target_step_key, edge_type, label)
VALUES
  -- trigger → contact type check
  (@flow_id, 'e_trigger_cond_realtor',  'trigger',          'cond_realtor',      'default',       NULL),
  -- realtor check branches
  (@flow_id, 'e_realtor_yes_notif',     'cond_realtor',     'notif_opportunity',  'condition_yes', 'Contact Type = Realtor'),
  (@flow_id, 'e_realtor_no_end',        'cond_realtor',     'end_not_realtor',    'condition_no',  'None'),
  -- opportunity → end
  (@flow_id, 'e_opportunity_end',       'notif_opportunity','end',                'default',       NULL);

-- ── Audit log ─────────────────────────────────────────────────────────────────

INSERT INTO `audit_logs`
  (tenant_id, actor_type, action, entity_type, changes, status)
VALUES (
  1,
  'user',
  'schema_migration',
  'reminder_flows',
  JSON_OBJECT(
    'migration',  '20260512_150000_seed_appt_set_prospect_flow',
    'description','Seeded Appt Set realtor-prospecting flow: trigger → condition(contact type realtor) → notify broker (create/update opportunity) → end'
  ),
  'success'
);
