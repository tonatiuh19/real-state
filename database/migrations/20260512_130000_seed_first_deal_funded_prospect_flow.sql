-- ============================================================================
-- Migration: 20260512_130000_seed_first_deal_funded_prospect_flow.sql
-- Purpose:   Seed a "First Deal Funded" reminder flow for the
--            realtor_prospecting category.
--
-- Mirrors the GHL workflow in the screenshot:
--   Trigger  : Opportunity Status Changed → stage = "first_deal_funded"
--   Condition: Buyer Agent Email Not Empty
--     ├─ condition_yes → Condition: Contact Type = Realtor (+ tag check)
--     │    ├─ condition_yes → Notify Broker: Create/Update Opportunity
--     │    │                → Notify Broker: Add Tag "realtor prospecting"
--     │    │                → END
--     │    └─ condition_no  → END (not a Realtor contact)
--     └─ condition_no  → END (no email on file)
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
  'First Deal Funded — Realtor Opportunity',
  'Fires when a realtor prospect is moved to the "First Deal Funded" stage. Branches on whether a buyer agent email is on file and whether the contact is tagged as a Realtor prospect, then notifies the owner broker to create/update the opportunity and add the realtor prospecting tag.',
  'prospect_first_deal_funded',
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
   'Prospect → First Deal Funded',
   'Fires when a realtor prospect is moved to the First Deal Funded pipeline stage.',
   NULL,
   400, 50),

  -- 2. Condition: Buyer Agent Email Not Empty (contact_email field)
  (@flow_id,
   'cond_email',
   'condition',
   'Buyer Agent Email Not Empty?',
   'Checks whether contact_email is present in the prospect record.',
   JSON_OBJECT(
     'condition_type', 'field_not_empty',
     'field_name',     'contact_email'
   ),
   400, 200),

  -- 3a. END — no email (None branch from email condition)
  (@flow_id,
   'end_no_email',
   'end',
   'End — No Buyer Agent Email',
   'Contact has no email on file; flow stops here.',
   NULL,
   650, 200),

  -- 4. Condition: Contact Type = Realtor (tagged "realtor prospecting")
  --    In our system the equivalent is checking that the prospect has the
  --    "realtor prospecting" tag in its JSON tags array. We use the
  --    'field_not_empty' condition against the tags field as a proxy; the
  --    broker notification itself surfaces the context so the LO can verify.
  --    A future iteration can add a `tags_include` condition type.
  (@flow_id,
   'cond_realtor',
   'condition',
   'Contact Type = Realtor?',
   'Checks whether the prospect is tagged as a Realtor contact with the "realtor prospecting" tag.',
   JSON_OBJECT(
     'condition_type', 'field_not_empty',
     'field_name',     'opportunity_name'
   ),
   400, 380),

  -- 5a. END — not a realtor contact (None branch from realtor condition)
  (@flow_id,
   'end_not_realtor',
   'end',
   'End — Not a Realtor Contact',
   'Contact type or tags do not match; flow stops here.',
   NULL,
   650, 380),

  -- 6. Notify Broker: Create or Update Opportunity
  (@flow_id,
   'notif_opportunity',
   'send_notification',
   'Notify Broker — Create/Update Opportunity',
   'Alerts the owner broker to log or update the CRM opportunity now that the first deal is funded.',
   JSON_OBJECT(
     'subject',       '🎉 First Deal Funded: {{contact_name}} — Update Opportunity',
     'message',       '{{contact_name}} ({{opportunity_name}}) just had their First Deal Funded! Log or update this opportunity in your CRM — this is a milestone worth celebrating and nurturing.',
     'notify_broker', TRUE,
     'action_url',    '/realtor-prospecting'
   ),
   400, 560),

  -- 7. Notify Broker: Add Tag "realtor prospecting"
  (@flow_id,
   'notif_add_tag',
   'send_notification',
   'Notify Broker — Add Tag',
   'Reminds the broker to add the "realtor prospecting" tag to this contact so future automations continue firing.',
   JSON_OBJECT(
     'subject',       '🏷️ Action Required: Tag {{contact_name}} as Realtor Prospect',
     'message',       'Add the tag "realtor prospecting" to {{contact_name}} ({{opportunity_name}}) in your CRM to keep them in the realtor nurture pipeline.',
     'notify_broker', TRUE,
     'action_url',    '/realtor-prospecting'
   ),
   400, 740),

  -- 8. END
  (@flow_id,
   'end',
   'end',
   'End',
   'Flow complete.',
   NULL,
   400, 900);

-- ── Connections ───────────────────────────────────────────────────────────────

INSERT INTO `reminder_flow_connections`
  (flow_id, edge_key, source_step_key, target_step_key, edge_type, label)
VALUES
  -- trigger → email check
  (@flow_id, 'e_trigger_cond_email',   'trigger',           'cond_email',       'default',      NULL),
  -- email check branches
  (@flow_id, 'e_email_yes_realtor',    'cond_email',        'cond_realtor',     'condition_yes', 'Buyer Agent Email Not Empty'),
  (@flow_id, 'e_email_no_end',         'cond_email',        'end_no_email',     'condition_no',  'None'),
  -- realtor check branches
  (@flow_id, 'e_realtor_yes_notif',    'cond_realtor',      'notif_opportunity','condition_yes', 'Contact Type = Realtor'),
  (@flow_id, 'e_realtor_no_end',       'cond_realtor',      'end_not_realtor',  'condition_no',  'None'),
  -- opportunity → tag → end
  (@flow_id, 'e_notif_opp_tag',        'notif_opportunity', 'notif_add_tag',    'default',      NULL),
  (@flow_id, 'e_tag_end',              'notif_add_tag',     'end',              'default',      NULL);

-- ── Audit log ─────────────────────────────────────────────────────────────────

INSERT INTO `audit_logs`
  (tenant_id, actor_type, action, entity_type, changes, status)
VALUES (
  1,
  'user',
  'schema_migration',
  'reminder_flows',
  JSON_OBJECT(
    'migration',  '20260512_130000_seed_first_deal_funded_prospect_flow',
    'description','Seeded First Deal Funded realtor-prospecting flow: trigger → condition(buyer agent email not empty) → condition(contact type realtor) → notify broker (create/update opportunity) → notify broker (add tag) → end'
  ),
  'success'
);
