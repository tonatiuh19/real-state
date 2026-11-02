/**
 * Overdue platform invoice detection (drives the owner badge / interstitial
 * and blocks new subscriptions while a renewal is unpaid) + route auth.
 */
import "dotenv/config";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import type { Pool } from "mysql2/promise";
import {
  createBrokerSession,
  createServer,
  findOverdueStripeInvoice,
  getOrCreateStripeCustomer,
  invalidateOverdueInvoiceCache,
  isSupportedCardBrand,
  listOverduePaymentCards,
  resolveLiveSubscriptionGuard,
  type StripeClient,
} from "./index";
import { createIntegrationTestPool } from "./testDbCleanup";

const TENANT = 987654; // isolated cache key; never touches real rows
const NOW_SEC = Math.floor(Date.now() / 1000);
const DAY = 86400;

function fakePool(customerId: string | null): Pool {
  return {
    query: vi.fn(async () => [
      customerId ? [{ stripe_customer_id: customerId }] : [],
    ]),
  } as unknown as Pool;
}

function fakeStripe(invoices: Array<Record<string, unknown>> | Error) {
  const list = vi.fn(async (params: Record<string, unknown>) => {
    if (invoices instanceof Error) throw invoices;
    expect(params).toMatchObject({ status: "open", customer: "cus_test" });
    return { data: invoices, has_more: false };
  });
  return { stripe: { invoices: { list } } as unknown as StripeClient, list };
}

const renewal = (over: Record<string, unknown> = {}) => ({
  id: "in_renewal",
  number: "QHYJCHRX-0015",
  amount_remaining: 35000,
  currency: "usd",
  attempt_count: 4,
  billing_reason: "subscription_cycle",
  created: NOW_SEC - 7 * DAY,
  status_transitions: { finalized_at: NOW_SEC - 7 * DAY + 3600 },
  next_payment_attempt: NOW_SEC + DAY,
  hosted_invoice_url: "https://invoice.stripe.com/i/test",
  ...over,
});

describe("findOverdueStripeInvoice", () => {
  beforeEach(() => invalidateOverdueInvoiceCache());

  it("returns the unpaid renewal with amount, days and pay link", async () => {
    const { stripe } = fakeStripe([renewal()]);
    const r = await findOverdueStripeInvoice(fakePool("cus_test"), stripe, TENANT);
    expect(r).toMatchObject({
      invoice_id: "in_renewal",
      number: "QHYJCHRX-0015",
      amount_due_usd: 350,
      days_overdue: 6, // counted from finalization (7d ago + 1h)
      attempt_count: 4,
      hosted_invoice_url: "https://invoice.stripe.com/i/test",
    });
    expect(r?.next_payment_attempt).toBeTruthy();
  });

  it("ignores abandoned checkout invoices, unattempted and zero-balance ones", async () => {
    const { stripe } = fakeStripe([
      renewal({ id: "in_checkout", billing_reason: "subscription_create" }),
      renewal({ id: "in_draftish", attempt_count: 0 }),
      renewal({ id: "in_paid_off", amount_remaining: 0 }),
    ]);
    const r = await findOverdueStripeInvoice(fakePool("cus_test"), stripe, TENANT);
    expect(r).toBeNull();
  });

  it("picks the oldest unpaid renewal when several are open", async () => {
    const { stripe } = fakeStripe([
      renewal({ id: "in_newer", created: NOW_SEC - 2 * DAY }),
      renewal({ id: "in_older", created: NOW_SEC - 30 * DAY }),
    ]);
    const r = await findOverdueStripeInvoice(fakePool("cus_test"), stripe, TENANT);
    expect(r?.invoice_id).toBe("in_older");
  });

  it("returns null without calling Stripe when there is no customer", async () => {
    const { stripe, list } = fakeStripe([renewal()]);
    const r = await findOverdueStripeInvoice(fakePool(null), stripe, TENANT);
    expect(r).toBeNull();
    expect(list).not.toHaveBeenCalled();
  });

  it("caches for 2 minutes; `fresh` and invalidation bypass the cache", async () => {
    const { stripe, list } = fakeStripe([renewal()]);
    const pool = fakePool("cus_test");
    await findOverdueStripeInvoice(pool, stripe, TENANT);
    await findOverdueStripeInvoice(pool, stripe, TENANT);
    expect(list).toHaveBeenCalledTimes(1);
    await findOverdueStripeInvoice(pool, stripe, TENANT, { fresh: true });
    expect(list).toHaveBeenCalledTimes(2);
    invalidateOverdueInvoiceCache(TENANT);
    await findOverdueStripeInvoice(pool, stripe, TENANT);
    expect(list).toHaveBeenCalledTimes(3);
  });

  it("throws on Stripe errors and never caches the failure", async () => {
    const failing = fakeStripe(new Error("stripe down"));
    await expect(
      findOverdueStripeInvoice(fakePool("cus_test"), failing.stripe, TENANT),
    ).rejects.toThrow("stripe down");
    const ok = fakeStripe([renewal()]);
    const r = await findOverdueStripeInvoice(fakePool("cus_test"), ok.stripe, TENANT);
    expect(r?.invoice_id).toBe("in_renewal");
    expect(ok.list).toHaveBeenCalledTimes(1);
  });

  it("reports 0 days on the day the renewal failed", async () => {
    const { stripe } = fakeStripe([
      renewal({ created: NOW_SEC - 600, status_transitions: { finalized_at: NOW_SEC - 600 } }),
    ]);
    const r = await findOverdueStripeInvoice(fakePool("cus_test"), stripe, TENANT);
    expect(r?.days_overdue).toBe(0);
  });
});

