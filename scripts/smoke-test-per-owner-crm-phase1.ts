/**
 * Phase 1 smoke tests — per-owner phone UNIQUE + flag-gated conflict scope.
 * Synthetic @smoke-pocrm-p1.local data; entire run ROLLS BACK.
 *
 * Usage: npx tsx scripts/smoke-test-per-owner-crm-phase1.ts
 */
import "dotenv/config";
import mysql, {
  type Connection,
  type RowDataPacket,
  type ResultSetHeader,
} from "mysql2/promise";
import {
  resolveClientPhoneConflictScope,
  resolvePerOwnerCrmActive,
} from "../shared/per-owner-crm.ts";

const TENANT_ID = Number(process.env.MORTGAGE_TENANT_ID ?? "1");

interface CaseResult {
  name: string;
  pass: boolean;
  detail?: string;
}

const cases: CaseResult[] = [];
const pass = (n: string, d?: string) => cases.push({ name: n, pass: true, detail: d });
const fail = (n: string, d?: string) => cases.push({ name: n, pass: false, detail: d });

function requireEnv(name: string): string {
  const v = process.env[name]?.trim();
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

async function indexExists(
  conn: Connection,
  table: string,
  indexName: string,
): Promise<boolean> {
  const [rows] = await conn.query<RowDataPacket[]>(
    `SELECT COUNT(*) AS c FROM information_schema.STATISTICS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND INDEX_NAME = ?`,
    [table, indexName],
  );
  return Number(rows[0]?.c ?? 0) > 0;
}

async function insertBroker(conn: Connection, email: string): Promise<number> {
  const [r] = await conn.query<ResultSetHeader>(
    `INSERT INTO brokers
       (tenant_id, email, first_name, last_name, role, status, email_verified, created_by_broker_id, public_token)
     VALUES (?, ?, 'Smoke', 'P1', 'admin', 'active', 0, NULL, UUID())`,
    [TENANT_ID, email],
  );
  return r.insertId;
}

async function insertClient(
  conn: Connection,
  email: string,
  brokerId: number,
  phone: string,
): Promise<number> {
  const norm = phone.replace(/\D/g, "").slice(-10);
  const [r] = await conn.query<ResultSetHeader>(
    `INSERT INTO clients
       (tenant_id, email, first_name, last_name, phone, normalized_phone, income_type, assigned_broker_id, source, list_visibility)
     VALUES (?, ?, 'Smoke', 'Borrower', ?, ?, 'W-2', ?, 'smoke_test', 'active')`,
    [TENANT_ID, email, phone, norm, brokerId],
  );
  return r.insertId;
}

async function runTests(conn: Connection) {
  const runId = `SMKP1${Date.now()}`;

  if (await indexExists(conn, "clients", "uq_clients_tenant_owner_norm_phone"))
    pass("preflight: per-owner UNIQUE index present");
  else
    fail("preflight: Phase 1 migration not applied", "run 20260708_180000 migration");

  const brokerA = await insertBroker(conn, `${runId}-a@smoke-pocrm-p1.local`);
  const brokerB = await insertBroker(conn, `${runId}-b@smoke-pocrm-p1.local`);
  const phone = `555${String(Date.now()).slice(-7)}`;

  await insertClient(conn, `${runId}-a@client.local`, brokerA, phone);

  // Cross-owner insert succeeds at DB
  let crossOk = false;
  try {
    await insertClient(conn, `${runId}-b@client.local`, brokerB, phone);
    crossOk = true;
  } catch (e: any) {
    fail("db: cross-owner same phone", e?.message);
  }
  if (crossOk) pass("db: two owners can share the same phone number");

  // Same-owner duplicate fails
  let sameBlocked = false;
  try {
    await insertClient(conn, `${runId}-dup@client.local`, brokerA, phone);
  } catch {
    sameBlocked = true;
  }
  if (sameBlocked) pass("db: same owner cannot have duplicate phone");
  else fail("db: same-owner duplicate should violate UNIQUE");

  // list_visibility backfill
  const [[vis]] = await conn.query<RowDataPacket[]>(
    `SELECT list_visibility FROM clients WHERE email = ? LIMIT 1`,
    [`${runId}-a@client.local`],
  );
  if (vis?.list_visibility === "active")
    pass("data: list_visibility active on new clients");
  else fail("data: list_visibility", String(vis?.list_visibility));

  // API conflict scope: flags OFF → tenant-wide (legacy)
  const legacy = resolvePerOwnerCrmActive({ enabled: false, brokerId: brokerB });
  if (resolveClientPhoneConflictScope(legacy, brokerB) === "tenant")
    pass("api-scope: flags OFF uses tenant-wide phone conflicts");
  else fail("api-scope: legacy should be tenant-wide");

  const active = resolvePerOwnerCrmActive({ enabled: true, brokerId: brokerB });
  if (resolveClientPhoneConflictScope(active, brokerB) === "per_owner")
    pass("api-scope: flags ON uses per-owner conflicts for assigned broker");
  else fail("api-scope: active should be per_owner");

  // Simulate tenant-wide conflict query (flags off behavior)
  const norm = phone.replace(/\D/g, "").slice(-10);
  const [tenantWide] = await conn.query<RowDataPacket[]>(
    `SELECT COUNT(*) AS c FROM clients
     WHERE tenant_id = ? AND normalized_phone = ? AND phone IS NOT NULL`,
    [TENANT_ID, norm],
  );
  if (Number(tenantWide[0]?.c) >= 2)
    pass("legacy-check: tenant-wide query finds cross-owner duplicates (API blocks when flags off)");
  else fail("legacy-check: expected 2 clients with same phone");

  // Simulate per-owner conflict query (flags on behavior) — broker B only sees own row
  const [ownerBOnly] = await conn.query<RowDataPacket[]>(
    `SELECT COUNT(*) AS c FROM clients
     WHERE tenant_id = ? AND normalized_phone = ? AND phone IS NOT NULL AND assigned_broker_id = ?`,
    [TENANT_ID, norm, brokerB],
  );
  if (Number(ownerBOnly[0]?.c) === 1)
    pass("per-owner-check: broker B sees only their own phone row when scoped");
  else fail("per-owner-check: broker B row count", String(ownerBOnly[0]?.c));
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
    console.log("\n=== Per-Owner CRM Phase 1 Smoke Tests ===\n");
    let failed = 0;
    for (const c of cases) {
      console.log(`${c.pass ? "✅" : "❌"} ${c.name}${c.detail ? ` — ${c.detail}` : ""}`);
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
