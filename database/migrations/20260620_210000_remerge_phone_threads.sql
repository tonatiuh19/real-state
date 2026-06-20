-- Merge duplicate conv_phone_* / conv_unknown_* threads into canonical conv_client_{clientId}.
-- Root cause: legacy phone-based thread IDs (often with +1 variants) can coexist with
-- canonical client threads, causing inbound replies to appear in a separate conversation.
--
-- Safe to run multiple times:
-- - only targets threads where client_id IS NOT NULL
-- - only targets conv_phone_* / conv_unknown_* IDs that differ from conv_client_{clientId}
-- - if canonical thread already exists, references are moved and duplicate thread is removed
-- - if canonical thread does not exist, one duplicate is renamed to canonical and the rest are merged

CREATE TEMPORARY TABLE _conv_phone_dupe_ranked (
  old_thread_id INT NOT NULL,
  tenant_id INT NOT NULL,
  client_id INT NOT NULL,
  old_conv VARCHAR(100) NOT NULL,
  canonical_conv VARCHAR(100) NOT NULL,
  canonical_thread_id INT NULL,
  rn BIGINT NOT NULL,
  PRIMARY KEY (old_thread_id)
);

INSERT INTO _conv_phone_dupe_ranked
SELECT
  ct.id AS old_thread_id,
  ct.tenant_id,
  ct.client_id,
  ct.conversation_id AS old_conv,
  CONCAT('conv_client_', ct.client_id) AS canonical_conv,
  (
    SELECT c2.id
    FROM conversation_threads c2
    WHERE c2.tenant_id = ct.tenant_id
      AND c2.conversation_id = CONCAT('conv_client_', ct.client_id)
    LIMIT 1
  ) AS canonical_thread_id,
  ROW_NUMBER() OVER (
    PARTITION BY ct.tenant_id, CONCAT('conv_client_', ct.client_id)
    ORDER BY ct.last_message_at DESC, ct.id DESC
  ) AS rn
FROM conversation_threads ct
WHERE ct.client_id IS NOT NULL
  AND ct.conversation_id <> CONCAT('conv_client_', ct.client_id)
  AND (
    ct.conversation_id LIKE 'conv_phone_%'
    OR ct.conversation_id LIKE 'conv_unknown_%'
  );

CREATE TEMPORARY TABLE _conv_phone_dupe_targets (
  old_thread_id INT NOT NULL,
  tenant_id INT NOT NULL,
  client_id INT NOT NULL,
  old_conv VARCHAR(100) NOT NULL,
  canonical_conv VARCHAR(100) NOT NULL,
  canonical_thread_id INT NULL,
  rn BIGINT NOT NULL,
  target_thread_id INT NOT NULL,
  PRIMARY KEY (old_thread_id)
);

INSERT INTO _conv_phone_dupe_targets
SELECT
  r.old_thread_id,
  r.tenant_id,
  r.client_id,
  r.old_conv,
  r.canonical_conv,
  r.canonical_thread_id,
  r.rn,
  COALESCE(r.canonical_thread_id, k.old_thread_id) AS target_thread_id
FROM _conv_phone_dupe_ranked r
LEFT JOIN _conv_phone_dupe_ranked k
  ON k.tenant_id = r.tenant_id
 AND k.canonical_conv = r.canonical_conv
 AND k.rn = 1;

-- For groups where canonical does not exist, rename the keeper row to canonical first.
UPDATE conversation_threads ct
JOIN _conv_phone_dupe_targets t
  ON t.old_thread_id = ct.id
SET
  ct.conversation_id = t.canonical_conv,
  ct.updated_at = NOW()
WHERE t.canonical_thread_id IS NULL
  AND t.rn = 1;

-- Repoint references from legacy thread IDs to canonical client IDs.
UPDATE communications c
JOIN _conv_phone_dupe_targets t
  ON t.tenant_id = c.tenant_id
 AND c.conversation_id = t.old_conv
SET c.conversation_id = t.canonical_conv;

UPDATE reminder_flow_executions rfe
JOIN _conv_phone_dupe_targets t
  ON t.tenant_id = rfe.tenant_id
 AND rfe.conversation_id = t.old_conv
SET rfe.conversation_id = t.canonical_conv;

