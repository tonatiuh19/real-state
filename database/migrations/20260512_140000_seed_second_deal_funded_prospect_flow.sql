-- ============================================================================
-- Migration: 20260512_140000_seed_second_deal_funded_prospect_flow.sql
-- Purpose:   Seed a "2nd Deal Funded" reminder flow for the
--            realtor_prospecting category.
--
-- Mirrors the GHL workflow in the screenshot:
--   Trigger  : Opportunity Status Changed → stage = "second_deal_funded"
--   Condition: Buyer Agent Email Not Empty
--     ├─ condition_yes → Condition: Contact Type = Realtor
--     │    ├─ condition_yes → Notify Broker: Add Tag "realtor prospecting"
--     │    │                → Notify Broker: Remove Tag (cleanup old tags)
--     │    │                → Notify Broker: Create/Update Opportunity
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
  '2nd Deal Funded — Realtor Nurture',
  'Fires when a realtor prospect is moved to the "2nd Deal Funded" stage. Branches on buyer agent email and contact type, then notifies the owner broker to add the realtor tag, remove stale tags, and create/update the CRM opportunity.',
  'prospect_second_deal_funded',
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
   'Prospect → 2nd Deal Funded',
   'Fires when a realtor prospect is moved to the 2nd Deal Funded pipeline stage.',
   NULL,
   400, 50),

  -- 2. Condition: Buyer Agent Email Not Empty
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

  -- 3a. END — no email (None branch)
  (@flow_id,
   'end_no_email',
   'end',
   'End — No Buyer Agent Email',
   'Contact has no email on file; flow stops here.',
   NULL,
   680, 200),

  -- 4. Condition: Contact Type = Realtor
  (@flow_id,
   'cond_realtor',
   'condition',
   'Contact Type = Realtor?',
   'Checks whether the prospect is tagged as a Realtor contact via opportunity_name proxy.',
   JSON_OBJECT(
     'condition_type', 'field_not_empty',
     'field_name',     'opportunity_name'
   ),
   400, 380),

  -- 5a. END — not a realtor contact (None branch)
  (@flow_id,
   'end_not_realtor',
   'end',
   'End — Not a Realtor Contact',
   'Contact type or tags do not match; flow stops here.',
   NULL,
   680, 380),

  -- 6. Notify Broker: Add Tag "realtor prospecting"
  (@flow_id,
   'notif_add_tag',
   'send_notification',
   'Notify Broker — Add Tag',
   'Reminds the broker to add the "realtor prospecting" tag to this contact in the CRM.',
   JSON_OBJECT(
     'subject',       '🏷️ 2nd Deal Funded: Tag {{contact_name}} as Realtor Prospect',
     'message',       '{{contact_name}} ({{opportunity_name}}) just had their 2nd Deal Funded! Add the "realtor prospecting" tag in your CRM to keep them in the nurture pipeline.',
     'notify_broker', TRUE,
     'action_url',    '/realtor-prospecting'
   ),
   400, 560),

  -- 7. Notify Broker: Remove stale tag
  (@flow_id,
   'notif_remove_tag',
   'send_notification',
   'Notify Broker — Remove Stale Tag',
   'Reminds the broker to remove any interim/holding tags now that the 2nd deal is funded.',
   JSON_OBJECT(
     'subject',       '🔖 Clean Up Tags for {{contact_name}}',
     'message',       'Now that {{contact_name}} ({{opportunity_name}}) has funded a 2nd deal, remove any stale interim tags in your CRM so automations stay clean.',
     'notify_broker', TRUE,
     'action_url',    '/realtor-prospecting'
   ),
   400, 740),

  -- 8. Notify Broker: Create or Update Opportunity
  (@flow_id,
   'notif_opportunity',
   'send_notification',
   'Notify Broker — Create/Update Opportunity',
   'Alerts the owner broker to log or update the CRM opportunity for the 2nd funded deal.',
   JSON_OBJECT(
     'subject',       '🎉 2nd Deal Funded: {{contact_name}} — Update Opportunity',
     'message',       '{{contact_name}} ({{opportunity_name}}) has funded their 2nd deal! Log or update this opportunity in your CRM — this realtor is an active referral partner worth nurturing.',
     'notify_broker', TRUE,
     'action_url',    '/realtor-prospecting'
   ),
   400, 920),

  -- 9. END
  (@flow_id,
   'end',
   'end',
   'End',
   'Flow complete.',
   NULL,
   400, 1080);

-- ── Connections ───────────────────────────────────────────────────────────────

INSERT INTO `reminder_flow_connections`
  (flow_id, edge_key, source_step_key, target_step_key, edge_type, label)
VALUES
  -- trigger → email check
  (@flow_id, 'e_trigger_cond_email', 'trigger',        'cond_email',        'default',       NULL),
  -- email check branches
  (@flow_id, 'e_email_yes_realtor',  'cond_email',     'cond_realtor',      'condition_yes', 'Buyer Agent Email Not Empty'),
  (@flow_id, 'e_email_no_end',       'cond_email',     'end_no_email',      'condition_no',  'None'),
  -- realtor check branches
  (@flow_id, 'e_realtor_yes_tag',    'cond_realtor',   'notif_add_tag',     'condition_yes', 'Contact Type = Realtor'),
  (@flow_id, 'e_realtor_no_end',     'cond_realtor',   'end_not_realtor',   'condition_no',  'None'),
  -- add tag → remove tag → opportunity → end
  (@flow_id, 'e_add_tag_remove',     'notif_add_tag',  'notif_remove_tag',  'default',       NULL),
  (@flow_id, 'e_remove_opportunity', 'notif_remove_tag','notif_opportunity', 'default',       NULL),
  (@flow_id, 'e_opportunity_end',    'notif_opportunity','end',              'default',       NULL);

-- ── Audit log ─────────────────────────────────────────────────────────────────

INSERT INTO `audit_logs`
  (tenant_id, actor_type, action, entity_type, changes, status)
VALUES (
  1,
  'user',
  'schema_migration',
  'reminder_flows',
  JSON_OBJECT(
    'migration',  '20260512_140000_seed_second_deal_funded_prospect_flow',
    'description','Seeded 2nd Deal Funded realtor-prospecting flow: trigger → condition(buyer agent email) → condition(contact type realtor) → notify broker (add tag) → notify broker (remove stale tag) → notify broker (create/update opportunity) → end'
  ),
  'success'
);
