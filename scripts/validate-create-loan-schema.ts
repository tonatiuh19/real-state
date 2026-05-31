/**
 * Validates DB schema + dry-run INSERT for POST /api/loans/create (manual pipeline loan).
 * Safe to run against prod/staging — uses a transaction that is always rolled back.
 *
 * Usage: npx tsx scripts/validate-create-loan-schema.ts
 */
import "dotenv/config";
import mysql from "mysql2/promise";

const TENANT_ID = Number(process.env.MORTGAGE_TENANT_ID ?? "1");

const LOAN_INSERT_COLUMNS = [
  "tenant_id",
  "application_number",
  "client_user_id",
  "broker_user_id",
  "loan_type",
  "loan_amount",
  "property_value",
  "property_address",
  "property_unit",
  "property_city",
  "property_state",
  "property_zip",
  "property_type",
  "down_payment",
  "loan_purpose",
  "marital_status",
  "dependent_count",
  "years_at_address",
  "status",
  "current_step",
  "total_steps",
  "estimated_close_date",
  "notes",
  "submitted_at",
] as const;

const CLIENT_INSERT_COLUMNS = [
  "tenant_id",
  "email",
  "first_name",
  "middle_name",
  "last_name",
  "phone",
  "address_street",
  "address_unit",
  "address_city",
  "address_state",
  "address_zip",
  "status",
  "email_verified",
  "assigned_broker_id",
  "source",
] as const;

const TASK_INSERT_COLUMNS = [
  "tenant_id",
  "application_id",
  "title",
  "description",
  "task_type",
  "status",
  "priority",
  "assigned_to_user_id",
  "created_by_broker_id",
  "due_date",
  "template_id",
] as const;

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing env: ${name}`);
  return value;
}

async function getTableColumns(
  conn: mysql.Connection,
  table: string,
): Promise<Set<string>> {
  const [rows] = await conn.query<mysql.RowDataPacket[]>(
    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?`,
    [table],
  );
  return new Set(rows.map((r) => String(r.COLUMN_NAME)));
}

function checkColumns(
  table: string,
  required: readonly string[],
  actual: Set<string>,
): string[] {
  return required.filter((col) => !actual.has(col));
}

/** Mirrors api/index.ts helpers */
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

