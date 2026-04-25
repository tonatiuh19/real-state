-- Migration: per-broker flow restriction + step-level trace logging
--
-- WHY:
--   * `restricted_to_broker_id`: lets a flow be hidden from other brokers in
--     the admin UI AND prevents the engine from triggering it for loans whose
--     `broker_user_id` does not match. NULL = visible to all (legacy default).
--   * `enable_trace_logging`: opt-in flag (per-flow) that makes the engine
--     write rows into `reminder_flow_step_logs` for every step transition.
--     Always-on logging would balloon the table for production drips, so we
--     gate behind a flow-level switch.
--   * `reminder_flow_step_logs`: full lifecycle trace (start, complete, fail,
--     skip, timeout) including channel, recipient, external_id (Twilio SID
--     or email message-id), payload snapshot, and error message.

-- ── reminder_flows additions ──────────────────────────────────────────────
-- Split into separate statements: TiDB requires the column to exist before
-- referencing it in an index/FK in a subsequent ALTER batch.
ALTER TABLE `reminder_flows`
  ADD COLUMN `restricted_to_broker_id` INT NULL DEFAULT NULL
    COMMENT 'NULL = visible to all brokers in tenant. Otherwise only this broker can see/run the flow.';

ALTER TABLE `reminder_flows`
  ADD COLUMN `enable_trace_logging` TINYINT(1) NOT NULL DEFAULT 0
    COMMENT 'When 1, engine writes per-step rows into reminder_flow_step_logs.';

ALTER TABLE `reminder_flows`
  ADD KEY `idx_reminder_flows_restricted_broker` (`restricted_to_broker_id`);

ALTER TABLE `reminder_flows`
  ADD CONSTRAINT `fk_reminder_flows_restricted_broker`
    FOREIGN KEY (`restricted_to_broker_id`) REFERENCES `brokers` (`id`) ON DELETE SET NULL;

-- ── reminder_flow_step_logs ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `reminder_flow_step_logs` (
  `id`             BIGINT      NOT NULL AUTO_INCREMENT,
  `tenant_id`      INT         NOT NULL DEFAULT 1,
  `flow_id`        INT         NOT NULL,
  `execution_id`   INT         NOT NULL,
  `step_key`       VARCHAR(100) NOT NULL,
  `step_type`      ENUM(
    'trigger','wait','send_notification','send_email','send_sms',
    'send_whatsapp','condition','branch','wait_for_response',
    'wait_until_date','end'
  ) NOT NULL,
  -- Lifecycle phase: started → (succeeded | failed | skipped | timeout)
  `event`          ENUM('started','succeeded','failed','skipped','timeout','cancelled') NOT NULL,
  `channel`        ENUM('sms','email','whatsapp','notification','none') NOT NULL DEFAULT 'none',
  `recipient`      VARCHAR(255) NULL COMMENT 'phone or email used at send time',
  `external_id`    VARCHAR(255) NULL COMMENT 'twilio SID, email message-id, etc.',
  `delivery_status` VARCHAR(50)  NULL COMMENT 'queued/sent/delivered/failed/undelivered',
  `payload`        JSON         NULL COMMENT 'snapshot: rendered message, subject, edge taken, etc.',
  `error_message`  TEXT         NULL,
  `duration_ms`    INT          NULL COMMENT 'wall-clock time for the step',
  `started_at`     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `completed_at`   DATETIME     NULL,
  `created_at`     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_flow_step_logs_flow`      (`flow_id`),
  KEY `idx_flow_step_logs_execution` (`execution_id`),
  KEY `idx_flow_step_logs_tenant`    (`tenant_id`),
  KEY `idx_flow_step_logs_started`   (`started_at`),
  CONSTRAINT `fk_flow_step_logs_flow`
    FOREIGN KEY (`flow_id`) REFERENCES `reminder_flows` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_flow_step_logs_execution`
    FOREIGN KEY (`execution_id`) REFERENCES `reminder_flow_executions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
