/**
 * READ-ONLY production safety + edge audit for Broadcast Bulk.
 * - No Twilio sends
 * - No Stripe / subscription writes
 * - No setting flips
 *
 * Usage: npx tsx scripts/smoke-test-broadcast-bulk-edge-audit.ts
 */
import "dotenv/config";
import mysql, { type RowDataPacket } from "mysql2/promise";
import {
  broadcastBulkBillingLabel,
  chunkArray,
  isBulkOperationTerminal,
  mapBulkOperationStatsToProgress,
  parseBroadcastSmsEngine,
  parseOperationIdsJson,
  resolveBroadcastSmsEngineFromEnv,
  shouldUseBulkSmsEngine,
} from "../shared/broadcast-bulk.ts";

const TENANT_ID = Number(process.env.MORTGAGE_TENANT_ID ?? "1");

function requireEnv(name: string): string {
  const v = process.env[name]?.trim();
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

type Case = { name: string; pass: boolean; detail?: string; severity?: "info" | "warn" | "fail" };
const cases: Case[] = [];
const pass = (name: string, detail?: string) =>
  cases.push({ name, pass: true, detail, severity: "info" });
const warn = (name: string, detail?: string) =>
  cases.push({ name, pass: true, detail, severity: "warn" });
const fail = (name: string, detail?: string) =>
  cases.push({ name, pass: false, detail, severity: "fail" });

async function main() {
  // ── Pure edge helpers (no I/O) ───────────────────────────────────────────
  const edges: Array<[string, boolean]> = [
    [
      "flag off never selects bulk",
      !shouldUseBulkSmsEngine({
        engineSetting: "messages",
        channel: "sms",
        smsRecipientCount: 50_000,
      }),
    ],
    [
      "email channel never selects bulk",
      !shouldUseBulkSmsEngine({
        engineSetting: "bulk",
        channel: "email",
        smsRecipientCount: 50_000,
      }),
    ],
    [
      "both channel can select bulk",
      shouldUseBulkSmsEngine({
        engineSetting: "bulk",
        channel: "both",
        smsRecipientCount: 2,
        minRecipients: 1,
      }),
    ],
    [
      "chunk 10000 stays single request",
      chunkArray(Array.from({ length: 10000 }, (_, i) => i), 10000).length === 1,
    ],
    [
      "chunk 10001 splits safely",
      chunkArray(Array.from({ length: 10001 }, (_, i) => i), 10000).length === 2,
    ],
    ["terminal COMPLETED", isBulkOperationTerminal("COMPLETED")],
    ["non-terminal RUNNING", !isBulkOperationTerminal("RUNNING")],
    [
      "billing label never invents bulk_segments meter",
      broadcastBulkBillingLabel("bulk") === "Broadcast (Bulk)" &&
        broadcastBulkBillingLabel("messages") === "Broadcast",
    ],
    [
      "progress empty stats safe",
      mapBulkOperationStatsToProgress(null, 10).progressPct === 0,
    ],
    [
      "parse ops from JSON string",
      parseOperationIdsJson('["a","b"]').join(",") === "a,b",
    ],
    [
      "default engine parse is messages",
      parseBroadcastSmsEngine(undefined) === "messages",
    ],
  ];
  for (const [name, ok] of edges) {
    if (ok) pass(name);
    else fail(name);
  }

  // ── READ-ONLY DB audit ───────────────────────────────────────────────────
  const conn = await mysql.createConnection({
    host: requireEnv("DB_HOST"),
    port: Number(requireEnv("DB_PORT")),
    user: requireEnv("DB_USER"),
    password: requireEnv("DB_PASSWORD"),
    database: requireEnv("DB_NAME"),
    ssl: { rejectUnauthorized: true },
  });

  try {
    // Confirm we never write in this script (read-only session hint)
    await conn.query(`SET SESSION TRANSACTION READ ONLY`).catch(() => {
      /* TiDB may ignore; we still only SELECT */
    });

    const envEngine = resolveBroadcastSmsEngineFromEnv(process.env);
    if (envEngine === "messages") {
      pass("env gate OFF (messages) — legacy path default", envEngine);
    } else if (envEngine === "bulk") {
      warn(
        "env gate ON (bulk) — Bulk engine active",
        "Kill switch: unset BROADCAST_BULK_MESSAGING_ENABLED / set BROADCAST_SMS_ENGINE=messages",
      );
    } else {
      fail("env gate unexpected value", envEngine);
    }

    // Legacy DB key is informational only (UI removed; env is source of truth)
    const [engineRows] = await conn.query<RowDataPacket[]>(
      `SELECT setting_value FROM system_settings
       WHERE tenant_id = ? AND setting_key = 'broadcast_sms_engine' LIMIT 1`,
      [TENANT_ID],
    );
    pass(
      "legacy DB broadcast_sms_engine (ignored by API)",
      String(engineRows[0]?.setting_value ?? "(unset)"),
    );

    for (const key of [
      "broadcast_bulk_min_recipients",
      "broadcast_bulk_chunk_size",
    ]) {
      const [rows] = await conn.query<RowDataPacket[]>(
        `SELECT setting_value FROM system_settings
         WHERE tenant_id = ? AND setting_key = ? LIMIT 1`,
        [TENANT_ID, key],
      );
      if (rows.length) pass(`setting ${key} present`, String(rows[0].setting_value));
      else warn(`setting ${key} missing`, "API falls back to defaults");
    }

    const [schemaCols] = await conn.query<RowDataPacket[]>(
      `SELECT COLUMN_NAME FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = 'realtor_broadcasts'
         AND COLUMN_NAME IN ('sms_engine','twilio_operation_ids','bulk_stats_json')`,
    );
    if (schemaCols.length === 3) pass("realtor_broadcasts Bulk columns present");
    else fail("realtor_broadcasts Bulk columns missing", String(schemaCols.length));

    const [recipCols] = await conn.query<RowDataPacket[]>(
      `SELECT COLUMN_NAME FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = 'realtor_broadcast_recipients'
         AND COLUMN_NAME = 'sms_bulk_message_id'`,
    );
    if (recipCols.length === 1) pass("recipient sms_bulk_message_id present");
    else fail("recipient sms_bulk_message_id missing");

    // In-flight Bulk campaigns (informational)
    const [inflight] = await conn.query<RowDataPacket[]>(
      `SELECT id, title, status, sms_engine,
              LEFT(COALESCE(twilio_operation_ids,''), 80) AS ops
       FROM realtor_broadcasts
       WHERE tenant_id = ?
         AND sms_engine = 'bulk'
         AND status IN ('sending','scheduled')
       ORDER BY id DESC LIMIT 10`,
      [TENANT_ID],
    );
    if (inflight.length === 0) {
      pass("no in-flight Bulk campaigns");
    } else {
      warn(
        `in-flight Bulk campaigns: ${inflight.length}`,
        inflight.map((r) => `#${r.id} ${r.status}`).join(", "),
      );
    }

    // Legacy path still used recently (no break)
    const [recent] = await conn.query<RowDataPacket[]>(
      `SELECT
         SUM(CASE WHEN COALESCE(sms_engine,'messages') = 'messages' THEN 1 ELSE 0 END) AS legacy_n,
         SUM(CASE WHEN sms_engine = 'bulk' THEN 1 ELSE 0 END) AS bulk_n,
         COUNT(*) AS total_n
       FROM realtor_broadcasts
       WHERE tenant_id = ?
         AND created_at >= NOW() - INTERVAL 30 DAY`,
      [TENANT_ID],
    );
    pass(
      "last-30d broadcast engine mix (read-only)",
      `legacy=${recent[0]?.legacy_n ?? 0} bulk=${recent[0]?.bulk_n ?? 0} total=${recent[0]?.total_n ?? 0}`,
    );

    // Subscription READ-ONLY snapshot — never mutate
    const [sub] = await conn.query<RowDataPacket[]>(
      `SELECT status, stripe_subscription_id,
              DATE_FORMAT(period_start,'%Y-%m-%d') AS period_start,
              DATE_FORMAT(period_end,'%Y-%m-%d') AS period_end
       FROM tenant_subscription WHERE tenant_id = ? LIMIT 1`,
      [TENANT_ID],
    );
    if (sub.length) {
      const s = sub[0];
      pass(
        "subscription snapshot untouched (read-only)",
        `status=${s.status} period=${s.period_start}→${s.period_end} sub=${s.stripe_subscription_id ? "present" : "none"}`,
      );
      if (String(s.status) === "active" && s.stripe_subscription_id) {
        pass("active Stripe subscription detected — audit did not write");
      }
    } else {
      warn("no tenant_subscription row");
    }

    // Quota mode should still work independently of Bulk
    const [quotaMode] = await conn.query<RowDataPacket[]>(
      `SELECT setting_value FROM system_settings
       WHERE tenant_id = ? AND setting_key = 'billing_quota_mode' LIMIT 1`,
      [TENANT_ID],
    );
    pass(
      "billing_quota_mode (unchanged by Bulk)",
      String(quotaMode[0]?.setting_value ?? "(unset)"),
    );

    // Stuck processing SMS on Bulk campaigns older than 2h (potential gap)
    const [stuck] = await conn.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS c
       FROM realtor_broadcast_recipients r
       JOIN realtor_broadcasts b ON b.id = r.broadcast_id
       WHERE r.tenant_id = ?
         AND b.sms_engine = 'bulk'
         AND r.sms_status = 'processing'
         AND r.updated_at < NOW() - INTERVAL 2 HOUR`,
      [TENANT_ID],
    );
    const stuckN = Number(stuck[0]?.c ?? 0);
    if (stuckN === 0) pass("no stale Bulk SMS processing rows (>2h)");
    else warn("stale Bulk SMS processing rows", String(stuckN));
  } finally {
    await conn.end();
  }

  const failed = cases.filter((c) => !c.pass);
  const warned = cases.filter((c) => c.severity === "warn");
  for (const c of cases) {
    const icon = !c.pass ? "❌" : c.severity === "warn" ? "⚠️" : "✅";
    console.log(`${icon} ${c.name}${c.detail ? ` — ${c.detail}` : ""}`);
  }
  console.log(
    `\n${cases.length} checks · ${failed.length} failed · ${warned.length} warnings`,
  );
  if (failed.length) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
