/**
 * HTTP integration — inbound SMS routing on a personal line (per-owner CRM).
 *
 * Regression: the same phone saved as a client under two owners. An SMS sent
 * to Owner A's personal Twilio line must land in A's conv_client_* thread —
 * never in Owner B's thread (which hid it from A while A still got the bell).
 */
import "dotenv/config";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import twilio from "twilio";
import type { Pool, ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { createServer } from "./index";
import {
  cleanupIntegrationTestFixtures,
  createIntegrationTestPool,
  uniqueTestE164,
} from "./testDbCleanup";

const RUN_ID = `http-inbound-sms-${Date.now()}`;
const TENANT_ID = 1;
const CRM_ON = process.env.PER_OWNER_CRM_ENABLED === "1";

describe("inbound SMS routing HTTP", () => {
  let pool: Pool;
  let app: ReturnType<typeof createServer>;
  const brokerIds: number[] = [];
  const clientIds: number[] = [];
  const conversationIds: string[] = [];
  let ownerA = 0;
  let ownerB = 0;
  let clientOfA = 0;
  let clientOfB = 0;
  const senderPhone = uniqueTestE164(`${RUN_ID}-sender`);
  const lineA = uniqueTestE164(`${RUN_ID}-line-a`);

  function signedPost(params: Record<string, string>) {
    const req = request(app)
      .post("/api/webhooks/inbound-sms")
      .type("form")
      .send(params);
    const token = process.env.TWILIO_AUTH_TOKEN;
    const url = process.env.TWILIO_SMS_WEBHOOK_URL;
    if (token && url) {
      req.set(
        "X-Twilio-Signature",
        twilio.getExpectedTwilioSignature(token, url, params),
      );
    } else if (process.env.INBOUND_WEBHOOK_SECRET) {
      req.set("X-Webhook-Secret", process.env.INBOUND_WEBHOOK_SECRET);
    }
    return req;
  }

  async function insertBroker(label: string, callerId: string | null) {
    const [ins] = await pool.query<ResultSetHeader>(
      `INSERT INTO brokers
         (tenant_id, email, first_name, last_name, role, status, public_token,
          twilio_caller_id)
       VALUES (?, ?, 'Http', ?, 'broker', 'active', ?, ?)`,
      [
        TENANT_ID,
        `${RUN_ID}-${label}@example.test`,
        label,
        cryptoRandom(),
        callerId,
      ],
    );
    brokerIds.push(ins.insertId);
    // No real alert emails to synthetic inboxes.
    await pool.query(
      `INSERT INTO broker_notification_preferences
         (broker_id, tenant_id, email_inbound_sms)
       VALUES (?, ?, 0)`,
      [ins.insertId, TENANT_ID],
    );
    return ins.insertId;
  }

  async function insertClient(label: string, brokerId: number) {
    const [ins] = await pool.query<ResultSetHeader>(
      `INSERT INTO clients
         (tenant_id, email, first_name, last_name, phone, normalized_phone,
          income_type, assigned_broker_id, list_visibility)
       VALUES (?, ?, 'Dup', ?, ?, ?, 'W-2', ?, 'active')`,
      [
        TENANT_ID,
        `${RUN_ID}-${label}@example.test`,
        label,
        senderPhone,
        senderPhone.replace(/\D/g, "").slice(-10),
        brokerId,
      ],
    );
    clientIds.push(ins.insertId);
    conversationIds.push(`conv_client_${ins.insertId}`);
    return ins.insertId;
  }

  beforeAll(async () => {
    if (!process.env.DB_HOST) throw new Error("DB_HOST required");
    pool = createIntegrationTestPool();
    app = createServer();

    ownerB = await insertBroker("OwnerB", null);
    // B's row is created first so a tenant-wide LIMIT 1 would pick it.
    clientOfB = await insertClient("ClientOfB", ownerB);
    ownerA = await insertBroker("OwnerA", lineA);
    clientOfA = await insertClient("ClientOfA", ownerA);
  }, 90_000);

  afterAll(async () => {
    if (!pool) return;
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
      clientIds,
      conversationIds,
    });
    await pool.end();
  });

  it("routes SMS on owner A's line into A's client thread", async () => {
    const sid = `SM${RUN_ID.replace(/\W/g, "")}a`.slice(0, 34);
    const res = await signedPost({
      From: senderPhone,
      To: lineA,
      Body: "hello from integration",
      MessageSid: sid,
      NumMedia: "0",
    });
    expect(res.status).toBe(200);
    expect(res.text).toContain("<Response>");

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT conversation_id, from_user_id, to_broker_id
       FROM communications
       WHERE tenant_id = ? AND external_id = ? LIMIT 1`,
      [TENANT_ID, sid],
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].to_broker_id).toBe(ownerA);
    if (CRM_ON) {
      expect(rows[0].conversation_id).toBe(`conv_client_${clientOfA}`);
      expect(rows[0].from_user_id).toBe(clientOfA);

      const [threads] = await pool.query<RowDataPacket[]>(
        `SELECT broker_id, client_id, owner_client_scope_broker_id
         FROM conversation_threads
         WHERE tenant_id = ? AND conversation_id = ? LIMIT 1`,
        [TENANT_ID, `conv_client_${clientOfA}`],
      );
      expect(threads[0]?.broker_id).toBe(ownerA);
      expect(threads[0]?.owner_client_scope_broker_id).toBe(ownerA);

      // Owner B's thread must not have been created / hijacked.
      const [bThreads] = await pool.query<RowDataPacket[]>(
        `SELECT id FROM conversation_threads
         WHERE tenant_id = ? AND conversation_id = ?`,
        [TENANT_ID, `conv_client_${clientOfB}`],
      );
      expect(bThreads).toHaveLength(0);
    }
  });

  it("unknown sender never merges into another owner's conv_unknown thread", async () => {
    if (!CRM_ON) return;
    const stranger = uniqueTestE164(`${RUN_ID}-stranger`);
    const last10 = stranger.replace(/\D/g, "").slice(-10);
    const sharedId = `conv_unknown_${last10}`;
    const ownId = `${sharedId}_b${ownerA}`;
    conversationIds.push(sharedId, ownId);

    // Owner B already holds the tenant-wide unknown thread for this phone.
    await pool.query(
      `INSERT INTO conversation_threads
         (tenant_id, conversation_id, client_phone, normalized_client_phone,
          client_id, broker_id, owner_client_scope_broker_id, channel,
          last_message_at, last_message_type, message_count, status)
       VALUES (?, ?, ?, ?, NULL, ?, ?, 'sms', NOW(), 'sms', 1, 'active')`,
      [TENANT_ID, sharedId, stranger, last10, ownerB, ownerB],
    );

    for (const suffix of ["u1", "u2"]) {
      const sid = `SM${RUN_ID.replace(/\W/g, "")}${suffix}`;
      const res = await signedPost({
        From: stranger,
        To: lineA,
        Body: `stranger ${suffix}`,
        MessageSid: sid,
        NumMedia: "0",
      });
      expect(res.status).toBe(200);
      const [rows] = await pool.query<RowDataPacket[]>(
        `SELECT conversation_id FROM communications
         WHERE tenant_id = ? AND external_id = ? LIMIT 1`,
        [TENANT_ID, sid],
      );
      // Both messages land in A's own deterministic thread.
      expect(rows[0]?.conversation_id).toBe(ownId);
    }

    const [[bThread]] = await pool.query<RowDataPacket[]>(
      `SELECT broker_id, owner_client_scope_broker_id, message_count, inbox_number
       FROM conversation_threads WHERE tenant_id = ? AND conversation_id = ?`,
      [TENANT_ID, sharedId],
    );
    expect(bThread.broker_id).toBe(ownerB);
    expect(bThread.owner_client_scope_broker_id).toBe(ownerB);
    expect(Number(bThread.message_count)).toBe(1);
    expect(bThread.inbox_number).toBeNull();

    const [[aThread]] = await pool.query<RowDataPacket[]>(
      `SELECT broker_id, owner_client_scope_broker_id, message_count, client_id
       FROM conversation_threads WHERE tenant_id = ? AND conversation_id = ?`,
      [TENANT_ID, ownId],
    );
    expect(aThread.broker_id).toBe(ownerA);
    expect(aThread.owner_client_scope_broker_id).toBe(ownerA);
    expect(aThread.client_id).toBeNull();
    expect(Number(aThread.message_count)).toBe(2);
  });

  it("is idempotent on Twilio retry (same MessageSid)", async () => {
    const sid = `SM${RUN_ID.replace(/\W/g, "")}a`.slice(0, 34);
    const res = await signedPost({
      From: senderPhone,
      To: lineA,
      Body: "hello from integration",
      MessageSid: sid,
      NumMedia: "0",
    });
    expect(res.status).toBe(200);
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS n FROM communications
       WHERE tenant_id = ? AND external_id = ?`,
      [TENANT_ID, sid],
    );
    expect(Number(rows[0].n)).toBe(1);
  });

  it("ignores empty body without media", async () => {
    const res = await signedPost({ From: senderPhone, To: lineA, Body: "" });
    expect(res.status).toBe(200);
    expect(res.text).toBe("<Response></Response>");
  });
});

function cryptoRandom(): string {
  return `${Date.now().toString(16)}${Math.random().toString(16).slice(2, 10)}`.slice(
    0,
    36,
  );
}