UPDATE email_drafts ed
JOIN _conv_phone_dupe_targets t
  ON t.tenant_id = ed.tenant_id
 AND ed.conversation_id = t.old_conv
SET ed.conversation_id = t.canonical_conv;

-- Merge denormalized thread attributes onto the target canonical thread.
CREATE TEMPORARY TABLE _conv_phone_dupe_merge (
  tenant_id INT NOT NULL,
  canonical_conv VARCHAR(100) NOT NULL,
  target_thread_id INT NOT NULL,
  merged_application_id INT NULL,
  merged_lead_id INT NULL,
  merged_broker_id INT NULL,
  merged_mailbox_id INT NULL,
  merged_contact_broker_id INT NULL,
  merged_client_name VARCHAR(255) NULL,
  merged_client_phone VARCHAR(20) NULL,
  merged_client_email VARCHAR(255) NULL,
  merged_inbox_number VARCHAR(20) NULL,
  merged_last_message_at DATETIME NULL,
  merged_message_count BIGINT NOT NULL,
  merged_unread_count BIGINT NOT NULL,
  merged_created_at DATETIME NULL,
  has_active TINYINT NOT NULL,
  has_archived TINYINT NOT NULL,
  PRIMARY KEY (target_thread_id)
);

INSERT INTO _conv_phone_dupe_merge
SELECT
  t.tenant_id,
  t.canonical_conv,
  t.target_thread_id,
  MAX(ct.application_id) AS merged_application_id,
  MAX(ct.lead_id) AS merged_lead_id,
  MAX(ct.broker_id) AS merged_broker_id,
  MAX(ct.mailbox_id) AS merged_mailbox_id,
  MAX(ct.contact_broker_id) AS merged_contact_broker_id,
  MAX(ct.client_name) AS merged_client_name,
  MAX(ct.client_phone) AS merged_client_phone,
  MAX(ct.client_email) AS merged_client_email,
  MAX(ct.inbox_number) AS merged_inbox_number,
  MAX(ct.last_message_at) AS merged_last_message_at,
  SUM(COALESCE(ct.message_count, 0)) AS merged_message_count,
  SUM(COALESCE(ct.unread_count, 0)) AS merged_unread_count,
  MIN(ct.created_at) AS merged_created_at,
  MAX(CASE WHEN ct.status = 'active' THEN 1 ELSE 0 END) AS has_active,
  MAX(CASE WHEN ct.archived_at IS NOT NULL THEN 1 ELSE 0 END) AS has_archived
FROM conversation_threads ct
JOIN _conv_phone_dupe_targets t
  ON t.old_thread_id = ct.id
GROUP BY t.tenant_id, t.canonical_conv, t.target_thread_id;

UPDATE conversation_threads ct
JOIN _conv_phone_dupe_merge m
  ON m.target_thread_id = ct.id
 AND m.tenant_id = ct.tenant_id
SET
  ct.application_id = COALESCE(ct.application_id, m.merged_application_id),
  ct.lead_id = COALESCE(ct.lead_id, m.merged_lead_id),
  ct.broker_id = COALESCE(ct.broker_id, m.merged_broker_id),
  ct.mailbox_id = COALESCE(ct.mailbox_id, m.merged_mailbox_id),
  ct.contact_broker_id = COALESCE(ct.contact_broker_id, m.merged_contact_broker_id),
  ct.client_name = COALESCE(ct.client_name, m.merged_client_name),
  ct.client_phone = COALESCE(ct.client_phone, m.merged_client_phone),
  ct.client_email = COALESCE(ct.client_email, m.merged_client_email),
  ct.inbox_number = COALESCE(ct.inbox_number, m.merged_inbox_number),
  ct.last_message_at = GREATEST(ct.last_message_at, m.merged_last_message_at),
  ct.message_count = GREATEST(COALESCE(ct.message_count, 0), m.merged_message_count),
  ct.unread_count = GREATEST(COALESCE(ct.unread_count, 0), m.merged_unread_count),
  ct.status = CASE
    WHEN m.has_active = 1 THEN 'active'
    ELSE ct.status
  END,
  ct.archived_at = CASE
    WHEN m.has_active = 1 THEN NULL
    WHEN m.has_archived = 1 THEN ct.archived_at
    ELSE ct.archived_at
  END,
  ct.created_at = LEAST(ct.created_at, m.merged_created_at),
  ct.normalized_client_phone = CASE
    WHEN LENGTH(REGEXP_REPLACE(COALESCE(ct.client_phone, ''), '[^0-9]', '')) >= 10
      THEN RIGHT(REGEXP_REPLACE(COALESCE(ct.client_phone, ''), '[^0-9]', ''), 10)
    ELSE ct.normalized_client_phone
  END,
  ct.updated_at = NOW();

