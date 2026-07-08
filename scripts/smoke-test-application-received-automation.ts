/**
 * Edge-case smoke tests for Application Received automation (status nudge + flow trigger).
 * Uses synthetic @smoke-ar-flow.local data; entire run ROLLS BACK — no real client impact.
 *
 * Usage: npx tsx scripts/smoke-test-application-received-automation.ts
 */
import "dotenv/config";
import mysql, {
  type Connection,
  type RowDataPacket,
  type ResultSetHeader,
} from "mysql2/promise";
import {
  APPLICATION_RECEIVED_FLOW_ID,
  NUDGE_FROM_STATUS,
  NUDGE_TO_STATUS,
  countActiveExecutions,
  fetchGapLoans,
  isFlowActive,
  statusNudgeAndTriggerFlow,
  triggerApplicationReceivedFlows,
} from "./lib/application-received-flow.ts";

const TENANT_ID = Number(process.env.MORTGAGE_TENANT_ID ?? "1");

interface CaseResult {
  name: string;
  pass: boolean;
  detail?: string;
}

const cases: CaseResult[] = [];

function pass(name: string, detail?: string) {
  cases.push({ name, pass: true, detail });
}

function fail(name: string, detail?: string) {
  cases.push({ name, pass: false, detail });
}

function requireEnv(name: string): string {
  const v = process.env[name]?.trim();
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

async function insertSmokeBroker(conn: Connection, email: string): Promise<number> {
  const [r] = await conn.query<ResultSetHeader>(
    `INSERT INTO brokers
      (tenant_id, email, first_name, last_name, role, status, email_verified, created_by_broker_id, public_token)
     VALUES (?, ?, 'Smoke', 'AR', 'admin', 'active', 0, NULL, UUID())`,
    [TENANT_ID, email],
  );
  return r.insertId;
}

async function insertSmokeClient(
  conn: Connection,
  email: string,
  brokerId: number | null,
  source: string,
): Promise<number> {
  const [r] = await conn.query<ResultSetHeader>(
    `INSERT INTO clients (tenant_id, email, first_name, last_name, phone, status, email_verified, assigned_broker_id, source)
     VALUES (?, ?, 'Smoke', 'Borrower', '5550009999', 'active', 0, ?, ?)`,
    [TENANT_ID, email, brokerId, source],
  );
  return r.insertId;
}

async function insertSmokeLoan(
  conn: Connection,
  opts: {
    appNumber: string;
    clientId: number;
    brokerId: number | null;
    loanType?: string;
    status?: string;
  },
): Promise<number> {
  const [r] = await conn.query<ResultSetHeader>(
    `INSERT INTO loan_applications
      (tenant_id, application_number, client_user_id, broker_user_id, loan_type,
       loan_amount, property_value, down_payment, status, current_step, total_steps, submitted_at)
     VALUES (?, ?, ?, ?, ?, 400000, 500000, 100000, ?, 1, 8, NOW())`,
    [
      TENANT_ID,
      opts.appNumber,
      opts.clientId,
      opts.brokerId,
      opts.loanType ?? "purchase",
      opts.status ?? NUDGE_TO_STATUS,
    ],
  );
  return r.insertId;
}

async function countStatusHistory(
  conn: Connection,
  loanId: number,
): Promise<number> {
  const [rows] = await conn.query<RowDataPacket[]>(
    `SELECT COUNT(*) AS c FROM application_status_history WHERE application_id = ?`,
    [loanId],
  );
  return Number(rows[0]?.c ?? 0);
}

async function runTests(conn: Connection) {
  const runId = `SMKAR${Date.now()}`;
  const flowActive = await isFlowActive(conn, APPLICATION_RECEIVED_FLOW_ID, TENANT_ID);
  if (flowActive) pass("preflight: Flow #3 is active");
  else fail("preflight: Flow #3 is active", "Flow #3 is OFF — enable before prod backfill");

  const mb = await insertSmokeBroker(conn, `${runId}@smoke-ar-flow.local`);
  const clientId = await insertSmokeClient(
    conn,
    `${runId}-client@smoke-ar-flow.local`,
    mb,
    "public_wizard",
  );
  const loanId = await insertSmokeLoan(conn, {
    appNumber: `${runId}-LA`,
    clientId,
    brokerId: mb,
    status: NUDGE_TO_STATUS,
  });

  // 1. First trigger creates execution
  const t1 = await triggerApplicationReceivedFlows(conn, loanId, TENANT_ID);
  if (t1.triggeredCount === 1) pass("trigger: first call creates 1 execution");
  else fail("trigger: first call creates 1 execution", `got ${t1.triggeredCount}`);

  // 2. Duplicate trigger skipped (R2)
  const t2 = await triggerApplicationReceivedFlows(conn, loanId, TENANT_ID);
  if (t2.triggeredCount === 0) pass("trigger: duplicate skipped when active execution exists");
  else fail("trigger: duplicate skipped", `triggeredCount=${t2.triggeredCount}`);

  const activeAfterDup = await countActiveExecutions(
    conn,
    loanId,
    APPLICATION_RECEIVED_FLOW_ID,
  );
  if (activeAfterDup === 1) pass("trigger: still exactly 1 active execution");
  else fail("trigger: execution count", `expected 1, got ${activeAfterDup}`);

  // 3. Status nudge on gap-style loan (new loan without prior execution)
  const client2 = await insertSmokeClient(
    conn,
    `${runId}-gap@smoke-ar-flow.local`,
    mb,
    "broker_created",
  );
  const gapLoanId = await insertSmokeLoan(conn, {
    appNumber: `${runId}-GAP`,
    clientId: client2,
    brokerId: mb,
    status: NUDGE_TO_STATUS,
  });
  const nudge = await statusNudgeAndTriggerFlow(
    conn,
    gapLoanId,
    TENANT_ID,
    mb,
    "smoke test nudge",
  );
  if (nudge.nudged && nudge.triggeredCount === 1)
    pass("nudge: app_sent round-trip creates execution");
  else
    fail(
      "nudge: app_sent round-trip creates execution",
      JSON.stringify(nudge),
    );

  const [[gapLoan]] = await conn.query<RowDataPacket[]>(
    `SELECT status FROM loan_applications WHERE id = ?`,
    [gapLoanId],
  );
  if (gapLoan?.status === NUDGE_TO_STATUS)
    pass("nudge: final status is application_received");
  else fail("nudge: final status", String(gapLoan?.status));

  const hist = await countStatusHistory(conn, gapLoanId);
  if (hist === 2) pass("nudge: records 2 status history rows");
  else fail("nudge: status history count", `expected 2, got ${hist}`);

  // 4. Second nudge on same loan — no duplicate execution
  const nudge2 = await statusNudgeAndTriggerFlow(
    conn,
    gapLoanId,
    TENANT_ID,
    mb,
    "smoke test second nudge",
  );
  if (nudge2.triggeredCount === 0) pass("nudge: second nudge does not duplicate execution");
  else fail("nudge: second nudge duplicate", `triggered=${nudge2.triggeredCount}`);

  // 5. Inactive flow override — no execution
  const client3 = await insertSmokeClient(
    conn,
    `${runId}-off@smoke-ar-flow.local`,
    mb,
    "public_wizard",
  );
  const offLoanId = await insertSmokeLoan(conn, {
    appNumber: `${runId}-OFF`,
    clientId: client3,
    brokerId: mb,
  });
  const off = await triggerApplicationReceivedFlows(conn, offLoanId, TENANT_ID, {
    flowActiveOverride: false,
  });
  if (off.triggeredCount === 0) pass("edge: inactive flow creates 0 executions");
  else fail("edge: inactive flow", `triggered=${off.triggeredCount}`);

  // 6. Refinance loan type still matches flow (loan_type_filter=all)
  const client4 = await insertSmokeClient(
    conn,
    `${runId}-refi@smoke-ar-flow.local`,
    mb,
    "public_wizard",
  );
  const refiLoanId = await insertSmokeLoan(conn, {
    appNumber: `${runId}-REFI`,
    clientId: client4,
    brokerId: mb,
    loanType: "refinance",
  });
  const refi = await triggerApplicationReceivedFlows(conn, refiLoanId, TENANT_ID);
  if (refi.triggeredCount === 1) pass("edge: refinance loan triggers flow");
  else fail("edge: refinance loan", `triggered=${refi.triggeredCount}`);

  // 7. Unassigned broker (NULL broker_user_id) — flow has no broker restriction
  const client5 = await insertSmokeClient(
    conn,
    `${runId}-unassigned@smoke-ar-flow.local`,
    null,
    "public_wizard",
  );
  const unassignedLoanId = await insertSmokeLoan(conn, {
    appNumber: `${runId}-UNAS`,
    clientId: client5,
    brokerId: null,
  });
  const unas = await triggerApplicationReceivedFlows(
    conn,
    unassignedLoanId,
    TENANT_ID,
  );
  if (unas.triggeredCount === 1)
    pass("edge: NULL broker_user_id still triggers unrestricted flow");
  else fail("edge: NULL broker", `triggered=${unas.triggeredCount}`);

  // 8. Wrong status nudge throws
  const client6 = await insertSmokeClient(
    conn,
    `${runId}-draft@smoke-ar-flow.local`,
    mb,
    "broker_created",
  );
  const draftLoanId = await insertSmokeLoan(conn, {
    appNumber: `${runId}-DRAFT`,
    clientId: client6,
    brokerId: mb,
    status: "draft",
  });
  let threw = false;
  try {
    await statusNudgeAndTriggerFlow(conn, draftLoanId, TENANT_ID, mb, "x");
  } catch {
    threw = true;
  }
  if (threw) pass("edge: nudge rejects non-application_received loan");
  else fail("edge: nudge should throw for draft status");

  // 9. Loans with executions excluded from gap audit
  const gapsBefore = await fetchGapLoans(conn, TENANT_ID);
  const shouldHaveExec = [
    `${runId}-LA`,
    `${runId}-GAP`,
    `${runId}-REFI`,
    `${runId}-UNAS`,
    `${runId}-MANUAL`,
  ];
  const smokeGaps = gapsBefore.filter((g) =>
    shouldHaveExec.includes(g.application_number),
  );
  if (smokeGaps.length === 0)
    pass("audit: loans with executions not in gap list");
  else
    fail(
      "audit: loans with executions in gap list",
      smokeGaps.map((g) => g.application_number).join(", "),
    );

  // 10. Manual create source simulation — application_received at insert
  const client7 = await insertSmokeClient(
    conn,
    `${runId}-manual@smoke-ar-flow.local`,
    mb,
    "broker_created",
  );
  const manualLoanId = await insertSmokeLoan(conn, {
    appNumber: `${runId}-MANUAL`,
    clientId: client7,
    brokerId: mb,
    status: NUDGE_TO_STATUS,
  });
  const manual = await triggerApplicationReceivedFlows(
    conn,
    manualLoanId,
    TENANT_ID,
  );
  if (manual.triggeredCount === 1)
    pass("manual: broker_created + application_received triggers flow");
  else fail("manual: broker_created trigger", `triggered=${manual.triggeredCount}`);

  // 11. Execution context has required fields
  const [execRows] = await conn.query<RowDataPacket[]>(
    `SELECT context_data FROM reminder_flow_executions
     WHERE loan_application_id = ? AND flow_id = ? LIMIT 1`,
    [loanId, APPLICATION_RECEIVED_FLOW_ID],
  );
  const ctx =
    typeof execRows[0]?.context_data === "string"
      ? JSON.parse(execRows[0].context_data)
      : execRows[0]?.context_data;
  if (ctx?.client_email && ctx?.application_number && ctx?.loan_id)
    pass("data: execution context_data has client_email, application_number, loan_id");
  else fail("data: execution context_data incomplete", JSON.stringify(ctx));

  // 12. next_execution_at is due (<= now) for cron pickup
  const [dueRows] = await conn.query<RowDataPacket[]>(
    `SELECT next_execution_at FROM reminder_flow_executions
     WHERE loan_application_id = ? AND flow_id = ? AND status = 'active'`,
    [loanId, APPLICATION_RECEIVED_FLOW_ID],
  );
  const due = dueRows[0]?.next_execution_at
    ? new Date(dueRows[0].next_execution_at).getTime()
    : 0;
  if (due > 0 && due <= Date.now() + 60_000)
    pass("cron: next_execution_at is due for processing");
  else fail("cron: next_execution_at not due", String(dueRows[0]?.next_execution_at));
}

async function main() {
  const conn = await mysql.createConnection({
    host: requireEnv("DB_HOST"),
    port: Number(process.env.DB_PORT ?? "3306"),
    user: requireEnv("DB_USER"),
    password: requireEnv("DB_PASSWORD"),
    database: requireEnv("DB_NAME"),
    ssl: { rejectUnauthorized: true },
  });

  try {
    await conn.beginTransaction();
    await runTests(conn);
    await conn.rollback();
    console.log("\n=== Application Received Automation Smoke Tests ===\n");
    let failed = 0;
    for (const c of cases) {
      const icon = c.pass ? "✅" : "❌";
      console.log(`${icon} ${c.name}${c.detail ? ` — ${c.detail}` : ""}`);
      if (!c.pass) failed++;
    }
    console.log(`\n${cases.length - failed}/${cases.length} passed (transaction rolled back)\n`);
    if (failed > 0) process.exit(1);
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    await conn.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
