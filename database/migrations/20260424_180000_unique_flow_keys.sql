-- Migration: enforce uniqueness of step_key and edge_key within a reminder flow.
-- Without this, the engine could (in principle) hit two rows with the same key
-- in `processFlowExecution`, leading to non-deterministic step lookup.
--
-- Verified safe: SELECT flow_id, step_key, COUNT(*) ... HAVING COUNT(*)>1
-- returned 0 rows on 2026-04-24 prior to applying.

ALTER TABLE `reminder_flow_steps`
  ADD UNIQUE KEY `uniq_flow_step_key` (`flow_id`, `step_key`);

ALTER TABLE `reminder_flow_connections`
  ADD UNIQUE KEY `uniq_flow_edge_key` (`flow_id`, `edge_key`);
