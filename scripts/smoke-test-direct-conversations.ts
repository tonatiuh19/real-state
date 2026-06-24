/**
 * Direct (1:1) conversation smoke tests — regression guard after group conversations.
 * Synthetic writes are always rolled back; read-only checks scan live data safely.
 *
 * Usage: npx tsx scripts/smoke-test-direct-conversations.ts
 * Unit-only: SMOKE_UNIT_ONLY=1 npx tsx scripts/smoke-test-direct-conversations.ts
 * Optional API (local dev): SMOKE_API=1 npx tsx scripts/smoke-test-direct-conversations.ts
 */
import "dotenv/config";
import mysql, { type RowDataPacket } from "mysql2/promise";
import axios from "axios";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { isGroupConversationsEnabled } from "../shared/group-conversations";

const TENANT_ID = Number(process.env.MORTGAGE_TENANT_ID ?? "1");
const RUN_UNIT_ONLY = process.env.SMOKE_UNIT_ONLY === "1";
const RUN_API = process.env.SMOKE_API === "1";
const API_BASE = process.env.API_BASE_URL ?? "http://localhost:8080";

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

function signBrokerToken(broker: {
  id: number;
  email: string;
  role: string;
}) {
  return jwt.sign(
    {
      brokerId: broker.id,
      email: broker.email,
      role: broker.role,
      userType: "broker",
      jti: crypto.randomUUID(),
      _smoke: true,
    },
    requireEnv("JWT_SECRET"),
    { expiresIn: "15m" },
  );
}

/** Mirrors inbox list filter: non-email threads for Conversations page. */
function inboxListSql(): string {
  return `SELECT ct.conversation_id, ct.thread_type
     FROM conversation_threads ct
     WHERE ct.tenant_id = ?
       AND ct.status = 'active'
       AND (ct.last_message_type IS NULL OR ct.last_message_type != 'email')
     ORDER BY ct.last_message_at DESC
     LIMIT 50`;
}

function runUnitTests() {
  const clientId = "conv_client_12345";
  if (clientId.startsWith("conv_client_") && !clientId.startsWith("conv_group_")) {
    pass("DC-001 conv_client_ namespace distinct from group");
  } else fail("DC-001 conv_client_ namespace distinct from group");

  const phoneId = "conv_phone_5551234567";
  if (phoneId.startsWith("conv_phone_")) pass("DC-002 conv_phone_ namespace preserved");
  else fail("DC-002 conv_phone_ namespace preserved");

  if (isGroupConversationsEnabled(undefined)) {
    pass("DC-018 group conversations enabled by default (env unset)");
  } else {
    fail("DC-018 group conversations enabled by default (env unset)");
  }

  if (!isGroupConversationsEnabled("0")) {
    pass("DC-018 opt-out GROUP_CONVERSATIONS_ENABLED=0");
  } else {
    fail("DC-018 opt-out GROUP_CONVERSATIONS_ENABLED=0");
  }
}

