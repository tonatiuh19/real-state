/**
 * Backfill Application Received reminder flow executions for loans that
 * landed in application_received while Flow #3 was inactive.
 *
 * Method: status nudge (application_received → app_sent → application_received)
 * then trigger flow execution insert (same as API status change path).
 *
 * Usage:
 *   npx tsx scripts/backfill-application-received-flows.ts           # audit only
 *   npx tsx scripts/backfill-application-received-flows.ts --execute
 *   npx tsx scripts/backfill-application-received-flows.ts --execute --loan-ids=600016,690016
 *   npx tsx scripts/backfill-application-received-flows.ts --execute --include-with-comms
 *
 * ⚠️  --execute creates real flow executions; cron will send real welcome SMS/email.
 */
import "dotenv/config";
import mysql from "mysql2/promise";
import {
  APPLICATION_RECEIVED_FLOW_ID,
  fetchGapLoans,
  isFlowActive,
  resolvePlatformOwnerBrokerId,
  statusNudgeAndTriggerFlow,
  countActiveExecutions,
  type GapLoanRow,
} from "./lib/application-received-flow.ts";

const TENANT_ID = Number(process.env.MORTGAGE_TENANT_ID ?? "1");
const ARGS = process.argv.slice(2);
const EXECUTE = ARGS.includes("--execute");
const INCLUDE_WITH_COMMS = ARGS.includes("--include-with-comms");
const loanIdsArg = ARGS.find((a) => a.startsWith("--loan-ids="));
const LOAN_ID_FILTER = loanIdsArg
  ? new Set(
      loanIdsArg
        .slice("--loan-ids=".length)
        .split(",")
        .map((s) => parseInt(s.trim(), 10))
        .filter((n) => Number.isFinite(n)),
    )
  : null;

function requireEnv(name: string): string {
  const v = process.env[name]?.trim();
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

function classifyOrigin(row: GapLoanRow): string {
  if (row.client_source === "broker_created") return "manual_broker_create";
  if (row.client_source === "public_wizard") return "public_wizard";
  if (row.client_source === "realtor") return "realtor_sourced";
  return row.client_source ?? "unknown";
}

function shouldSkip(row: GapLoanRow): { skip: boolean; reason?: string } {
  if (LOAN_ID_FILTER && !LOAN_ID_FILTER.has(row.id)) {
    return { skip: true, reason: "not in --loan-ids filter" };
  }
  if (!INCLUDE_WITH_COMMS && row.comm_count > 0) {
    return {
      skip: true,
      reason: `already has ${row.comm_count} communication(s) — use --include-with-comms to force`,
    };
  }
  return { skip: false };
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
    const flowActive = await isFlowActive(
      conn,
      APPLICATION_RECEIVED_FLOW_ID,
      TENANT_ID,
    );
    console.log("\n=== Application Received Flow Backfill Audit ===\n");
    console.log(`Flow #${APPLICATION_RECEIVED_FLOW_ID} active: ${flowActive ? "YES" : "NO"}`);
    if (!flowActive) {
      console.error(
        "ABORT: Flow #3 must be active before backfill. Run migration 20260703_194500_reactivate_application_received_flow.sql",
      );
      process.exit(1);
    }

    const gaps = await fetchGapLoans(conn, TENANT_ID);
    console.log(`\nGap loans (application_received, no Flow #3 execution): ${gaps.length}\n`);

    const byOrigin: Record<string, number> = {};
    for (const row of gaps) {
      const o = classifyOrigin(row);
      byOrigin[o] = (byOrigin[o] ?? 0) + 1;
    }
    console.log("By client source:", byOrigin);
    console.log(
      "\nNote: Historical manual broker creates used app_sent + direct email — none in this gap set unless moved to application_received.\n",
    );

    const toProcess: GapLoanRow[] = [];
    const skipped: { row: GapLoanRow; reason: string }[] = [];

    console.log("--- Loan detail ---");
    for (const row of gaps) {
      const origin = classifyOrigin(row);
      const { skip, reason } = shouldSkip(row);
      const flag = skip ? "SKIP" : EXECUTE ? "RUN " : "PLAN";
      console.log(
        `[${flag}] #${row.id} ${row.application_number} | ${row.client_name.trim()} | origin=${origin} | comms=${row.comm_count} | broker=${row.broker_user_id ?? "NULL"}`,
      );
      if (skip && reason) console.log(`         ↳ ${reason}`);
      if (skip) skipped.push({ row, reason: reason! });
      else toProcess.push(row);
    }

    if (!EXECUTE) {
      console.log(
        `\nDry run complete. ${toProcess.length} loan(s) would be nudged. Re-run with --execute to apply.`,
      );
      console.log(
        "Cron will deliver real welcome SMS/email after executions are created.\n",
      );
      return;
    }

    if (toProcess.length === 0) {
      console.log("\nNothing to backfill after filters.\n");
      return;
    }

    const poBrokerId = await resolvePlatformOwnerBrokerId(conn, TENANT_ID);
    const notes =
      "Backfill: status nudge to start Application Received reminder flow (Flow #3 was inactive at original submit)";

    let ok = 0;
    let fail = 0;

    for (const row of toProcess) {
      await conn.beginTransaction();
      try {
        const { triggeredCount } = await statusNudgeAndTriggerFlow(
          conn,
          row.id,
          TENANT_ID,
          poBrokerId,
          notes,
        );
        const active = await countActiveExecutions(
          conn,
          row.id,
          APPLICATION_RECEIVED_FLOW_ID,
        );
        await conn.commit();
        console.log(
          `✅ ${row.application_number}: nudged, triggeredCount=${triggeredCount}, activeExecutions=${active}`,
        );
        ok++;
      } catch (err) {
        await conn.rollback();
        console.error(
          `❌ ${row.application_number}:`,
          err instanceof Error ? err.message : err,
        );
        fail++;
      }
    }

    const remaining = await fetchGapLoans(conn, TENANT_ID);
    console.log(`\nDone: ${ok} succeeded, ${fail} failed, ${skipped.length} skipped`);
    console.log(`Remaining gap loans: ${remaining.length}\n`);
  } finally {
    await conn.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
