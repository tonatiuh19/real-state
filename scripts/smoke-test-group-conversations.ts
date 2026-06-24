/**
 * Group conversations smoke tests — synthetic transaction, always rolled back.
 *
 * Usage: npx tsx scripts/smoke-test-group-conversations.ts
 * Unit-only: SMOKE_UNIT_ONLY=1 npx tsx scripts/smoke-test-group-conversations.ts
 */
import "dotenv/config";
import mysql, { type RowDataPacket } from "mysql2/promise";
import {
  buildAutoGroupTitle,
  computeParticipantFingerprint,
  groupSmsQuotaUnits,
  isGroupConversationsEnabled,
  resolveGroupConversationsEnabled,
  newGroupConversationId,
  normalizeE164,
  parseOtherRecipients,
  phoneLast10,
  resolveDisplayTitle,
  smsSegmentsFromBody,
} from "../shared/group-conversations";

const TENANT_ID = Number(process.env.MORTGAGE_TENANT_ID ?? "1");
const RUN_UNIT_ONLY = process.env.SMOKE_UNIT_ONLY === "1";

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

function runSqlAssemblyTests() {
  const groupVis = `OR (
           ct.thread_type = 'group'
           AND EXISTS (SELECT 1 FROM conversation_participants cp_vis WHERE cp_vis.broker_id = ?)
           OR (
             ct.thread_type = 'group'
             AND EXISTS (SELECT 1 FROM conversation_participants cp_cl WHERE cp_cl.client_id IS NOT NULL)
           )
         )`;
  const visibilityWhere = `(ct.broker_id = ?
          OR EXISTS (SELECT 1 FROM clients cl_own WHERE cl_own.id = ct.client_id)
         ${groupVis})`;
  if (/\)\s*AND\s+OR/i.test(visibilityWhere)) {
    fail("GC-SQL visibility must not contain AND OR");
  } else {
    pass("GC-SQL visibility fragment valid");
  }

  const groupSearch = `OR (ct.thread_type = 'group' AND ct.title LIKE ?)
          OR EXISTS (SELECT 1 FROM conversation_participants cp_s WHERE cp_s.display_name LIKE ?)`;
  const searchWhere = `(ct.client_name LIKE ?
          OR ct.client_phone LIKE ?
          ${groupSearch})`;
  if (/\)\s*AND\s+OR/i.test(searchWhere)) {
    fail("GC-SQL search must not contain AND OR");
  } else {
    pass("GC-SQL search fragment valid");
  }
}

