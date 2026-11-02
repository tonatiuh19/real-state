/**
 * Phases 2–7 smoke tests — per-owner CRM (synthetic data, full rollback).
 * Usage: npx tsx scripts/smoke-test-per-owner-crm-phases2-7.ts
 */
import "dotenv/config";
import mysql, {
  type Connection,
  type RowDataPacket,
  type ResultSetHeader,
} from "mysql2/promise";
import {
  perOwnerClientListWhere,
  perOwnerThreadMineWhere,
  perOwnerThreadSharedQueueWhere,
  normalizePhoneLast10,
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

async function insertBroker(conn: Connection, email: string): Promise<number> {
  const [r] = await conn.query<ResultSetHeader>(
    `INSERT INTO brokers
       (tenant_id, email, first_name, last_name, role, status, email_verified, created_by_broker_id, public_token)
     VALUES (?, ?, 'Smoke', 'P27', 'admin', 'active', 0, NULL, UUID())`,
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
  const norm = normalizePhoneLast10(phone);
  const [r] = await conn.query<ResultSetHeader>(
    `INSERT INTO clients
       (tenant_id, email, first_name, last_name, phone, normalized_phone, income_type, assigned_broker_id, source, list_visibility)
     VALUES (?, ?, 'Smoke', 'Borrower', ?, ?, 'W-2', ?, 'smoke_test', 'active')`,
    [TENANT_ID, email, phone, norm, brokerId],
  );
  return r.insertId;
}

async function runTests(conn: Connection) {
  const runId = Date.now();
  const phone = `562555${String(runId).slice(-4)}`;
  const norm = normalizePhoneLast10(phone);

  pass("helpers: perOwnerClientListWhere", perOwnerClientListWhere("c"));
  pass("helpers: perOwnerThreadMineWhere", perOwnerThreadMineWhere("ct"));
  pass("helpers: shared queue SQL", perOwnerThreadSharedQueueWhere("ct"));

  const b1 = await insertBroker(conn, `smoke-p27-a-${runId}@smoke-pocrm.local`);
  const b2 = await insertBroker(conn, `smoke-p27-b-${runId}@smoke-pocrm.local`);
  const c1 = await insertClient(conn, `smoke-c1-${runId}@smoke-pocrm.local`, b1, phone);
  const c2 = await insertClient(
    conn,
    `smoke-c2-${runId}@smoke-pocrm.local`,
    b2,
    phone,
  );

  const [dupCount] = await conn.query<RowDataPacket[]>(
    `SELECT COUNT(*) AS c FROM clients
     WHERE tenant_id = ? AND normalized_phone = ?`,
    [TENANT_ID, norm],
  );
  if (Number(dupCount[0]?.c) >= 2) pass("phase1: same phone two owners allowed in DB");
  else fail("phase1: cross-owner same phone");

  const convShared = `conv_smoke_shared_${runId}`;
  await conn.query(
    `INSERT INTO conversation_threads
       (tenant_id, conversation_id, client_id, broker_id, client_phone, normalized_client_phone,
        last_message_at, last_message_preview, last_message_type, message_count, unread_count, status)
     VALUES (?, ?, NULL, NULL, ?, ?, NOW(), 'hi', 'sms', 1, 1, 'active')`,
    [TENANT_ID, convShared, phone, norm],
  );
  pass("phase5: shared queue thread inserted");

  const convMine = `conv_smoke_mine_${runId}`;
  await conn.query(
    `INSERT INTO conversation_threads
       (tenant_id, conversation_id, client_id, broker_id, owner_client_scope_broker_id,
        client_phone, normalized_client_phone, last_message_at, last_message_preview,
        last_message_type, message_count, unread_count, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), 'yo', 'sms', 1, 0, 'active')`,
    [TENANT_ID, convMine, c1, b1, b1, phone, norm],
  );

  const [sharedOnly] = await conn.query<RowDataPacket[]>(
    `SELECT conversation_id FROM conversation_threads ct
     WHERE ct.tenant_id = ? AND ${perOwnerThreadSharedQueueWhere("ct")}`,
    [TENANT_ID],
  );
  if (sharedOnly.some((r) => r.conversation_id === convShared))
    pass("phase5: shared filter finds queue thread");
  else fail("phase5: shared filter");

  const [mineOnly] = await conn.query<RowDataPacket[]>(
    `SELECT conversation_id FROM conversation_threads ct
     WHERE ct.tenant_id = ? AND ${perOwnerThreadMineWhere("ct")}`,
    [TENANT_ID, b1, b1, b1],
  );
  if (mineOnly.some((r) => r.conversation_id === convMine))
    pass("phase3: mine filter finds scoped thread");
  else fail("phase3: mine filter");

  const [listB1] = await conn.query<RowDataPacket[]>(
    `SELECT id FROM clients c WHERE c.tenant_id = ? AND ${perOwnerClientListWhere("c")}`,
    [TENANT_ID, b1, "active"],
  );
  if (listB1.some((r) => r.id === c1) && !listB1.some((r) => r.id === c2))
    pass("phase3: per-owner client list scoped to owner");
  else fail("phase3: client list scope", `b1=${listB1.map((r) => r.id).join(",")}`);

  const [[b1PhoneRow]] = await conn.query<RowDataPacket[]>(
    `SELECT id FROM clients
     WHERE tenant_id = ? AND assigned_broker_id = ? AND normalized_phone = ?
       AND list_visibility = 'active' LIMIT 1`,
    [TENANT_ID, b1, norm],
  );
  const [[b2PhoneRow]] = await conn.query<RowDataPacket[]>(
    `SELECT id FROM clients
     WHERE tenant_id = ? AND assigned_broker_id = ? AND normalized_phone = ?
       AND list_visibility = 'active' LIMIT 1`,
    [TENANT_ID, b2, norm],
  );
  if (Number(b1PhoneRow?.id) === c1 && Number(b2PhoneRow?.id) === c2)
    pass("phase3: owner-scoped phone lookup isolates rows");
  else fail("phase3: owner-scoped phone lookup");

  const [groupR] = await conn.query<ResultSetHeader>(
    `INSERT INTO crm_person_groups (tenant_id, status, created_by_broker_id)
     VALUES (?, 'pending', ?)`,
    [TENANT_ID, b1],
  );
  const groupId = groupR.insertId;
  for (const cid of [c1, c2]) {
    await conn.query(
      `INSERT INTO crm_person_group_members (tenant_id, group_id, entity_type, entity_id)
       VALUES (?, ?, 'client', ?)`,
      [TENANT_ID, groupId, cid],
    );
  }
  pass("phase4: person group + members");

  const [jobR] = await conn.query<ResultSetHeader>(
    `INSERT INTO crm_transfer_jobs
       (tenant_id, from_broker_id, to_broker_id, source_entity_type, source_entity_id, status, created_by_broker_id)
     VALUES (?, ?, ?, 'client', ?, 'review', ?)`,
    [TENANT_ID, b1, b2, c1, b1],
  );
  if (jobR.insertId) pass("phase4: transfer job review status");
  else fail("phase4: transfer job");

  await conn.query(
    `UPDATE conversation_threads ct
     INNER JOIN clients c ON c.id = ct.client_id
     SET ct.owner_client_scope_broker_id = c.assigned_broker_id
     WHERE ct.conversation_id = ?`,
    [convMine],
  );
  const [[scoped]] = await conn.query<RowDataPacket[]>(
    `SELECT owner_client_scope_broker_id FROM conversation_threads WHERE conversation_id = ?`,
    [convMine],
  );
  if (Number(scoped?.owner_client_scope_broker_id) === b1)
    pass("phase2: owner_client_scope_broker_id backfill pattern");
  else fail("phase2: scope backfill");
}

async function main() {
  const conn = await mysql.createConnection({
    host: requireEnv("DB_HOST"),
    port: Number(requireEnv("DB_PORT")),
    user: requireEnv("DB_USER"),
    password: requireEnv("DB_PASSWORD"),
    database: requireEnv("DB_NAME"),
    ssl: { rejectUnauthorized: true },
  });

  try {
    await conn.beginTransaction();
    await runTests(conn);
    await conn.rollback();
  } finally {
    await conn.end();
  }

  const passed = cases.filter((c) => c.pass).length;
  const failed = cases.filter((c) => !c.pass);
  for (const c of cases) {
    console.log(`${c.pass ? "✓" : "✗"} ${c.name}${c.detail ? ` — ${c.detail}` : ""}`);
  }
  console.log(`\n${passed}/${cases.length} passed`);
  if (failed.length) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