describe("resolveLiveSubscriptionGuard (no second subscription)", () => {
  const sub = (id: string, status: string) => ({ id, status });

  it("allows creating only when nothing is live", () => {
    expect(resolveLiveSubscriptionGuard([])).toEqual({ action: "create" });
    expect(
      resolveLiveSubscriptionGuard([
        sub("a", "incomplete_expired"),
        sub("b", "canceled"),
        sub("c", "incomplete"),
      ]),
    ).toEqual({ action: "create" });
  });

  it("returns the active/trialing subscription as already active", () => {
    const r = resolveLiveSubscriptionGuard([
      sub("old", "incomplete_expired"),
      sub("live", "active"),
    ]);
    expect(r).toMatchObject({ action: "already_active", subscription: { id: "live" } });
    expect(
      resolveLiveSubscriptionGuard([sub("t", "trialing")]).action,
    ).toBe("already_active");
  });

  it("blocks when the real subscription is past due or unpaid", () => {
    // Encore's real case: newest is an abandoned attempt, the real one is past_due.
    const r = resolveLiveSubscriptionGuard([
      sub("sub_throwaway", "incomplete"),
      sub("sub_real", "past_due"),
    ]);
    expect(r).toMatchObject({ action: "blocked_unpaid", subscription: { id: "sub_real" } });
    expect(resolveLiveSubscriptionGuard([sub("u", "unpaid")]).action).toBe(
      "blocked_unpaid",
    );
  });

  it("prefers an active subscription over an unpaid one", () => {
    const r = resolveLiveSubscriptionGuard([
      sub("unpaid", "past_due"),
      sub("paid", "active"),
    ]);
    expect(r).toMatchObject({ action: "already_active", subscription: { id: "paid" } });
  });
});

