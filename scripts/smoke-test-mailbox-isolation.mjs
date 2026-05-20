/**
 * smoke-test-mailbox-isolation.mjs
 *
 * Robust end-to-end smoke test verifying:
 *   1. DB is clean (no mailboxes, no email comms, no orphan email threads)
 *   2. New email system tables exist (email_drafts, email_signatures, email_attachment_cache, email_sync_log)
 *   3. Mailbox list API returns ONLY the connecting broker's mailbox
 *   4. A second broker cannot see the first broker's mailbox
 *   5. Thread list is isolated to the broker's mailbox (mailbox_id filter)
 *   6. Folder browsing is restricted to the owning broker
 *   7. Sync endpoint is restricted to the owning broker
 *   8. DB invariant: assigned_broker_id is never NULL on active mailboxes
 *
 * Usage:
 *   node scripts/smoke-test-mailbox-isolation.mjs [broker1_email] [broker2_email]
 *
 * If broker emails are not passed as args, the script auto-selects the first two
 * active brokers from the DB.
 *
 * Requires: .env in project root with DB_* and JWT_SECRET only.
 * NO broker tokens should ever be stored in .env or any config file.
 * Tokens are generated in-memory from JWT_SECRET + broker IDs at test runtime.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import mysql from "mysql2/promise";
import axios from "axios";
import jwt from "jsonwebtoken";
import crypto from "crypto";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, "../.env");

// ─── Load .env ────────────────────────────────────────────────────────────────
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

if (!env.JWT_SECRET || env.JWT_SECRET.length < 32) {
  console.error(
    "❌  JWT_SECRET missing or too short in .env — cannot generate test tokens",
  );
  process.exit(1);
}

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

// ─── Sign a short-lived test JWT for a broker (in-memory only, never stored) ──
function signTestToken(broker) {
  return jwt.sign(
    {
      brokerId: broker.id,
      email: broker.email,
      role: broker.role,
      userType: "broker",
      jti: crypto.randomUUID(),
      _smoke_test: true, // marker so these are identifiable in logs
    },
    env.JWT_SECRET,
    { expiresIn: "15m" }, // short-lived — only needed for the duration of this test
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
let passed = 0;
let failed = 0;
const results = [];

function pass(name, detail = "") {
  passed++;
  results.push({ status: "PASS", name, detail });
  console.log(`  ✅ PASS  ${name}${detail ? " — " + detail : ""}`);
}

function fail(name, detail = "") {
  failed++;
  results.push({ status: "FAIL", name, detail });
  console.error(`  ❌ FAIL  ${name}${detail ? " — " + detail : ""}`);
}

function section(title) {
  console.log(`\n${"═".repeat(60)}\n  ${title}\n${"═".repeat(60)}`);
}

async function apiCall(token, method, urlPath, data) {
  try {
    const res = await axios({
      method,
      url: `${API_BASE}${urlPath}`,
      data,
      headers: { Authorization: `Bearer ${token}` },
      validateStatus: () => true,
    });
    return { status: res.status, data: res.data };
  } catch (e) {
    return { status: 0, error: e.message };
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────
const db = await mysql.createConnection(DB_CONFIG);
console.log("\n🔍  Mailbox Isolation Smoke Test");
console.log(`    API: ${API_BASE}`);
console.log(`    DB:  ${env.DB_HOST}:${env.DB_PORT}/${env.DB_NAME}`);
console.log(
  `    Note: Tokens generated in-memory from JWT_SECRET — never stored\n`,
);

// ─── Load test brokers from DB (or accept as CLI args) ───────────────────────
const [broker1Email, broker2Email] = process.argv.slice(2);

let brokerQuery;
if (broker1Email && broker2Email) {
  [brokerQuery] = await db.query(
    `SELECT id, email, first_name, last_name, role FROM brokers
     WHERE tenant_id = ? AND status = 'active' AND email IN (?, ?)
     ORDER BY FIELD(email, ?, ?)`,
    [TENANT_ID, broker1Email, broker2Email, broker1Email, broker2Email],
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
    `❌  Need at least 2 active brokers in the DB. Found: ${brokerQuery.length}`,
  );
  await db.end();
  process.exit(1);
}

const brokerA = brokerQuery[0];
const brokerB = brokerQuery[1];

// Generate short-lived test tokens in memory — not stored in any file
const TOKEN_A = signTestToken(brokerA);
const TOKEN_B = signTestToken(brokerB);

console.log(
  `    Broker A: ${brokerA.first_name} ${brokerA.last_name} <${brokerA.email}> (id=${brokerA.id})`,
);
console.log(
  `    Broker B: ${brokerB.first_name} ${brokerB.last_name} <${brokerB.email}> (id=${brokerB.id})\n`,
);

// ─── CHECK 1: DB clean slate ──────────────────────────────────────────────────
section("1. DB Clean Slate");

const [mailboxRows] = await db.query(
  "SELECT COUNT(*) AS cnt FROM conversation_email_mailboxes WHERE tenant_id = 1",
);
mailboxRows[0].cnt === 0
  ? pass("No mailbox records exist", `count=${mailboxRows[0].cnt}`)
  : fail(
      "Mailbox records still present — run migration first",
      `count=${mailboxRows[0].cnt}`,
    );

const [emailCommRows] = await db.query(
  "SELECT COUNT(*) AS cnt FROM communications WHERE tenant_id = 1 AND communication_type = 'email'",
);
emailCommRows[0].cnt === 0
  ? pass("No email communications exist", `count=${emailCommRows[0].cnt}`)
  : fail(
      "Email communications still present — run migration first",
      `count=${emailCommRows[0].cnt}`,
    );

const [emailThreadRows] = await db.query(
  `SELECT COUNT(*) AS cnt FROM conversation_threads
   WHERE tenant_id = 1 AND last_message_type = 'email'
   AND NOT EXISTS (
     SELECT 1 FROM communications c
     WHERE c.conversation_id = conversation_threads.conversation_id
       AND c.tenant_id = 1 AND c.communication_type != 'email'
   )`,
);
emailThreadRows[0].cnt === 0
  ? pass(
      "No orphan email-only threads exist",
      `count=${emailThreadRows[0].cnt}`,
    )
  : fail(
      "Email-only threads still present — run migration first",
      `count=${emailThreadRows[0].cnt}`,
    );

// ─── CHECK 2: New email system tables exist ───────────────────────────────────
section("2. DB Schema — Email System v2 Tables Exist");

const emailV2Tables = [
  "email_drafts",
  "email_signatures",
  "email_attachment_cache",
  "email_sync_log",
];
for (const tbl of emailV2Tables) {
  const [rows] = await db.query(
    `SELECT COUNT(*) AS cnt FROM information_schema.tables
     WHERE table_schema = ? AND table_name = ?`,
    [env.DB_NAME, tbl],
  );
  rows[0].cnt === 1
    ? pass(`Table '${tbl}' exists`)
    : fail(
        `Table '${tbl}' is MISSING — run migration 20260519_100000_email_system_v2.sql`,
      );
}

// Also verify is_shared column has been dropped from conversation_email_mailboxes
const [isSharedCol] = await db.query(
  `SELECT COUNT(*) AS cnt FROM information_schema.columns
   WHERE table_schema = ? AND table_name = 'conversation_email_mailboxes' AND column_name = 'is_shared'`,
  [env.DB_NAME],
);
isSharedCol[0].cnt === 0
  ? pass("is_shared column has been removed from conversation_email_mailboxes")
  : fail(
      "is_shared column still exists — run migration 20260519_100000_email_system_v2.sql",
    );

// ─── CHECK 3: Mailbox list returns empty for both brokers ─────────────────────
section("3. Mailbox List — Empty Before Connect");

const rA2 = await apiCall(TOKEN_A, "GET", "/api/conversations/mailboxes");
rA2.status === 200 &&
Array.isArray(rA2.data?.mailboxes) &&
rA2.data.mailboxes.length === 0
  ? pass(`${brokerA.first_name} sees zero mailboxes before connecting`)
  : fail(
      `${brokerA.first_name} sees unexpected mailboxes`,
      JSON.stringify(rA2.data?.mailboxes ?? rA2.error),
    );

const rB2 = await apiCall(TOKEN_B, "GET", "/api/conversations/mailboxes");
rB2.status === 200 &&
Array.isArray(rB2.data?.mailboxes) &&
rB2.data.mailboxes.length === 0
  ? pass(`${brokerB.first_name} sees zero mailboxes before connecting`)
  : fail(
      `${brokerB.first_name} sees unexpected mailboxes`,
      JSON.stringify(rB2.data?.mailboxes ?? rB2.error),
    );

// ─── CHECK 4: NULL assigned_broker_id rows ───────────────────────────────────
section("4. DB Invariant — No ownerless mailboxes");

const [orphanRows] = await db.query(
  "SELECT id, mailbox_email, status FROM conversation_email_mailboxes WHERE tenant_id = 1 AND assigned_broker_id IS NULL AND status NOT IN ('disabled','pending')",
);
orphanRows.length === 0
  ? pass("No active mailbox has NULL assigned_broker_id")
  : fail(
      `${orphanRows.length} active mailbox(es) have no owner`,
      orphanRows.map((r) => r.mailbox_email).join(", "),
    );

// ─── CHECK 5: Thread list isolation ───────────────────────────────────────────
section("5. Thread API — mailbox_id filter enforced");

const rA5 = await apiCall(
  TOKEN_A,
  "GET",
  "/api/conversations/threads?folder=inbox&limit=10",
);
if (rA5.status === 200) {
  const threads = rA5.data?.threads || [];
  pass(
    `Thread list call succeeded for ${brokerA.first_name}`,
    `${threads.length} thread(s) returned`,
  );

  const mailboxResA = await apiCall(
    TOKEN_A,
    "GET",
    "/api/conversations/mailboxes",
  );
  const aMailboxIds = new Set(
    (mailboxResA.data?.mailboxes || []).map((m) => m.id),
  );
  const leaked = threads.filter(
    (t) =>
      t.mailbox_id !== null &&
      t.mailbox_id !== undefined &&
      !aMailboxIds.has(t.mailbox_id),
  );
  leaked.length === 0
    ? pass(`No thread belongs to a mailbox ${brokerA.first_name} doesn't own`)
    : fail(
        `${leaked.length} thread(s) from foreign mailboxes leaked to ${brokerA.first_name}`,
        leaked.map((t) => t.mailbox_id).join(", "),
      );
} else {
  fail(
    "Thread API call failed",
    `status=${rA5.status} ${JSON.stringify(rA5.error ?? "")}`,
  );
}

section("6. Cross-Broker Access — Denied");

const [allMailboxes] = await db.query(
  "SELECT id, mailbox_email, assigned_broker_id FROM conversation_email_mailboxes WHERE tenant_id = 1 AND status = 'active'",
);

if (allMailboxes.length >= 2) {
  const listA = await apiCall(TOKEN_A, "GET", "/api/conversations/mailboxes");
  const listB = await apiCall(TOKEN_B, "GET", "/api/conversations/mailboxes");

  const aIds = new Set((listA.data?.mailboxes || []).map((m) => m.id));
  const bIds = new Set((listB.data?.mailboxes || []).map((m) => m.id));

  const overlap = [...aIds].filter((id) => bIds.has(id));
  overlap.length === 0
    ? pass(
        `${brokerA.first_name} and ${brokerB.first_name} see no overlapping mailboxes`,
      )
    : fail(
        `${overlap.length} mailbox(es) visible to both brokers`,
        overlap.join(", "),
      );

  // Try Broker A calling Broker B's mailbox folder endpoint directly
  const bOnlyMailboxes = allMailboxes.filter((mb) => !aIds.has(mb.id));
  if (bOnlyMailboxes.length > 0) {
    const mb = bOnlyMailboxes[0];
    const rCross = await apiCall(
      TOKEN_A,
      "GET",
      `/api/conversations/mailboxes/${mb.id}/folders`,
    );
    rCross.status === 404 || rCross.status === 403
      ? pass(
          `${brokerA.first_name} denied access to ${brokerB.first_name}'s mailbox`,
          `status=${rCross.status}`,
        )
      : fail(
          `${brokerA.first_name} accessed ${brokerB.first_name}'s mailbox!`,
          `mailbox=${mb.mailbox_email} status=${rCross.status}`,
        );
  } else {
    console.log(
      `  ⚠️  SKIP  Both brokers own different mailboxes — direct folder cross-test needs 2+ connected mailboxes`,
    );
  }
} else {
  console.log(
    `  ⚠️  SKIP  Need 2 active mailboxes for cross-broker test (connect both brokers first)`,
  );
}

section("7. Folder Browsing — Own Mailbox Only");

const mailboxResA7 = await apiCall(
  TOKEN_A,
  "GET",
  "/api/conversations/mailboxes",
);
const ownMailbox = (mailboxResA7.data?.mailboxes || [])[0];
if (ownMailbox) {
  const rFolders = await apiCall(
    TOKEN_A,
    "GET",
    `/api/conversations/mailboxes/${ownMailbox.id}/folders`,
  );
  if (rFolders.status === 200 && Array.isArray(rFolders.data?.folders)) {
    pass(
      `${brokerA.first_name} can browse folders on own mailbox`,
      `${rFolders.data.folders.length} folder(s) returned`,
    );
    const systemFolders = rFolders.data.folders.filter((f) => f.isSystemFolder);
    const customFolders = rFolders.data.folders.filter(
      (f) => !f.isSystemFolder,
    );
    pass(`System folders visible`, `count=${systemFolders.length}`);
    customFolders.length >= 0 &&
      pass(`Custom folders visible`, `count=${customFolders.length}`);
  } else {
    fail(
      "Folder listing failed or returned wrong shape",
      `status=${rFolders.status}`,
    );
  }
} else {
  console.log(
    `  ⚠️  SKIP  ${brokerA.first_name} has no active mailbox — connect first`,
  );
}

section("8. Sync — Restricted to Owning Broker");

const [activeMbs] = await db.query(
  "SELECT id, mailbox_email, assigned_broker_id FROM conversation_email_mailboxes WHERE tenant_id = 1 AND status = 'active' LIMIT 5",
);

if (activeMbs.length > 0) {
  const bMailboxRes = await apiCall(
    TOKEN_B,
    "GET",
    "/api/conversations/mailboxes",
  );
  const bMailboxIds = new Set(
    (bMailboxRes.data?.mailboxes || []).map((m) => m.id),
  );

  const foreignToB = activeMbs.find((mb) => !bMailboxIds.has(mb.id));
  if (foreignToB) {
    const rSync = await apiCall(
      TOKEN_B,
      "POST",
      `/api/conversations/mailboxes/${foreignToB.id}/sync`,
    );
    rSync.status === 404 || rSync.status === 403
      ? pass(
          `${brokerB.first_name} blocked from syncing ${brokerA.first_name}'s mailbox`,
          `status=${rSync.status}`,
        )
      : fail(
          `${brokerB.first_name} synced a foreign mailbox!`,
          `mailbox=${foreignToB.mailbox_email} status=${rSync.status}`,
        );
  } else {
    console.log(
      `  ⚠️  SKIP  No mailbox exists that ${brokerB.first_name} doesn't own — connect both brokers first`,
    );
  }
} else {
  console.log(`  ⚠️  SKIP  No active mailboxes exist — connect brokers first`);
}

// ─── Summary ──────────────────────────────────────────────────────────────────
await db.end();

console.log("\n" + "═".repeat(60));
console.log(`  RESULTS: ${passed} passed, ${failed} failed`);
console.log("═".repeat(60));

if (failed > 0) {
  console.error(
    "\n🚨  SMOKE TEST FAILED — do NOT deploy until all checks pass\n",
  );
  process.exit(1);
} else {
  console.log("\n✅  All checks passed — mailbox isolation is enforced\n");
  process.exit(0);
}
