-- ============================================================================
-- Migration: 20260512_160000_seed_contacted_prospect_flow.sql
-- Purpose:   Seed a "Contacted" reminder flow for the
--            realtor_prospecting category.
--
-- DRAFT — not yet applied to DB.
--
-- Mirrors the GHL workflow in the screenshot:
--   Trigger  : Call Details → Call Direction "Outgoing" + Status "Completed"
--              (maps to stage = "contacted" in our pipeline)
--   Condition: Contact Type = Realtor AND Tags includes "realtor prospecting"
--     ├─ condition_yes → Notify Broker: Create/Update Opportunity
--     │                → Notify Broker: Remove from Workflow
--     │                → END
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
  'Contacted — Realtor Opportunity',
  'Fires when a realtor prospect is moved to the "Contacted" stage (outgoing call completed). Checks whether the contact is a Realtor prospect, then notifies the owner broker to create/update the CRM opportunity and remove the prospect from the workflow.',
  'prospect_contacted',
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
   'Prospect → Contacted',
   'Fires when a realtor prospect is moved to the Contacted stage (outgoing call completed).',
   NULL,
   400, 50),

  -- 2. Condition: Contact Type = Realtor AND has "realtor prospecting" tag
  (@flow_id,
   'cond_realtor',
   'condition',
   'Contact Type = Realtor?',
   'Checks whether the prospect is a Realtor contact with the "realtor prospecting" tag via opportunity_name proxy.',
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
   'Alerts the owner broker to log or update the CRM opportunity now that contact has been made.',
   JSON_OBJECT(
     'subject',       '📞 Contacted: {{contact_name}} — Update Opportunity',
     'message',       'You completed an outgoing call with {{contact_name}} ({{opportunity_name}})! Log or update this opportunity in your CRM to keep the realtor nurture pipeline moving.',
     'notify_broker', TRUE,
     'action_url',    '/realtor-prospecting'
   ),
   400, 400),

  -- 5. Notify Broker: Remove from Workflow
  (@flow_id,
   'notif_remove_workflow',
   'send_notification',
   'Notify Broker — Remove from Workflow',
   'Reminds the broker to remove the prospect from the current workflow now that contact has been established.',
   JSON_OBJECT(
     'subject',       '🔄 Remove {{contact_name}} from Workflow',
     'message',       '{{contact_name}} ({{opportunity_name}}) has been contacted. Remove them from this workflow in your CRM and transition to the next stage of the realtor nurture sequence.',
     'notify_broker', TRUE,
     'action_url',    '/realtor-prospecting'
   ),
   400, 580),

  -- 6. END
  (@flow_id,
   'end',
   'end',
   'End',
   'Flow complete.',
   NULL,
   400, 740);

-- ── Connections ───────────────────────────────────────────────────────────────

INSERT INTO `reminder_flow_connections`
  (flow_id, edge_key, source_step_key, target_step_key, edge_type, label)
VALUES
  -- trigger → contact type check
  (@flow_id, 'e_trigger_cond_realtor',   'trigger',             'cond_realtor',        'default',       NULL),
  -- realtor check branches
  (@flow_id, 'e_realtor_yes_notif',      'cond_realtor',        'notif_opportunity',   'condition_yes', 'Contact Type = Realtor'),
  (@flow_id, 'e_realtor_no_end',         'cond_realtor',        'end_not_realtor',     'condition_no',  'None'),
  -- opportunity → remove workflow → end
  (@flow_id, 'e_opportunity_remove',     'notif_opportunity',   'notif_remove_workflow','default',       NULL),
  (@flow_id, 'e_remove_end',             'notif_remove_workflow','end',                 'default',       NULL);

-- ── Audit log ─────────────────────────────────────────────────────────────────

INSERT INTO `audit_logs`
  (tenant_id, actor_type, action, entity_type, changes, status)
VALUES (
  1,
  'user',
  'schema_migration',
  'reminder_flows',
  JSON_OBJECT(
    'migration',  '20260512_160000_seed_contacted_prospect_flow',
    'description','Seeded Contacted realtor-prospecting flow: trigger → condition(contact type realtor) → notify broker (create/update opportunity) → notify broker (remove from workflow) → end'
  ),
  'success'
);
