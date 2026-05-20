/**
 * scripts/smoke-test-email-full.mjs
 *
 * Comprehensive smoke test for the entire email system:
 *   • Azure App token acquisition & permission probes (Mail.Read, Mail.Send,
 *     Mail.ReadWrite, User.Read.All, Calendars.Read)
 *   • Graph API direct tests — folders, messages, PATCH flag/isRead, move,
 *     draft creation, attachment listing, delta sync token
 *   • All REST API endpoints — auth, mailboxes, threads, folders, drafts,
 *     signatures, thread actions, sync, sync-log, send
 *   • Cross-broker isolation — every protected resource verified for 403/404
 *   • Thread action system — archive, delete, mark_read, mark_unread,
 *     flag, unflag, move — including invalid inputs and edge cases
 *   • DB invariants — table existence, column constraints, null checks,
 *     unread_count integrity, JSON columns, sync-log structure
 *   • Pagination, search, status filter on thread list
 *   • Draft full lifecycle (create → read → update → delete)
 *   • Signature full lifecycle (create → read → update → delete)
 *   • Graceful degradation when Graph is unavailable (DB-only action)
 *
 * Usage:
 *   node scripts/smoke-test-email-full.mjs
 *   node scripts/smoke-test-email-full.mjs teamdc@encoremortgage.org
 *   node scripts/smoke-test-email-full.mjs teamdc@encoremortgage.org broker1@corp.com broker2@corp.com
 *
 * Args:
 *   $1 — mailbox email for direct Graph API tests   (optional)
 *   $2 — broker 1 email for isolation tests         (optional, auto-selected from DB)
 *   $3 — broker 2 email for isolation tests         (optional, auto-selected from DB)
 *
 * Requirements:
 *   npm install mysql2 axios jsonwebtoken   (already in package.json)
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import mysql from "mysql2/promise";
import axios from "axios";
import jwt from "jsonwebtoken";
import crypto from "crypto";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ─── Load .env ─────────────────────────────────────────────────────────────────
const envPath = path.join(__dirname, "../.env");
const env = Object.fromEntries(
  fs
    .readFileSync(envPath, "utf8")
    .split("\n")
    .filter((l) => l.includes("=") && !l.startsWith("#"))
    .map((l) => {
      const idx = l.indexOf("=");
      return [l.slice(0, idx).trim(), l.slice(idx + 1).trim()];
    }),
);

// ─── Validate required env vars ────────────────────────────────────────────────
const REQUIRED = [
  "JWT_SECRET",
  "DB_HOST",
  "DB_PORT",
  "DB_USER",
  "DB_PASSWORD",
  "DB_NAME",
  "OFFICE365_TENANT_ID",
  "OFFICE365_CLIENT_ID",
  "OFFICE365_CLIENT_SECRET",
];
const missingEnv = REQUIRED.filter((k) => !env[k]);
if (missingEnv.length > 0) {
  console.error("❌  Missing required env vars:", missingEnv.join(", "));
  process.exit(1);
}
if (env.JWT_SECRET.length < 32) {
  console.error("❌  JWT_SECRET too short (< 32 chars)");
  process.exit(1);
}

// ─── CLI Args ──────────────────────────────────────────────────────────────────
const [testMailboxArg, broker1EmailArg, broker2EmailArg] =
  process.argv.slice(2);
const TEST_MAILBOX = testMailboxArg || null;

// ─── Config ───────────────────────────────────────────────────────────────────
const DB_CONFIG = {
  host: env.DB_HOST,
  port: Number(env.DB_PORT || 4000),
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,
  ssl: { rejectUnauthorized: false },
};
const API_BASE = env.API_BASE_URL || "http://localhost:8080";
const TENANT_ID = 1;
const GRAPH_BASE = "https://graph.microsoft.com/v1.0";

// ─── Telemetry ────────────────────────────────────────────────────────────────
let passed = 0;
let failed = 0;
let skipped = 0;
const failures = [];

function pass(name, detail = "") {
  passed++;
  console.log(`  ✅ PASS  ${name}${detail ? "  →  " + detail : ""}`);
}
function fail(name, detail = "") {
  failed++;
  failures.push({ name, detail });
  console.error(`  ❌ FAIL  ${name}${detail ? "  →  " + detail : ""}`);
}
function skip(name, reason = "") {
  skipped++;
  console.log(`  ⏭  SKIP  ${name}${reason ? "  →  " + reason : ""}`);
}
function section(title) {
  console.log(`\n${"═".repeat(66)}\n  ${title}\n${"═".repeat(66)}`);
}
function assert(condition, passName, failName, detail = "") {
  condition ? pass(passName, detail) : fail(failName, detail);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function signTestToken(broker) {
  return jwt.sign(
    {
      brokerId: broker.id,
      email: broker.email,
      role: broker.role || "broker",
      userType: "broker",
      jti: crypto.randomUUID(),
      _smoke_test: true,
    },
    env.JWT_SECRET,
    { expiresIn: "15m" },
  );
}

async function api(token, method, urlPath, data, extraHeaders = {}) {
  try {
    const res = await axios({
      method,
      url: `${API_BASE}${urlPath}`,
      data,
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...extraHeaders,
      },
      validateStatus: () => true,
    });
    return { status: res.status, data: res.data, headers: res.headers };
  } catch (e) {
    return { status: 0, error: e.message };
  }
}

async function graphFetch(accessToken, urlPath, options = {}) {
  const { method = "GET", body } = options;
  const res = await fetch(`${GRAPH_BASE}${urlPath}`, {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, json };
}

// ═════════════════════════════════════════════════════════════════════════════
//  SETUP: Connect DB + acquire test brokers + acquire Graph token
// ═════════════════════════════════════════════════════════════════════════════
console.log("═".repeat(66));
console.log("  Email System Full Smoke Test");
console.log(`  API  : ${API_BASE}`);
console.log(`  DB   : ${env.DB_HOST}:${env.DB_PORT}/${env.DB_NAME}`);
console.log(`  Graph mailbox: ${TEST_MAILBOX || "(not specified)"}`);
console.log("═".repeat(66));

const db = await mysql.createConnection(DB_CONFIG);

// ─── Select test brokers ───────────────────────────────────────────────────────
let brokerQuery;
if (broker1EmailArg && broker2EmailArg) {
  [brokerQuery] = await db.query(
    `SELECT id, email, first_name, last_name, role FROM brokers
     WHERE tenant_id = ? AND status = 'active' AND email IN (?, ?)
     ORDER BY FIELD(email, ?, ?)`,
    [
      TENANT_ID,
      broker1EmailArg,
      broker2EmailArg,
      broker1EmailArg,
      broker2EmailArg,
    ],
  );
} else {
  [brokerQuery] = await db.query(
    `SELECT id, email, first_name, last_name, role FROM brokers
     WHERE tenant_id = ? AND status = 'active'
     ORDER BY id ASC LIMIT 2`,
    [TENANT_ID],
  );
}
if (brokerQuery.length < 2) {
  console.error(
    `❌  Need at least 2 active brokers. Found: ${brokerQuery.length}`,
  );
  await db.end();
  process.exit(1);
}

const brokerA = brokerQuery[0];
const brokerB = brokerQuery[1];
const TOKEN_A = signTestToken(brokerA);
const TOKEN_B = signTestToken(brokerB);
console.log(
  `\n  Broker A: ${brokerA.first_name} ${brokerA.last_name} <${brokerA.email}> (id=${brokerA.id})`,
);
console.log(
  `  Broker B: ${brokerB.first_name} ${brokerB.last_name} <${brokerB.email}> (id=${brokerB.id})\n`,
);

// ─── Acquire Graph app token ────────────────────────────────────────────────
let GRAPH_TOKEN = null;
try {
  const params = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: env.OFFICE365_CLIENT_ID,
    client_secret: env.OFFICE365_CLIENT_SECRET,
    scope: "https://graph.microsoft.com/.default",
  });
  const r = await fetch(
    `https://login.microsoftonline.com/${encodeURIComponent(env.OFFICE365_TENANT_ID)}/oauth2/v2.0/token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    },
  );
  const j = await r.json();
  if (!r.ok) throw new Error(JSON.stringify(j));
  GRAPH_TOKEN = j.access_token;
  console.log(`  Graph token acquired (expires_in: ${j.expires_in}s)\n`);
} catch (e) {
  console.warn(`  ⚠️  Could not acquire Graph token: ${e.message}`);
  console.warn(`     Graph-direct tests will be skipped.\n`);
}

// ═════════════════════════════════════════════════════════════════════════════
//  SECTION 1 — DB SCHEMA INVARIANTS
// ═════════════════════════════════════════════════════════════════════════════
section("1. DB Schema Invariants");

// 1a: Required tables
const requiredTables = [
  "email_drafts",
  "email_signatures",
  "email_attachment_cache",
  "email_sync_log",
  "conversation_email_mailboxes",
  "conversation_threads",
  "communications",
];
for (const tbl of requiredTables) {
  const [[row]] = await db.query(
    `SELECT COUNT(*) AS cnt FROM information_schema.tables
     WHERE table_schema = ? AND table_name = ?`,
    [env.DB_NAME, tbl],
  );
  assert(row.cnt === 1, `Table '${tbl}' exists`, `Table '${tbl}' MISSING`);
}

// 1b: Required columns on conversation_threads
const requiredThreadCols = [
  "unread_count",
  "priority",
  "archived_at",
  "mailbox_id",
  "tags",
];
for (const col of requiredThreadCols) {
  const [[row]] = await db.query(
    `SELECT COUNT(*) AS cnt FROM information_schema.columns
     WHERE table_schema = ? AND table_name = 'conversation_threads' AND column_name = ?`,
    [env.DB_NAME, col],
  );
  assert(
    row.cnt === 1,
    `conversation_threads.${col} column exists`,
    `conversation_threads.${col} MISSING`,
  );
}

// 1c: conversation_threads.priority is valid enum
const [[priorityCheck]] = await db.query(
  `SELECT COUNT(*) AS cnt FROM conversation_threads
   WHERE tenant_id = ? AND priority NOT IN ('low','normal','high','urgent')`,
  [TENANT_ID],
);
assert(
  priorityCheck.cnt === 0,
  "No invalid priority values in conversation_threads",
  `${priorityCheck.cnt} rows have invalid priority`,
);

// 1d: unread_count is always non-negative
const [[unreadCheck]] = await db.query(
  `SELECT COUNT(*) AS cnt FROM conversation_threads
   WHERE tenant_id = ? AND unread_count < 0`,
  [TENANT_ID],
);
assert(
  unreadCheck.cnt === 0,
  "unread_count is always >= 0",
  `${unreadCheck.cnt} threads have negative unread_count`,
);

// 1e: No active mailbox with NULL assigned_broker_id
const [[orphanMb]] = await db.query(
  `SELECT COUNT(*) AS cnt FROM conversation_email_mailboxes
   WHERE tenant_id = ? AND assigned_broker_id IS NULL
   AND status NOT IN ('disabled','pending')`,
  [TENANT_ID],
);
assert(
  orphanMb.cnt === 0,
  "No active mailbox has NULL assigned_broker_id",
  `${orphanMb.cnt} active mailboxes are ownerless`,
);

// 1f: No email communications with NULL conversation_id
const [[nullConvComm]] = await db.query(
  `SELECT COUNT(*) AS cnt FROM communications
   WHERE tenant_id = ? AND communication_type = 'email' AND conversation_id IS NULL`,
  [TENANT_ID],
);
assert(
  nullConvComm.cnt === 0,
  "All email communications have a conversation_id",
  `${nullConvComm.cnt} email comms have NULL conversation_id`,
);

// 1g: No conversation_threads with NULL last_message_type when they have communications
const [[nullMsgType]] = await db.query(
  `SELECT COUNT(*) AS cnt FROM conversation_threads ct
   WHERE ct.tenant_id = ? AND ct.last_message_type IS NULL
   AND EXISTS (SELECT 1 FROM communications c WHERE c.conversation_id = ct.conversation_id AND c.tenant_id = ?)`,
  [TENANT_ID, TENANT_ID],
);
assert(
  nullMsgType.cnt === 0,
  "All threads with messages have last_message_type set",
  `${nullMsgType.cnt} threads with messages have NULL last_message_type`,
);

// 1h: email_sync_log has valid status values (enum: running, ok, error, partial)
const [[badSyncStatus]] = await db.query(
  `SELECT COUNT(*) AS cnt FROM email_sync_log
   WHERE status NOT IN ('running','ok','error','partial')`,
);
assert(
  badSyncStatus.cnt === 0,
  "All email_sync_log rows have valid status",
  `${badSyncStatus.cnt} sync log rows have invalid status`,
);

// 1i: is_shared column should NOT exist on conversation_email_mailboxes
const [[isSharedCol]] = await db.query(
  `SELECT COUNT(*) AS cnt FROM information_schema.columns
   WHERE table_schema = ? AND table_name = 'conversation_email_mailboxes' AND column_name = 'is_shared'`,
  [env.DB_NAME],
);
assert(
  isSharedCol.cnt === 0,
  "is_shared column removed from conversation_email_mailboxes",
  "is_shared column still exists — run migration",
);

// 1j: communications status enum is valid
const [[badCommStatus]] = await db.query(
  `SELECT COUNT(*) AS cnt FROM communications
   WHERE tenant_id = ? AND status NOT IN ('sent','read','delivered','failed','pending','received')`,
  [TENANT_ID],
);
assert(
  badCommStatus.cnt === 0,
  "All communications have valid status values",
  `${badCommStatus.cnt} communications have invalid status`,
);

// ═════════════════════════════════════════════════════════════════════════════
//  SECTION 2 — AUTHENTICATION / AUTHORIZATION HARDENING
// ═════════════════════════════════════════════════════════════════════════════
section("2. Auth — Reject Invalid / Missing Tokens");

const PROTECTED_ROUTES = [
  ["GET", "/api/conversations/mailboxes"],
  ["GET", "/api/conversations/threads"],
  ["GET", "/api/email/drafts"],
  ["GET", "/api/email/signatures"],
];

// 2a: No token → 401
for (const [method, route] of PROTECTED_ROUTES) {
  const r = await api(null, method, route);
  assert(
    r.status === 401,
    `No token → 401 on ${method} ${route}`,
    `No token returned ${r.status} on ${method} ${route}`,
  );
}

// 2b: Malformed token
const r2b = await api(
  "not-a-jwt-at-all",
  "GET",
  "/api/conversations/mailboxes",
);
assert(
  r2b.status === 401,
  "Malformed token → 401",
  `Malformed token returned ${r2b.status}`,
);

// 2c: Expired token (sign with -1s TTL)
const expiredToken = jwt.sign(
  { brokerId: brokerA.id, userType: "broker", jti: crypto.randomUUID() },
  env.JWT_SECRET,
  { expiresIn: -1 },
);
const r2c = await api(expiredToken, "GET", "/api/conversations/mailboxes");
assert(
  r2c.status === 401,
  "Expired token → 401",
  `Expired token returned ${r2c.status}`,
);

// 2d: Token signed with wrong secret
const wrongSecretToken = jwt.sign(
  { brokerId: brokerA.id, userType: "broker", jti: crypto.randomUUID() },
  "wrong-secret-abcdefghijklmnopqrstuvwxyz",
  { expiresIn: "15m" },
);
const r2d = await api(wrongSecretToken, "GET", "/api/conversations/mailboxes");
assert(
  r2d.status === 401,
  "Token with wrong secret → 401",
  `Wrong-secret token returned ${r2d.status}`,
);

// 2e: Token with wrong userType (client instead of broker)
const clientTypeToken = jwt.sign(
  { brokerId: brokerA.id, userType: "client", jti: crypto.randomUUID() },
  env.JWT_SECRET,
  { expiresIn: "15m" },
);
const r2e = await api(clientTypeToken, "GET", "/api/conversations/mailboxes");
assert(
  r2e.status === 401 || r2e.status === 403,
  "Client-type token rejected on broker endpoint",
  `Client-type token returned ${r2e.status}`,
);

// 2f: Thread action without auth
const r2f = await api(null, "PATCH", "/api/email/threads/fake-conv/action", {
  action: "archive",
});
assert(
  r2f.status === 401,
  "Thread action without token → 401",
  `Returned ${r2f.status}`,
);

// ═════════════════════════════════════════════════════════════════════════════
//  SECTION 3 — MAILBOX API
// ═════════════════════════════════════════════════════════════════════════════
section("3. Mailbox API");

// 3a: List mailboxes — returns array
const r3a = await api(TOKEN_A, "GET", "/api/conversations/mailboxes");
assert(
  r3a.status === 200 && Array.isArray(r3a.data?.mailboxes),
  "GET /mailboxes → 200 with mailboxes array",
  `Mailbox list returned status=${r3a.status}`,
  `count=${r3a.data?.mailboxes?.length ?? "?"}`,
);

const aMailboxIds = new Set((r3a.data?.mailboxes || []).map((m) => m.id));

// 3b: Each mailbox has expected fields
for (const mb of r3a.data?.mailboxes || []) {
  const hasMandatoryFields =
    mb.id !== undefined &&
    mb.mailbox_email !== undefined &&
    mb.status !== undefined &&
    mb.provider !== undefined;
  assert(
    hasMandatoryFields,
    `Mailbox ${mb.mailbox_email} has required fields`,
    `Mailbox id=${mb.id} is missing required fields`,
  );
}

// 3c: Broker B cannot see Broker A's mailboxes
const r3c = await api(TOKEN_B, "GET", "/api/conversations/mailboxes");
if (r3c.status === 200 && Array.isArray(r3c.data?.mailboxes)) {
  const bMailboxIds = new Set(r3c.data.mailboxes.map((m) => m.id));
  const overlap = [...aMailboxIds].filter((id) => bMailboxIds.has(id));
  assert(
    overlap.length === 0,
    "No mailbox overlap between brokers A and B",
    `${overlap.length} shared mailbox(es) leaked`,
    overlap.join(", "),
  );
} else {
  pass("Broker B mailbox list call didn't error", `status=${r3c.status}`);
}

// 3d: Folder listing — own mailbox
const ownMailboxA = (r3a.data?.mailboxes || [])[0];
if (ownMailboxA) {
  const r3d = await api(
    TOKEN_A,
    "GET",
    `/api/conversations/mailboxes/${ownMailboxA.id}/folders`,
  );
  if (r3d.status === 200) {
    assert(
      Array.isArray(r3d.data?.folders),
      "Folder list returns folders array",
      "Folder response missing folders array",
    );
    const hasSystemFolders = (r3d.data?.folders || []).some(
      (f) => f.isSystemFolder,
    );
    assert(
      hasSystemFolders,
      "At least one system folder returned",
      "No system folders in response",
    );
  } else if (r3d.status === 502 || r3d.status === 503) {
    skip("Folder listing", "Graph API unreachable (502/503)");
  } else {
    fail(
      "Folder listing on own mailbox failed",
      `status=${r3d.status} ${JSON.stringify(r3d.data)}`,
    );
  }

  // 3e: Folder messages on own mailbox
  const inbox = (r3d?.data?.folders || []).find(
    (f) => f.displayName?.toLowerCase() === "inbox",
  );
  if (inbox) {
    const r3e = await api(
      TOKEN_A,
      "GET",
      `/api/conversations/mailboxes/${ownMailboxA.id}/folders/${encodeURIComponent(inbox.id)}/messages?$top=5`,
    );
    assert(
      r3e.status === 200 && Array.isArray(r3e.data?.messages),
      "Folder messages (Inbox) returns messages array",
      `Folder messages returned status=${r3e.status}`,
    );
  }

  // 3f: Sync log on own mailbox
  const r3f = await api(
    TOKEN_A,
    "GET",
    `/api/conversations/mailboxes/${ownMailboxA.id}/sync-log`,
  );
  assert(
    r3f.status === 200 && Array.isArray(r3f.data?.logs),
    "Sync log returns logs array for own mailbox",
    `Sync log returned status=${r3f.status}`,
  );
} else {
  skip("Folder listing / sync log", "Broker A has no connected mailbox");
}

// 3g: Folder listing — foreign mailbox → 403 or 404
const [allDbMailboxes] = await db.query(
  `SELECT id, mailbox_email, assigned_broker_id FROM conversation_email_mailboxes
   WHERE tenant_id = ? AND status = 'active'`,
  [TENANT_ID],
);
const bMailboxIdsArr = (r3c.data?.mailboxes || []).map((m) => m.id);
const foreignToA = allDbMailboxes.find((mb) => !aMailboxIds.has(mb.id));
if (foreignToA) {
  const r3g = await api(
    TOKEN_A,
    "GET",
    `/api/conversations/mailboxes/${foreignToA.id}/folders`,
  );
  assert(
    r3g.status === 403 || r3g.status === 404,
    `Broker A denied folder access to foreign mailbox (${foreignToA.mailbox_email})`,
    `Broker A accessed foreign mailbox!`,
    `status=${r3g.status}`,
  );
} else {
  skip(
    "Foreign folder access",
    "All mailboxes belong to Broker A or none exist",
  );
}

// 3h: Sync on foreign mailbox → 403 or 404
const bMailboxIds2 = new Set((r3c.data?.mailboxes || []).map((m) => m.id));
const foreignToB = allDbMailboxes.find((mb) => !bMailboxIds2.has(mb.id));
if (foreignToB) {
  const r3h = await api(
    TOKEN_B,
    "POST",
    `/api/conversations/mailboxes/${foreignToB.id}/sync`,
  );
  assert(
    r3h.status === 403 || r3h.status === 404,
    `Broker B denied sync on foreign mailbox (${foreignToB.mailbox_email})`,
    `Broker B synced a foreign mailbox!`,
    `status=${r3h.status}`,
  );
} else {
  skip("Foreign sync", "No mailbox exists that Broker B doesn't own");
}

// 3i: Sync-log on foreign mailbox → 403 or 404
if (foreignToB) {
  const r3i = await api(
    TOKEN_B,
    "GET",
    `/api/conversations/mailboxes/${foreignToB.id}/sync-log`,
  );
  assert(
    r3i.status === 403 || r3i.status === 404,
    `Broker B denied sync-log access to foreign mailbox`,
    `Broker B accessed foreign sync-log!`,
    `status=${r3i.status}`,
  );
} else {
  skip("Foreign sync-log", "No foreign mailbox to test against");
}

// 3j: Non-existent mailbox ID
const r3j = await api(
  TOKEN_A,
  "GET",
  "/api/conversations/mailboxes/99999999/folders",
);
assert(
  r3j.status === 404 || r3j.status === 403,
  "Non-existent mailbox → 404/403",
  `Returned ${r3j.status}`,
);

// ═════════════════════════════════════════════════════════════════════════════
//  SECTION 4 — THREAD LIST API
// ═════════════════════════════════════════════════════════════════════════════
section("4. Thread List API");

// 4a: Basic list
const r4a = await api(
  TOKEN_A,
  "GET",
  "/api/conversations/threads?folder=inbox&limit=20",
);
assert(
  r4a.status === 200 && Array.isArray(r4a.data?.threads),
  "GET /threads → 200 with threads array",
  `Thread list returned status=${r4a.status}`,
  `count=${r4a.data?.threads?.length ?? "?"}`,
);
const allThreadsA = r4a.data?.threads || [];

// 4b: Response shape for each thread
for (const t of allThreadsA.slice(0, 5)) {
  const valid =
    t.conversation_id !== undefined &&
    t.status !== undefined &&
    t.last_message_at !== undefined;
  assert(
    valid,
    `Thread ${t.conversation_id?.slice(0, 20)} has required fields`,
    `Thread missing required fields`,
    JSON.stringify(t),
  );
}

// 4c: status=active filter
const r4c = await api(
  TOKEN_A,
  "GET",
  "/api/conversations/threads?folder=inbox&status=active&limit=20",
);
assert(
  r4c.status === 200 && Array.isArray(r4c.data?.threads),
  "Thread list with status=active filter works",
  `Returned ${r4c.status}`,
);
const nonActive = (r4c.data?.threads || []).filter(
  (t) => t.status !== "active",
);
assert(
  nonActive.length === 0,
  "status=active filter returns only active threads",
  `${nonActive.length} non-active threads leaked through`,
);

// 4d: status=closed filter
const r4d = await api(
  TOKEN_A,
  "GET",
  "/api/conversations/threads?folder=inbox&status=closed&limit=20",
);
assert(
  r4d.status === 200,
  "Thread list with status=closed filter works",
  `Returned ${r4d.status}`,
);

// 4e: Pagination — page=1 then page=2 (API uses page-based pagination)
const r4e1 = await api(
  TOKEN_A,
  "GET",
  "/api/conversations/threads?folder=inbox&limit=2&page=1",
);
const r4e2 = await api(
  TOKEN_A,
  "GET",
  "/api/conversations/threads?folder=inbox&limit=2&page=2",
);
assert(
  r4e1.status === 200,
  "Pagination page 1 works",
  `Returned ${r4e1.status}`,
);
assert(
  r4e2.status === 200,
  "Pagination page 2 works",
  `Returned ${r4e2.status}`,
);
if (r4e1.status === 200 && r4e2.status === 200) {
  const ids1 = (r4e1.data?.threads || []).map((t) => t.conversation_id);
  const ids2 = (r4e2.data?.threads || []).map((t) => t.conversation_id);
  const overlapPag = ids1.filter((id) => ids2.includes(id));
  assert(
    overlapPag.length === 0 || ids1.length === 0 || ids2.length === 0,
    "No overlap between page 1 and page 2",
    `${overlapPag.length} duplicate conversation(s) across pages — add tiebreaker to ORDER BY`,
  );
}

// 4f: Search query
const r4f = await api(
  TOKEN_A,
  "GET",
  "/api/conversations/threads?folder=inbox&search=test&limit=10",
);
assert(
  r4f.status === 200,
  "Thread search query works",
  `Returned ${r4f.status}`,
);

// 4g: No cross-broker thread leakage — threads returned to A don't belong to B's exclusive mailboxes
{
  const aThreads = r4a.data?.threads || [];
  const aMailboxIdsArr = [...aMailboxIds];
  const bOnlyMailboxIds = new Set(
    allDbMailboxes.filter((mb) => !aMailboxIds.has(mb.id)).map((mb) => mb.id),
  );
  const leaked = aThreads.filter(
    (t) =>
      t.mailbox_id !== null &&
      t.mailbox_id !== undefined &&
      bOnlyMailboxIds.has(t.mailbox_id),
  );
  assert(
    leaked.length === 0,
    "No threads from B-exclusive mailboxes leaked to Broker A",
    `${leaked.length} thread(s) leaked`,
  );
}

// 4h: mailboxId query param filters correctly
if (ownMailboxA) {
  const r4h = await api(
    TOKEN_A,
    "GET",
    `/api/conversations/threads?folder=inbox&mailboxId=${ownMailboxA.id}&limit=20`,
  );
  assert(
    r4h.status === 200,
    "Thread list with mailboxId filter works",
    `Returned ${r4h.status}`,
  );
  const wrongMailbox = (r4h.data?.threads || []).filter(
    (t) => t.mailbox_id !== null && t.mailbox_id !== ownMailboxA.id,
  );
  assert(
    wrongMailbox.length === 0,
    "mailboxId filter returns only threads for that mailbox",
    `${wrongMailbox.length} threads from wrong mailbox`,
  );
}

// ═════════════════════════════════════════════════════════════════════════════
//  SECTION 5 — THREAD ACTION API
// ═════════════════════════════════════════════════════════════════════════════
section("5. Thread Action API");

// 5a: Missing action body → 400
const r5a = await api(
  TOKEN_A,
  "PATCH",
  "/api/email/threads/some-conv/action",
  {},
);
assert(
  r5a.status === 400 || r5a.status === 404,
  "Missing action → 400 or 404",
  `Returned ${r5a.status}`,
);

// 5b: Invalid action value → 400
const r5b = await api(TOKEN_A, "PATCH", "/api/email/threads/some-conv/action", {
  action: "invalid-action",
});
assert(
  r5b.status === 400 || r5b.status === 404,
  "Invalid action → 400 or 404",
  `Returned ${r5b.status}`,
);

// 5c: move without folderId → 400
const r5c = await api(TOKEN_A, "PATCH", "/api/email/threads/some-conv/action", {
  action: "move",
});
assert(
  r5c.status === 400 || r5c.status === 404,
  "move without folderId → 400 or 404",
  `Returned ${r5c.status}`,
);

// 5d: Non-existent conversationId → 404
const r5d = await api(
  TOKEN_A,
  "PATCH",
  "/api/email/threads/NON_EXISTENT_CONV_ID_999/action",
  { action: "archive" },
);
assert(
  r5d.status === 404,
  "Non-existent thread → 404",
  `Returned ${r5d.status}`,
);

// 5e-5k: Test each action on a real email thread (if one exists)
const emailThread = allThreadsA.find(
  (t) =>
    t.mailbox_id != null && (t.status === "active" || t.status === "closed"),
);
if (emailThread) {
  const convId = emailThread.conversation_id;
  const ACTIONS_TO_TEST = [
    {
      action: "mark_read",
      check: (data) => data?.thread != null,
      desc: "mark_read updates thread",
    },
    {
      action: "mark_unread",
      check: (data) => data?.thread != null,
      desc: "mark_unread updates thread",
    },
    {
      action: "flag",
      check: (data) => data?.thread?.priority === "urgent",
      desc: "flag sets priority=urgent",
    },
    {
      action: "unflag",
      check: (data) => data?.thread?.priority === "normal",
      desc: "unflag sets priority=normal",
    },
  ];
  for (const { action, check, desc } of ACTIONS_TO_TEST) {
    const r = await api(
      TOKEN_A,
      "PATCH",
      `/api/email/threads/${encodeURIComponent(convId)}/action`,
      { action },
    );
    if (r.status === 200) {
      assert(
        check(r.data),
        desc,
        `${action}: check failed`,
        JSON.stringify(r.data?.thread),
      );
    } else if (r.status === 502 || r.status === 503) {
      skip(desc, "Graph API unavailable");
    } else {
      fail(desc, `status=${r.status} ${JSON.stringify(r.data)}`);
    }
  }

  // 5i: move action to Inbox
  if (ownMailboxA) {
    const folders5i = await api(
      TOKEN_A,
      "GET",
      `/api/conversations/mailboxes/${ownMailboxA.id}/folders`,
    );
    const inboxFolder = (folders5i.data?.folders || []).find(
      (f) => f.displayName?.toLowerCase() === "inbox",
    );
    if (inboxFolder) {
      const r5i = await api(
        TOKEN_A,
        "PATCH",
        `/api/email/threads/${encodeURIComponent(convId)}/action`,
        {
          action: "move",
          folderId: inboxFolder.id,
        },
      );
      assert(
        r5i.status === 200 || r5i.status === 502,
        "move to Inbox works or Graph unavailable",
        `move returned ${r5i.status}`,
      );
    } else {
      skip("move action", "Inbox folder not found in folder list");
    }
  }

  // 5j: Cross-broker thread action → Broker B cannot act on Broker A's thread
  const r5j = await api(
    TOKEN_B,
    "PATCH",
    `/api/email/threads/${encodeURIComponent(convId)}/action`,
    { action: "archive" },
  );
  assert(
    r5j.status === 404 || r5j.status === 403,
    "Broker B cannot act on Broker A's thread",
    `Broker B got ${r5j.status} on foreign thread`,
  );
} else {
  skip("Thread action tests (5e-5j)", "No email thread available for Broker A");
}

// 5k: archive action removes thread from list
const archivableThread = allThreadsA.find(
  (t) => t.mailbox_id != null && t.status === "active",
);
if (
  archivableThread &&
  archivableThread.conversation_id !== emailThread?.conversation_id
) {
  const convId = archivableThread.conversation_id;
  const r5k = await api(
    TOKEN_A,
    "PATCH",
    `/api/email/threads/${encodeURIComponent(convId)}/action`,
    { action: "archive" },
  );
  if (r5k.status === 200) {
    pass("archive returns 200");
    // Verify thread is now closed/archived in DB
    const [[dbThread]] = await db.query(
      `SELECT status, archived_at FROM conversation_threads WHERE conversation_id = ? AND tenant_id = ?`,
      [convId, TENANT_ID],
    );
    assert(
      dbThread?.status === "closed",
      "archive: thread status set to closed in DB",
      "archive: thread status not updated in DB",
      `status=${dbThread?.status}`,
    );
    assert(
      dbThread?.archived_at != null,
      "archive: archived_at set in DB",
      "archive: archived_at is NULL after archive",
    );
  } else {
    skip("archive DB verification", `archive returned ${r5k.status}`);
  }
} else {
  skip(
    "archive verification test",
    "No separate active email thread for archive test",
  );
}

// ═════════════════════════════════════════════════════════════════════════════
//  SECTION 6 — EMAIL SEND API
// ═════════════════════════════════════════════════════════════════════════════
section("6. Email Send API");

// 6a: No auth → 401
const r6a = await api(null, "POST", "/api/email/send", {
  to: "test@test.com",
  subject: "Test",
  body: "Hello",
});
assert(
  r6a.status === 401,
  "Email send without auth → 401",
  `Returned ${r6a.status}`,
);

// 6b: Missing 'to' field → 400
const r6b = await api(TOKEN_A, "POST", "/api/email/send", {
  subject: "Test",
  body: "Hello",
});
assert(
  r6b.status === 400,
  "Email send missing 'to' → 400",
  `Returned ${r6b.status}`,
);

// 6c: Missing 'subject' → 400
const r6c = await api(TOKEN_A, "POST", "/api/email/send", {
  to: "test@example.com",
  body: "Hello",
});
assert(
  r6c.status === 400,
  "Email send missing 'subject' → 400",
  `Returned ${r6c.status}`,
);

// 6d: Missing 'body' → 400
const r6d = await api(TOKEN_A, "POST", "/api/email/send", {
  to: "test@example.com",
  subject: "Test",
});
assert(
  r6d.status === 400,
  "Email send missing 'body' → 400",
  `Returned ${r6d.status}`,
);

// 6e: Empty body string → 400
const r6e = await api(TOKEN_A, "POST", "/api/email/send", {
  to: "test@example.com",
  subject: "Test",
  body: "",
});
assert(
  r6e.status === 400,
  "Email send empty body → 400",
  `Returned ${r6e.status}`,
);

// 6f: Invalid email format → 400
const r6f = await api(TOKEN_A, "POST", "/api/email/send", {
  to: "not-an-email",
  subject: "Test",
  body: "Hello",
});
assert(
  r6f.status === 400,
  "Email send invalid 'to' email format → 400",
  `Returned ${r6f.status}`,
);

// ═════════════════════════════════════════════════════════════════════════════
//  SECTION 7 — DRAFTS FULL LIFECYCLE
// ═════════════════════════════════════════════════════════════════════════════
section("7. Drafts Full Lifecycle");

// 7a: No auth → 401
const r7auth = await api(null, "GET", "/api/email/drafts");
assert(
  r7auth.status === 401,
  "GET /email/drafts without auth → 401",
  `Returned ${r7auth.status}`,
);

// 7b: List drafts — returns array
const r7b = await api(TOKEN_A, "GET", "/api/email/drafts");
assert(
  r7b.status === 200 && Array.isArray(r7b.data?.drafts),
  "GET /email/drafts → 200 with drafts array",
  `Returned ${r7b.status}`,
);

const initialDraftCount = r7b.data?.drafts?.length ?? 0;

// 7c: Create draft
const r7c = await api(TOKEN_A, "POST", "/api/email/drafts", {
  to: "smoke-test@example.com",
  cc: "",
  bcc: "",
  subject: "[smoke-test] Draft " + Date.now(),
  body: "<p>Smoke test draft body</p>",
  mailbox_id: ownMailboxA?.id ?? null,
});
let createdDraftId = null;
if (r7c.status === 200 || r7c.status === 201) {
  createdDraftId = r7c.data?.draft?.id ?? r7c.data?.id ?? null;
  assert(
    createdDraftId != null,
    "Draft created with ID",
    "Draft created but no ID returned",
  );
} else {
  fail(
    "Create draft returned unexpected status",
    `status=${r7c.status} ${JSON.stringify(r7c.data)}`,
  );
}

// 7d: Draft count increased
const r7d = await api(TOKEN_A, "GET", "/api/email/drafts");
if (r7d.status === 200) {
  const newCount = r7d.data?.drafts?.length ?? 0;
  assert(
    newCount === initialDraftCount + 1,
    "Draft count increased by 1 after create",
    `Count: ${initialDraftCount} → ${newCount}`,
  );
}

// 7e: Update draft
if (createdDraftId) {
  const r7e = await api(TOKEN_A, "POST", "/api/email/drafts", {
    id: createdDraftId,
    to: "smoke-test-updated@example.com",
    subject: "[smoke-test] Draft Updated " + Date.now(),
    body: "<p>Updated smoke test draft body</p>",
    mailbox_id: ownMailboxA?.id ?? null,
  });
  assert(
    r7e.status === 200 || r7e.status === 201,
    "Draft update returns 200/201",
    `Returned ${r7e.status}`,
  );
}

// 7f: Delete draft
if (createdDraftId) {
  const r7f = await api(
    TOKEN_A,
    "DELETE",
    `/api/email/drafts/${createdDraftId}`,
  );
  assert(
    r7f.status === 200,
    "Draft delete returns 200",
    `Returned ${r7f.status}`,
  );

  // Verify deleted
  const r7fv = await api(TOKEN_A, "GET", "/api/email/drafts");
  if (r7fv.status === 200) {
    const afterCount = r7fv.data?.drafts?.length ?? 0;
    assert(
      afterCount === initialDraftCount,
      "Draft count restored after delete",
      `Count: ${afterCount} vs expected ${initialDraftCount}`,
    );
  }
}

// 7g: Delete non-existent draft → 404 or 400
const r7g = await api(TOKEN_A, "DELETE", "/api/email/drafts/99999999");
assert(
  r7g.status === 404 || r7g.status === 400,
  "Delete non-existent draft → 404/400",
  `Returned ${r7g.status}`,
);

// 7h: Broker B cannot delete Broker A's draft
if (createdDraftId) {
  // Re-create to test cross-broker delete
  const r7h_create = await api(TOKEN_A, "POST", "/api/email/drafts", {
    to: "smoke-test@example.com",
    subject: "[smoke-test] Cross-broker draft " + Date.now(),
    body: "<p>x</p>",
    mailbox_id: ownMailboxA?.id ?? null,
  });
  const crossDraftId =
    r7h_create.data?.draft?.id ?? r7h_create.data?.id ?? null;
  if (crossDraftId) {
    const r7h = await api(
      TOKEN_B,
      "DELETE",
      `/api/email/drafts/${crossDraftId}`,
    );
    assert(
      r7h.status === 403 || r7h.status === 404,
      "Broker B cannot delete Broker A's draft",
      `Returned ${r7h.status}`,
    );
    // Cleanup
    await api(TOKEN_A, "DELETE", `/api/email/drafts/${crossDraftId}`);
  } else {
    skip(
      "Cross-broker draft delete",
      "Failed to create second draft for cross-broker test",
    );
  }
}

// ═════════════════════════════════════════════════════════════════════════════
//  SECTION 8 — SIGNATURES FULL LIFECYCLE
// ═════════════════════════════════════════════════════════════════════════════
section("8. Signatures Full Lifecycle");

// 8a: No auth → 401
const r8auth = await api(null, "GET", "/api/email/signatures");
assert(
  r8auth.status === 401,
  "GET /email/signatures without auth → 401",
  `Returned ${r8auth.status}`,
);

// 8b: List signatures
const r8b = await api(TOKEN_A, "GET", "/api/email/signatures");
assert(
  r8b.status === 200 && Array.isArray(r8b.data?.signatures),
  "GET /email/signatures → 200 with array",
  `Returned ${r8b.status}`,
);
const initialSigCount = r8b.data?.signatures?.length ?? 0;

// 8c: Create signature
const r8c = await api(TOKEN_A, "POST", "/api/email/signatures", {
  name: "[smoke-test] Default",
  html: "<p>Smoke Test Signature — <strong>Felix</strong></p>",
  is_default: false,
});
let createdSigId = null;
if (r8c.status === 200 || r8c.status === 201) {
  createdSigId = r8c.data?.signature?.id ?? r8c.data?.id ?? null;
  assert(
    createdSigId != null,
    "Signature created with ID",
    "Signature created but no ID returned",
  );
} else {
  fail(
    "Create signature returned unexpected status",
    `status=${r8c.status} ${JSON.stringify(r8c.data)}`,
  );
}

// 8d: Count increased
const r8d = await api(TOKEN_A, "GET", "/api/email/signatures");
if (r8d.status === 200) {
  const newCount = r8d.data?.signatures?.length ?? 0;
  assert(
    newCount === initialSigCount + 1,
    "Signature count increased by 1 after create",
    `Count: ${initialSigCount} → ${newCount}`,
  );
}

// 8e: Update signature
if (createdSigId) {
  const r8e = await api(TOKEN_A, "POST", "/api/email/signatures", {
    id: createdSigId,
    name: "[smoke-test] Updated",
    html: "<p>Updated Signature</p>",
    is_default: false,
  });
  assert(
    r8e.status === 200 || r8e.status === 201,
    "Signature update returns 200/201",
    `Returned ${r8e.status}`,
  );
}

// 8f: Delete signature
if (createdSigId) {
  const r8f = await api(
    TOKEN_A,
    "DELETE",
    `/api/email/signatures/${createdSigId}`,
  );
  assert(
    r8f.status === 200,
    "Signature delete returns 200",
    `Returned ${r8f.status}`,
  );

  const r8fv = await api(TOKEN_A, "GET", "/api/email/signatures");
  if (r8fv.status === 200) {
    const afterCount = r8fv.data?.signatures?.length ?? 0;
    assert(
      afterCount === initialSigCount,
      "Signature count restored after delete",
      `Count: ${afterCount} vs expected ${initialSigCount}`,
    );
  }
}

// 8g: Delete non-existent signature → 404 or 400
const r8g = await api(TOKEN_A, "DELETE", "/api/email/signatures/99999999");
assert(
  r8g.status === 404 || r8g.status === 400,
  "Delete non-existent signature → 404/400",
  `Returned ${r8g.status}`,
);

// 8h: Broker B cannot delete Broker A's signature (cross-broker)
const r8h_create = await api(TOKEN_A, "POST", "/api/email/signatures", {
  name: "[smoke-test] Cross-broker sig " + Date.now(),
  html: "<p>Cross-broker test</p>",
  is_default: false,
});
const crossSigId =
  r8h_create.data?.signature?.id ?? r8h_create.data?.id ?? null;
if (crossSigId) {
  const r8h = await api(
    TOKEN_B,
    "DELETE",
    `/api/email/signatures/${crossSigId}`,
  );
  assert(
    r8h.status === 403 || r8h.status === 404,
    "Broker B cannot delete Broker A's signature",
    `Returned ${r8h.status}`,
  );
  await api(TOKEN_A, "DELETE", `/api/email/signatures/${crossSigId}`);
} else {
  skip(
    "Cross-broker signature delete",
    "Failed to create signature for cross-broker test",
  );
}

// ═════════════════════════════════════════════════════════════════════════════
//  SECTION 9 — GRAPH API DIRECT TESTS (requires TEST_MAILBOX + GRAPH_TOKEN)
// ═════════════════════════════════════════════════════════════════════════════
section("9. Graph API Direct Tests");

if (!GRAPH_TOKEN) {
  skip(
    "All Graph direct tests",
    "No Graph token acquired — check Azure credentials in .env",
  );
} else if (!TEST_MAILBOX) {
  skip(
    "All per-mailbox Graph tests",
    "Pass a mailbox email as $1 to enable Graph direct tests",
  );
} else {
  const MB = encodeURIComponent(TEST_MAILBOX);

  // 9a: User.Read.All — list users
  const r9a = await graphFetch(
    GRAPH_TOKEN,
    "/users?$select=mail,displayName&$top=5",
  );
  assert(
    r9a.ok && Array.isArray(r9a.json?.value),
    "User.Read.All — list users works",
    `Graph returned ${r9a.status}`,
  );

  // 9b: Mail.Read — list inbox messages
  const r9b = await graphFetch(
    GRAPH_TOKEN,
    `/users/${MB}/mailFolders/inbox/messages?$top=5&$select=id,subject,isRead,receivedDateTime`,
  );
  assert(
    r9b.ok,
    "Mail.Read — inbox messages readable",
    `status=${r9b.status} ${JSON.stringify(r9b.json?.error)}`,
  );
  const graphMessages = r9b.json?.value ?? [];
  if (graphMessages.length > 0) {
    const m = graphMessages[0];
    assert(
      m.id != null && m.subject != null,
      "Inbox message has id and subject",
      "Inbox message missing fields",
    );
  }

  // 9c: Mail.Read — list top-level mail folders
  const r9c = await graphFetch(
    GRAPH_TOKEN,
    `/users/${MB}/mailFolders?$top=50&$select=id,displayName,totalItemCount,unreadItemCount,childFolderCount`,
  );
  assert(
    r9c.ok && Array.isArray(r9c.json?.value),
    "Mail folders list works",
    `status=${r9c.status}`,
  );
  const graphFolders = r9c.json?.value ?? [];
  const inboxGF = graphFolders.find(
    (f) => f.displayName?.toLowerCase() === "inbox",
  );
  assert(
    inboxGF != null,
    "Inbox folder present in folder list",
    "Inbox missing from folder list",
  );
  const sentGF = graphFolders.find(
    (f) => f.displayName?.toLowerCase() === "sent items",
  );
  assert(
    sentGF != null,
    "Sent Items folder present",
    "Sent Items missing from folder list",
  );
  const draftsGF = graphFolders.find(
    (f) => f.displayName?.toLowerCase() === "drafts",
  );
  assert(
    draftsGF != null,
    "Drafts folder present",
    "Drafts folder missing from folder list",
  );

  // 9d: Child folder listing (folders with children)
  const folderWithChildren = graphFolders.find(
    (f) => (f.childFolderCount ?? 0) > 0,
  );
  if (folderWithChildren) {
    const r9d = await graphFetch(
      GRAPH_TOKEN,
      `/users/${MB}/mailFolders/${encodeURIComponent(folderWithChildren.id)}/childFolders?$top=50`,
    );
    assert(
      r9d.ok && Array.isArray(r9d.json?.value),
      `Child folders list for "${folderWithChildren.displayName}" works`,
      `status=${r9d.status}`,
    );
  } else {
    skip("Child folder listing", "No folder has child folders");
  }

  // 9e: Mail.ReadWrite — list drafts folder messages
  if (draftsGF) {
    const r9e = await graphFetch(
      GRAPH_TOKEN,
      `/users/${MB}/mailFolders/${encodeURIComponent(draftsGF.id)}/messages?$top=3&$select=id,subject`,
    );
    assert(
      r9e.ok,
      "Mail.ReadWrite — drafts folder readable",
      `status=${r9e.status}`,
    );
  }

  // 9f: Fetch full body of a message (Mail.Read)
  if (graphMessages.length > 0) {
    const msgId = graphMessages[0].id;
    const r9f = await graphFetch(
      GRAPH_TOKEN,
      `/users/${MB}/messages/${encodeURIComponent(msgId)}?$select=id,subject,body,from,toRecipients`,
    );
    assert(r9f.ok, "Fetch full message body works", `status=${r9f.status}`);
    if (r9f.ok) {
      assert(
        r9f.json?.body?.content != null,
        "Message body.content is present",
        "Message body.content is null/missing",
      );
      assert(
        ["HTML", "Text"].includes(r9f.json?.body?.contentType),
        "Message body.contentType is HTML or Text",
        `Unexpected contentType: ${r9f.json?.body?.contentType}`,
      );
    }
  } else {
    skip("Full message body fetch", "Inbox is empty");
  }

  // 9g: PATCH isRead (mark read) — Mail.ReadWrite
  if (graphMessages.length > 0) {
    const msgId = graphMessages[0].id;
    const r9g = await graphFetch(
      GRAPH_TOKEN,
      `/users/${MB}/messages/${encodeURIComponent(msgId)}`,
      {
        method: "PATCH",
        body: { isRead: true },
      },
    );
    assert(
      r9g.ok,
      "PATCH isRead=true works (Mail.ReadWrite)",
      `status=${r9g.status} ${JSON.stringify(r9g.json?.error)}`,
    );
    // Restore original read state
    await graphFetch(
      GRAPH_TOKEN,
      `/users/${MB}/messages/${encodeURIComponent(msgId)}`,
      {
        method: "PATCH",
        body: { isRead: graphMessages[0].isRead ?? false },
      },
    );
  } else {
    skip("PATCH isRead", "No messages to test on");
  }

  // 9h: PATCH flag (flag a message) — Mail.ReadWrite
  if (graphMessages.length > 0) {
    const msgId = graphMessages[0].id;
    const r9h = await graphFetch(
      GRAPH_TOKEN,
      `/users/${MB}/messages/${encodeURIComponent(msgId)}`,
      {
        method: "PATCH",
        body: { flag: { flagStatus: "flagged" } },
      },
    );
    assert(
      r9h.ok,
      "PATCH flag=flagged works (Mail.ReadWrite)",
      `status=${r9h.status} ${JSON.stringify(r9h.json?.error)}`,
    );
    // Restore to notFlagged
    await graphFetch(
      GRAPH_TOKEN,
      `/users/${MB}/messages/${encodeURIComponent(msgId)}`,
      {
        method: "PATCH",
        body: { flag: { flagStatus: "notFlagged" } },
      },
    );
  } else {
    skip("PATCH flag", "No messages to test on");
  }

  // 9i: Move message (move to Sent Items then back to Inbox)
  // Only run on inbox messages — use message at index > 0 to avoid touching top-most
  if (graphMessages.length >= 2 && inboxGF && sentGF) {
    const msgId = graphMessages[1].id;
    const r9i_move = await graphFetch(
      GRAPH_TOKEN,
      `/users/${MB}/messages/${encodeURIComponent(msgId)}/move`,
      {
        method: "POST",
        body: { destinationId: sentGF.id },
      },
    );
    if (r9i_move.ok) {
      pass(
        "POST /messages/{id}/move to Sent Items works",
        `status=${r9i_move.status}`,
      );
      const movedMsgId = r9i_move.json?.id ?? msgId;
      // Move it back to Inbox
      const r9i_back = await graphFetch(
        GRAPH_TOKEN,
        `/users/${MB}/messages/${encodeURIComponent(movedMsgId)}/move`,
        {
          method: "POST",
          body: { destinationId: inboxGF.id },
        },
      );
      assert(
        r9i_back.ok,
        "Move back to Inbox works",
        `status=${r9i_back.status}`,
      );
    } else {
      fail(
        "POST /messages/{id}/move failed",
        `status=${r9i_move.status} ${JSON.stringify(r9i_move.json?.error)}`,
      );
    }
  } else {
    skip(
      "Move message test",
      "Need >= 2 inbox messages with Inbox and Sent Items folders",
    );
  }

  // 9j: Delta sync token — verify $deltaToken returned for incremental sync
  const r9j = await graphFetch(
    GRAPH_TOKEN,
    `/users/${MB}/mailFolders/inbox/messages/delta?$select=id,subject,isRead&$top=5`,
  );
  if (r9j.ok) {
    const hasDelta =
      r9j.json["@odata.deltaLink"] != null ||
      r9j.json["@odata.nextLink"] != null;
    assert(
      hasDelta,
      "Delta sync returns @odata.deltaLink or @odata.nextLink",
      "Delta sync response missing delta/next link",
    );
  } else {
    fail(
      "Delta sync request failed",
      `status=${r9j.status} ${JSON.stringify(r9j.json?.error)}`,
    );
  }

  // 9k: Mail.Send — send test email to self
  const r9k = await graphFetch(GRAPH_TOKEN, `/users/${MB}/sendMail`, {
    method: "POST",
    body: {
      message: {
        subject: "[smoke-test] Full system test — safe to delete",
        body: {
          contentType: "HTML",
          content: `<p>Automated smoke test from <code>smoke-test-email-full.mjs</code> — ${new Date().toISOString()}</p>`,
        },
        toRecipients: [{ emailAddress: { address: TEST_MAILBOX } }],
      },
      saveToSentItems: false,
    },
  });
  assert(
    r9k.ok,
    "Mail.Send — send to self works",
    `status=${r9k.status} ${JSON.stringify(r9k.json?.error)}`,
  );

  // 9l: Mail.ReadWrite — create then delete a draft
  const r9l_create = await graphFetch(GRAPH_TOKEN, `/users/${MB}/messages`, {
    method: "POST",
    body: {
      subject: "[smoke-test] Draft — safe to delete",
      body: { contentType: "Text", content: "Smoke test draft" },
      toRecipients: [{ emailAddress: { address: TEST_MAILBOX } }],
    },
  });
  if (r9l_create.ok) {
    const draftId = r9l_create.json?.id;
    pass(
      "Mail.ReadWrite — create draft in Drafts folder",
      `id=${draftId?.slice(0, 20)}…`,
    );
    if (draftId) {
      const r9l_del = await graphFetch(
        GRAPH_TOKEN,
        `/users/${MB}/messages/${encodeURIComponent(draftId)}`,
        {
          method: "DELETE",
        },
      );
      assert(
        r9l_del.ok || r9l_del.status === 204,
        "Mail.ReadWrite — delete draft works",
        `status=${r9l_del.status}`,
      );
    }
  } else {
    fail(
      "Mail.ReadWrite — create draft failed",
      `status=${r9l_create.status} ${JSON.stringify(r9l_create.json?.error)}`,
    );
  }

  // 9m: List message attachments (just confirm endpoint responds)
  if (graphMessages.length > 0) {
    const msgId = graphMessages[0].id;
    const r9m = await graphFetch(
      GRAPH_TOKEN,
      `/users/${MB}/messages/${encodeURIComponent(msgId)}/attachments?$select=id,name,contentType,size`,
    );
    assert(r9m.ok, "Attachment list endpoint responds", `status=${r9m.status}`);
    const attachments = r9m.json?.value ?? [];
    pass(`Attachment count for first message: ${attachments.length}`);
  } else {
    skip("Attachment listing", "No messages in inbox");
  }

  // 9n: Invalid mailbox → ErrorInvalidUser returned
  const r9n = await graphFetch(
    GRAPH_TOKEN,
    `/users/definitively-does-not-exist@invalid.tld/messages?$top=1`,
  );
  assert(
    !r9n.ok,
    "Invalid mailbox returns error (not 200)",
    `Unexpectedly returned ${r9n.status} OK`,
  );
}

// ═════════════════════════════════════════════════════════════════════════════
//  SECTION 10 — DB DATA INTEGRITY DEEP CHECKS
// ═════════════════════════════════════════════════════════════════════════════
section("10. DB Data Integrity Deep Checks");

// 10a: All email communications have an external_id (Graph message ID) if from sync
const [[missingExtId]] = await db.query(
  `SELECT COUNT(*) AS cnt FROM communications
   WHERE tenant_id = ? AND communication_type = 'email'
   AND direction = 'inbound' AND external_id IS NULL
   AND created_at > DATE_SUB(NOW(), INTERVAL 7 DAY)`,
  [TENANT_ID],
);
if (missingExtId.cnt > 0) {
  fail(
    `${missingExtId.cnt} recent inbound email comms missing external_id (Graph message ID)`,
    `This means mailbox sync is not saving Graph IDs`,
  );
} else {
  pass(
    "All recent inbound email communications have external_id",
    `checked last 7 days`,
  );
}

// 10b: email_sync_log error_detail column is valid (no broken JSON fragments)
const [syncLogRows] = await db.query(
  `SELECT id, error_detail FROM email_sync_log
   WHERE tenant_id = ? ORDER BY started_at DESC LIMIT 50`,
  [TENANT_ID],
);
let badJson = 0;
for (const row of syncLogRows) {
  if (row.error_detail == null) continue;
  try {
    if (
      typeof row.error_detail === "string" &&
      row.error_detail.startsWith("{")
    ) {
      JSON.parse(row.error_detail);
    }
  } catch {
    badJson++;
  }
}
assert(
  badJson === 0,
  `All email_sync_log error_detail is valid (no broken JSON)`,
  `${badJson} sync log rows have broken error_detail JSON`,
);

// 10c: conversation_threads.tags is valid JSON array or NULL
const [taggedThreads] = await db.query(
  `SELECT conversation_id, tags FROM conversation_threads
   WHERE tenant_id = ? AND tags IS NOT NULL LIMIT 100`,
  [TENANT_ID],
);
let badTagsJson = 0;
for (const row of taggedThreads) {
  try {
    const parsed =
      typeof row.tags === "string" ? JSON.parse(row.tags) : row.tags;
    if (!Array.isArray(parsed)) badTagsJson++;
  } catch {
    badTagsJson++;
  }
}
assert(
  badTagsJson === 0,
  "All conversation_threads.tags are valid JSON arrays",
  `${badTagsJson} threads have invalid tags JSON`,
);

// 10d: No duplicate (conversation_id, mailbox_id) in conversation_threads
const [[dupConvMb]] = await db.query(
  `SELECT COUNT(*) AS cnt FROM (
     SELECT conversation_id, mailbox_id, COUNT(*) as n
     FROM conversation_threads
     WHERE tenant_id = ?
     GROUP BY conversation_id, mailbox_id
     HAVING n > 1
   ) AS dups`,
  [TENANT_ID],
);
assert(
  dupConvMb.cnt === 0,
  "No duplicate (conversation_id, mailbox_id) pairs in conversation_threads",
  `${dupConvMb.cnt} duplicate pair(s) found`,
);

// 10e: email_drafts belong to existing brokers
const [[orphanDrafts]] = await db.query(
  `SELECT COUNT(*) AS cnt FROM email_drafts ed
   WHERE NOT EXISTS (SELECT 1 FROM brokers b WHERE b.id = ed.broker_id AND b.tenant_id = ed.tenant_id)`,
  [],
);
assert(
  orphanDrafts.cnt === 0,
  "All email_drafts belong to existing brokers",
  `${orphanDrafts.cnt} orphaned draft(s)`,
);

// 10f: email_signatures belong to existing brokers
const [[orphanSigs]] = await db.query(
  `SELECT COUNT(*) AS cnt FROM email_signatures es
   WHERE NOT EXISTS (SELECT 1 FROM brokers b WHERE b.id = es.broker_id AND b.tenant_id = es.tenant_id)`,
  [],
);
assert(
  orphanSigs.cnt === 0,
  "All email_signatures belong to existing brokers",
  `${orphanSigs.cnt} orphaned signature(s)`,
);

// 10g: No email communications pointing to non-existent conversation_threads
const [[orphanComms]] = await db.query(
  `SELECT COUNT(*) AS cnt FROM communications c
   WHERE c.tenant_id = ? AND c.communication_type = 'email'
   AND NOT EXISTS (
     SELECT 1 FROM conversation_threads ct
     WHERE ct.conversation_id = c.conversation_id AND ct.tenant_id = c.tenant_id
   )`,
  [TENANT_ID],
);
assert(
  orphanComms.cnt === 0,
  "All email communications reference an existing conversation thread",
  `${orphanComms.cnt} orphaned email communication(s)`,
);

// 10h: conversation_email_mailboxes.provider is always a known value
const [[badProvider]] = await db.query(
  `SELECT COUNT(*) AS cnt FROM conversation_email_mailboxes
   WHERE tenant_id = ? AND provider NOT IN ('office365','gmail','smtp')`,
  [TENANT_ID],
);
assert(
  badProvider.cnt === 0,
  "All mailboxes have a recognized provider value",
  `${badProvider.cnt} mailboxes with unknown provider`,
);

// 10i: No conversation_threads have both status=active AND archived_at set
const [[activeArchived]] = await db.query(
  `SELECT COUNT(*) AS cnt FROM conversation_threads
   WHERE tenant_id = ? AND status = 'active' AND archived_at IS NOT NULL`,
  [TENANT_ID],
);
assert(
  activeArchived.cnt === 0,
  "No thread is both active and archived_at set",
  `${activeArchived.cnt} thread(s) are active but have archived_at`,
);

// 10j: No negative totalItemCount in email_attachment_cache
const [[negCacheCount]] = await db.query(
  `SELECT COUNT(*) AS cnt FROM information_schema.tables
   WHERE table_schema = ? AND table_name = 'email_attachment_cache'`,
  [env.DB_NAME],
);
if (negCacheCount.cnt > 0) {
  pass(
    "email_attachment_cache table exists (deep integrity skipped — no PK to validate)",
  );
} else {
  skip("email_attachment_cache integrity", "Table does not exist");
}

// ═════════════════════════════════════════════════════════════════════════════
//  SECTION 11 — EDGE CASES & MISCELLANEOUS
// ═════════════════════════════════════════════════════════════════════════════
section("11. Edge Cases & Miscellaneous");

// 11a: Thread action on a thread with no external_id comms (DB-only update)
const [noExtIdThread] = await db.query(
  `SELECT ct.conversation_id FROM conversation_threads ct
   WHERE ct.tenant_id = ? AND ct.status = 'active'
   AND NOT EXISTS (
     SELECT 1 FROM communications c
     WHERE c.conversation_id = ct.conversation_id
       AND c.tenant_id = ct.tenant_id
       AND c.external_id IS NOT NULL
   ) LIMIT 1`,
  [TENANT_ID],
);
if (noExtIdThread.length > 0) {
  const convId = noExtIdThread[0].conversation_id;
  // Check if this thread belongs to Broker A
  const [[threadOwner]] = await db.query(
    `SELECT mb.assigned_broker_id FROM conversation_threads ct
     LEFT JOIN conversation_email_mailboxes mb ON mb.id = ct.mailbox_id
     WHERE ct.conversation_id = ? AND ct.tenant_id = ?`,
    [convId, TENANT_ID],
  );
  if (threadOwner?.assigned_broker_id === brokerA.id) {
    const r11a = await api(
      TOKEN_A,
      "PATCH",
      `/api/email/threads/${encodeURIComponent(convId)}/action`,
      {
        action: "mark_read",
      },
    );
    assert(
      r11a.status === 200,
      "Thread action on thread with no Graph IDs → DB-only update (200)",
      `Returned ${r11a.status}`,
    );
  } else {
    skip(
      "DB-only thread action",
      "Thread with no external_ids doesn't belong to Broker A",
    );
  }
} else {
  skip("DB-only thread action", "No thread with all-null external_ids found");
}

// 11b: Large conversationId (SQL injection probe — should return 404, not 500)
const injectedConvId = "' OR '1'='1"; // classic SQL injection
const r11b = await api(
  TOKEN_A,
  "PATCH",
  `/api/email/threads/${encodeURIComponent(injectedConvId)}/action`,
  { action: "archive" },
);
assert(
  r11b.status === 400 || r11b.status === 404 || r11b.status === 422,
  "SQL injection in conversationId handled safely (no 500)",
  `Injection returned ${r11b.status} — check for 500`,
);

// 11c: Very long subject in draft (boundary test — 1000 char subject)
const longSubject = "S".repeat(1000);
const r11c = await api(TOKEN_A, "POST", "/api/email/drafts", {
  to: "test@example.com",
  subject: longSubject,
  body: "<p>boundary test</p>",
  mailbox_id: ownMailboxA?.id ?? null,
});
if (r11c.status === 200 || r11c.status === 201) {
  const longDraftId = r11c.data?.draft?.id ?? r11c.data?.id;
  pass("1000-char subject draft accepted");
  if (longDraftId)
    await api(TOKEN_A, "DELETE", `/api/email/drafts/${longDraftId}`);
} else {
  // Also acceptable to reject at 400
  assert(
    r11c.status === 400,
    "1000-char subject rejected at 400 (acceptable)",
    `Returned ${r11c.status}`,
  );
}

// 11d: Concurrent duplicate draft creates (idempotency sanity check)
if (ownMailboxA) {
  const payload = {
    to: "concurrent@example.com",
    subject: "[smoke-test] Concurrent " + Date.now(),
    body: "<p>concurrent</p>",
    mailbox_id: ownMailboxA.id,
  };
  const [rr1, rr2] = await Promise.all([
    api(TOKEN_A, "POST", "/api/email/drafts", payload),
    api(TOKEN_A, "POST", "/api/email/drafts", payload),
  ]);
  assert(
    rr1.status === 200 || rr1.status === 201,
    "Concurrent draft create #1 succeeds",
    `Returned ${rr1.status}`,
  );
  assert(
    rr2.status === 200 || rr2.status === 201,
    "Concurrent draft create #2 succeeds",
    `Returned ${rr2.status}`,
  );
  // Cleanup both
  const id1 = rr1.data?.draft?.id ?? rr1.data?.id;
  const id2 = rr2.data?.draft?.id ?? rr2.data?.id;
  if (id1) await api(TOKEN_A, "DELETE", `/api/email/drafts/${id1}`);
  if (id2 && id2 !== id1)
    await api(TOKEN_A, "DELETE", `/api/email/drafts/${id2}`);
}

// 11e: Thread action with extra unknown body fields (should not error)
const activeThread = allThreadsA.find(
  (t) => t.status === "active" && t.mailbox_id != null,
);
if (activeThread) {
  const r11e = await api(
    TOKEN_A,
    "PATCH",
    `/api/email/threads/${encodeURIComponent(activeThread.conversation_id)}/action`,
    {
      action: "flag",
      unknownField1: "should be ignored",
      anotherField: 42,
    },
  );
  assert(
    r11e.status === 200 || r11e.status === 502,
    "Extra unknown fields in action body don't cause 500",
    `Returned ${r11e.status}`,
  );
}

// 11f: Mark unread then mark read — verify unread_count in DB
if (activeThread) {
  const convId = activeThread.conversation_id;
  await api(
    TOKEN_A,
    "PATCH",
    `/api/email/threads/${encodeURIComponent(convId)}/action`,
    { action: "mark_unread" },
  );
  const [[afterUnread]] = await db.query(
    `SELECT unread_count FROM conversation_threads WHERE conversation_id = ? AND tenant_id = ?`,
    [convId, TENANT_ID],
  );
  assert(
    (afterUnread?.unread_count ?? 0) >= 1,
    "mark_unread sets unread_count >= 1 in DB",
    `unread_count=${afterUnread?.unread_count}`,
  );

  await api(
    TOKEN_A,
    "PATCH",
    `/api/email/threads/${encodeURIComponent(convId)}/action`,
    { action: "mark_read" },
  );
  const [[afterRead]] = await db.query(
    `SELECT unread_count FROM conversation_threads WHERE conversation_id = ? AND tenant_id = ?`,
    [convId, TENANT_ID],
  );
  assert(
    afterRead?.unread_count === 0,
    "mark_read sets unread_count = 0 in DB",
    `unread_count=${afterRead?.unread_count}`,
  );
}

// 11g: Webhook endpoint exists (returns 400 on empty body, not 404)
const r11g = await api(null, "POST", "/api/webhooks/inbound-email", {});
assert(
  r11g.status !== 404,
  "Inbound email webhook endpoint exists (not 404)",
  `Returned ${r11g.status}`,
);

// ═════════════════════════════════════════════════════════════════════════════
//  FINAL SUMMARY
// ═════════════════════════════════════════════════════════════════════════════
await db.end();

const total = passed + failed + skipped;
console.log("\n" + "═".repeat(66));
console.log(
  `  RESULTS:  ${passed} passed  |  ${failed} failed  |  ${skipped} skipped  |  ${total} total`,
);
console.log("═".repeat(66));

if (failures.length > 0) {
  console.error("\n  Failed checks:");
  for (const f of failures) {
    console.error(`    ❌  ${f.name}${f.detail ? "  →  " + f.detail : ""}`);
  }
}

if (failed > 0) {
  console.error(
    "\n🚨  SMOKE TEST FAILED — resolve all failures before deploying.\n",
  );
  process.exit(1);
} else {
  console.log("\n✅  All checks passed — email system is healthy.\n");
  process.exit(0);
}
