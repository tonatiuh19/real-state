/**
 * HTTP integration — blocked phone numbers (CRUD + inbound call/SMS enforcement).
 */
import "dotenv/config";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import twilio from "twilio";
import type { Pool, ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { createBrokerSession, createServer } from "./index";
import {
  cleanupIntegrationTestFixtures,
  createIntegrationTestPool,
  uniqueTestE164,
} from "./testDbCleanup";

const RUN_ID = `http-blocked-${Date.now()}`;
const TENANT_ID = 1;

describe("blocked numbers HTTP", () => {
  let pool: Pool;
  let app: ReturnType<typeof createServer>;
  let adminToken = "";
  let partnerToken = "";
  const brokerIds: number[] = [];
  const blockedIds: number[] = [];
  const spammer = uniqueTestE164(`${RUN_ID}-spammer`);
  const spammerLast10 = spammer.replace(/\D/g, "").slice(-10);
  const adminLine = uniqueTestE164(`${RUN_ID}-line`);
  let blockedId = 0;

  /** Signs like Twilio for whichever guard the route uses. */
  function twilioPost(path: string, params: Record<string, string>) {
    const req = request(app).post(path).type("form").send(params);
    const token = process.env.TWILIO_AUTH_TOKEN;
    const smsUrl = process.env.TWILIO_SMS_WEBHOOK_URL;
    const appUrl = process.env.APP_URL;
    if (token && path === "/api/webhooks/inbound-sms" && smsUrl) {
      req.set(
        "X-Twilio-Signature",
        twilio.getExpectedTwilioSignature(token, smsUrl, params),
      );
    } else if (token && path.startsWith("/api/voice/") && appUrl) {
      req.set(
        "X-Twilio-Signature",
        twilio.getExpectedTwilioSignature(token, `${appUrl}${path}`, params),
      );
    } else if (process.env.INBOUND_WEBHOOK_SECRET) {
      req.set("X-Webhook-Secret", process.env.INBOUND_WEBHOOK_SECRET);
    }
    return req;
  }

  async function insertBroker(
    label: string,
    role: "admin" | "broker",
    callerId: string | null,
  ) {
    const email = `${RUN_ID}-${label}@example.test`;
    const [ins] = await pool.query<ResultSetHeader>(
      `INSERT INTO brokers
         (tenant_id, email, first_name, last_name, role, status, public_token,
          twilio_caller_id)
       VALUES (?, ?, 'Http', ?, ?, 'active', ?, ?)`,
      [TENANT_ID, email, label, role, cryptoRandom(), callerId],
    );
    brokerIds.push(ins.insertId);
    // No real alert emails to synthetic inboxes.
    await pool.query(
      `INSERT INTO broker_notification_preferences
         (broker_id, tenant_id, email_inbound_sms, email_voicemail)
       VALUES (?, ?, 0, 0)`,
      [ins.insertId, TENANT_ID],
    );
    return createBrokerSession({ id: ins.insertId, email, role });
  }

  beforeAll(async () => {
    if (!process.env.DB_HOST || !process.env.JWT_SECRET) {
      throw new Error("DB_HOST and JWT_SECRET required");
    }
    pool = createIntegrationTestPool();
    app = createServer();
    adminToken = await insertBroker("Admin", "admin", adminLine);
    partnerToken = await insertBroker("Partner", "broker", null);
  }, 90_000);

  afterAll(async () => {
    if (!pool) return;
    if (blockedIds.length) {
      await pool
        .query(
          `DELETE FROM blocked_phone_numbers WHERE tenant_id = ? AND id IN (${blockedIds.map(() => "?").join(",")})`,
          [TENANT_ID, ...blockedIds],
        )
        .catch(() => undefined);
    }
    await pool
      .query(
        `DELETE FROM blocked_phone_numbers WHERE tenant_id = ? AND normalized_phone = ?`,
        [TENANT_ID, spammerLast10],
      )
      .catch(() => undefined);
    await pool
      .query(
        `DELETE FROM notifications
         WHERE tenant_id = ? AND recipient_type = 'broker'
           AND user_id IN (${brokerIds.map(() => "?").join(",") || "NULL"})`,
        [TENANT_ID, ...brokerIds],
      )
      .catch(() => undefined);
    await cleanupIntegrationTestFixtures(pool, {
      runId: RUN_ID,
      brokerIds,
      conversationIds: [`conv_unknown_${spammerLast10}`],
    });
    await pool.end();
  });

  it("GET without auth → 401", async () => {
    const res = await request(app).get("/api/blocked-numbers");
    expect(res.status).toBe(401);
  });

  it("partner (broker role) → 403 on list and create", async () => {
    const list = await request(app)
      .get("/api/blocked-numbers")
      .set("Authorization", `Bearer ${partnerToken}`);
    expect(list.status).toBe(403);
    const create = await request(app)
      .post("/api/blocked-numbers")
      .set("Authorization", `Bearer ${partnerToken}`)
      .send({ phone: spammer });
    expect(create.status).toBe(403);
  });

  it("rejects invalid numbers, no channel, and own lines", async () => {
    const auth = { Authorization: `Bearer ${adminToken}` };
    const bad = await request(app)
      .post("/api/blocked-numbers")
      .set(auth)
      .send({ phone: "12345" });
    expect(bad.status).toBe(400);

    const none = await request(app)
      .post("/api/blocked-numbers")
      .set(auth)
      .send({ phone: spammer, block_calls: false, block_sms: false });
    expect(none.status).toBe(400);

    // String flags from non-JSON clients: "false" must not mean true.
    const noneStrings = await request(app)
      .post("/api/blocked-numbers")
      .set(auth)
      .send({ phone: spammer, block_calls: "false", block_sms: "false" });
    expect(noneStrings.status).toBe(400);

    const own = await request(app)
      .post("/api/blocked-numbers")
      .set(auth)
      .send({ phone: adminLine });
    expect(own.status).toBe(400);
  });

  it("blocks a 10-digit number as +1 E.164, then 409 on any other format", async () => {
    const res = await request(app)
      .post("/api/blocked-numbers")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ phone: spammerLast10, reason: "  Robocall test  " });
    expect(res.status).toBe(201);
    expect(res.body.blocked_number.phone_e164).toBe(`+1${spammerLast10}`);
    expect(res.body.blocked_number.normalized_phone).toBe(spammerLast10);
    expect(res.body.blocked_number.reason).toBe("Robocall test");
    expect(res.body.blocked_number.block_calls).toBe(true);
    expect(res.body.blocked_number.block_sms).toBe(true);
    blockedId = res.body.blocked_number.id;
    blockedIds.push(blockedId);

    const formatted = `(${spammerLast10.slice(0, 3)}) ${spammerLast10.slice(3, 6)}-${spammerLast10.slice(6)}`;
    const dup = await request(app)
      .post("/api/blocked-numbers")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ phone: formatted });
    expect(dup.status).toBe(409);
  });

  it("GET lists the blocked number with who blocked it", async () => {
    const res = await request(app)
      .get("/api/blocked-numbers")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    const row = res.body.blocked_numbers.find(
      (b: { id: number }) => b.id === blockedId,
    );
    expect(row).toBeTruthy();
    expect(row.blocked_by_name).toBe("Http Admin");
  });

  it("inbound call from blocked number is rejected before ringing", async () => {
    const res = await twilioPost("/api/voice/incoming", {
      From: spammer,
      To: adminLine,
      CallSid: `CA${RUN_ID.replace(/\W/g, "")}`.slice(0, 34),
    });
    expect(res.status).toBe(200);
    expect(res.text).toContain("<Reject");
    expect(res.text).toContain('reason="busy"');
    expect(res.text).not.toContain("<Dial");
  });

  it("inbound SMS from blocked number is dropped (no communication stored)", async () => {
    const sid = `SM${RUN_ID.replace(/\W/g, "")}x`.slice(0, 34);
    const res = await twilioPost("/api/webhooks/inbound-sms", {
      From: spammer,
      To: adminLine,
      Body: "verify your business",
      MessageSid: sid,
      NumMedia: "0",
    });
    expect(res.status).toBe(200);
    expect(res.text).toBe("<Response></Response>");
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT id FROM communications WHERE tenant_id = ? AND external_id = ?`,
      [TENANT_ID, sid],
    );
    expect(rows).toHaveLength(0);
  });

  it("STOP from a blocked number is still honoured", async () => {
    const res = await twilioPost("/api/webhooks/inbound-sms", {
      From: spammer,
      To: adminLine,
      Body: "STOP",
      MessageSid: `SM${RUN_ID.replace(/\W/g, "")}s`.slice(0, 34),
      NumMedia: "0",
    });
    expect(res.status).toBe(200);
    expect(res.text).toContain("unsubscribed");
  });

  it("counts stopped attempts", async () => {
    // Counter update is fire-and-forget — give it a moment.
    await new Promise((r) => setTimeout(r, 1500));
    const [[row]] = await pool.query<RowDataPacket[]>(
      `SELECT blocked_call_count, blocked_sms_count, last_blocked_at
       FROM blocked_phone_numbers WHERE id = ?`,
      [blockedId],
    );
    expect(Number(row.blocked_call_count)).toBe(1);
    expect(Number(row.blocked_sms_count)).toBe(1);
    expect(row.last_blocked_at).not.toBeNull();
  });

  it("DELETE unblocks, then 404 on repeat", async () => {
    const auth = { Authorization: `Bearer ${adminToken}` };
    const del = await request(app)
      .delete(`/api/blocked-numbers/${blockedId}`)
      .set(auth);
    expect(del.status).toBe(200);
    const again = await request(app)
      .delete(`/api/blocked-numbers/${blockedId}`)
      .set(auth);
    expect(again.status).toBe(404);
    const invalid = await request(app)
      .delete(`/api/blocked-numbers/abc`)
      .set(auth);
    expect(invalid.status).toBe(400);
  });

  it("calls-only block lets texts through (channel-specific)", async () => {
    const auth = { Authorization: `Bearer ${adminToken}` };
    const create = await request(app)
      .post("/api/blocked-numbers")
      .set(auth)
      .send({ phone: spammer, block_calls: true, block_sms: false });
    expect(create.status).toBe(201);
    expect(create.body.blocked_number.block_sms).toBe(false);
    blockedIds.push(create.body.blocked_number.id);

    const sid = `SM${RUN_ID.replace(/\W/g, "")}ok`;
    const res = await twilioPost("/api/webhooks/inbound-sms", {
      From: spammer,
      To: adminLine,
      Body: "real question",
      MessageSid: sid,
      NumMedia: "0",
    });
    expect(res.status).toBe(200);
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT conversation_id FROM communications
       WHERE tenant_id = ? AND external_id = ?`,
      [TENANT_ID, sid],
    );
    expect(rows).toHaveLength(1);
  });
});

function cryptoRandom(): string {
  return `${Date.now().toString(16)}${Math.random().toString(16).slice(2, 10)}`.slice(
    0,
    36,
  );
}
