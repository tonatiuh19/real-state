/**
 * Unit + helper smoke for Twilio Bulk Messaging broadcast engine.
 * Does not send live SMS — validates helpers and DB columns/settings.
 *
 * Usage: npx tsx scripts/smoke-test-broadcast-bulk.ts
 */
import "dotenv/config";
import mysql, { type RowDataPacket } from "mysql2/promise";
import {
  broadcastBulkBillingLabel,
  chunkArray,
  mapBulkOperationStatsToProgress,
  parseBroadcastSmsEngine,
  resolveBroadcastSmsEngineFromEnv,
  shouldUseBulkSmsEngine,
} from "../shared/broadcast-bulk.ts";

const TENANT_ID = Number(process.env.MORTGAGE_TENANT_ID ?? "1");

function requireEnv(name: string): string {
  const v = process.env[name]?.trim();
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

async function main() {
  const cases: { name: string; pass: boolean; detail?: string }[] = [];
  const pass = (name: string, detail?: string) =>
    cases.push({ name, pass: true, detail });
  const fail = (name: string, detail?: string) =>
    cases.push({ name, pass: false, detail });

  // Pure helpers
  if (parseBroadcastSmsEngine("messages") === "messages") {
    pass("default engine is messages");
  } else fail("default engine is messages");

  if (
    shouldUseBulkSmsEngine({
      engineSetting: "bulk",
      channel: "sms",
      smsRecipientCount: 10,
      minRecipients: 1,
    })
  ) {
    pass("bulk enabled for sms");
  } else fail("bulk enabled for sms");

  if (
    !shouldUseBulkSmsEngine({
      engineSetting: "bulk",
      channel: "email",
      smsRecipientCount: 100,
    })
  ) {
    pass("bulk skipped for email-only");
  } else fail("bulk skipped for email-only");

  if (chunkArray(Array.from({ length: 9500 }, (_, i) => i), 9000).length === 2) {
    pass("chunk under 10k");
  } else fail("chunk under 10k");

  const progress = mapBulkOperationStatsToProgress(
    { sent: 8, delivered: 2, failed: 1, recipients: 12 },
    12,
    "COMPLETED",
  );
  if (progress.sentCount === 10 && progress.failedCount === 1) {
    pass("operation stats mapping", `pct=${progress.progressPct}`);
  } else fail("operation stats mapping", JSON.stringify(progress));

  if (broadcastBulkBillingLabel("bulk") === "Broadcast (Bulk)") {
    pass("billing label Broadcast (Bulk)");
  } else fail("billing label Broadcast (Bulk)");

  const conn = await mysql.createConnection({
    host: requireEnv("DB_HOST"),
    port: Number(requireEnv("DB_PORT")),
    user: requireEnv("DB_USER"),
    password: requireEnv("DB_PASSWORD"),
    database: requireEnv("DB_NAME"),
    ssl: { rejectUnauthorized: true },
  });

  try {
    const [cols] = await conn.query<RowDataPacket[]>(
      `SHOW COLUMNS FROM realtor_broadcasts LIKE 'sms_engine'`,
    );
    if (cols.length) pass("column sms_engine exists");
    else fail("column sms_engine exists");

    const [ops] = await conn.query<RowDataPacket[]>(
      `SHOW COLUMNS FROM realtor_broadcasts LIKE 'twilio_operation_ids'`,
    );
    if (ops.length) pass("column twilio_operation_ids exists");
    else fail("column twilio_operation_ids exists");

    const [bulkMsg] = await conn.query<RowDataPacket[]>(
      `SHOW COLUMNS FROM realtor_broadcast_recipients LIKE 'sms_bulk_message_id'`,
    );
    if (bulkMsg.length) pass("column sms_bulk_message_id exists");
    else fail("column sms_bulk_message_id exists");

    const [settings] = await conn.query<RowDataPacket[]>(
      `SELECT setting_value FROM system_settings
       WHERE tenant_id = ? AND setting_key = 'broadcast_sms_engine' LIMIT 1`,
      [TENANT_ID],
    );
    // Legacy DB key may still exist from migration; engine is gated by env only.
    pass(
      "legacy DB broadcast_sms_engine (informational)",
      String(settings[0]?.setting_value ?? "(unset)"),
    );

    const envEngine = resolveBroadcastSmsEngineFromEnv(process.env);
    if (envEngine === "messages") {
      pass("env gate OFF (messages) — no breaking change", envEngine);
    } else {
      pass("env gate ON (bulk) — Bulk engine active via env", envEngine);
    }

    if (parseBroadcastSmsEngine(undefined) === "messages") {
      pass("default engine remains messages (no breaking change)");
    } else fail("default engine remains messages (no breaking change)");
  } finally {
    await conn.end();
  }

  const failed = cases.filter((c) => !c.pass);
  for (const c of cases) {
    console.log(`${c.pass ? "✅" : "❌"} ${c.name}${c.detail ? ` — ${c.detail}` : ""}`);
  }
  if (failed.length) {
    console.error(`\n${failed.length} check(s) failed`);
    process.exit(1);
  }
  console.log(`\nAll ${cases.length} broadcast-bulk checks passed`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
