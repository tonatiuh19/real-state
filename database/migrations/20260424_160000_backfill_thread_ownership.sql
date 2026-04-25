-- Back-fill conversation_threads.broker_id based on CURRENT number ownership.
--
-- Any thread whose inbox_number matches a broker's twilio_caller_id (personal
-- line) should be owned by that broker — regardless of when the thread was
-- first created or who it was originally assigned to. This corrects rows where
-- the thread was created before a number was assigned to a broker, or where
-- the number has since been reassigned to a different broker.
--
-- Safe to re-run: the WHERE clause only updates rows that don't already match.

UPDATE conversation_threads ct
JOIN brokers b
  ON b.tenant_id = ct.tenant_id
 AND b.twilio_caller_id IS NOT NULL
 AND b.twilio_caller_id <> ''
 AND b.twilio_caller_id = ct.inbox_number
 AND b.status = 'active'
SET ct.broker_id = b.id,
    ct.updated_at = NOW()
WHERE ct.tenant_id IS NOT NULL
  AND (ct.broker_id IS NULL OR ct.broker_id <> b.id);

-- Report (logged by mysql CLI as result summary)
SELECT
  COUNT(*) AS total_threads,
  SUM(CASE WHEN broker_id IS NULL THEN 1 ELSE 0 END) AS still_shared,
  SUM(CASE WHEN broker_id IS NOT NULL THEN 1 ELSE 0 END) AS owned_by_broker
FROM conversation_threads;