-- Remove duplicate legacy rows (keep only target canonical thread per group).
DELETE ct
FROM conversation_threads ct
JOIN _conv_phone_dupe_targets t
  ON t.old_thread_id = ct.id
WHERE t.old_thread_id <> t.target_thread_id;

-- Recompute message_count/last_message for touched canonical threads from communications.
CREATE TEMPORARY TABLE _conv_phone_dupe_touched (
  tenant_id INT NOT NULL,
  canonical_conv VARCHAR(100) NOT NULL,
  PRIMARY KEY (tenant_id, canonical_conv)
);

INSERT INTO _conv_phone_dupe_touched
SELECT DISTINCT tenant_id, canonical_conv
FROM _conv_phone_dupe_targets;

CREATE TEMPORARY TABLE _conv_phone_dupe_comm_agg (
  tenant_id INT NOT NULL,
  conversation_id VARCHAR(100) NOT NULL,
  message_count BIGINT NOT NULL,
  last_message_at DATETIME NULL,
  PRIMARY KEY (tenant_id, conversation_id)
);

INSERT INTO _conv_phone_dupe_comm_agg
SELECT
  c.tenant_id,
  c.conversation_id,
  COUNT(*) AS message_count,
  MAX(c.created_at) AS last_message_at
FROM communications c
JOIN _conv_phone_dupe_touched t
  ON t.tenant_id = c.tenant_id
 AND t.canonical_conv = c.conversation_id
GROUP BY c.tenant_id, c.conversation_id;

UPDATE conversation_threads ct
JOIN _conv_phone_dupe_touched t
  ON t.tenant_id = ct.tenant_id
 AND t.canonical_conv = ct.conversation_id
LEFT JOIN _conv_phone_dupe_comm_agg a
  ON a.tenant_id = ct.tenant_id
 AND a.conversation_id = ct.conversation_id
SET
  ct.message_count = COALESCE(a.message_count, 0),
  ct.last_message_at = COALESCE(a.last_message_at, ct.last_message_at),
  ct.last_message_preview = COALESCE((
    SELECT LEFT(
      REGEXP_REPLACE(REGEXP_REPLACE(c2.body, '<[^>]*>', ' '), '\\s+', ' '),
      200
    )
    FROM communications c2
    WHERE c2.tenant_id = ct.tenant_id
      AND c2.conversation_id = ct.conversation_id
    ORDER BY c2.created_at DESC, c2.id DESC
    LIMIT 1
  ), ct.last_message_preview),
  ct.last_message_type = COALESCE((
    SELECT CASE
      WHEN c3.communication_type IN ('email', 'sms', 'whatsapp', 'call', 'internal_note')
        THEN c3.communication_type
      ELSE NULL
    END
    FROM communications c3
    WHERE c3.tenant_id = ct.tenant_id
      AND c3.conversation_id = ct.conversation_id
    ORDER BY c3.created_at DESC, c3.id DESC
    LIMIT 1
  ), ct.last_message_type),
  ct.normalized_client_phone = CASE
    WHEN LENGTH(REGEXP_REPLACE(COALESCE(ct.client_phone, ''), '[^0-9]', '')) >= 10
      THEN RIGHT(REGEXP_REPLACE(COALESCE(ct.client_phone, ''), '[^0-9]', ''), 10)
    ELSE ct.normalized_client_phone
  END,
  ct.updated_at = NOW();

DROP TEMPORARY TABLE IF EXISTS _conv_phone_dupe_comm_agg;
DROP TEMPORARY TABLE IF EXISTS _conv_phone_dupe_touched;
DROP TEMPORARY TABLE IF EXISTS _conv_phone_dupe_merge;
DROP TEMPORARY TABLE IF EXISTS _conv_phone_dupe_targets;
DROP TEMPORARY TABLE IF EXISTS _conv_phone_dupe_ranked;
