/**
 * Refresh TENANT_1_ACTUAL_30D from live DB (last 30 days UTC).
 * Updates api/lib/billing-calculator.ts and prints JSON for canvas sync.
 *
 * Usage: npx tsx scripts/refresh-billing-snapshot.ts
 *        npx tsx scripts/refresh-billing-snapshot.ts --tenant 1
 */
import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import mysql from "mysql2/promise";

const TENANT_ID = Number(
  process.argv.includes("--tenant")
    ? process.argv[process.argv.indexOf("--tenant") + 1]
    : process.env.BILLING_SNAPSHOT_TENANT_ID ?? "1",
);

const VOICE_MIN_PER_CALL_EST = 2.4;

async function scalar(
  conn: mysql.Connection,
  sql: string,
  params: unknown[] = [],
): Promise<number> {
  const [rows] = await conn.query(sql, params);
  const row = (rows as { v: number }[])[0];
  return Number(row?.v ?? 0);
}

async function main() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT ?? 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: { rejectUnauthorized: true },
  });

  const sinceExpr = "DATE_SUB(UTC_TIMESTAMP(), INTERVAL 30 DAY)";
  const tid = TENANT_ID;

  const [periodRows] = await conn.query(
    `SELECT DATE_FORMAT(${sinceExpr}, '%Y-%m-%d') AS period_start,
            DATE_FORMAT(UTC_TIMESTAMP(), '%Y-%m-%d') AS period_end`,
  );
  const period = (periodRows as { period_start: string; period_end: string }[])[0];

  const convoSmsSegments = await scalar(
    conn,
    `SELECT COALESCE(SUM(CEIL(GREATEST(CHAR_LENGTH(COALESCE(c.body,'')), 1) / 160.0)), 0) AS v
     FROM communications c
     WHERE c.tenant_id = ? AND c.communication_type = 'sms' AND c.direction = 'outbound'
       AND COALESCE(c.sent_at, c.created_at) >= ${sinceExpr}
       AND NOT EXISTS (
         SELECT 1 FROM realtor_broadcast_recipients r
         WHERE r.tenant_id = ? AND r.sms_ext_id IS NOT NULL AND r.sms_ext_id = c.external_id
       )`,
    [tid, tid],
  );

  const broadcastSmsSegments = await scalar(
    conn,
    `SELECT COALESCE(SUM(CEIL(GREATEST(CHAR_LENGTH(COALESCE(rb.body_sms,'')), 1) / 160.0)), 0) AS v
     FROM realtor_broadcast_recipients r
     JOIN realtor_broadcasts rb ON rb.id = r.broadcast_id
     WHERE r.tenant_id = ? AND r.sms_status IN ('sent', 'delivered')
       AND r.sent_at >= ${sinceExpr}`,
    [tid],
  );

  const totalEmailSends = await scalar(
    conn,
    `SELECT COUNT(*) AS v FROM communications
     WHERE tenant_id = ? AND communication_type = 'email' AND direction = 'outbound'
       AND COALESCE(sent_at, created_at) >= ${sinceExpr}`,
    [tid],
  );

  const broadcastEmailSends = await scalar(
    conn,
    `SELECT COUNT(*) AS v FROM realtor_broadcast_recipients
     WHERE tenant_id = ? AND email_status = 'sent' AND sent_at >= ${sinceExpr}`,
    [tid],
  );

  const callsLogged = await scalar(
    conn,
    `SELECT COUNT(*) AS v FROM communications
     WHERE tenant_id = ? AND communication_type = 'call'
       AND COALESCE(sent_at, created_at) >= ${sinceExpr}`,
    [tid],
  );

  const voiceMinutesRecorded = Math.round(
    await scalar(
      conn,
      `SELECT ROUND(COALESCE(SUM(recording_duration), 0) / 60, 2) AS v
       FROM communications
       WHERE tenant_id = ? AND communication_type = 'call'
         AND COALESCE(sent_at, created_at) >= ${sinceExpr}`,
      [tid],
    ),
  );

  const schedulerBookings = await scalar(
    conn,
    `SELECT COUNT(*) AS v FROM scheduled_meetings
     WHERE tenant_id = ? AND created_at >= ${sinceExpr}`,
    [tid],
  );

  const mortgiAiTokens = await scalar(
    conn,
    `SELECT COALESCE(SUM(tokens_used), 0) AS v FROM ai_chat_sessions
     WHERE tenant_id = ? AND updated_at >= ${sinceExpr}`,
    [tid],
  );

  const mortgiSessions = await scalar(
    conn,
    `SELECT COUNT(*) AS v FROM ai_chat_sessions
     WHERE tenant_id = ? AND created_at >= ${sinceExpr}`,
    [tid],
  );

  const mortgiUserMessages = await scalar(
    conn,
    `SELECT COALESCE(SUM(FLOOR(JSON_LENGTH(messages) / 2)), 0) AS v
     FROM ai_chat_sessions WHERE tenant_id = ? AND updated_at >= ${sinceExpr}`,
    [tid],
  );

  await conn.end();

  const totalSmsSegments = convoSmsSegments + broadcastSmsSegments;
  const voiceMinutesEstimated = Math.round(callsLogged * VOICE_MIN_PER_CALL_EST);

  const snapshot = {
    periodStart: period.period_start,
    periodEnd: period.period_end,
    tenantId: TENANT_ID,
    totalSmsSegments,
    broadcastSmsSegments,
    convoSmsSegments,
    totalEmailSends,
    broadcastEmailSends,
    callsLogged,
    voiceMinutesRecorded,
    voiceMinutesEstimated,
    schedulerBookings,
    mortgiAiTokens,
    mortgiSessions,
    mortgiUserMessages,
    refreshedAt: new Date().toISOString(),
  };

  const usageFields = {
    periodStart: snapshot.periodStart,
    periodEnd: snapshot.periodEnd,
    tenantId: snapshot.tenantId,
    totalSmsSegments: snapshot.totalSmsSegments,
    broadcastSmsSegments: snapshot.broadcastSmsSegments,
    convoSmsSegments: snapshot.convoSmsSegments,
    totalEmailSends: snapshot.totalEmailSends,
    broadcastEmailSends: snapshot.broadcastEmailSends,
    callsLogged: snapshot.callsLogged,
    voiceMinutesRecorded: snapshot.voiceMinutesRecorded,
    voiceMinutesEstimated: snapshot.voiceMinutesEstimated,
    schedulerBookings: snapshot.schedulerBookings,
    mortgiAiTokens: snapshot.mortgiAiTokens,
    mortgiSessions: snapshot.mortgiSessions,
    mortgiUserMessages: snapshot.mortgiUserMessages,
  };

  const formatUsageSnapshot = (indent: string) =>
    Object.entries(usageFields)
      .map(([k, v]) => {
        const val =
          typeof v === "string" ? `"${v}"` : String(v);
        return `${indent}${k}: ${val},`;
      })
      .join("\n");

  const calcPath = path.join(process.cwd(), "shared/billing-calculator.ts");
  let calcSrc = fs.readFileSync(calcPath, "utf8");
  calcSrc = calcSrc.replace(
    /export const TENANT_1_ACTUAL_30D: UsageSnapshot = \{[\s\S]*?\};/,
    `export const TENANT_1_ACTUAL_30D: UsageSnapshot = {\n${formatUsageSnapshot("  ")}\n};`,
  );
  fs.writeFileSync(calcPath, calcSrc);

  const canvasPath = path.join(
    process.env.HOME ?? "",
    ".cursor/projects/Users-felixgomez-Code-real-state/canvases/platform-owner-budget-calculator.canvas.tsx",
  );
  if (fs.existsSync(canvasPath)) {
    let canvasSrc = fs.readFileSync(canvasPath, "utf8");
    const actualBlock = `const ACTUAL_30D = {
  periodStart: "${snapshot.periodStart}",
  periodEnd: "${snapshot.periodEnd}",
  totalSms: ${snapshot.totalSmsSegments},
  broadcastSms: ${snapshot.broadcastSmsSegments},
  convoSms: ${snapshot.convoSmsSegments},
  totalEmail: ${snapshot.totalEmailSends},
  broadcastEmail: ${snapshot.broadcastEmailSends},
  calls: ${snapshot.callsLogged},
  voiceMinRecorded: ${snapshot.voiceMinutesRecorded},
  voiceMinEstimated: ${snapshot.voiceMinutesEstimated},
  scheduler: ${snapshot.schedulerBookings},
  mortgiTokens: ${snapshot.mortgiAiTokens},
  mortgiSessions: ${snapshot.mortgiSessions},
} as const;`;
    canvasSrc = canvasSrc.replace(
      /const ACTUAL_30D = \{[\s\S]*?\} as const;/,
      actualBlock,
    );
    fs.writeFileSync(canvasPath, canvasSrc);
    console.log("Updated canvas ACTUAL_30D");
  }

  console.log(JSON.stringify(snapshot, null, 2));
  console.log("\nUpdated shared/billing-calculator.ts (TENANT_1_ACTUAL_30D)");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