async function main() {
  const conn = await mysql.createConnection({
    host: requireEnv("DB_HOST"),
    user: requireEnv("DB_USER"),
    password: requireEnv("DB_PASSWORD"),
    database: requireEnv("DB_NAME"),
    port: parseInt(process.env.DB_PORT || "3306", 10),
    ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: true } : undefined,
  });

  console.log("🔍 Validating manual loan creation against live DB...\n");
  console.log(`   Database: ${process.env.DB_NAME}`);
  console.log(`   Tenant:   ${TENANT_ID}\n`);

  let failed = false;

  // ── 1. Column existence ───────────────────────────────────────────────────
  const loanCols = await getTableColumns(conn, "loan_applications");
  const clientCols = await getTableColumns(conn, "clients");
  const taskCols = await getTableColumns(conn, "tasks");

  for (const [table, required, actual] of [
    ["loan_applications", LOAN_INSERT_COLUMNS, loanCols],
    ["clients", CLIENT_INSERT_COLUMNS, clientCols],
    ["tasks", TASK_INSERT_COLUMNS, taskCols],
  ] as const) {
    const missing = checkColumns(table, required, actual);
    if (missing.length) {
      failed = true;
      console.error(`❌ ${table}: missing columns:`);
      missing.forEach((c) => console.error(`     - ${c}`));
      if (table === "loan_applications") {
        console.error(
          "\n   → Run migration: database/migrations/20260505_120000_add_mismo_borrower_fields.sql",
        );
      }
    } else {
      console.log(`✅ ${table}: all ${required.length} required columns present`);
    }
  }

  // MISMO fields specifically (common prod gap)
  const mismoFields = [
    "marital_status",
    "dependent_count",
    "years_at_address",
    "property_unit",
  ];
  const missingMismo = mismoFields.filter((c) => !loanCols.has(c));
  if (missingMismo.length) {
    failed = true;
    console.error(`\n❌ MISMO borrower fields missing on loan_applications: ${missingMismo.join(", ")}`);
  } else {
    console.log("✅ MISMO borrower fields present on loan_applications");
  }

  if (!clientCols.has("middle_name") || !clientCols.has("address_unit")) {
    failed = true;
    console.error("❌ clients.middle_name or clients.address_unit missing (MISMO migration)");
  } else {
    console.log("✅ clients middle_name / address_unit present");
  }

  // ── 2. Sanitizer unit checks (no DB) ────────────────────────────────────────
  console.log("\n── Sanitizer checks (NaN → null) ──");
  const sanitizerCases: Array<[string, unknown, number | null]> = [
    ["dependent_count empty", "", null],
    ["dependent_count NaN string", "NaN", null],
    ["dependent_count valid", "2", 2],
    ["years_at_address NaN", NaN, null],
    ["years_at_address valid", "1.5", 1.5],
    ["loan_amount valid", "1120000", 1120000],
    ["loan_amount invalid", "abc", null],
  ];
  for (const [label, input, expected] of sanitizerCases) {
    const fn = label.startsWith("loan")
      ? toSqlMoney
      : label.includes("years")
        ? toSqlOptionalFloat
        : toSqlOptionalInt;
    const got = fn(input);
    const ok =
      got === expected || (got !== null && expected !== null && got === expected);
    if (!ok && !(got === expected)) {
      // loose compare for floats
      if (typeof got === "number" && typeof expected === "number" && got === expected) {
        console.log(`✅ ${label}: ${got}`);
      } else {
        failed = true;
        console.error(`❌ ${label}: expected ${expected}, got ${got}`);
      }
    } else {
      console.log(`✅ ${label}: ${got}`);
    }
  }

  if (failed) {
    console.error("\n⛔ Schema validation failed — fix migrations before deploying.\n");
    await conn.end();
    process.exit(1);
  }

  // ── 3. Dry-run INSERT (rolled back) ─────────────────────────────────────────
  console.log("\n── Dry-run INSERT (transaction rollback) ──");

  const [[broker]] = await conn.query<mysql.RowDataPacket[]>(
    `SELECT id FROM brokers WHERE tenant_id = ? AND status = 'active' ORDER BY id LIMIT 1`,
    [TENANT_ID],
  );
  if (!broker) {
    console.error("❌ No active broker found for dry-run");
    await conn.end();
    process.exit(1);
  }

  const brokerId = broker.id as number;
  const testEmail = `schema-validate-${Date.now()}@encore-mortgage.invalid`;
  const appNumber = `LA${Date.now().toString().slice(-8)}`;

  await conn.beginTransaction();
  try {
    const [clientResult] = await conn.query<mysql.ResultSetHeader>(
      `INSERT INTO clients
        (tenant_id, email, first_name, middle_name, last_name, phone,
         address_street, address_unit, address_city, address_state, address_zip,
         status, email_verified, assigned_broker_id, source)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,'active',0,?,'broker_created')`,
      [
        TENANT_ID,
        testEmail,
        "Schema",
        null,
        "Validate",
        "5550000000",
        null,
        null,
        null,
        null,
        null,
        brokerId,
      ],
    );
    const clientId = clientResult.insertId;

    const parsedLoanAmount = toSqlMoney("1120000")!;
    const parsedPropertyValue = toSqlMoney("1400000")!;
    const parsedDownPayment = toSqlMoney("280000")!;
    const parsedDependentCount = toSqlOptionalInt("NaN");
    const parsedYearsAtAddress = toSqlOptionalFloat("");

    const [loanResult] = await conn.query<mysql.ResultSetHeader>(
      `INSERT INTO loan_applications (
        tenant_id, application_number, client_user_id, broker_user_id, loan_type, loan_amount,
        property_value, property_address, property_unit, property_city, property_state, property_zip,
        property_type, down_payment, loan_purpose, marital_status, dependent_count, years_at_address,
        status, current_step, total_steps, estimated_close_date, notes, submitted_at
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,'app_sent',1,8,?,?,NOW())`,
      [
        TENANT_ID,
        appNumber,
        clientId,
        brokerId,
        "purchase",
        parsedLoanAmount,
        parsedPropertyValue,
        "1627 N Greycastle Ave",
        null,
        "Montebello",
        "CA",
        "90640",
        "single_family",
        parsedDownPayment,
        null,
        null,
        parsedDependentCount,
        parsedYearsAtAddress,
        null,
        null,
      ],
    );
    const applicationId = loanResult.insertId;

    await conn.query(
      `INSERT INTO tasks (
        tenant_id, application_id, title, description, task_type, status, priority,
        assigned_to_user_id, created_by_broker_id, due_date, template_id
      ) VALUES (?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?, ?)`,
      [
        TENANT_ID,
        applicationId,
        "Government-Issued ID",
        "Test task",
        "document_verification",
        "high",
        clientId,
        brokerId,
        new Date(),
        34,
      ],
    );

    console.log(`✅ Dry-run INSERT succeeded (loan id ${applicationId}, client ${clientId})`);
    console.log("   Used NaN-sanitized dependent_count=null, years_at_address=null");
  } catch (err) {
    failed = true;
    console.error("❌ Dry-run INSERT failed:");
    console.error(err instanceof Error ? err.message : err);
  } finally {
    await conn.rollback();
    console.log("↩️  Transaction rolled back (no data persisted)");
  }

  await conn.end();

  if (failed) {
    console.error("\n⛔ Validation failed.\n");
    process.exit(1);
  }

  console.log("\n✅ All checks passed — safe to deploy create-loan NaN fix.\n");
  console.log(
    "   Note: if prod was missing MISMO columns, apply migration first:\n" +
      "   database/migrations/20260505_120000_add_mismo_borrower_fields.sql\n",
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