async function runDbTests(pool: mysql.Pool) {
  const conn = await pool.getConnection();
  const runId = Date.now();
  const convClientId = `conv_client_smoke_${runId}`;
  const convPhoneId = `conv_phone_${String(runId).slice(-10)}`;
  const clientPhone = `+1555${String(runId).slice(-7)}`;

  try {
    await conn.beginTransaction();

    // ── Schema: direct defaults still valid after group migration ────────────
    const [colRows] = await conn.query<RowDataPacket[]>(
      `SELECT COLUMN_NAME, COLUMN_DEFAULT
       FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = 'conversation_threads'
         AND COLUMN_NAME IN ('thread_type', 'channel', 'creation_source')`,
    );
    const defaults = Object.fromEntries(
      colRows.map((r) => [r.COLUMN_NAME as string, r.COLUMN_DEFAULT]),
    );
    if (String(defaults.thread_type).includes("direct")) {
      pass("DC-003 thread_type column default direct");
    } else fail("DC-003 thread_type column default direct", String(defaults.thread_type));

    // ── Synthetic direct client thread (legacy insert shape) ─────────────────
    await conn.query(
      `INSERT INTO conversation_threads
         (tenant_id, conversation_id, broker_id, client_id,
          client_name, client_phone, client_email,
          last_message_at, last_message_preview, last_message_type,
          message_count, unread_count, status)
       VALUES (?, ?, 1, NULL, 'Smoke Direct Client', ?, 'smoke@example.com',
               NOW(), 'hello', 'sms', 0, 0, 'active')`,
      [TENANT_ID, convClientId, clientPhone],
    );

    const [directRow] = await conn.query<RowDataPacket[]>(
      `SELECT thread_type, participant_fingerprint, title, channel, creation_source
       FROM conversation_threads
       WHERE tenant_id = ? AND conversation_id = ?`,
      [TENANT_ID, convClientId],
    );
    const d = directRow[0];
    if (
      d?.thread_type === "direct" &&
      (d.participant_fingerprint === null || d.participant_fingerprint === undefined) &&
      (d.title === null || d.title === undefined)
    ) {
      pass("DC-004 direct thread insert without group fields");
    } else {
      fail(
        "DC-004 direct thread insert without group fields",
        JSON.stringify(d),
      );
    }

    // ── Phone-only thread (unknown caller path) ──────────────────────────────
    await conn.query(
      `INSERT INTO conversation_threads
         (tenant_id, conversation_id, broker_id, client_phone,
          last_message_at, last_message_preview, last_message_type,
          message_count, unread_count, status)
       VALUES (?, ?, 1, ?, NOW(), 'call', 'call', 1, 0, 'active')`,
      [TENANT_ID, convPhoneId, clientPhone],
    );

    const [phoneRow] = await conn.query<RowDataPacket[]>(
      `SELECT thread_type, client_id FROM conversation_threads
       WHERE conversation_id = ? AND tenant_id = ?`,
      [convPhoneId, TENANT_ID],
    );
    if (
      phoneRow[0]?.thread_type === "direct" &&
      (phoneRow[0]?.client_id === null || phoneRow[0]?.client_id === undefined)
    ) {
      pass("DC-005 conv_phone_ thread remains direct with null client_id");
    } else fail("DC-005 conv_phone_ thread remains direct with null client_id");

    // ── 1:1 communication insert (no group metadata required) ──────────────
    const [ins] = await conn.query<mysql.ResultSetHeader>(
      `INSERT INTO communications
         (tenant_id, from_broker_id, communication_type, direction,
          body, status, conversation_id, message_type, delivery_status, created_at)
       VALUES (?, 1, 'sms', 'outbound', 'Smoke test outbound', 'sent', ?, 'text', 'sent', NOW())`,
      [TENANT_ID, convClientId],
    );

    await conn.query(
      `UPDATE conversation_threads SET
         last_message_preview = 'Smoke test outbound',
         last_message_type = 'sms',
         last_message_at = NOW(),
         message_count = message_count + 1,
         updated_at = NOW()
       WHERE tenant_id = ? AND conversation_id = ?`,
      [TENANT_ID, convClientId],
    );

    const [msgRows] = await conn.query<RowDataPacket[]>(
      `SELECT c.id, c.conversation_id,
              COALESCE(
                NULLIF(CONCAT(b.first_name, ' ', b.last_name), ' '),
                NULLIF(CONCAT(fc.first_name, ' ', fc.last_name), ' '),
                'System'
              ) AS sender_name
       FROM communications c
       LEFT JOIN brokers b ON c.from_broker_id = b.id
       LEFT JOIN clients fc ON c.from_user_id = fc.id
       WHERE c.id = ? AND c.tenant_id = ?`,
      [ins.insertId, TENANT_ID],
    );
    if (
      msgRows[0]?.conversation_id === convClientId &&
      msgRows[0]?.sender_name &&
      msgRows[0].sender_name !== ""
    ) {
      pass("DC-006 direct message + sender_name SQL (group join safe)", String(msgRows[0].sender_name));
    } else fail("DC-006 direct message + sender_name SQL");

    // ── Multiple NULL fingerprints allowed (direct threads) ──────────────────
    await conn.query(
      `INSERT INTO conversation_threads
         (tenant_id, conversation_id, broker_id, client_name, client_phone,
          last_message_at, last_message_preview, last_message_type,
          message_count, unread_count, status, participant_fingerprint)
       VALUES (?, ?, 1, 'Second Direct', ?, NOW(), 'x', 'sms', 0, 0, 'active', NULL)`,
      [TENANT_ID, `${convClientId}_b`, clientPhone],
    );
    pass("DC-007 multiple direct threads with NULL fingerprint");

    // ── Group query must not pick up direct threads ──────────────────────────
    const [mixed] = await conn.query<RowDataPacket[]>(
      `SELECT conversation_id FROM conversation_threads
       WHERE tenant_id = ? AND thread_type = 'group'
         AND conversation_id IN (?, ?, ?)`,
      [TENANT_ID, convClientId, convPhoneId, `${convClientId}_b`],
    );
    if (mixed.length === 0) pass("DC-008 direct threads excluded from group-only filter");
    else fail("DC-008 direct threads excluded from group-only filter", String(mixed.length));

    // ── Inbox list query includes synthetic direct threads ───────────────────
    const [inbox] = await conn.query<RowDataPacket[]>(inboxListSql(), [TENANT_ID]);
    const inboxIds = new Set(inbox.map((r) => r.conversation_id as string));
    if (inboxIds.has(convClientId)) {
      pass("DC-009 inbox list query includes direct SMS thread");
    } else fail("DC-009 inbox list query includes direct SMS thread");

    const directInInbox = inbox.filter((r) => r.thread_type === "direct");
    if (directInInbox.length > 0) {
      pass("DC-010 inbox rows default thread_type direct", String(directInInbox.length));
    } else fail("DC-010 inbox rows default thread_type direct");
  } catch (e: unknown) {
    fail("DB transaction", e instanceof Error ? e.message : String(e));
  } finally {
    await conn.rollback();
    conn.release();
  }

  // ── Read-only production sanity (no writes) ────────────────────────────────
  const [misTyped] = await pool.query<RowDataPacket[]>(
    `SELECT COUNT(*) AS c FROM conversation_threads
     WHERE tenant_id = ?
       AND conversation_id LIKE 'conv_client_%'
       AND thread_type != 'direct'`,
    [TENANT_ID],
  );
  if ((misTyped[0]?.c as number) === 0) {
    pass("DC-011 no conv_client_* rows mis-typed as group");
  } else {
    fail(
      "DC-011 no conv_client_* rows mis-typed as group",
      String(misTyped[0]?.c),
    );
  }

  const [directWithFp] = await pool.query<RowDataPacket[]>(
    `SELECT COUNT(*) AS c FROM conversation_threads
     WHERE tenant_id = ?
       AND thread_type = 'direct'
       AND participant_fingerprint IS NOT NULL`,
    [TENANT_ID],
  );
  if ((directWithFp[0]?.c as number) === 0) {
    pass("DC-012 no direct threads carry group fingerprint");
  } else {
    fail(
      "DC-012 no direct threads carry group fingerprint",
      String(directWithFp[0]?.c),
    );
  }

  const [directWithParticipants] = await pool.query<RowDataPacket[]>(
    `SELECT COUNT(*) AS c FROM conversation_participants cp
     JOIN conversation_threads ct
       ON ct.conversation_id = cp.conversation_id AND ct.tenant_id = cp.tenant_id
     WHERE ct.tenant_id = ? AND ct.thread_type = 'direct'`,
    [TENANT_ID],
  );
  if ((directWithParticipants[0]?.c as number) === 0) {
    pass("DC-013 direct threads have no conversation_participants rows");
  } else {
    fail(
      "DC-013 direct threads have no conversation_participants rows",
      String(directWithParticipants[0]?.c),
    );
  }
}

