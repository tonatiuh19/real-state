/**
 * Shared helpers for Application Received reminder flow backfill and smoke tests.
 * Mirrors api/index.ts triggerReminderFlows() without importing the full server.
 */
import type { Connection, RowDataPacket, ResultSetHeader } from "mysql2/promise";

export const APPLICATION_RECEIVED_FLOW_ID = 3;
export const NUDGE_FROM_STATUS = "app_sent";
export const NUDGE_TO_STATUS = "application_received";

export type GapLoanRow = {
  id: number;
  application_number: string;
  submitted_at: Date | string | null;
  client_source: string | null;
  broker_user_id: number | null;
  client_name: string;
  flow3_execs: number;
  comm_count: number;
};

export async function fetchGapLoans(
  conn: Connection,
  tenantId: number,
): Promise<GapLoanRow[]> {
  const [rows] = await conn.query<RowDataPacket[]>(
    `SELECT la.id, la.application_number, la.submitted_at,
            c.source AS client_source, la.broker_user_id,
            CONCAT(c.first_name, ' ', c.last_name) AS client_name,
            (SELECT COUNT(*) FROM reminder_flow_executions rfe
             WHERE rfe.loan_application_id = la.id AND rfe.flow_id = ?) AS flow3_execs,
            (SELECT COUNT(*) FROM communications comm
             WHERE comm.application_id = la.id) AS comm_count
     FROM loan_applications la
     INNER JOIN clients c ON c.id = la.client_user_id
     WHERE la.tenant_id = ?
       AND la.status = ?
       AND NOT EXISTS (
         SELECT 1 FROM reminder_flow_executions rfe
         WHERE rfe.loan_application_id = la.id AND rfe.flow_id = ?
       )
     ORDER BY la.submitted_at DESC`,
    [APPLICATION_RECEIVED_FLOW_ID, tenantId, NUDGE_TO_STATUS, APPLICATION_RECEIVED_FLOW_ID],
  );
  return rows as GapLoanRow[];
}

export async function isFlowActive(
  conn: Connection,
  flowId: number,
  tenantId: number,
): Promise<boolean> {
  const [rows] = await conn.query<RowDataPacket[]>(
    `SELECT is_active FROM reminder_flows WHERE id = ? AND tenant_id = ?`,
    [flowId, tenantId],
  );
  return rows.length > 0 && Number(rows[0].is_active) === 1;
}

/**
 * Mirrors api/index.ts triggerReminderFlows for application_received only.
 */
export async function triggerApplicationReceivedFlows(
  conn: Connection,
  loanId: number,
  tenantId: number,
  opts?: { flowActiveOverride?: boolean },
): Promise<{ triggeredCount: number; flowIds: number[] }> {
  const [loanRows] = await conn.query<RowDataPacket[]>(
    `SELECT la.id, la.application_number, la.loan_type, la.status,
            la.actual_close_date, la.estimated_close_date,
            c.id AS client_id, c.first_name, c.last_name, c.email, c.phone,
            la.broker_user_id AS broker_id,
            b.first_name AS broker_first_name, b.last_name AS broker_last_name
     FROM loan_applications la
     INNER JOIN clients c ON la.client_user_id = c.id
     LEFT JOIN brokers b ON la.broker_user_id = b.id
     WHERE la.id = ? AND la.tenant_id = ?`,
    [loanId, tenantId],
  );
  if (!loanRows.length) return { triggeredCount: 0, flowIds: [] };

  const loan = loanRows[0];
  const loanType: string = loan.loan_type || "purchase";

  const flowActive =
    opts?.flowActiveOverride ??
    (await isFlowActive(conn, APPLICATION_RECEIVED_FLOW_ID, tenantId));
  if (!flowActive) return { triggeredCount: 0, flowIds: [] };

  const [flows] = await conn.query<RowDataPacket[]>(
    `SELECT rf.id, rf.trigger_delay_days, rf.loan_type_filter
     FROM reminder_flows rf
     WHERE rf.tenant_id = ?
       AND rf.trigger_event = ?
       AND rf.is_active = 1
       AND rf.flow_category = 'loan'
       AND (rf.loan_type_filter = 'all' OR rf.loan_type_filter = ?)
       AND (rf.restricted_to_broker_id IS NULL OR rf.restricted_to_broker_id = ?)`,
    [tenantId, NUDGE_TO_STATUS, loanType, loan.broker_id ?? -1],
  );
  if (!flows.length) return { triggeredCount: 0, flowIds: [] };

  const brokerName = loan.broker_first_name
    ? `${loan.broker_first_name} ${loan.broker_last_name}`.trim()
    : "Your Loan Officer";

  const contextData = JSON.stringify({
    loan_type: loanType,
    loan_status: loan.status,
    application_number: loan.application_number,
    client_id: loan.client_id,
    client_name: `${loan.first_name} ${loan.last_name}`,
    client_email: loan.email,
    client_phone: loan.phone,
    loan_id: loanId,
    actual_close_date: loan.actual_close_date ?? null,
    estimated_close_date: loan.estimated_close_date ?? null,
    broker_name: brokerName,
    broker_id: loan.broker_id ?? null,
  });

  const flowIds: number[] = [];
  let triggeredCount = 0;

  for (const flow of flows) {
    const [existing] = await conn.query<RowDataPacket[]>(
      `SELECT id FROM reminder_flow_executions
       WHERE tenant_id = ? AND flow_id = ?
         AND loan_application_id = ? AND client_id = ?
         AND status = 'active'
       LIMIT 1`,
      [tenantId, flow.id, loanId, loan.client_id],
    );
    if (existing.length > 0) continue;

    const [triggerSteps] = await conn.query<RowDataPacket[]>(
      `SELECT step_key FROM reminder_flow_steps
       WHERE flow_id = ? AND step_type = 'trigger' LIMIT 1`,
      [flow.id],
    );
    const triggerKey = triggerSteps[0]?.step_key ?? null;
    const nextExecAt = new Date();
    nextExecAt.setDate(nextExecAt.getDate() + (flow.trigger_delay_days || 0));
    const execConvId = `conv_client_${loan.client_id}`;

    await conn.query(
      `INSERT INTO reminder_flow_executions
         (tenant_id, flow_id, loan_application_id, client_id,
          conversation_id, current_step_key, status, next_execution_at,
          completed_steps, context_data, last_step_started_at, started_at)
       VALUES (?, ?, ?, ?, ?, ?, 'active', ?, '[]', ?, NOW(), NOW())`,
      [
        tenantId,
        flow.id,
        loanId,
        loan.client_id,
        execConvId,
        triggerKey,
        nextExecAt,
        contextData,
      ],
    );
    flowIds.push(flow.id);
    triggeredCount++;
  }

  return { triggeredCount, flowIds };
}

