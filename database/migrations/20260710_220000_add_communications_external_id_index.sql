-- Speed up O365/Twilio dedup lookups: SELECT id FROM communications
-- WHERE tenant_id = ? AND external_id = ? (was full table scan → ~336M RU/mo).
-- TiDB Cloud Serverless (MySQL 8.0 compatible).

ALTER TABLE `communications`
  ADD KEY `idx_comm_external_id` (`tenant_id`, `external_id`);
