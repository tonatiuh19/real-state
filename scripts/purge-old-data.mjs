/**
 * scripts/purge-old-data.mjs
 *
 * Reclaim TiDB row storage by deleting expired ephemeral rows and trimming
 * bulky historical payloads (email HTML, audit logs, flow step logs).
 *
 * Usage:
 *   node scripts/purge-old-data.mjs              # dry-run (counts only)
 *   node scripts/purge-old-data.mjs --execute    # apply deletes/updates
 *   node scripts/purge-old-data.mjs --execute --aggressive
 *
 * --aggressive  Also deletes old orphan SMS threads (conv_phone_* with no
 *               application_id) older than 365 days. Use only after review.
 *
 * Requires .env: DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import mysql from "mysql2/promise";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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

const REQUIRED = ["DB_HOST", "DB_PORT", "DB_USER", "DB_PASSWORD", "DB_NAME"];
const missing = REQUIRED.filter((k) => !env[k]);
if (missing.length) {
  console.error("Missing .env:", missing.join(", "));
  process.exit(1);
}

const execute = process.argv.includes("--execute");
const aggressive = process.argv.includes("--aggressive");

const RETENTION = {
  auditLogsDays: 90,
  emailSyncLogDays: 30,
  notificationsReadDays: 120,
  flowStepLogsDays: 90,
  flowExecutionsDays: 180,
  systemEventDays: 180,
  emailBodyTrimDays: 60,
  emailBodyMaxChars: 400,
  providerJsonTrimDays: 90,
  orphanSmsDays: 365,
};

async function count(pool, sql, params = []) {
  const [rows] = await pool.query(sql, params);
  return Number(rows[0]?.c ?? 0);
}

async function runStep(pool, label, countSql, countParams, actionSql, actionParams) {
  const n = await count(pool, countSql, countParams);
  console.log(`  ${label}: ${n.toLocaleString()} row(s)`);
  if (!execute || n === 0) return { label, affected: 0, would: n };
  const [result] = await pool.query(actionSql, actionParams);
  const affected = result.affectedRows ?? 0;
  return { label, affected, would: n };
}

async function tableSizes(pool) {
  const db = env.DB_NAME;
  const [rows] = await pool.query(
    `SELECT table_name AS tbl,
            ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS mb
     FROM information_schema.tables
     WHERE table_schema = ?
     GROUP BY table_name
     ORDER BY mb DESC
     LIMIT 25`,
    [db],
  );
  console.log("\nTop tables by allocated size (information_schema):");
  for (const r of rows) {
    console.log(`  ${String(r.tbl).padEnd(36)} ${r.mb} MiB`);
  }
}

async function main() {
  console.log(execute ? "MODE: execute" : "MODE: dry-run (pass --execute to apply)");
  if (aggressive) console.log("FLAG: --aggressive enabled\n");

  const pool = await mysql.createPool({
    host: env.DB_HOST,
    port: Number(env.DB_PORT),
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    ssl: { rejectUnauthorized: true },
    connectionLimit: 2,
  });

  try {
    await pool.query("SELECT 1");
    await tableSizes(pool);

    const results = [];

    console.log("\nPhase 1 — expired ephemeral data");
    results.push(
      await runStep(
        pool,
        "mms_media (expired)",
        "SELECT COUNT(*) AS c FROM mms_media WHERE expires_at <= NOW()",
        [],
        "DELETE FROM mms_media WHERE expires_at <= NOW()",
        [],
      ),
    );
    results.push(
      await runStep(
        pool,
        "broker_sessions (expired)",
        "SELECT COUNT(*) AS c FROM broker_sessions WHERE expires_at < NOW()",
        [],
        "DELETE FROM broker_sessions WHERE expires_at < NOW()",
        [],
      ),
    );
    results.push(
      await runStep(
        pool,
        "user_sessions (expired)",
        "SELECT COUNT(*) AS c FROM user_sessions WHERE expires_at < NOW()",
        [],
        "DELETE FROM user_sessions WHERE expires_at < NOW()",
        [],
      ),
    );
    results.push(
      await runStep(
        pool,
        "revoked_tokens (expired)",
        "SELECT COUNT(*) AS c FROM revoked_tokens WHERE expires_at < NOW()",
        [],
        "DELETE FROM revoked_tokens WHERE expires_at < NOW()",
        [],
      ),
    );

    console.log("\nPhase 2 — logs & notifications");
    const auditCutoff = `DATE_SUB(NOW(), INTERVAL ${RETENTION.auditLogsDays} DAY)`;
    results.push(
      await runStep(
        pool,
        `audit_logs (older than ${RETENTION.auditLogsDays}d)`,
        `SELECT COUNT(*) AS c FROM audit_logs WHERE created_at < ${auditCutoff}`,
        [],
        `DELETE FROM audit_logs WHERE created_at < ${auditCutoff}`,
        [],
      ),
    );
    const syncCutoff = `DATE_SUB(NOW(), INTERVAL ${RETENTION.emailSyncLogDays} DAY)`;
    results.push(
      await runStep(
        pool,
        `email_sync_log (older than ${RETENTION.emailSyncLogDays}d)`,
        `SELECT COUNT(*) AS c FROM email_sync_log WHERE started_at < ${syncCutoff}`,
        [],
        `DELETE FROM email_sync_log WHERE started_at < ${syncCutoff}`,
        [],
      ),
    );
    const notifCutoff = `DATE_SUB(NOW(), INTERVAL ${RETENTION.notificationsReadDays} DAY)`;
    results.push(
      await runStep(
        pool,
        `notifications (read, older than ${RETENTION.notificationsReadDays}d)`,
        `SELECT COUNT(*) AS c FROM notifications WHERE is_read = 1 AND created_at < ${notifCutoff}`,
        [],
        `DELETE FROM notifications WHERE is_read = 1 AND created_at < ${notifCutoff}`,
        [],
      ),
    );
    const stepLogCutoff = `DATE_SUB(NOW(), INTERVAL ${RETENTION.flowStepLogsDays} DAY)`;
    results.push(
      await runStep(
        pool,
        `reminder_flow_step_logs (older than ${RETENTION.flowStepLogsDays}d)`,
        `SELECT COUNT(*) AS c FROM reminder_flow_step_logs WHERE created_at < ${stepLogCutoff}`,
        [],
        `DELETE FROM reminder_flow_step_logs WHERE created_at < ${stepLogCutoff}`,
        [],
      ),
    );
    const execCutoff = `DATE_SUB(NOW(), INTERVAL ${RETENTION.flowExecutionsDays} DAY)`;
    results.push(
      await runStep(
        pool,
        `reminder_flow_executions (terminal, older than ${RETENTION.flowExecutionsDays}d)`,
        `SELECT COUNT(*) AS c FROM reminder_flow_executions
         WHERE status IN ('completed','failed','cancelled')
           AND updated_at < ${execCutoff}`,
        [],
        `DELETE FROM reminder_flow_executions
         WHERE status IN ('completed','failed','cancelled')
           AND updated_at < ${execCutoff}`,
        [],
      ),
    );

    console.log("\nPhase 3 — communications (trim, not delete)");
    const emailTrimCutoff = `DATE_SUB(NOW(), INTERVAL ${RETENTION.emailBodyTrimDays} DAY)`;
    const emailTrimCount = await count(
      pool,
      `SELECT COUNT(*) AS c FROM communications
       WHERE communication_type = 'email'
         AND CHAR_LENGTH(COALESCE(body,'')) > ?
         AND created_at < ${emailTrimCutoff}`,
      [RETENTION.emailBodyMaxChars],
    );
    console.log(
      `  email bodies trim to ${RETENTION.emailBodyMaxChars} chars (>${RETENTION.emailBodyTrimDays}d): ${emailTrimCount.toLocaleString()} row(s)`,
    );
    if (execute && emailTrimCount > 0) {
      const [r] = await pool.query(
        `UPDATE communications
         SET body = LEFT(body, ?)
         WHERE communication_type = 'email'
           AND CHAR_LENGTH(COALESCE(body,'')) > ?
           AND created_at < ${emailTrimCutoff}`,
        [RETENTION.emailBodyMaxChars, RETENTION.emailBodyMaxChars],
      );
      results.push({
        label: "email body trim",
        affected: r.affectedRows ?? 0,
        would: emailTrimCount,
      });
    }

    const jsonTrimCutoff = `DATE_SUB(NOW(), INTERVAL ${RETENTION.providerJsonTrimDays} DAY)`;
    const jsonTrimCount = await count(
      pool,
      `SELECT COUNT(*) AS c FROM communications
       WHERE created_at < ${jsonTrimCutoff}
         AND (provider_response IS NOT NULL OR metadata IS NOT NULL)`,
    );
    console.log(
      `  clear provider_response/metadata (>${RETENTION.providerJsonTrimDays}d): ${jsonTrimCount.toLocaleString()} row(s)`,
    );
    if (execute && jsonTrimCount > 0) {
      const [r] = await pool.query(
        `UPDATE communications
         SET provider_response = NULL, metadata = NULL
         WHERE created_at < ${jsonTrimCutoff}
           AND (provider_response IS NOT NULL OR metadata IS NOT NULL)`,
      );
      results.push({
        label: "provider JSON trim",
        affected: r.affectedRows ?? 0,
        would: jsonTrimCount,
      });
    }

    const sysCutoff = `DATE_SUB(NOW(), INTERVAL ${RETENTION.systemEventDays} DAY)`;
    results.push(
      await runStep(
        pool,
        `communications system_event (>${RETENTION.systemEventDays}d)`,
        `SELECT COUNT(*) AS c FROM communications
         WHERE communication_type = 'system_event' AND created_at < ${sysCutoff}`,
        [],
        `DELETE FROM communications
         WHERE communication_type = 'system_event' AND created_at < ${sysCutoff}`,
        [],
      ),
    );

    if (aggressive) {
      console.log("\nPhase 4 — aggressive (orphan SMS)");
      const orphanCutoff = `DATE_SUB(NOW(), INTERVAL ${RETENTION.orphanSmsDays} DAY)`;
      results.push(
        await runStep(
          pool,
          `orphan SMS (conv_phone_*, no application, >${RETENTION.orphanSmsDays}d)`,
          `SELECT COUNT(*) AS c FROM communications
           WHERE communication_type IN ('sms','whatsapp')
             AND application_id IS NULL
             AND conversation_id LIKE 'conv_phone_%'
             AND created_at < ${orphanCutoff}`,
          [],
          `DELETE FROM communications
           WHERE communication_type IN ('sms','whatsapp')
             AND application_id IS NULL
             AND conversation_id LIKE 'conv_phone_%'
             AND created_at < ${orphanCutoff}`,
          [],
        ),
      );
    }

    if (execute) {
      console.log("\nPost-purge table sizes:");
      await tableSizes(pool);
    }

    console.log("\nSummary:");
    for (const r of results) {
      if (!r) continue;
      const key = execute ? "affected" : "would";
      console.log(`  ${r.label}: ${(r[key] ?? 0).toLocaleString()}`);
    }

    if (!execute) {
      console.log(
        "\nNo changes applied. Re-run with --execute when ready.",
      );
    }
  } catch (err) {
    if (err?.code === "ER_UNKNOWN_ERROR" || String(err?.message).includes("quota")) {
      console.error(
        "\nTiDB cluster is quota-locked. In TiDB Cloud: raise spending limit or upgrade,",
        "then run this script again.",
      );
    }
    throw err;
  } finally {
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
