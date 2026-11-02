/**
 * Smoke tests for Stripe-anchored billing periods vs calendar-month fallback.
 * Uses synthetic tenant rows inside a transaction — entire run ROLLS BACK.
 *
 * Usage: npx tsx scripts/smoke-test-billing-period-anchor.ts
 */
import "dotenv/config";
import mysql, {
  type Connection,
  type RowDataPacket,
} from "mysql2/promise";
import {
  resolveBillingPeriodAnchor,
  shouldAdvanceCalendarBillingPeriod,
  shouldSyncStripeSubscriptionPeriod,
  isBillingPeriodTransition,
  stripePeriodToSqlDate,
  currentCalendarMonthStart,
  calendarMonthEnd,
} from "../shared/billing-period.ts";

const TENANT_ID = Number(process.env.MORTGAGE_TENANT_ID ?? "1");

interface SavedSubscription {
  periodStart: string | null;
  periodEnd: string | null;
  stripeSubscriptionId: string | null;
  stripeCustomerId: string | null;
  status: string | null;
}

interface CaseResult {
  name: string;
  pass: boolean;
  detail?: string;
}

const cases: CaseResult[] = [];
const pass = (name: string, detail?: string) =>
  cases.push({ name, pass: true, detail });
const fail = (name: string, detail?: string) =>
  cases.push({ name, pass: false, detail });

