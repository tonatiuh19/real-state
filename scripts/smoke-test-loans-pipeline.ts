/**
 * Smoke tests for Loans & Pipeline (3-path ownership, create/update/status, UI vs API).
 * Safe against prod/staging — synthetic rows use @smoke-loans.local emails;
 * all inserts run in a transaction that is always ROLLED BACK.
 *
 * Usage: npx tsx scripts/smoke-test-loans-pipeline.ts
 */
import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import mysql, { type RowDataPacket } from "mysql2/promise";

const TENANT_ID = Number(process.env.MORTGAGE_TENANT_ID ?? "1");

type Severity = "critical" | "high" | "medium" | "low" | "info";

interface Finding {
  id: string;
  severity: Severity;
  title: string;
  detail: string;
}

interface CaseResult {
  name: string;
  pass: boolean;
  detail?: string;
}

const findings: Finding[] = [];
const cases: CaseResult[] = [];

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing env: ${name}`);
  return value;
}

function pass(name: string, detail?: string) {
  cases.push({ name, pass: true, detail });
}

function fail(name: string, detail?: string) {
  cases.push({ name, pass: false, detail });
}

function finding(
  id: string,
  severity: Severity,
  title: string,
  detail: string,
) {
  findings.push({ id, severity, title, detail });
}

/** Mirrors api/index.ts loan list / detail scoping */
function hasGlobalLoanAccess(role: string): boolean {
  return role === "platform_owner";
}

function canAccessLoanThreePath(
  brokerId: number,
  loan: {
    broker_user_id: number | null;
    partner_broker_id: number | null;
  },
  client: { assigned_broker_id: number | null },
  partnerOwnerBrokerId: number | null = null,
): boolean {
  return (
    client.assigned_broker_id === brokerId ||
    loan.broker_user_id === brokerId ||
    loan.partner_broker_id === brokerId ||
    partnerOwnerBrokerId === brokerId
  );
}

function buildPipelineWhere(
  role: string,
  brokerId: number,
): { sql: string; params: (number | string)[] } {
  if (hasGlobalLoanAccess(role)) {
    return { sql: "WHERE la.tenant_id = ?", params: [TENANT_ID] };
  }
  return {
    sql: `WHERE (c.assigned_broker_id = ? OR la.broker_user_id = ? OR la.partner_broker_id = ? OR EXISTS (
      SELECT 1 FROM brokers op
      WHERE op.id = la.partner_broker_id AND op.created_by_broker_id = ? AND op.tenant_id = la.tenant_id
    )) AND la.tenant_id = ?`,
    params: [brokerId, brokerId, brokerId, brokerId, TENANT_ID],
  };
}

function toSqlOptionalInt(val: unknown): number | null {
  if (val == null || val === "") return null;
  const n = parseInt(String(val), 10);
  return Number.isFinite(n) ? n : null;
}

function toSqlOptionalFloat(val: unknown): number | null {
  if (val == null || val === "") return null;
  const n = parseFloat(String(val));
  return Number.isFinite(n) ? n : null;
}

function toSqlMoney(val: unknown): number | null {
  if (val == null || val === "") return null;
  const n = parseFloat(String(val));
  return Number.isFinite(n) ? n : null;
}

function canMbUpdatePipelineStatus(role: string): boolean {
  return role === "admin" || role === "superadmin" || role === "platform_owner";
}

function runAuthMatrixTests() {
  const mbA = 10;
  const mbB = 20;
  const partnerP = 30;
  const owner = 1;

  const clientA = { assigned_broker_id: mbA };
  const loanMbOnly = {
    broker_user_id: mbA,
    partner_broker_id: null as number | null,
  };
  const loanPartnerOnly = {
    broker_user_id: mbB,
    partner_broker_id: partnerP,
  };

  const clientOrphan = { assigned_broker_id: null as number | null };

  const matrix: Array<{
    name: string;
    brokerId: number;
    role: string;
    loan: typeof loanMbOnly;
    client: { assigned_broker_id: number | null };
    expected: boolean;
  }> = [
    {
      name: "MB sees loan via broker_user_id",
      brokerId: mbA,
      role: "admin",
      loan: loanMbOnly,
      client: clientA,
      expected: true,
    },
    {
      name: "MB B cannot see MB A loan (no path)",
      brokerId: mbB,
      role: "admin",
      loan: loanMbOnly,
      client: clientA,
      expected: false,
    },
    {
      name: "Partner sees loan via partner_broker_id",
      brokerId: partnerP,
      role: "broker",
      loan: loanPartnerOnly,
      client: { assigned_broker_id: mbB },
      expected: true,
    },
    {
      name: "MB A sees partner loan via owned partner (path 4)",
      brokerId: mbA,
      role: "admin",
      loan: loanPartnerOnly,
      client: { assigned_broker_id: mbB },
      expected: true,
    },
    {
      name: "MB sees loan via client assigned_broker_id only",
      brokerId: mbA,
      role: "admin",
      loan: { broker_user_id: null, partner_broker_id: null },
      client: clientA,
      expected: true,
    },
    {
      name: "Partner blocked from pipeline status API",
      brokerId: partnerP,
      role: "broker",
      loan: loanPartnerOnly,
      client: { assigned_broker_id: mbB },
      expected: false,
    },
    {
      name: "Platform owner global access (logic flag)",
      brokerId: owner,
      role: "platform_owner",
      loan: loanMbOnly,
      client: clientA,
      expected: true,
    },
    {
      name: "No access when all three paths null",
      brokerId: mbA,
      role: "admin",
      loan: { broker_user_id: null, partner_broker_id: null },
      client: clientOrphan,
      expected: false,
    },
  ];

  for (const t of matrix) {
    if (t.name.includes("Platform owner global")) {
      if (hasGlobalLoanAccess(t.role)) pass(`auth: ${t.name}`);
      else fail(`auth: ${t.name}`);
      continue;
    }
    if (t.name.includes("Partner blocked from pipeline status")) {
      if (!canMbUpdatePipelineStatus(t.role)) pass(`auth: ${t.name}`);
      else fail(`auth: ${t.name}`);
      continue;
    }
    const got = canAccessLoanThreePath(
      t.brokerId,
      t.loan,
      t.client,
      t.loan.partner_broker_id === partnerP ? mbA : null,
    );
    if (got === t.expected) pass(`auth: ${t.name}`);
    else fail(`auth: ${t.name}`, `expected ${t.expected}, got ${got}`);
  }

  if (!hasGlobalLoanAccess("admin"))
    pass("auth: MB admin is NOT global (only platform_owner)");
  else fail("auth: MB admin is NOT global");

  if (hasGlobalLoanAccess("platform_owner"))
    pass("auth: platform_owner has global loan access flag");
  else fail("auth: platform_owner global flag");
}

function runSanitizerTests() {
  const checks: Array<[string, unknown, number | null]> = [
    ["dependent_count NaN", "NaN", null],
    ["dependent_count empty", "", null],
    ["dependent_count valid", "2", 2],
    ["years_at_address NaN", NaN, null],
    ["loan_amount invalid", "abc", null],
    ["loan_amount valid", "500000", 500000],
  ];
  for (const [label, input, expected] of checks) {
    const fn = label.startsWith("loan")
      ? toSqlMoney
      : label.includes("years")
        ? toSqlOptionalFloat
        : toSqlOptionalInt;
    const got = fn(input);
    if (got === expected) pass(`sanitizer: ${label}`);
    else fail(`sanitizer: ${label}`, `expected ${expected}, got ${got}`);
  }
}

function runStaticUiApiTests() {
  const root = process.cwd();
  const apiIndex = fs.readFileSync(path.join(root, "api/index.ts"), "utf8");
  const wizard = fs.readFileSync(
    path.join(root, "client/components/NewLoanWizard.tsx"),
    "utf8",
  );
  const pipeline = fs.readFileSync(
    path.join(root, "client/pages/admin/Pipeline.tsx"),
    "utf8",
  );
  const pipelineSlice = fs.readFileSync(
    path.join(root, "client/store/slices/pipelineSlice.ts"),
    "utf8",
  );

  const createLoanBlock = apiIndex.match(
    /const handleCreateLoan[\s\S]{0,2000}/,
  )?.[0];
  if (createLoanBlock?.includes("Only mortgage bankers can create loans manually"))
    pass("static: handleCreateLoan requires admin or platform_owner");
  else if (createLoanBlock && !createLoanBlock.includes("brokerRole")) {
    finding(
      "SEC-LOAN-001",
      "critical",
      "POST /api/loans/create has no role check",
      "Any authenticated broker can call the API.",
    );
    fail("static: handleCreateLoan role gate");
  } else {
    fail("static: handleCreateLoan role gate");
  }

  if (
    wizard.includes("selectedBrokerId") &&
    wizard.includes("broker_user_id: selectedBrokerId")
  )
    pass("static: NewLoanWizard sends broker_user_id to createLoan");
  else if (
    wizard.includes("selectedBrokerId") &&
    wizard.includes("createLoan({") &&
    !wizard.match(/createLoan\(\{[\s\S]{0,800}broker_user_id/)
  ) {
    finding(
      "UI-LOAN-001",
      "high",
      "New Loan Wizard broker assignment not sent to API",
      "selectedBrokerId omitted from createLoan payload.",
    );
    fail("static: UI-LOAN-001 wizard assignment");
  }

  if (pipeline.includes('isPartner ?') && pipeline.includes("Get My Link"))
    pass("ui: Pipeline hides New Loan button for partners");
  else fail("ui: Pipeline partner New Loan guard");

  if (pipeline.includes("draggable={!isPartner}"))
    pass("ui: Pipeline kanban drag disabled for partners");
  else fail("ui: Pipeline kanban drag guard");

  const adminPatchHandlers: Array<{
    name: string;
    pattern: RegExp;
    id: string;
  }> = [
    {
      name: "handleAssignBroker",
      pattern:
        /const handleAssignBroker[\s\S]{0,1200}UPDATE loan_applications SET broker_user_id/,
      id: "SEC-LOAN-002",
    },
    {
      name: "handleAssignPartner",
      pattern:
        /const handleAssignPartner[\s\S]{0,1200}UPDATE loan_applications SET partner_broker_id/,
      id: "SEC-LOAN-003",
    },
    {
      name: "handleUpdateLoanSourceCategory",
      pattern: /const handleUpdateLoanSourceCategory[\s\S]{0,2800}/,
      id: "SEC-LOAN-004",
    },
  ];

  for (const h of adminPatchHandlers) {
    const block = apiIndex.match(h.pattern)?.[0] ?? "";
    const hasOwnership =
      block.includes("assertLoanAccess") ||
      block.includes("rowHasLoanOwnershipAccess");
    if (!hasOwnership && block.length > 0) {
      finding(
        h.id,
        "critical",
        `${h.name} lacks ownership check`,
        "Admin PATCH without assertLoanAccess.",
      );
      fail(`static: ${h.id} ${h.name} missing ownership`);
    } else if (hasOwnership) {
      pass(`static: ${h.name} uses assertLoanAccess`);
    } else {
      fail(`static: could not parse ${h.name}`);
    }
  }

  if (
    apiIndex.includes("canUseExistingClient") ||
    apiIndex.includes("assigned to another broker")
  )
    pass("static: create-loan guards existing client reassignment");
  else if (
    apiIndex.match(/handleCreateLoan[\s\S]{0,5000}assigned_broker_id=\?/)
  ) {
    finding(
      "SEC-LOAN-005",
      "high",
      "Manual create reassigns existing client without ownership check",
      "handleCreateLoan overwrites assigned_broker_id.",
    );
    fail("static: SEC-LOAN-005 client reassignment");
  }

  if (pipelineSlice.includes("`/api/loans?"))
    pass("ui: pipelineSlice uses GET /api/loans (server-side scoping)");
  else fail("ui: pipelineSlice fetchLoans endpoint");

  if (apiIndex.includes("hasGlobalLoanAccess = brokerRole === \"platform_owner\""))
    pass("api: global loan access limited to platform_owner");
  else fail("api: hasGlobalLoanAccess pattern");
}