describe("getOrCreateStripeCustomer — never silently replaces a customer", () => {
  function recordingPool(storedCustomer: string | null) {
    const writes: string[] = [];
    const pool = {
      query: vi.fn(async (sql: string) => {
        if (/^\s*(UPDATE|INSERT)/i.test(sql)) writes.push(sql);
        if (/SELECT stripe_customer_id/i.test(sql)) {
          return [storedCustomer ? [{ stripe_customer_id: storedCustomer }] : []];
        }
        return [[]];
      }),
    } as unknown as Pool;
    return { pool, writes };
  }
  function stripeWith(retrieveError: unknown) {
    const create = vi.fn(async () => ({ id: "cus_new" }));
    const stripe = {
      customers: {
        retrieve: vi.fn(async () => {
          if (retrieveError) throw retrieveError;
          return { id: "cus_live" };
        }),
        create,
      },
    } as unknown as StripeClient;
    return { stripe, create };
  }

  it("returns the stored customer when Stripe finds it", async () => {
    const { pool, writes } = recordingPool("cus_live");
    const { stripe, create } = stripeWith(null);
    await expect(
      getOrCreateStripeCustomer(pool, stripe, TENANT, "owner@example.test"),
    ).resolves.toBe("cus_live");
    expect(create).not.toHaveBeenCalled();
    expect(writes).toHaveLength(0);
  });

  it("throws (no wipe, no new customer) on a live/test key mismatch", async () => {
    const { pool, writes } = recordingPool("cus_live");
    const { stripe, create } = stripeWith({
      code: "resource_missing",
      message:
        "No such customer: 'cus_live'; a similar object exists in live mode, but a test mode key was used to make this request.",
    });
    await expect(
      getOrCreateStripeCustomer(pool, stripe, TENANT, "owner@example.test"),
    ).rejects.toBeTruthy();
    expect(create).not.toHaveBeenCalled();
    expect(writes).toHaveLength(0);
  });

  it("throws (no wipe, no new customer) on network errors / outages", async () => {
    const { pool, writes } = recordingPool("cus_live");
    const { stripe, create } = stripeWith({
      type: "StripeConnectionError",
      message: "An error occurred with our connection to Stripe.",
    });
    await expect(
      getOrCreateStripeCustomer(pool, stripe, TENANT, "owner@example.test"),
    ).rejects.toBeTruthy();
    expect(create).not.toHaveBeenCalled();
    expect(writes).toHaveLength(0);
  });

  it("replaces only a genuinely deleted customer", async () => {
    const { pool, writes } = recordingPool("cus_deleted");
    const { stripe, create } = stripeWith({
      code: "resource_missing",
      message: "No such customer: 'cus_deleted'",
    });
    await expect(
      getOrCreateStripeCustomer(pool, stripe, TENANT, "owner@example.test"),
    ).resolves.toBe("cus_new");
    expect(create).toHaveBeenCalledTimes(1);
    expect(writes.some((w) => /stripe_customer_id = NULL/.test(w))).toBe(true);
  });
});

