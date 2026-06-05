-- Tenant billing usage snapshot (last 30 days rolling UTC).
-- @see docs/BILLING_AND_QUOTA_PLAN.md §15.8
-- Run: scripts/refresh-billing-snapshot.ts (or mysql CLI with @tid set)

SET @tid = 1;
SET @since = DATE_SUB(UTC_TIMESTAMP(), INTERVAL 30 DAY);
SET @until = UTC_TIMESTAMP();

SELECT 'period_start' AS k, DATE_FORMAT(@since, '%Y-%m-%d') AS v
UNION ALL SELECT 'period_end', DATE_FORMAT(@until, '%Y-%m-%d');

-- SMS segments: convo (communications not linked to broadcast Twilio SID)
SELECT 'convo_sms_segments' AS k, COALESCE(SUM(
  CEIL(GREATEST(CHAR_LENGTH(COALESCE(c.body,'')), 1) / 160.0)
), 0) AS v
FROM communications c
WHERE c.tenant_id = @tid
  AND c.communication_type = 'sms'
  AND c.direction = 'outbound'
  AND COALESCE(c.sent_at, c.created_at) >= @since
  AND NOT EXISTS (
    SELECT 1 FROM realtor_broadcast_recipients r
    WHERE r.tenant_id = @tid
      AND r.sms_ext_id IS NOT NULL
      AND r.sms_ext_id = c.external_id
  );

-- Broadcast SMS segments: recipients × segments per blast body
SELECT 'broadcast_sms_segments' AS k, COALESCE(SUM(
  CEIL(GREATEST(CHAR_LENGTH(COALESCE(rb.body_sms,'')), 1) / 160.0)
), 0) AS v
FROM realtor_broadcast_recipients r
JOIN realtor_broadcasts rb ON rb.id = r.broadcast_id
WHERE r.tenant_id = @tid
  AND r.sms_status IN ('sent', 'delivered')
  AND r.sent_at >= @since;

SELECT 'broadcast_sms_recipients' AS k, COUNT(*) AS v
FROM realtor_broadcast_recipients
WHERE tenant_id = @tid
  AND sms_status IN ('sent', 'delivered')
  AND sent_at >= @since;

SELECT 'email_total' AS k, COUNT(*) AS v
FROM communications
WHERE tenant_id = @tid
  AND communication_type = 'email'
  AND direction = 'outbound'
  AND COALESCE(sent_at, created_at) >= @since;

SELECT 'broadcast_email' AS k, COUNT(*) AS v
FROM realtor_broadcast_recipients
WHERE tenant_id = @tid
  AND email_status = 'sent'
  AND sent_at >= @since;

SELECT 'calls' AS k, COUNT(*) AS v
FROM communications
WHERE tenant_id = @tid
  AND communication_type = 'call'
  AND COALESCE(sent_at, created_at) >= @since;

SELECT 'voice_min_recorded' AS k, ROUND(COALESCE(SUM(recording_duration), 0) / 60, 2) AS v
FROM communications
WHERE tenant_id = @tid
  AND communication_type = 'call'
  AND COALESCE(sent_at, created_at) >= @since;

SELECT 'scheduler_bookings' AS k, COUNT(*) AS v
FROM scheduled_meetings
WHERE tenant_id = @tid
  AND created_at >= @since;

SELECT 'mortgi_tokens' AS k, COALESCE(SUM(tokens_used), 0) AS v
FROM ai_chat_sessions
WHERE tenant_id = @tid
  AND updated_at >= @since;

SELECT 'mortgi_sessions' AS k, COUNT(*) AS v
FROM ai_chat_sessions
WHERE tenant_id = @tid
  AND created_at >= @since;

SELECT 'mortgi_messages' AS k, COALESCE(SUM(FLOOR(JSON_LENGTH(messages) / 2)), 0) AS v
FROM ai_chat_sessions
WHERE tenant_id = @tid
  AND updated_at >= @since;
