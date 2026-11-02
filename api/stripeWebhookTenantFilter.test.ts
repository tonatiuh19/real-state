/**
 * Shared Stripe account: other tenants' webhook events must be ignored, and
 * untagged top-ups must never credit this tenant. Signed locally; requires a
 * Stripe TEST key. Never send tenant 1 top-up events from here.
 */
import "dotenv/config";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import Stripe from "stripe";
import type { Pool, RowDataPacket } from "mysql2/promise";
import { createServer } from "./index";
import { createIntegrationTestPool } from "./testDbCleanup";

const SECRET = "whsec_tenant_filter_test";
const RUN = `evt_filtertest_${Date.now()}`;
const isTestKey = (process.env.STRIPE_SECRET_KEY ?? "").startsWith("sk_test_");
const topUp = { pack_id: "sms_1k", dimension: "sms_segments", units: "1000" };

describe.skipIf(!isTestKey)("Stripe webhook tenant filter", () => {
  let pool: Pool;
  let app: ReturnType<typeof createServer>;
  let previousSecret: string | undefined;
  const ids: string[] = [];

  const send = (
    suffix: string,
    type: string,
    object: Record<string, unknown>,
  ) => {
    const id = `${RUN}_${suffix}`;
    ids.push(id);
    const payload = JSON.stringify({ id, type, data: { object } });
    const signature = Stripe.webhooks.generateTestHeaderString({
      payload,
      secret: SECRET,
    });
    return request(app)
      .post("/api/billing/stripe/webhook")
      .set("Content-Type", "application/json")
      .set("Stripe-Signature", signature)
      .send(payload);
  };

  const snapshot = async () => {
    const [[row]] = await pool.query<RowDataPacket[]>(
      `SELECT
         (SELECT COUNT(*) FROM tenant_usage_ledger) AS ledger,
         (SELECT COUNT(*) FROM tenant_usage_period) AS periods,
         (SELECT MAX(updated_at) FROM tenant_subscription) AS sub_updated`,
    );
    return JSON.stringify(row);
  };

  beforeAll(() => {
    previousSecret = process.env.STRIPE_WEBHOOK_SECRET;
    process.env.STRIPE_WEBHOOK_SECRET = SECRET;
    pool = createIntegrationTestPool();
    app = createServer();
  });

  afterAll(async () => {
    process.env.STRIPE_WEBHOOK_SECRET = previousSecret;
    if (ids.length) {
      await pool.query(
        `DELETE FROM stripe_webhook_events WHERE event_id IN (?)`,
        [ids],
      );
    }
    await pool.end();
  });

  it("ignores another tenant's subscription event without recording it", async () => {
    const before = await snapshot();
    const res = await send("sub2", "customer.subscription.updated", {
      id: "sub_filter_test",
      object: "subscription",
      status: "active",
      customer: "cus_filter_test",
      metadata: { tenant_id: "2" },
    });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ received: true, ignored: true });
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT 1 FROM stripe_webhook_events WHERE event_id = ?`,
      [`${RUN}_sub2`],
    );
    expect(rows).toHaveLength(0);
    expect(await snapshot()).toBe(before);
  });

  it("ignores another tenant's top-up", async () => {
    const before = await snapshot();
    const res = await send("pi2", "payment_intent.succeeded", {
      id: "pi_filter_test_2",
      object: "payment_intent",
      metadata: { tenant_id: "2", ...topUp },
    });
    expect(res.status).toBe(200);
    expect(res.body.ignored).toBe(true);
    expect(await snapshot()).toBe(before);
  });

  it("skips an untagged subscription for an unknown customer", async () => {
    const before = await snapshot();
    const res = await send("subnone", "customer.subscription.updated", {
      id: "sub_filter_test_none",
      object: "subscription",
      status: "active",
      customer: "cus_filter_test_unknown",
      metadata: {},
    });
    expect(res.status).toBe(200);
    expect(await snapshot()).toBe(before);
  });

  it("never credits an untagged top-up", async () => {
    const before = await snapshot();
    const res = await send("pinone", "payment_intent.succeeded", {
      id: "pi_filter_test_none",
      object: "payment_intent",
      metadata: topUp,
    });
    expect(res.status).toBe(200);
    expect(await snapshot()).toBe(before);
  });
});