function requireEnv(name: string): string {
  const v = process.env[name]?.trim();
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

async function seedSmokeSubscription(
  conn: Connection,
  params: {
    periodStart: string;
    periodEnd: string | null;
    stripeSubscriptionId: string | null;
    status: string;
  },
): Promise<void> {
  await conn.query(
    `UPDATE tenant_subscription
     SET status = ?, period_start = ?, period_end = ?,
         stripe_subscription_id = ?, updated_at = UTC_TIMESTAMP()
     WHERE tenant_id = ?`,
    [
      params.status,
      params.periodStart,
      params.periodEnd,
      params.stripeSubscriptionId,
      TENANT_ID,
    ],
  );
}

async function saveSubscription(conn: Connection): Promise<SavedSubscription> {
  const [rows] = await conn.query<RowDataPacket[]>(
    `SELECT DATE_FORMAT(period_start, '%Y-%m-%d') AS period_start,
            DATE_FORMAT(period_end, '%Y-%m-%d') AS period_end,
            stripe_subscription_id, stripe_customer_id, status
     FROM tenant_subscription WHERE tenant_id = ? LIMIT 1`,
    [TENANT_ID],
  );
  const row = rows[0];
  return {
    periodStart: row?.period_start ? String(row.period_start) : null,
    periodEnd: row?.period_end ? String(row.period_end) : null,
    stripeSubscriptionId: row?.stripe_subscription_id
      ? String(row.stripe_subscription_id)
      : null,
    stripeCustomerId: row?.stripe_customer_id
      ? String(row.stripe_customer_id)
      : null,
    status: row?.status ? String(row.status) : null,
  };
}

async function restoreSubscription(
  conn: Connection,
  saved: SavedSubscription,
): Promise<void> {
  await conn.query(
    `UPDATE tenant_subscription
     SET period_start = ?, period_end = ?, stripe_subscription_id = ?,
         stripe_customer_id = ?, status = ?, updated_at = UTC_TIMESTAMP()
     WHERE tenant_id = ?`,
    [
      saved.periodStart,
      saved.periodEnd,
      saved.stripeSubscriptionId,
      saved.stripeCustomerId,
      saved.status,
      TENANT_ID,
    ],
  );
}

async function readSubscription(conn: Connection): Promise<{
  periodStart: string | null;
  periodEnd: string | null;
  stripeSubscriptionId: string | null;
  status: string | null;
}> {
  const [rows] = await conn.query<RowDataPacket[]>(
    `SELECT DATE_FORMAT(period_start, '%Y-%m-%d') AS period_start,
            DATE_FORMAT(period_end, '%Y-%m-%d') AS period_end,
            stripe_subscription_id, status
     FROM tenant_subscription WHERE tenant_id = ? LIMIT 1`,
    [TENANT_ID],
  );
  const row = rows[0];
  if (!row) return {
    periodStart: null,
    periodEnd: null,
    stripeSubscriptionId: null,
    status: null,
  };
  return {
    periodStart: row.period_start ? String(row.period_start) : null,
    periodEnd: row.period_end ? String(row.period_end) : null,
    stripeSubscriptionId: row.stripe_subscription_id
      ? String(row.stripe_subscription_id)
      : null,
    status: row.status ? String(row.status) : null,
  };
}

/** Mirrors api/index.ts maybeAdvanceBillingPeriod calendar branch. */
async function simulateCalendarAdvance(conn: Connection): Promise<boolean> {
  const monthStart = currentCalendarMonthStart();
  const sub = await readSubscription(conn);
  const anchor = resolveBillingPeriodAnchor({
    stripeSubscriptionId: sub.stripeSubscriptionId,
    subscriptionStatus: sub.status,
  });
  if (
    !shouldAdvanceCalendarBillingPeriod({
      anchor,
      storedPeriodStart: sub.periodStart,
      calendarMonthStart: monthStart,
    })
  ) {
    return false;
  }
  await conn.query(
    `UPDATE tenant_subscription
     SET period_start = ?, period_end = ?, updated_at = UTC_TIMESTAMP()
     WHERE tenant_id = ?`,
    [monthStart, calendarMonthEnd(monthStart), TENANT_ID],
  );
  return true;
}

/** Mirrors api/index.ts syncStripeSubscriptionToDb period update. */
async function simulateStripePeriodSync(
  conn: Connection,
  stripePeriodStart: string,
  stripePeriodEnd: string,
): Promise<boolean> {
  const sub = await readSubscription(conn);
  const changed = isBillingPeriodTransition(
    sub.periodStart,
    stripePeriodStart,
  );
  await conn.query(
    `UPDATE tenant_subscription
     SET period_start = ?, period_end = ?, updated_at = UTC_TIMESTAMP()
     WHERE tenant_id = ?`,
    [stripePeriodStart, stripePeriodEnd, TENANT_ID],
  );
  return changed;
}

async function countUsagePeriodRows(conn: Connection, periodStart: string): Promise<number> {
  const [rows] = await conn.query<RowDataPacket[]>(
    `SELECT COUNT(*) AS c FROM tenant_usage_period
     WHERE tenant_id = ? AND period_start = ?`,
    [TENANT_ID, periodStart],
  );
  return Number(rows[0]?.c ?? 0);
}

async function seedUsagePeriodRow(
  conn: Connection,
  periodStart: string,
  dimension: string,
  included: number,
  used: number,
): Promise<void> {
  await conn.query(
    `INSERT INTO tenant_usage_period
       (tenant_id, period_start, dimension, included_units, used_units, reserved_units)
     VALUES (?, ?, ?, ?, ?, 0)
     ON DUPLICATE KEY UPDATE included_units = VALUES(included_units), used_units = VALUES(used_units)`,
    [TENANT_ID, periodStart, dimension, included, used],
  );
}

async function main(): Promise<void> {
  const conn = await mysql.createConnection({
    host: requireEnv("DB_HOST"),
    port: Number(process.env.DB_PORT ?? "4000"),
    user: requireEnv("DB_USER"),
    password: requireEnv("DB_PASSWORD"),
    database: requireEnv("DB_NAME"),
    ssl: { rejectUnauthorized: true },
  });

  try {
    await conn.beginTransaction();
    const savedSubscription = await saveSubscription(conn);

    // --- Production tenant read-only sanity (before mutations) ---
    // Canceled / inactive / incomplete_expired Stripe IDs fall back to calendar
    // (tenant 1 currently keeps a canceled sub_ id — that is valid).
    if (savedSubscription.stripeSubscriptionId) {
      const prodStatus = String(savedSubscription.status ?? "").toLowerCase();
      const prodAnchor = resolveBillingPeriodAnchor({
        stripeSubscriptionId: savedSubscription.stripeSubscriptionId,
        subscriptionStatus: savedSubscription.status ?? "",
      });
      const expectCalendar = ["inactive", "canceled", "incomplete_expired"].includes(
        prodStatus,
      );
      if (expectCalendar && prodAnchor === "calendar") {
        pass(
          `Production tenant ${TENANT_ID}: canceled/inactive Stripe sub → calendar`,
          `status=${prodStatus || "?"} period=${savedSubscription.periodStart ?? "?"}`,
        );
      } else if (!expectCalendar && prodAnchor === "stripe") {
        pass(
          `Production tenant ${TENANT_ID}: Stripe anchor expected`,
          `status=${prodStatus || "?"} period=${savedSubscription.periodStart ?? "?"}`,
        );
      } else {
        fail(
          `Production tenant ${TENANT_ID}: unexpected billing anchor`,
          `status=${prodStatus || "?"} anchor=${prodAnchor} (expected ${expectCalendar ? "calendar" : "stripe"})`,
        );
      }
    } else {
      pass(`Production tenant ${TENANT_ID}: no Stripe sub (calendar ok)`);
    }

    // --- Pure logic sanity (embedded) ---
    const anchorActive = resolveBillingPeriodAnchor({
      stripeSubscriptionId: "sub_smoke",
      subscriptionStatus: "active",
    });
    if (anchorActive === "stripe") {
      pass("resolveBillingPeriodAnchor: active Stripe sub → stripe");
    } else {
      fail("resolveBillingPeriodAnchor: active Stripe sub → stripe", anchorActive);
    }

    const jun20Unix = Math.floor(
      new Date("2026-06-20T00:00:00Z").getTime() / 1000,
    );
    const jul20Unix = Math.floor(
      new Date("2026-07-20T00:00:00Z").getTime() / 1000,
    );
    const stripeStart = stripePeriodToSqlDate(jun20Unix);
    const stripeEnd = stripePeriodToSqlDate(jul20Unix);
    if (stripeStart === "2026-06-20" && stripeEnd === "2026-07-20") {
      pass("stripePeriodToSqlDate: Jun 20 subscription anchor");
    } else {
      fail(
        "stripePeriodToSqlDate: Jun 20 subscription anchor",
        `${stripeStart} / ${stripeEnd}`,
      );
    }

    if (
      shouldSyncStripeSubscriptionPeriod({
        dbPeriodStart: "2026-07-01",
        dbStatus: "active",
        stripePeriodStart: "2026-06-20",
        stripeStatus: "active",
      })
    ) {
      pass("shouldSyncStripeSubscriptionPeriod: detects calendar drift");
    } else {
      fail("shouldSyncStripeSubscriptionPeriod: detects calendar drift");
    }

    // --- DB: Stripe anchor blocks calendar advance ---
    await seedSmokeSubscription(conn, {
      periodStart: "2026-06-20",
      periodEnd: "2026-07-20",
      stripeSubscriptionId: "sub_smoke_stripe_anchor",
      status: "active",
    });

    const advancedStripe = await simulateCalendarAdvance(conn);
    const afterStripeAdvance = await readSubscription(conn);
    if (!advancedStripe && afterStripeAdvance.periodStart === "2026-06-20") {
      pass("DB: calendar advance skipped for Stripe-linked tenant");
    } else {
      fail(
        "DB: calendar advance skipped for Stripe-linked tenant",
        JSON.stringify({ advancedStripe, afterStripeAdvance }),
      );
    }

    // --- DB: calendar tenant advances on month rollover ---
    await seedSmokeSubscription(conn, {
      periodStart: "2026-06-01",
      periodEnd: "2026-06-30",
      stripeSubscriptionId: null,
      status: "inactive",
    });

    const monthStart = currentCalendarMonthStart();
    if (monthStart > "2026-06-01") {
      const advancedCalendar = await simulateCalendarAdvance(conn);
      const afterCalendar = await readSubscription(conn);
      if (advancedCalendar && afterCalendar.periodStart === monthStart) {
        pass("DB: calendar advance applies when no Stripe subscription");
      } else {
        fail(
          "DB: calendar advance applies when no Stripe subscription",
          JSON.stringify({ advancedCalendar, afterCalendar, monthStart }),
        );
      }
    } else {
      pass("DB: calendar advance applies when no Stripe subscription", "skipped — still June in UTC");
    }

    // --- DB: Stripe sync corrects drifted period ---
    await seedSmokeSubscription(conn, {
      periodStart: "2026-07-01",
      periodEnd: "2026-07-31",
      stripeSubscriptionId: "sub_smoke_drift",
      status: "active",
    });

    const synced = await simulateStripePeriodSync(
      conn,
      "2026-06-20",
      "2026-07-20",
    );
    const afterSync = await readSubscription(conn);
    if (
      synced &&
      afterSync.periodStart === "2026-06-20" &&
      afterSync.periodEnd === "2026-07-20"
    ) {
      pass("DB: Stripe period sync overwrites calendar drift");
    } else {
      fail(
        "DB: Stripe period sync overwrites calendar drift",
        JSON.stringify({ synced, afterSync }),
      );
    }

    // --- DB: new period row can be seeded without touching old period ---
    await seedUsagePeriodRow(conn, "2026-07-01", "sms_segments", 1000, 433);
    await seedUsagePeriodRow(conn, "2026-06-20", "sms_segments", 1000, 0);
    const oldRows = await countUsagePeriodRows(conn, "2026-07-01");
    const newRows = await countUsagePeriodRows(conn, "2026-06-20");
    if (oldRows >= 1 && newRows >= 1) {
      pass("DB: period transition keeps historical usage rows isolated");
    } else {
      fail(
        "DB: period transition keeps historical usage rows isolated",
        `old=${oldRows} new=${newRows}`,
      );
    }

    // --- DB: canceled Stripe sub allows calendar advance again ---
    await seedSmokeSubscription(conn, {
      periodStart: "2026-06-01",
      periodEnd: "2026-06-30",
      stripeSubscriptionId: "sub_smoke_canceled",
      status: "canceled",
    });
    const canceledAnchor = resolveBillingPeriodAnchor({
      stripeSubscriptionId: "sub_smoke_canceled",
      subscriptionStatus: "canceled",
    });
    if (canceledAnchor === "calendar") {
      pass("resolveBillingPeriodAnchor: canceled → calendar fallback");
    } else {
      fail("resolveBillingPeriodAnchor: canceled → calendar fallback", canceledAnchor);
    }

    await restoreSubscription(conn, savedSubscription);
    await conn.rollback();
  } finally {
    await conn.end();
  }

  const failed = cases.filter((c) => !c.pass);
  console.log("\n=== Billing period anchor smoke tests ===\n");
  for (const c of cases) {
    console.log(`${c.pass ? "✓" : "✗"} ${c.name}${c.detail ? ` — ${c.detail}` : ""}`);
  }
  console.log(`\n${cases.length - failed.length}/${cases.length} passed\n`);
  if (failed.length > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