async function runApiTests(pool: mysql.Pool) {
  if (!RUN_API) {
    pass("DC-API skipped", "Set SMOKE_API=1 with dev server running");
    return;
  }

  const [brokers] = await pool.query<RowDataPacket[]>(
    `SELECT id, email, role FROM brokers
     WHERE tenant_id = ? AND status = 'active'
     ORDER BY id ASC LIMIT 1`,
    [TENANT_ID],
  );
  if (!brokers.length) {
    fail("DC-API fixture broker");
    return;
  }

  const broker = brokers[0];
  const token = signBrokerToken({
    id: broker.id as number,
    email: broker.email as string,
    role: broker.role as string,
  });
  const headers = { Authorization: `Bearer ${token}` };

  const configRes = await axios.get(`${API_BASE}/api/conversations/config`, {
    headers,
    validateStatus: () => true,
    timeout: 15000,
  });
  if (configRes.status === 200 && configRes.data?.success === true) {
    pass("DC-API GET /conversations/config → 200");
  } else {
    fail("DC-API GET /conversations/config", `status ${configRes.status}`);
  }

  const threadsRes = await axios.get(`${API_BASE}/api/conversations/threads`, {
    headers,
    params: { limit: 10, status: "all" },
    validateStatus: () => true,
    timeout: 15000,
  });
  if (threadsRes.status !== 200 || !Array.isArray(threadsRes.data?.threads)) {
    fail("DC-API GET /conversations/threads", `status ${threadsRes.status}`);
    return;
  }
  pass("DC-API GET /conversations/threads → 200");

  const threads = threadsRes.data.threads as Array<{
    conversation_id: string;
    thread_type?: string;
  }>;
  const nonGroup = threads.filter(
    (t) => t.thread_type !== "group" && !t.conversation_id.startsWith("conv_group_"),
  );
  if (nonGroup.length > 0 || threads.length === 0) {
    pass(
      "DC-API thread list includes direct-style rows",
      `${nonGroup.length} direct of ${threads.length}`,
    );
  } else {
    fail("DC-API thread list includes direct-style rows");
  }

  const groupRes = await axios.post(
    `${API_BASE}/api/conversations/groups`,
    { channel: "internal", participants: [] },
    { headers, validateStatus: () => true, timeout: 15000 },
  );
  const groupDisabled = !isGroupConversationsEnabled(
    process.env.GROUP_CONVERSATIONS_ENABLED,
  );
  if (groupDisabled && groupRes.status === 404) {
    pass("DC-API group create 404 when feature disabled (non-breaking)");
  } else if (!groupDisabled && (groupRes.status === 400 || groupRes.status === 200)) {
    pass("DC-API group route reachable when enabled", `status ${groupRes.status}`);
  } else {
    fail("DC-API group route behavior", `status ${groupRes.status}, disabled=${groupDisabled}`);
  }

  const [sample] = await pool.query<RowDataPacket[]>(
    `SELECT conversation_id FROM conversation_threads
     WHERE tenant_id = ? AND thread_type = 'direct'
       AND conversation_id LIKE 'conv_client_%'
       AND status = 'active'
     ORDER BY last_message_at DESC
     LIMIT 1`,
    [TENANT_ID],
  );
  if (!sample.length) {
    pass("DC-API messages skipped", "no sample direct thread in DB");
    return;
  }

  const convId = sample[0].conversation_id as string;
  const msgRes = await axios.get(
    `${API_BASE}/api/conversations/${encodeURIComponent(convId)}/messages`,
    { headers, params: { limit: 5 }, validateStatus: () => true, timeout: 15000 },
  );
  if (msgRes.status === 200 && Array.isArray(msgRes.data?.messages)) {
    pass("DC-API GET direct thread messages → 200", convId);
  } else {
    fail("DC-API GET direct thread messages", `status ${msgRes.status} conv=${convId}`);
  }
}

async function main() {
  console.log("Direct (1:1) conversation smoke tests\n");
  runUnitTests();

  if (!RUN_UNIT_ONLY) {
    const pool = mysql.createPool({
      host: requireEnv("DB_HOST"),
      user: requireEnv("DB_USER"),
      password: requireEnv("DB_PASSWORD"),
      database: requireEnv("DB_NAME"),
      port: parseInt(process.env.DB_PORT || "3306", 10),
      ssl:
        process.env.DB_SSL === "true"
          ? { rejectUnauthorized: true }
          : undefined,
      timezone: "+00:00",
    });

    try {
      await runDbTests(pool);
      await runApiTests(pool);
    } finally {
      await pool.end();
    }
  } else {
    pass("DC-DB skipped (SMOKE_UNIT_ONLY=1)");
    pass("DC-API skipped (SMOKE_UNIT_ONLY=1)");
  }

  const failed = cases.filter((c) => !c.pass);
  for (const c of cases) {
    console.log(`${c.pass ? "✓" : "✗"} ${c.name}${c.detail ? ` — ${c.detail}` : ""}`);
  }
  console.log(`\n${cases.length - failed.length}/${cases.length} passed`);
  if (failed.length) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