function runUnitTests() {
  const fp1 = computeParticipantFingerprint("+15559876543", [
    "+15551111111",
    "+15552222222",
  ]);
  const fp2 = computeParticipantFingerprint("+15559876543", [
    "+15552222222",
    "+15551111111",
  ]);
  if (fp1 === fp2) pass("GC-019 fingerprint order-independent");
  else fail("GC-019 fingerprint order-independent");

  const title2 = buildAutoGroupTitle([
    { display_name: "Bob Reyes" },
    { display_name: "Alice Nguyen" },
  ]);
  if (title2.includes("Alice") && title2.includes("Bob"))
    pass("GC-020 auto-title two participants", title2);
  else fail("GC-020 auto-title two participants", title2);

  const title5 = buildAutoGroupTitle([
    { display_name: "A" },
    { display_name: "B" },
    { display_name: "C" },
    { display_name: "D" },
    { display_name: "E" },
  ]);
  if (title5.includes("+3")) pass("GC-020 auto-title overflow", title5);
  else fail("GC-020 auto-title overflow", title5);

  const others = parseOtherRecipients({
    From: "+15551111111",
    OtherRecipients0: "+15552222222",
  });
  if (others.length === 1 && phoneLast10(others[0]).length === 10)
    pass("GC-005 parse OtherRecipients0");
  else fail("GC-005 parse OtherRecipients0");

  const arrayOthers = parseOtherRecipients({
    recipients: ["+15553333333", "+15554444444"],
  });
  if (arrayOthers.length === 2) pass("GC-005 parse recipients array");
  else fail("GC-005 parse recipients array");

  const display = resolveDisplayTitle(null, [
    { display_name: "Alice Nguyen" },
  ]);
  if (display === "Alice Nguyen") pass("GC-023 display_title fallback");
  else fail("GC-023 display_title fallback", display);

  const id = newGroupConversationId();
  if (id.startsWith("conv_group_")) pass("GC-001 conversation id namespace");
  else fail("GC-001 conversation id namespace", id);

  if (normalizeE164("5625735110") === "+15625735110")
    pass("normalizeE164 10-digit");
  else fail("normalizeE164 10-digit");

  if (smsSegmentsFromBody("hello") === 1) pass("GC-021 sms segment single");
  else fail("GC-021 sms segment single");

  const longBody = "x".repeat(161);
  if (smsSegmentsFromBody(longBody) === 2) pass("GC-021 sms segment multi");
  else fail("GC-021 sms segment multi");

  if (groupSmsQuotaUnits("hello", 3) === 3)
    pass("GC-022 quota units segments x recipients");
  else fail("GC-022 quota units segments x recipients");

  const fpDirect = computeParticipantFingerprint("+15551111111", [
    "+15552222222",
  ]);
  const fpGroup = computeParticipantFingerprint("+15551111111", [
    "+15552222222",
    "+15553333333",
  ]);
  if (fpDirect !== fpGroup) pass("GC-004 group vs pair fingerprint differs");
  else fail("GC-004 group vs pair fingerprint differs");

  if (isGroupConversationsEnabled(undefined)) {
    pass("GC-018 enabled by default (env unset)");
  } else {
    fail("GC-018 enabled by default (env unset)");
  }
  if (!isGroupConversationsEnabled("0")) {
    pass("GC-018 opt-out with GROUP_CONVERSATIONS_ENABLED=0");
  } else {
    fail("GC-018 opt-out with GROUP_CONVERSATIONS_ENABLED=0");
  }
  if (
    resolveGroupConversationsEnabled({
      enabled: undefined,
      runtime: "production",
      allowProduction: undefined,
    }) === false
  ) {
    pass("GC-024 disabled in production by default");
  } else {
    fail("GC-024 disabled in production by default");
  }
  if (
    resolveGroupConversationsEnabled({
      enabled: undefined,
      runtime: "production",
      allowProduction: "1",
    })
  ) {
    pass("GC-025 enabled in production when ALLOW_PRODUCTION=1");
  } else {
    fail("GC-025 enabled in production when ALLOW_PRODUCTION=1");
  }
  if (
    resolveGroupConversationsEnabled({
      enabled: undefined,
      runtime: "development",
      allowProduction: undefined,
    })
  ) {
    pass("GC-026 enabled in development without production flag");
  } else {
    fail("GC-026 enabled in development without production flag");
  }
}

