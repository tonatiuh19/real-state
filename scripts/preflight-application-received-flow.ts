/**
 * Production preflight: Application Received welcome flow must be active and runnable.
 * Read-only — safe to run before deploy or on a daily cron.
 *
 * Usage:
 *   npm run preflight:application-received
 *   npx tsx scripts/preflight-application-received-flow.ts
 */
import "dotenv/config";
import mysql from "mysql2/promise";
import {
  runApplicationReceivedProdPreflight,
} from "./lib/application-received-flow.ts";

const TENANT_ID = Number(process.env.MORTGAGE_TENANT_ID ?? "1");

function requireEnv(name: string): string {
  const v = process.env[name]?.trim();
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

async function main() {
  const conn = await mysql.createConnection({
    host: requireEnv("DB_HOST"),
    port: Number(process.env.DB_PORT ?? "3306"),
    user: requireEnv("DB_USER"),
    password: requireEnv("DB_PASSWORD"),
    database: requireEnv("DB_NAME"),
    ssl: { rejectUnauthorized: true },
  });

  try {
    const result = await runApplicationReceivedProdPreflight(conn, TENANT_ID);
    console.log("\n=== Application Received Production Preflight ===\n");
    for (const check of result.checks) {
      const icon = check.pass ? "✅" : "❌";
      console.log(`${icon} ${check.name}${check.detail ? ` — ${check.detail}` : ""}`);
    }
    console.log(
      result.ok
        ? "\n✅ Preflight passed — welcome automation is configured for production.\n"
        : "\n❌ Preflight FAILED — fix Reminder Flows before deploying or accepting applications.\n",
    );
    if (!result.ok) process.exit(1);
  } finally {
    await conn.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