describe("overdue payment cards", () => {
  const overdueInfo = {
    invoice_id: "in_x",
    number: null,
    amount_due_usd: 350,
    currency: "usd",
    failed_at: new Date().toISOString(),
    days_overdue: 7,
    attempt_count: 4,
    next_payment_attempt: null,
    hosted_invoice_url: null,
  };
  const pm = (id: string, brand: string, exp_year = 2031, wallet?: string) => ({
    id,
    card: { brand, last4: id.slice(-4), exp_month: 12, exp_year, wallet: wallet ? { type: wallet } : null },
  });

  function cardsStripe(lastCharge: Record<string, unknown> | null) {
    return {
      customers: {
        retrieve: vi.fn(async () => ({
          invoice_settings: { default_payment_method: "pm_amex" },
        })),
      },
      paymentMethods: {
        list: vi.fn(async () => ({
          data: [
            pm("pm_dead0308", "visa", 2031, "apple_pay"),
            pm("pm_amex", "amex"),
            pm("pm_old2019", "visa", 2019),
            pm("pm_good1450", "visa"),
          ],
          has_more: false,
        })),
      },
      invoices: {
        retrieve: vi.fn(async () => ({
          payment_intent: { latest_charge: lastCharge },
        })),
      },
    } as unknown as StripeClient;
  }

  it("marks Amex, expired and hard-declined cards unusable, usable first", async () => {
    const stripe = cardsStripe({
      payment_method: "pm_dead0308",
      outcome: { advice_code: "do_not_try_again", reason: "invalid_account" },
    });
    const cards = await listOverduePaymentCards(fakePool("cus_test"), stripe, TENANT, overdueInfo);
    const by = Object.fromEntries(cards.map((c) => [c.id, c]));
    expect(by.pm_amex).toMatchObject({ usable: false, is_default: true });
    expect(by.pm_amex.unusable_reason).toMatch(/American Express isn't accepted/);
    expect(by.pm_old2019).toMatchObject({ usable: false, unusable_reason: "Expired" });
    expect(by.pm_dead0308).toMatchObject({ usable: false, wallet: "apple_pay" });
    expect(by.pm_dead0308.unusable_reason).toMatch(/Declined by the bank/);
    expect(by.pm_good1450.usable).toBe(true);
    expect(cards[0].id).toBe("pm_good1450");
  });

  it("keeps a generically declined card selectable", async () => {
    const stripe = cardsStripe({
      payment_method: "pm_good1450",
      outcome: { advice_code: "try_again_later", reason: "generic_decline" },
    });
    const cards = await listOverduePaymentCards(fakePool("cus_test"), stripe, TENANT, overdueInfo);
    expect(cards.find((c) => c.id === "pm_good1450")?.usable).toBe(true);
  });

  it("still lists cards if the last decline can't be read", async () => {
    const stripe = cardsStripe(null);
    (stripe.invoices.retrieve as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error("boom"));
    const cards = await listOverduePaymentCards(fakePool("cus_test"), stripe, TENANT, overdueInfo);
    expect(cards).toHaveLength(4);
  });

  it("supported brands default to Visa / Mastercard / Carnet", () => {
    expect(isSupportedCardBrand("visa")).toBe(true);
    expect(isSupportedCardBrand("MasterCard")).toBe(true);
    expect(isSupportedCardBrand("amex")).toBe(false);
    expect(isSupportedCardBrand(null)).toBe(false);
  });
});

describe("GET /api/billing/overdue auth", () => {
  let pool: Pool | undefined;
  const app = createServer();

  afterAll(async () => {
    await pool?.end();
  });

  it("401 without a session", async () => {
    const res = await request(app).get("/api/billing/overdue");
    expect(res.status).toBe(401);
  });

  it("401 on the in-app payment endpoints without a session", async () => {
    const options = await request(app).get("/api/billing/overdue/payment-options");
    expect(options.status).toBe(401);
    const pay = await request(app)
      .post("/api/billing/overdue/pay")
      .send({ invoice_id: "in_x", payment_method_id: "pm_x" });
    expect(pay.status).toBe(401);
  });

  it("403 for non platform-owner roles", async () => {
    if (!process.env.DB_HOST || !process.env.JWT_SECRET) return;
    pool = createIntegrationTestPool();
    const [rows] = await pool.query<Array<{ id: number; email: string }> & []>(
      `SELECT id, email FROM brokers
       WHERE tenant_id = 1 AND role = 'admin' AND status = 'active' LIMIT 1`,
    );
    const admin = (rows as Array<{ id: number; email: string }>)[0];
    if (!admin) return;
    const token = createBrokerSession({
      id: admin.id,
      email: admin.email,
      role: "admin",
    });
    const res = await request(app)
      .get("/api/billing/overdue")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(403);
    const options = await request(app)
      .get("/api/billing/overdue/payment-options")
      .set("Authorization", `Bearer ${token}`);
    expect(options.status).toBe(403);
    const pay = await request(app)
      .post("/api/billing/overdue/pay")
      .set("Authorization", `Bearer ${token}`)
      .send({ invoice_id: "in_x", payment_method_id: "pm_x" });
    expect(pay.status).toBe(403);
  });
});