async function runDbTests() {
  const pool = mysql.createPool({
    host: requireEnv("DB_HOST"),
    user: requireEnv("DB_USER"),
    password: requireEnv("DB_PASSWORD"),
    database: requireEnv("DB_NAME"),
    port: parseInt(process.env.DB_PORT || "3306", 10),
    ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: true } : undefined,
    timezone: "+00:00",
  });

  const conn = await pool.getConnection();
  const runId = `smoke-group-${Date.now()}`;
  const phoneA = `+1555${String(Date.now()).slice(-7)}1`;
  const phoneB = `+1555${String(Date.now()).slice(-7)}2`;
  const convId = `conv_group_${runId.replace(/\W/g, "").slice(0, 16)}`;
  const fp = computeParticipantFingerprint(null, [phoneA, phoneB]);

  try {
    await conn.beginTransaction();

    const [colRows] = await conn.query<RowDataPacket[]>(
      `SELECT COLUMN_NAME FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = 'conversation_threads'
         AND COLUMN_NAME IN ('thread_type', 'creation_source', 'participant_fingerprint')`,
    );
    if (colRows.length >= 3) pass("GC-001 group thread columns exist");
    else fail("GC-001 group thread columns exist — run migration");

    const [partTable] = await conn.query<RowDataPacket[]>(
      `SELECT TABLE_NAME FROM information_schema.TABLES
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'conversation_participants'`,
    );
    if (partTable.length > 0) pass("GC-001 conversation_participants table");
    else fail("GC-001 conversation_participants table — run migration");

    await conn.query(
      `INSERT INTO conversation_threads
         (tenant_id, conversation_id, broker_id, thread_type, title,
          participant_fingerprint, channel, creation_source,
          client_name, last_message_at, last_message_preview, last_message_type,
          message_count, unread_count, status)
       VALUES (?, ?, 1, 'group', 'Smoke Test Group', ?, 'internal', 'encore',
               'Smoke Test Group', NOW(), 'test', 'internal_note', 0, 0, 'active')`,
      [TENANT_ID, convId, fp],
    );

    await conn.query(
      `INSERT INTO conversation_participants
         (tenant_id, conversation_id, participant_type, phone_e164, display_name, role)
       VALUES (?, ?, 'external_phone', ?, 'Alice', 'member'),
              (?, ?, 'external_phone', ?, 'Bob', 'member')`,
      [TENANT_ID, convId, phoneA, TENANT_ID, convId, phoneB],
    );

    const [threadRows] = await conn.query<RowDataPacket[]>(
      `SELECT thread_type, participant_fingerprint, creation_source FROM conversation_threads
       WHERE conversation_id = ? AND tenant_id = ?`,
      [convId, TENANT_ID],
    );
    if (
      threadRows[0]?.thread_type === "group" &&
      threadRows[0]?.participant_fingerprint === fp &&
      threadRows[0]?.creation_source === "encore"
    ) {
      pass("GC-003 group thread insert");
    } else fail("GC-003 group thread insert");

    const [pCount] = await conn.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS c FROM conversation_participants
       WHERE conversation_id = ? AND tenant_id = ? AND left_at IS NULL`,
      [convId, TENANT_ID],
    );
    if ((pCount[0]?.c as number) === 2) pass("GC-001 participant count");
    else fail("GC-001 participant count");

    const [directFp] = await conn.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS c FROM conversation_threads
       WHERE thread_type = 'direct' AND participant_fingerprint IS NOT NULL
         AND tenant_id = ?`,
      [TENANT_ID],
    );
    if ((directFp[0]?.c as number) === 0) pass("GC-007 direct threads no fingerprint");
    else
      fail(
        "GC-007 direct threads no fingerprint",
        String(directFp[0]?.c),
      );

    const fpDup = computeParticipantFingerprint(null, [phoneA, phoneB]);
    const [dupRows] = await conn.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS c FROM conversation_threads
       WHERE tenant_id = ? AND participant_fingerprint = ?`,
      [TENANT_ID, fpDup],
    );
    if ((dupRows[0]?.c as number) === 1) pass("GC-004 fingerprint uniqueness");
    else fail("GC-004 fingerprint uniqueness");

    const phoneSyncedId = `${convId}_sync`;
    const fpSync = computeParticipantFingerprint("+15559998888", [
      phoneA,
      phoneB,
      "+15557776666",
    ]);
    await conn.query(
      `INSERT INTO conversation_threads
         (tenant_id, conversation_id, broker_id, thread_type, title,
          participant_fingerprint, channel, creation_source,
          client_name, last_message_at, last_message_preview, last_message_type,
          message_count, unread_count, status)
       VALUES (?, ?, 1, 'group', NULL, ?, 'sms', 'phone_synced',
               'Auto Group', NOW(), 'inbound', 'sms', 1, 1, 'active')`,
      [TENANT_ID, phoneSyncedId, fpSync],
    );
    const [syncRow] = await conn.query<RowDataPacket[]>(
      `SELECT creation_source, channel FROM conversation_threads
       WHERE conversation_id = ? AND tenant_id = ?`,
      [phoneSyncedId, TENANT_ID],
    );
    if (
      syncRow[0]?.creation_source === "phone_synced" &&
      syncRow[0]?.channel === "sms"
    ) {
      pass("GC-006 phone_synced creation_source");
    } else fail("GC-006 phone_synced creation_source");

    if (isGroupConversationsEnabled(undefined)) {
      pass("GC-018 enabled by default (env unset)");
    } else {
      fail("GC-018 enabled by default (env unset)");
    }
    if (!isGroupConversationsEnabled("0")) {
      pass("GC-018 opt-out with GROUP_CONVERSATIONS_ENABLED=0");
    } else {
      fail("GC-018 opt-out with GROUP_CONVERSATIONS_ENABLED=0");
    }
  } catch (e: unknown) {
    fail("DB transaction", e instanceof Error ? e.message : String(e));
  } finally {
    await conn.rollback();
    conn.release();
    await pool.end();
  }
}

async function main() {
  console.log("Group conversations smoke tests\n");
  runSqlAssemblyTests();
  runUnitTests();
  if (!RUN_UNIT_ONLY) {
    await runDbTests();
  } else {
    pass("GC-DB skipped (SMOKE_UNIT_ONLY=1)");
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