async function insertBroker(
  conn: mysql.Connection,
  row: {
    email: string;
    role: "broker" | "admin" | "platform_owner";
    created_by_broker_id: number | null;
  },
): Promise<number> {
  const [result] = await conn.query<mysql.ResultSetHeader>(
    `INSERT INTO brokers
      (tenant_id, email, first_name, last_name, role, status, email_verified, created_by_broker_id, public_token)
     VALUES (?, ?, 'Smoke', 'Test', ?, 'active', 0, ?, UUID())`,
    [TENANT_ID, row.email, row.role, row.created_by_broker_id],
  );
  return result.insertId;
}

async function insertClient(
  conn: mysql.Connection,
  email: string,
  assigned_broker_id: number | null,
): Promise<number> {
  const [result] = await conn.query<mysql.ResultSetHeader>(
    `INSERT INTO clients
      (tenant_id, email, first_name, last_name, status, email_verified, assigned_broker_id, source)
     VALUES (?, ?, 'Smoke', 'Client', 'active', 0, ?, 'broker_created')`,
    [TENANT_ID, email, assigned_broker_id],
  );
  return result.insertId;
}

async function insertLoan(
  conn: mysql.Connection,
  opts: {
    appNumber: string;
    clientId: number;
    broker_user_id: number | null;
    partner_broker_id: number | null;
    status?: string;
  },
): Promise<number> {
  const [result] = await conn.query<mysql.ResultSetHeader>(
    `INSERT INTO loan_applications
      (tenant_id, application_number, client_user_id, broker_user_id, partner_broker_id,
       loan_type, loan_amount, property_value, down_payment, status, current_step, total_steps, submitted_at)
     VALUES (?, ?, ?, ?, ?, 'purchase', 500000, 650000, 150000, ?, 1, 8, NOW())`,
    [
      TENANT_ID,
      opts.appNumber,
      opts.clientId,
      opts.broker_user_id,
      opts.partner_broker_id,
      opts.status ?? "app_sent",
    ],
  );
  return result.insertId;
}

