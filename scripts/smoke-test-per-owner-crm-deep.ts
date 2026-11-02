/**
 * Deep edge-case tests — Per-Owner CRM (synthetic data, full ROLLBACK).
 * Covers flag matrix, isolation, visibility, threads, transfers, blast dedupe.
 *
 * Usage: npx tsx scripts/smoke-test-per-owner-crm-deep.ts
 */
import "dotenv/config";
import mysql, {
  type Connection,
  type RowDataPacket,
  type ResultSetHeader,
} from "mysql2/promise";
import {
  resolvePerOwnerCrmFromEnv,
  resolvePerOwnerCrmActive,
  resolveClientPhoneConflictScope,
  clientListVisibilityFilter,
  clientPhoneConflictWhere,
  perOwnerClientListWhere,
  perOwnerThreadMineWhere,
  perOwnerThreadSharedQueueWhere,
  defaultConversationInboxScope,
  normalizePhoneLast10,
  parsePilotBrokerIds,
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

function runFlagMatrix() {
  const off = resolvePerOwnerCrmActive({ enabled: false });
  if (!off.activeForBroker) pass("flags: disabled → inactive");
  else fail("flags: disabled");

  const prodOn = resolvePerOwnerCrmFromEnv({
    enabled: "1",
    brokerId: 1,
  });
  if (prodOn.activeForBroker) pass("flags: ENABLED=1 in production → active");
  else fail("flags: prod on");

  if (parsePilotBrokerIds("[1,2,3]").join() === "1,2,3") pass("flags: JSON pilot parse (legacy helper)");
  else fail("flags: JSON pilot");

  const scopeOff = resolveClientPhoneConflictScope(
    resolvePerOwnerCrmActive({ enabled: false }),
    5,
  );
  if (scopeOff === "tenant") pass("scope: legacy tenant-wide when CRM off");
  else fail("scope: legacy");

  const flagsOn = resolvePerOwnerCrmFromEnv({
    enabled: "1",
    brokerId: 1,
  });
  if (resolveClientPhoneConflictScope(flagsOn, 5) === "per_owner")
    pass("scope: per_owner when CRM on + assigned broker");
  else fail("scope: per_owner");

  if (resolveClientPhoneConflictScope(flagsOn, null) === "tenant")
    pass("scope: tenant when no assigned broker");
  else fail("scope: null assignee");

  if (clientListVisibilityFilter(flagsOn).join() === "active")
    pass("visibility filter: active only when CRM on");
  else fail("visibility filter on");

  if (defaultConversationInboxScope(flagsOn) === "mine")
    pass("inbox default: mine when CRM on");
  else fail("inbox default on");

  if (defaultConversationInboxScope(off) === "all") pass("inbox default: all when CRM off");
  else fail("inbox default off");
}

async function insertBroker(
  conn: Connection,
  email: string,
  opts: { twilio?: string; createdBy?: number | null } = {},
): Promise<number> {
  const [r] = await conn.query<ResultSetHeader>(
    `INSERT INTO brokers
       (tenant_id, email, first_name, last_name, role, status, email_verified,
        created_by_broker_id, public_token, twilio_caller_id)
     VALUES (?, ?, 'Deep', 'Test', 'admin', 'active', 0, ?, UUID(), ?)`,
    [TENANT_ID, email, opts.createdBy ?? null, opts.twilio ?? null],
  );
  return r.insertId;
}

async function insertClient(
  conn: Connection,
  email: string,
  brokerId: number,
  phone: string,
  visibility: "active" | "hidden" | "archived" = "active",
): Promise<number> {
  const norm = normalizePhoneLast10(phone);
  const [r] = await conn.query<ResultSetHeader>(
    `INSERT INTO clients
       (tenant_id, email, first_name, last_name, phone, normalized_phone, income_type,
        assigned_broker_id, source, list_visibility)
     VALUES (?, ?, 'Deep', 'Client', ?, ?, 'W-2', ?, 'smoke_deep', ?)`,
    [TENANT_ID, email, phone, norm, brokerId, visibility],
  );
  return r.insertId;
}

/** Mirrors API scoped phone resolution when CRM enabled. */
async function scopedPhoneLookup(
  conn: Connection,
  brokerId: number,
  norm: string,
): Promise<number | null> {
  const [rows] = await conn.query<RowDataPacket[]>(
    `SELECT id FROM clients
     WHERE tenant_id = ? AND assigned_broker_id = ?
       AND list_visibility = 'active' AND phone IS NOT NULL
       AND (normalized_phone = ? OR RIGHT(REGEXP_REPLACE(phone, '[^0-9]', ''), 10) = ?)
     LIMIT 1`,
    [TENANT_ID, brokerId, norm, norm],
  );
  return rows[0]?.id != null ? Number(rows[0].id) : null;
}

async function runDbEdgeCases(conn: Connection) {
  const runId = Date.now();
  const phone = `562777${String(runId).slice(-4)}`;
  const norm = normalizePhoneLast10(phone);

  const mbA = await insertBroker(conn, `deep-a-${runId}@smoke.local`, {
    twilio: `+1562777${String(runId).slice(-4)}`,
  });
  const mbB = await insertBroker(conn, `deep-b-${runId}@smoke.local`, {
    twilio: `+1562778${String(runId).slice(-4)}`,
  });
  const mbC = await insertBroker(conn, `deep-c-${runId}@smoke.local`);

  const rowA = await insertClient(conn, `a-${runId}@smoke.local`, mbA, phone);
  const rowB = await insertClient(conn, `b-${runId}@smoke.local`, mbB, phone);
  const rowHidden = await insertClient(
    conn,
    `hidden-${runId}@smoke.local`,
    mbA,
    `562888${String(runId).slice(-4)}`,
    "hidden",
  );
  const rowArchived = await insertClient(
    conn,
    `arch-${runId}@smoke.local`,
    mbA,
    `562999${String(runId).slice(-4)}`,
    "archived",
  );

  // Cross-owner same phone
  const [crossCount] = await conn.query<RowDataPacket[]>(
    `SELECT COUNT(*) AS c FROM clients WHERE tenant_id = ? AND normalized_phone = ?`,
    [TENANT_ID, norm],
  );
  if (Number(crossCount[0]?.c) >= 2) pass("edge: two owners same phone in DB");
  else fail("edge: cross-owner phone");

  // Same-owner duplicate blocked
  let dupBlocked = false;
  try {
    await conn.query(
      `INSERT INTO clients
         (tenant_id, email, first_name, last_name, phone, normalized_phone, assigned_broker_id, source)
       VALUES (?, ?, 'X', 'Y', ?, ?, ?, 'smoke')`,
      [TENANT_ID, `dup-${runId}@smoke.local`, phone, norm, mbA],
    );
  } catch {
    dupBlocked = true;
  }
  if (dupBlocked) pass("edge: same-owner duplicate phone rejected by UNIQUE");
  else fail("edge: same-owner dup should fail");

  // Scoped phone lookup isolation
  const lookA = await scopedPhoneLookup(conn, mbA, norm);
  const lookB = await scopedPhoneLookup(conn, mbB, norm);
  if (lookA === rowA && lookB === rowB && lookA !== lookB)
    pass("edge: scoped lookup returns correct owner row each");
  else fail("edge: scoped lookup", `A=${lookA} B=${lookB}`);

  if ((await scopedPhoneLookup(conn, mbC, norm)) == null)
    pass("edge: third MB gets null for phone they do not own");
  else fail("edge: third MB isolation");

  // Client list — hidden/archived excluded
  const listSql = `SELECT id FROM clients c WHERE c.tenant_id = ? AND ${perOwnerClientListWhere("c")}`;
  const [listA] = await conn.query<RowDataPacket[]>(listSql, [TENANT_ID, mbA]);
  const ids = listA.map((r) => Number(r.id));
  if (ids.includes(rowA) && !ids.includes(rowB) && !ids.includes(rowHidden) && !ids.includes(rowArchived))
    pass("edge: client list active-only + owner scoped");
  else fail("edge: client list", ids.join(","));

  // Threads: mine / shared / cross-leak
  const convShared = `conv_deep_shared_${runId}`;
  const convMineA = `conv_deep_mine_a_${runId}`;
  const convMineB = `conv_deep_mine_b_${runId}`;
  const convLeak = `conv_deep_leak_${runId}`;

  await conn.query(
    `INSERT INTO conversation_threads
       (tenant_id, conversation_id, client_id, broker_id, client_phone, normalized_client_phone,
        last_message_at, last_message_preview, last_message_type, message_count, unread_count, status)
     VALUES (?, ?, NULL, NULL, ?, ?, NOW(), 'shared', 'sms', 1, 1, 'active')`,
    [TENANT_ID, convShared, phone, norm],
  );
  await conn.query(
    `INSERT INTO conversation_threads
       (tenant_id, conversation_id, client_id, broker_id, owner_client_scope_broker_id,
        client_phone, normalized_client_phone, last_message_at, last_message_preview,
        last_message_type, message_count, unread_count, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), 'mineA', 'sms', 1, 0, 'active')`,
    [TENANT_ID, convMineA, rowA, mbA, mbA, phone, norm],
  );
  await conn.query(
    `INSERT INTO conversation_threads
       (tenant_id, conversation_id, client_id, broker_id, owner_client_scope_broker_id,
        client_phone, normalized_client_phone, last_message_at, last_message_preview,
        last_message_type, message_count, unread_count, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), 'mineB', 'sms', 1, 0, 'active')`,
    [TENANT_ID, convMineB, rowB, mbB, mbB, phone, norm],
  );
  // Thread owned by B but queried with A's mine filter — must not appear
  await conn.query(
    `INSERT INTO conversation_threads
       (tenant_id, conversation_id, client_id, broker_id, owner_client_scope_broker_id,
        client_phone, normalized_client_phone, last_message_at, last_message_preview,
        last_message_type, message_count, unread_count, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), 'leak', 'sms', 1, 0, 'active')`,
    [TENANT_ID, convLeak, rowB, mbB, mbB, phone, norm],
  );

  const mineA = await conn.query<RowDataPacket[]>(
    `SELECT conversation_id FROM conversation_threads ct
     WHERE ct.tenant_id = ? AND ct.conversation_id IN (?,?,?,?)
       AND ${perOwnerThreadMineWhere("ct")}`,
    [TENANT_ID, convShared, convMineA, convMineB, convLeak, mbA, mbA, mbA],
  );
  const mineAIds = mineA[0].map((r) => r.conversation_id);
  if (mineAIds.includes(convMineA) && !mineAIds.includes(convMineB) && !mineAIds.includes(convLeak) && !mineAIds.includes(convShared))
    pass("edge: mine tab excludes other owner + shared queue");
  else fail("edge: mine isolation", mineAIds.join(","));

  const mineB = await conn.query<RowDataPacket[]>(
    `SELECT conversation_id FROM conversation_threads ct
     WHERE ct.tenant_id = ? AND ct.conversation_id IN (?,?,?)
       AND ${perOwnerThreadMineWhere("ct")}`,
    [TENANT_ID, convMineA, convMineB, convShared, mbB, mbB, mbB],
  );
  const mineBIds = mineB[0].map((r) => r.conversation_id);
  if (mineBIds.includes(convMineB) && !mineBIds.includes(convMineA) && !mineBIds.includes(convShared))
    pass("edge: MB B mine tab symmetric isolation");
  else fail("edge: mine B", mineBIds.join(","));

  const [sharedRows] = await conn.query<RowDataPacket[]>(
    `SELECT conversation_id FROM conversation_threads ct
     WHERE ct.tenant_id = ? AND ct.conversation_id IN (?,?,?)
       AND ${perOwnerThreadSharedQueueWhere("ct")}`,
    [TENANT_ID, convShared, convMineA, convMineB],
  );
  if (
    sharedRows.length === 1 &&
    sharedRows[0].conversation_id === convShared
  )
    pass("edge: shared tab only unclaimed threads");
  else fail("edge: shared tab", String(sharedRows.length));

  // Claim pattern: stamp broker + client + scope
  await conn.query(
    `UPDATE conversation_threads
     SET client_id = ?, broker_id = ?, owner_client_scope_broker_id = ?, updated_at = NOW()
     WHERE conversation_id = ? AND tenant_id = ? AND client_id IS NULL AND broker_id IS NULL`,
    [rowB, mbB, mbB, convShared, TENANT_ID],
  );
  const [[claimed]] = await conn.query<RowDataPacket[]>(
    `SELECT client_id, broker_id, owner_client_scope_broker_id FROM conversation_threads
     WHERE conversation_id = ?`,
    [convShared],
  );
  if (
    Number(claimed?.client_id) === rowB &&
    Number(claimed?.broker_id) === mbB &&
    Number(claimed?.owner_client_scope_broker_id) === mbB
  )
    pass("edge: claim stamps client + broker + scope");
  else fail("edge: claim stamp");

  const [sharedAfterClaim] = await conn.query<RowDataPacket[]>(
    `SELECT 1 FROM conversation_threads ct
     WHERE ct.conversation_id = ? AND ${perOwnerThreadSharedQueueWhere("ct")}`,
    [convShared],
  );
  if (sharedAfterClaim.length === 0) pass("edge: claimed thread leaves shared queue");
  else fail("edge: post-claim shared");

  // Phone conflict SQL — per_owner vs tenant
  const scopePerOwner = "per_owner" as const;
  const conflictSql = `SELECT id FROM clients c WHERE ${clientPhoneConflictWhere(scopePerOwner)} LIMIT 1`;
  const [conflictA] = await conn.query<RowDataPacket[]>(conflictSql, [
    TENANT_ID,
    norm,
    mbA,
  ]);
  const [conflictB] = await conn.query<RowDataPacket[]>(conflictSql, [
    TENANT_ID,
    norm,
    mbB,
  ]);
  if (Number(conflictA[0]?.id) === rowA && Number(conflictB[0]?.id) === rowB)
    pass("edge: phone conflict scoped per owner");
  else fail("edge: phone conflict scope");

  // Transfer hide pattern
  await conn.query(
    `UPDATE clients SET list_visibility = 'hidden', hidden_reason = 'transfer', hidden_at = NOW()
     WHERE id = ?`,
    [rowA],
  );
  const [listAfterHide] = await conn.query<RowDataPacket[]>(listSql, [TENANT_ID, mbA]);
  if (!listAfterHide.some((r) => Number(r.id) === rowA))
    pass("edge: hidden after transfer not in active list");
  else fail("edge: hidden list");

  // Blast dedupe simulation
  const blastCandidates = [
    { id: rowA, phone, norm },
    { id: rowB, phone, norm },
    { id: rowHidden, phone: `562888${String(runId).slice(-4)}`, norm: normalizePhoneLast10(`562888${String(runId).slice(-4)}`) },
  ];
  const seen = new Set<string>();
  let blastCount = 0;
  for (const c of blastCandidates) {
    if (c.norm && seen.has(c.norm)) continue;
    if (c.norm) seen.add(c.norm);
    blastCount++;
  }
  if (blastCount === 2) pass("edge: blast dedupe one SMS per normalized_phone");
  else fail("edge: blast dedupe", String(blastCount));

  // Realtor scoping by created_by_broker_id
  const realtorPhone = `562666${String(runId).slice(-4)}`;
  const [rA] = await conn.query<ResultSetHeader>(
    `INSERT INTO brokers
       (tenant_id, email, first_name, last_name, role, status, email_verified, phone,
        created_by_broker_id, public_token)
     VALUES (?, ?, 'Jane', 'Doe', 'broker', 'active', 0, ?, ?, UUID())`,
    [TENANT_ID, `realtor-a-${runId}@smoke.local`, realtorPhone, mbA],
  );
  const [rB] = await conn.query<ResultSetHeader>(
    `INSERT INTO brokers
       (tenant_id, email, first_name, last_name, role, status, email_verified, phone,
        created_by_broker_id, public_token)
     VALUES (?, ?, 'Jane', 'Realtor', 'broker', 'active', 0, ?, ?, UUID())`,
    [TENANT_ID, `realtor-b-${runId}@smoke.local`, realtorPhone, mbB],
  );
  const [realtorsA] = await conn.query<RowDataPacket[]>(
    `SELECT id FROM brokers WHERE tenant_id = ? AND role = 'broker' AND created_by_broker_id = ?`,
    [TENANT_ID, mbA],
  );
  if (
    realtorsA.some((r) => Number(r.id) === rA.insertId) &&
    !realtorsA.some((r) => Number(r.id) === rB.insertId)
  )
    pass("edge: realtor list scoped to created_by_broker_id");
  else fail("edge: realtor scope");

  // Person group duplicate entity
  const [grp] = await conn.query<ResultSetHeader>(
    `INSERT INTO crm_person_groups (tenant_id, status, created_by_broker_id) VALUES (?, 'pending', ?)`,
    [TENANT_ID, mbA],
  );
  await conn.query(
    `INSERT INTO crm_person_group_members (tenant_id, group_id, entity_type, entity_id)
     VALUES (?, ?, 'client', ?)`,
    [TENANT_ID, grp.insertId, rowB],
  );
  let memberDupBlocked = false;
  const [grp2] = await conn.query<ResultSetHeader>(
    `INSERT INTO crm_person_groups (tenant_id, status, created_by_broker_id) VALUES (?, 'pending', ?)`,
    [TENANT_ID, mbB],
  );
  try {
    await conn.query(
      `INSERT INTO crm_person_group_members (tenant_id, group_id, entity_type, entity_id)
       VALUES (?, ?, 'client', ?)`,
      [TENANT_ID, grp2.insertId, rowB],
    );
  } catch {
    memberDupBlocked = true;
  }
  if (memberDupBlocked) pass("edge: client cannot join two person groups");
  else fail("edge: group member unique");

  // Regression: legacy thread list must NOT exempt any role (platform owner uses same filter)
  const legacyOwnershipSql = `SELECT conversation_id FROM conversation_threads ct
    WHERE ct.tenant_id = ? AND ct.conversation_id = ?
      AND (
        ct.broker_id = ?
        OR (ct.client_id IS NULL AND ct.broker_id IS NULL)
        OR EXISTS (
          SELECT 1 FROM clients cl_own
          WHERE cl_own.id = ct.client_id AND cl_own.tenant_id = ct.tenant_id
            AND (
              cl_own.assigned_broker_id = ?
              OR EXISTS (
                SELECT 1 FROM loan_applications la_own
                WHERE la_own.client_user_id = ct.client_id
                  AND la_own.tenant_id = ct.tenant_id
                  AND (la_own.broker_user_id = ? OR la_own.partner_broker_id = ?)
              )
            )
        )
      )`;
  const [mbCSeesB] = await conn.query<RowDataPacket[]>(legacyOwnershipSql, [
    TENANT_ID,
    convMineB,
    mbC,
    mbC,
    mbC,
    mbC,
  ]);
  const [mbBSeesB] = await conn.query<RowDataPacket[]>(legacyOwnershipSql, [
    TENANT_ID,
    convMineB,
    mbB,
    mbB,
    mbB,
    mbB,
  ]);
  if (mbCSeesB.length === 0 && mbBSeesB.length === 1)
    pass("regression: legacy filter hides other MB threads (incl. platform owner broker id)");
  else fail("regression: legacy platform-owner leak", `${mbCSeesB.length}/${mbBSeesB.length}`);

  // NULL normalized_phone — same owner two rows with null norm allowed (edge)
  const nullPhoneEmail1 = `null1-${runId}@smoke.local`;
  const nullPhoneEmail2 = `null2-${runId}@smoke.local`;
  try {
    await conn.query(
      `INSERT INTO clients
         (tenant_id, email, first_name, last_name, phone, normalized_phone, assigned_broker_id, source)
       VALUES (?, ?, 'N', '1', NULL, NULL, ?, 'smoke'), (?, ?, 'N', '2', NULL, NULL, ?, 'smoke')`,
      [TENANT_ID, nullPhoneEmail1, mbA, TENANT_ID, nullPhoneEmail2, mbA],
    );
    pass("edge: multiple null-phone rows same owner allowed");
  } catch (e) {
    fail("edge: null phone rows", String(e));
  }
}

async function main() {
  runFlagMatrix();

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
    await runDbEdgeCases(conn);
    await conn.rollback();
  } finally {
    await conn.end();
  }

  const passed = cases.filter((c) => c.pass).length;
  const failed = cases.filter((c) => !c.pass);
  for (const c of cases) {
    console.log(`${c.pass ? "✓" : "✗"} ${c.name}${c.detail ? ` — ${c.detail}` : ""}`);
  }
  console.log(`\n${passed}/${cases.length} passed (transaction rolled back)`);
  if (failed.length) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