export async function recordStatusChange(
  conn: Connection,
  tenantId: number,
  loanId: number,
  fromStatus: string,
  toStatus: string,
  brokerId: number,
  notes: string | null = null,
): Promise<void> {
  await conn.query(
    `INSERT INTO application_status_history
       (tenant_id, application_id, from_status, to_status, changed_by_broker_id, notes)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [tenantId, loanId, fromStatus, toStatus, brokerId, notes],
  );
}

/**
 * Status nudge: application_received → app_sent → application_received,
 * then trigger Application Received reminder flow(s).
 */
export async function statusNudgeAndTriggerFlow(
  conn: Connection,
  loanId: number,
  tenantId: number,
  changedByBrokerId: number,
  notes: string,
): Promise<{ triggeredCount: number; nudged: boolean }> {
  const [[loan]] = await conn.query<RowDataPacket[]>(
    `SELECT id, status FROM loan_applications WHERE id = ? AND tenant_id = ?`,
    [loanId, tenantId],
  );
  if (!loan) throw new Error(`Loan #${loanId} not found`);

  if (loan.status !== NUDGE_TO_STATUS) {
    throw new Error(
      `Loan #${loanId} status is ${loan.status}; expected ${NUDGE_TO_STATUS}`,
    );
  }

  await conn.query(
    `UPDATE loan_applications SET status = ?, updated_at = NOW() WHERE id = ? AND tenant_id = ?`,
    [NUDGE_FROM_STATUS, loanId, tenantId],
  );
  await recordStatusChange(
    conn,
    tenantId,
    loanId,
    NUDGE_TO_STATUS,
    NUDGE_FROM_STATUS,
    changedByBrokerId,
    notes,
  );

  await conn.query(
    `UPDATE loan_applications SET status = ?, updated_at = NOW() WHERE id = ? AND tenant_id = ?`,
    [NUDGE_TO_STATUS, loanId, tenantId],
  );
  await recordStatusChange(
    conn,
    tenantId,
    loanId,
    NUDGE_FROM_STATUS,
    NUDGE_TO_STATUS,
    changedByBrokerId,
    notes,
  );

  const { triggeredCount } = await triggerApplicationReceivedFlows(
    conn,
    loanId,
    tenantId,
  );
  return { triggeredCount, nudged: true };
}

export async function countActiveExecutions(
  conn: Connection,
  loanId: number,
  flowId: number,
): Promise<number> {
  const [rows] = await conn.query<RowDataPacket[]>(
    `SELECT COUNT(*) AS c FROM reminder_flow_executions
     WHERE loan_application_id = ? AND flow_id = ? AND status = 'active'`,
    [loanId, flowId],
  );
  return Number(rows[0]?.c ?? 0);
}

export async function resolvePlatformOwnerBrokerId(
  conn: Connection,
  tenantId: number,
): Promise<number> {
  const [rows] = await conn.query<RowDataPacket[]>(
    `SELECT id FROM brokers
     WHERE tenant_id = ? AND role = 'platform_owner' AND status = 'active'
     ORDER BY id ASC LIMIT 1`,
    [tenantId],
  );
  if (!rows.length) throw new Error("No active platform_owner broker found");
  return Number(rows[0].id);
}
