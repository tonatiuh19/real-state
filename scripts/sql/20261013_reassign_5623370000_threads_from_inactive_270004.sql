-- One-off data repair (NOT a schema migration).
-- Broker 270004 (Encore Mortgage Processing) was deactivated on 2026-10-13 and
-- the main line +15623370000 was reassigned to info@ (broker 2580002).
-- 232 threads on that line still point at inactive 270004, so they are hidden
-- from info@ under per-owner CRM visibility (mine/shared rules).
--
-- Reassigns only threads on +15623370000 owned by INACTIVE broker 270004.
-- Threads owned by active brokers (3, 120002, 90002) are left untouched.
-- Client-linked threads (3, all clients of broker 3) get the client owner's
-- scope — same rule as _executeThreadUpsert.

START TRANSACTION;

UPDATE conversation_threads ct
JOIN brokers b ON b.id = ct.broker_id AND b.tenant_id = ct.tenant_id
LEFT JOIN clients c ON c.id = ct.client_id AND c.tenant_id = ct.tenant_id
SET ct.broker_id = 2580002,
    ct.owner_client_scope_broker_id = CASE
      WHEN ct.client_id IS NULL THEN 2580002
      WHEN c.assigned_broker_id IS NOT NULL THEN c.assigned_broker_id
      ELSE ct.owner_client_scope_broker_id
    END,
    ct.updated_at = NOW()
WHERE ct.tenant_id = 1
  AND ct.inbox_number = '+15623370000'
  AND ct.broker_id = 270004
  AND b.status = 'inactive';

COMMIT;

-- Verify: expect 0
SELECT COUNT(*) AS still_on_270004
FROM conversation_threads
WHERE tenant_id = 1 AND inbox_number = '+15623370000' AND broker_id = 270004;