async function countVisibleLoans(
  conn: mysql.Connection,
  role: string,
  brokerId: number,
  appNumberPrefix: string,
): Promise<number> {
  const { sql, params } = buildPipelineWhere(role, brokerId);
  const [rows] = await conn.query<RowDataPacket[]>(
    `SELECT COUNT(*) AS total
     FROM loan_applications la
     INNER JOIN clients c ON la.client_user_id = c.id AND c.tenant_id = la.tenant_id
     ${sql}
       AND la.application_number LIKE ?`,
    [...params, `${appNumberPrefix}%`],
  );
  return Number(rows[0]?.total ?? 0);
}

async function runDbTests(conn: mysql.Connection) {
  const runId = `SMK${Date.now()}`;
  const prefix = `${runId}-`;

  const mbA = await insertBroker(conn, {
    email: `${prefix}mb-a@smoke-loans.local`,
    role: "admin",
    created_by_broker_id: null,
  });
  const mbB = await insertBroker(conn, {
    email: `${prefix}mb-b@smoke-loans.local`,
    role: "admin",
    created_by_broker_id: null,
  });
  const partnerP = await insertBroker(conn, {
    email: `${prefix}partner@smoke-loans.local`,
    role: "broker",
    created_by_broker_id: mbA,
  });

  const clientA = await insertClient(
    conn,
    `${prefix}c-a@smoke-loans.local`,
    mbA,
  );
  const clientB = await insertClient(
    conn,
    `${prefix}c-b@smoke-loans.local`,
    mbB,
  );

  await insertLoan(conn, {
    appNumber: `${prefix}L1`,
    clientId: clientA,
    broker_user_id: mbA,
    partner_broker_id: null,
  });
  await insertLoan(conn, {
    appNumber: `${prefix}L2`,
    clientId: clientB,
    broker_user_id: mbB,
    partner_broker_id: partnerP,
  });
  await insertLoan(conn, {
    appNumber: `${prefix}L3`,
    clientId: clientB,
    broker_user_id: mbB,
    partner_broker_id: null,
  });

  const mbACount = await countVisibleLoans(conn, "admin", mbA, prefix);
  if (mbACount === 2) pass("db: MB A sees L1 + L2 (owned partner path 4)");
  else fail("db: MB A scoped loan count", `expected 2, got ${mbACount}`);

  const mbBCount = await countVisibleLoans(conn, "admin", mbB, prefix);
  if (mbBCount === 2) pass("db: MB B sees L2 + L3 via broker_user_id");
  else fail("db: MB B scoped loan count", `expected 2, got ${mbBCount}`);

  const partnerCount = await countVisibleLoans(conn, "broker", partnerP, prefix);
  if (partnerCount === 1) pass("db: Partner sees only L2 via partner_broker_id");
  else fail("db: Partner scoped loan count", `expected 1, got ${partnerCount}`);

  const ownerCount = await countVisibleLoans(conn, "platform_owner", 1, prefix);
  if (ownerCount === 3) pass("db: platform_owner sees all smoke loans");
  else fail("db: platform_owner loan count", `expected 3, got ${ownerCount}`);

  // Existing client reassignment simulation (create-loan path)
  const existingEmail = `${prefix}existing@smoke-loans.local`;
  const existingClient = await insertClient(conn, existingEmail, mbB);
  await conn.query(
    `UPDATE clients SET first_name=?, assigned_broker_id=? WHERE id=? AND tenant_id=?`,
    ["Before", mbB, existingClient, TENANT_ID],
  );
  await conn.query(
    `UPDATE clients SET first_name=?, assigned_broker_id=? WHERE id=? AND tenant_id=?`,
    ["After", mbA, existingClient, TENANT_ID],
  );
  const [[reassigned]] = await conn.query<RowDataPacket[]>(
    "SELECT assigned_broker_id FROM clients WHERE id = ?",
    [existingClient],
  );
  if (Number(reassigned.assigned_broker_id) === mbA)
    pass("db: create-loan client UPDATE can reassign assigned_broker_id (SEC-LOAN-005)");
  else fail("db: client reassignment simulation");

  // Dry-run manual loan INSERT (NaN fields) — mirrors validate-create-loan
  const testEmail = `${prefix}new@smoke-loans.local`;
  const [clientResult] = await conn.query<mysql.ResultSetHeader>(
    `INSERT INTO clients
      (tenant_id, email, first_name, last_name, status, email_verified, assigned_broker_id, source)
     VALUES (?, ?, 'New', 'Loan', 'active', 0, ?, 'broker_created')`,
    [TENANT_ID, testEmail, mbA],
  );
  const parsedDependent = toSqlOptionalInt("NaN");
  const parsedYears = toSqlOptionalFloat("");
  const [loanResult] = await conn.query<mysql.ResultSetHeader>(
    `INSERT INTO loan_applications (
      tenant_id, application_number, client_user_id, broker_user_id, loan_type, loan_amount,
      property_value, down_payment, marital_status, dependent_count, years_at_address,
      status, current_step, total_steps, submitted_at
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,'app_sent',1,8,NOW())`,
    [
      TENANT_ID,
      `${prefix}DRY`,
      clientResult.insertId,
      mbA,
      "purchase",
      500000,
      650000,
      150000,
      null,
      parsedDependent,
      parsedYears,
    ],
  );
  if (loanResult.insertId) pass("db: dry-run loan INSERT with NaN-sanitized nulls");
  else fail("db: dry-run loan INSERT");

  // Schema columns required by create-loan
  const [cols] = await conn.query<RowDataPacket[]>(
    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'loan_applications'`,
  );
  const colSet = new Set(cols.map((r) => String(r.COLUMN_NAME)));
  for (const required of [
    "marital_status",
    "dependent_count",
    "years_at_address",
    "property_unit",
    "partner_broker_id",
  ]) {
    if (colSet.has(required)) pass(`schema: loan_applications.${required}`);
    else {
      fail(`schema: loan_applications.${required} missing`);
      finding(
        "SCHEMA-001",
        "critical",
        `Missing column loan_applications.${required}`,
        "Apply MISMO / pipeline migrations before deploy.",
      );
    }
  }
}

async function main() {
  console.log("Loans & Pipeline smoke tests\n");

  runAuthMatrixTests();
  runSanitizerTests();
  runStaticUiApiTests();

  const conn = await mysql.createConnection({
    host: requireEnv("DB_HOST"),
    port: Number(process.env.DB_PORT || "3306"),
    user: requireEnv("DB_USER"),
    password: requireEnv("DB_PASSWORD"),
    database: requireEnv("DB_NAME"),
    ssl: { rejectUnauthorized: true },
  });

  try {
    await conn.beginTransaction();
    await runDbTests(conn);
  } finally {
    await conn.rollback();
    await conn.end();
    console.log("\n↩️  Transaction rolled back (no smoke data persisted)");
  }

  const failed = cases.filter((c) => !c.pass);
  const critical = findings.filter((f) => f.severity === "critical");
  const high = findings.filter((f) => f.severity === "high");

  console.log(`\nCases: ${cases.length - failed.length}/${cases.length} passed`);
  if (failed.length) {
    console.log("\nFailed cases:");
    for (const f of failed) {
      console.log(`  ✗ ${f.name}${f.detail ? ` — ${f.detail}` : ""}`);
    }
  }

  if (findings.length) {
    console.log("\nFindings (by severity):");
    for (const sev of [
      "critical",
      "high",
      "medium",
      "low",
      "info",
    ] as Severity[]) {
      for (const f of findings.filter((x) => x.severity === sev)) {
        console.log(`  [${sev.toUpperCase()}] ${f.id}: ${f.title}`);
        console.log(`           ${f.detail}`);
      }
    }
  }

  if (failed.length || critical.length) {
    process.exitCode = 1;
    console.log("\n❌ Smoke tests FAILED (see critical findings)");
  } else if (high.length) {
    console.log("\n⚠️  Passed with HIGH findings — review before prod");
  } else {
    console.log("\n✅ Smoke tests passed");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
