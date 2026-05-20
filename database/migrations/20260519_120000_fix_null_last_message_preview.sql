-- Migration: Backfill NULL last_message_preview for conversation threads that have communications.
--
-- Root cause: prior to the 2026-05-19 fix in upsertCommunicationAndThread,
-- SMS messages with no body text (media-only or empty) and emails whose HTML
-- body stripped to empty string left last_message_preview as NULL.
-- The API now always sets a typed fallback ("(Message)", "(Email)", "📞 Voice call").
-- This migration retroactively sets those 4 known affected threads.
--
-- Safe to re-run (COALESCE ensures already-set values are never overwritten).

UPDATE conversation_threads ct
SET ct.last_message_preview = (
  SELECT COALESCE(
    -- Prefer a real body from the most recent communication with non-empty body
    (SELECT NULLIF(TRIM(LEFT(c2.body, 200)), '')
     FROM communications c2
     WHERE c2.conversation_id = ct.conversation_id
       AND c2.tenant_id       = ct.tenant_id
       AND c2.body            IS NOT NULL
       AND c2.body            != ''
     ORDER BY c2.sent_at DESC
     LIMIT 1),
    -- Fall back to type-based label from the most recent communication
    (SELECT CASE c3.communication_type
              WHEN 'call'      THEN '📞 Voice call'
              WHEN 'email'     THEN '(Email)'
              WHEN 'whatsapp'  THEN '(Message)'
              ELSE                  '(Message)'
            END
     FROM communications c3
     WHERE c3.conversation_id = ct.conversation_id
       AND c3.tenant_id       = ct.tenant_id
     ORDER BY c3.sent_at DESC
     LIMIT 1),
    '(Message)'
  )
)
WHERE ct.tenant_id          = 1
  AND ct.last_message_preview IS NULL
  AND EXISTS (
    SELECT 1
    FROM communications c
    WHERE c.conversation_id = ct.conversation_id
      AND c.tenant_id       = ct.tenant_id
  );
