/**
 * Phase 0 smoke tests for Per-Owner CRM foundation.
 * Validates new tables/columns/flags exist and behave correctly with flags OFF.
 * Uses synthetic @smoke-pocrm.local data; entire run ROLLS BACK.
 *
 * Usage: npx tsx scripts/smoke-test-per-owner-crm-phase0.ts
 */
import "dotenv/config";
import mysql, {
  type Connection,
  type RowDataPacket,
  type ResultSetHeader,
} from "mysql2/promise";
import {
  PER_OWNER_CRM_SETTING_KEYS,
  resolvePerOwnerCrmFromEnv,
  resolvePerOwnerCrmActive,
  resolveClientPhoneConflictScope,
} from "../shared/per-owner-crm.ts";

const TENANT_ID = Number(process.env.MORTGAGE_TENANT_ID ?? "1");

interface CaseResult {
  name: string;
  pass: boolean;
  detail?: string;
}

const cases: CaseResult[] = [];
const pass = (name: string, detail?: string) =>
  cases.push({ name, pass: true, detail });
const fail = (name: string, detail?: string) =>
  cases.push({ name, pass: false, detail });

function requireEnv(name: string): string {
  const v = process.env[name]?.trim();
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

async function columnExists(
  conn: Connection,
  table: string,
  column: string,
): Promise<boolean> {
  const [rows] = await conn.query<RowDataPacket[]>(
    `SELECT COUNT(*) AS c FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [table, column],
  );
  return Number(rows[0]?.c ?? 0) > 0;
}

async function tableExists(conn: Connection, table: string): Promise<boolean> {
  const [rows] = await conn.query<RowDataPacket[]>(
    `SELECT COUNT(*) AS c FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?`,
    [table],
  );
  return Number(rows[0]?.c ?? 0) > 0;
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
     VALUES (?, ?, 'Smoke', 'POCRM', 'admin', 'active', 0, NULL, UUID())`,
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
       (tenant_id, email, first_name, last_name, phone, normalized_phone, income_type, assigned_broker_id, source)
     VALUES (?, ?, 'Smoke', 'Borrower', ?, ?, 'W-2', ?, 'smoke_test')`,
    [TENANT_ID, email, phone, norm, brokerId],
  );
  return r.insertId;
}

async function getSetting(
  conn: Connection,
  key: string,
): Promise<string | null> {
  const [rows] = await conn.query<RowDataPacket[]>(
    `SELECT setting_value FROM system_settings
     WHERE setting_key = ? AND (tenant_id = ? OR tenant_id IS NULL)
     ORDER BY tenant_id DESC LIMIT 1`,
    [key, TENANT_ID],
  );
  return rows[0]?.setting_value != null
    ? String(rows[0].setting_value)
    : null;
}

async function runTests(conn: Connection) {
  const runId = `SMKPO${Date.now()}`;

  // ── Preflight: Phase 0 schema present ─────────────────────────────────────
  const tables = [
    "crm_person_groups",
    "crm_person_group_members",
    "crm_transfer_jobs",
  ];
  for (const t of tables) {
    if (await tableExists(conn, t)) pass(`schema: table ${t} exists`);
    else fail(`schema: table ${t} exists`, "Run migration 20260708_173000");
  }

  if (await columnExists(conn, "clients", "list_visibility"))
    pass("schema: clients.list_visibility column exists");
  else fail("schema: clients.list_visibility", "migration not applied");

  if (await columnExists(conn, "conversation_threads", "owner_client_scope_broker_id"))
    pass("schema: conversation_threads.owner_client_scope_broker_id exists");
  else fail("schema: owner_client_scope_broker_id", "migration not applied");

  // Phase 1: per-owner phone UNIQUE (tenant-wide removed)
  if (await indexExists(conn, "clients", "uq_clients_tenant_owner_norm_phone"))
    pass("schema: per-owner phone UNIQUE index exists (Phase 1)");
  else fail("schema: uq_clients_tenant_owner_norm_phone", "Phase 1 not applied");

  if (!(await indexExists(conn, "clients", "uq_clients_tenant_norm_phone")))
    pass("schema: legacy tenant-wide phone UNIQUE removed");
  else fail("schema: old uq_clients_tenant_norm_phone still present");

  // ── Feature flags (env vars — default OFF) ────────────────────────────────
  const flagsDefault = resolvePerOwnerCrmActive({});
  if (!flagsDefault.activeForBroker)
    pass("flags: inactive when not enabled");
  else fail("flags: should be inactive by default", JSON.stringify(flagsDefault));

  const flagsOn = resolvePerOwnerCrmFromEnv({
    enabled: "1",
    brokerId: 3,
  });
  if (flagsOn.activeForBroker) pass("flags: active when ENABLED=1");
  else fail("flags: should be active when enabled", JSON.stringify(flagsOn));

  // Legacy system_settings rows may still exist from Phase 0 — not read at runtime.
  const enabled = await getSetting(conn, PER_OWNER_CRM_SETTING_KEYS.enabled);
  if (enabled != null) pass("legacy: system_settings rows present (ignored at runtime)");
  else pass("legacy: no system_settings rows");

  // ── Synthetic data exercises new tables (rolled back) ─────────────────────
  const brokerA = await insertBroker(conn, `${runId}-a@smoke-pocrm.local`);
  const brokerB = await insertBroker(conn, `${runId}-b@smoke-pocrm.local`);
  const phone = `555${String(Date.now()).slice(-7)}`;
  const clientA = await insertClient(
    conn,
    `${runId}-client@smoke-pocrm.local`,
    brokerA,
    phone,
  );

  const [grp] = await conn.query<ResultSetHeader>(
    `INSERT INTO crm_person_groups
       (tenant_id, status, created_by_broker_id, notes)
     VALUES (?, 'pending', ?, 'smoke link request')`,
    [TENANT_ID, brokerA],
  );
  const groupId = grp.insertId;

  await conn.query(
    `INSERT INTO crm_person_group_members
       (tenant_id, group_id, entity_type, entity_id, role)
     VALUES (?, ?, 'client', ?, 'member')`,
    [TENANT_ID, groupId, clientA],
  );

  const [memRows] = await conn.query<RowDataPacket[]>(
    `SELECT COUNT(*) AS c FROM crm_person_group_members WHERE group_id = ?`,
    [groupId],
  );
  if (Number(memRows[0]?.c) === 1) pass("data: person group member inserted");
  else fail("data: group member count", String(memRows[0]?.c));

  // Duplicate entity in another group should fail (uq_cpgm_entity)
  let dupBlocked = false;
  const [grp2] = await conn.query<ResultSetHeader>(
    `INSERT INTO crm_person_groups (tenant_id, status, created_by_broker_id)
     VALUES (?, 'pending', ?)`,
    [TENANT_ID, brokerB],
  );
  try {
    await conn.query(
      `INSERT INTO crm_person_group_members
         (tenant_id, group_id, entity_type, entity_id)
       VALUES (?, ?, 'client', ?)`,
      [TENANT_ID, grp2.insertId, clientA],
    );
  } catch {
    dupBlocked = true;
  }
  if (dupBlocked) pass("integrity: entity cannot join two groups");
  else fail("integrity: duplicate group member should be blocked");

  const [tj] = await conn.query<ResultSetHeader>(
    `INSERT INTO crm_transfer_jobs
       (tenant_id, from_broker_id, to_broker_id, source_entity_type, source_entity_id, created_by_broker_id)
     VALUES (?, ?, ?, 'client', ?, ?)`,
    [TENANT_ID, brokerA, brokerB, clientA, brokerA],
  );
  if (tj.insertId > 0) pass("data: transfer job inserted");
  else fail("data: transfer job insert");

  // list_visibility defaults active on new client
  const [[clientRow]] = await conn.query<RowDataPacket[]>(
    `SELECT list_visibility, hidden_reason, hidden_at FROM clients WHERE id = ?`,
    [clientA],
  );
  if (clientRow?.list_visibility === "active")
    pass("defaults: new client list_visibility is active");
  else fail("defaults: list_visibility", String(clientRow?.list_visibility));

  if (clientRow?.hidden_reason == null && clientRow?.hidden_at == null)
    pass("defaults: hidden_reason/hidden_at null on new client");
  else fail("defaults: hidden fields should be null");

  // Soft-hide without breaking row (Phase 4 behavior prep)
  await conn.query(
    `UPDATE clients SET list_visibility = 'hidden', hidden_reason = 'transfer', hidden_at = NOW() WHERE id = ?`,
    [clientA],
  );
  const [[hidden]] = await conn.query<RowDataPacket[]>(
    `SELECT list_visibility FROM clients WHERE id = ?`,
    [clientA],
  );
  if (hidden?.list_visibility === "hidden")
    pass("visibility: client can be soft-hidden without delete");
  else fail("visibility: soft-hide", String(hidden?.list_visibility));

  // Phase 1: DB allows same phone for different owners; blocks same owner twice
  let crossOwnerOk = false;
  try {
    await insertClient(
      conn,
      `${runId}-dup@smoke-pocrm.local`,
      brokerB,
      phone,
    );
    crossOwnerOk = true;
  } catch {
    crossOwnerOk = false;
  }
  if (crossOwnerOk)
    pass("phase1: same phone allowed for a different owner (DB level)");
  else fail("phase1: cross-owner duplicate should be allowed at DB");

  let sameOwnerDupBlocked = false;
  try {
    await insertClient(
      conn,
      `${runId}-dup2@smoke-pocrm.local`,
      brokerA,
      phone,
    );
  } catch {
    sameOwnerDupBlocked = true;
  }
  if (sameOwnerDupBlocked)
    pass("phase1: duplicate phone for same owner blocked by per-owner UNIQUE");
  else fail("phase1: same-owner duplicate should be blocked");

  // Thread scope column nullable (no forced backfill in Phase 0)
  const [loan] = await conn.query<ResultSetHeader>(
    `INSERT INTO loan_applications
       (tenant_id, application_number, client_user_id, broker_user_id, loan_type,
        loan_amount, property_value, down_payment, status, current_step, total_steps)
     VALUES (?, ?, ?, ?, 'purchase', 100000, 200000, 50000, 'draft', 1, 8)`,
    [TENANT_ID, `${runId}-LA`, clientA, brokerA],
  );
  const [thread] = await conn.query<ResultSetHeader>(
    `INSERT INTO conversation_threads
       (tenant_id, conversation_id, client_id, broker_id, owner_client_scope_broker_id,
        last_message_at, last_message_type, message_count)
     VALUES (?, ?, ?, ?, NULL, NOW(), 'sms', 0)`,
    [TENANT_ID, `conv_smoke_${runId}`, clientA, brokerA],
  );
  const [[th]] = await conn.query<RowDataPacket[]>(
    `SELECT owner_client_scope_broker_id FROM conversation_threads WHERE id = ?`,
    [thread.insertId],
  );
  if (th?.owner_client_scope_broker_id == null)
    pass("threads: owner_client_scope_broker_id nullable (legacy threads OK)");
  else
    fail("threads: scope should be null until Phase 2 backfill", String(th?.owner_client_scope_broker_id));

  // Can set scope when ready (Phase 2+)
  await conn.query(
    `UPDATE conversation_threads SET owner_client_scope_broker_id = ? WHERE id = ?`,
    [brokerA, thread.insertId],
  );
  const [[scoped]] = await conn.query<RowDataPacket[]>(
    `SELECT owner_client_scope_broker_id FROM conversation_threads WHERE id = ?`,
    [thread.insertId],
  );
  if (Number(scoped?.owner_client_scope_broker_id) === brokerA)
    pass("threads: owner_client_scope_broker_id can be set explicitly");
  else fail("threads: scope update", String(scoped?.owner_client_scope_broker_id));

  void loan.insertId;
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
    console.log("\n=== Per-Owner CRM Phase 0 Smoke Tests ===\n");
    let failed = 0;
    for (const c of cases) {
      console.log(
        `${c.pass ? "✅" : "❌"} ${c.name}${c.detail ? ` — ${c.detail}` : ""}`,
      );
      if (!c.pass) failed++;
    }
    console.log(
      `\n${cases.length - failed}/${cases.length} passed (transaction rolled back)\n`,
    );
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
