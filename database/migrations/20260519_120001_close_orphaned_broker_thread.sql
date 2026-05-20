-- Migration: Close the orphaned conversation thread whose broker no longer exists.
--
-- Background: conv_client_930015 is associated with broker_id = 6 which was
-- removed from the system (no row in brokers with that id and status = 'active').
-- The thread is therefore invisible to every broker's inbox yet still counts
-- as 'active', triggering the data-quality warning in the smoke suite.
--
-- Fix: close the thread and detach the stale broker_id.
-- Also clear the assigned_broker_id on the associated client (id=930015 "Jane Doe")
-- so the client is not permanently orphaned in the CRM.

UPDATE conversation_threads
SET status    = 'closed',
    broker_id = NULL,
    updated_at = NOW()
WHERE tenant_id       = 1
  AND conversation_id = 'conv_client_930015'
  AND broker_id       = 6;

-- Detach the ghost broker from the client record so it can be reassigned
UPDATE clients
SET assigned_broker_id = NULL
WHERE tenant_id            = 1
  AND id                   = 930015
  AND assigned_broker_id   = 6;
