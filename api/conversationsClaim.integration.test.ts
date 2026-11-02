/**
 * HTTP integration — shared-queue claim edges (per-owner CRM).
 */
import "dotenv/config";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import type { Pool, ResultSetHeader } from "mysql2/promise";
import { createBrokerSession, createServer } from "./index";
import {
  cleanupIntegrationTestFixtures,
  createIntegrationTestPool,
  uniqueTestE164,
} from "./testDbCleanup";

const RUN_ID = `http-claim-${Date.now()}`;
const TENANT_ID = 1;
const CONVERSATION_ID = `conv_shared_${RUN_ID}`;

describe("conversation claim HTTP", () => {
  let pool: Pool;
  let app: ReturnType<typeof createServer>;
  let tokenA = "";
  let tokenB = "";
  const brokerIds: number[] = [];
  const clientIds: number[] = [];

  beforeAll(async () => {
    if (!process.env.DB_HOST || !process.env.JWT_SECRET) {
      throw new Error("DB_HOST and JWT_SECRET required");
    }
    pool = createIntegrationTestPool();
    app = createServer();

    const phone = uniqueTestE164(RUN_ID);
    const [insA] = await pool.query<ResultSetHeader>(
      `INSERT INTO brokers
         (tenant_id, email, first_name, last_name, role, status, public_token)
       VALUES (?, ?, 'Http', 'ClaimA', 'admin', 'active', ?)`,
      [TENANT_ID, `${RUN_ID}-a@example.test`, cryptoRandom()],
    );
    const [insB] = await pool.query<ResultSetHeader>(
      `INSERT INTO brokers
         (tenant_id, email, first_name, last_name, role, status, public_token)
       VALUES (?, ?, 'Http', 'ClaimB', 'admin', 'active', ?)`,
      [TENANT_ID, `${RUN_ID}-b@example.test`, cryptoRandom()],
    );
    brokerIds.push(insA.insertId, insB.insertId);
    tokenA = createBrokerSession({
      id: insA.insertId,
      email: `${RUN_ID}-a@example.test`,
      role: "admin",
    });
    tokenB = createBrokerSession({
      id: insB.insertId,
      email: `${RUN_ID}-b@example.test`,
      role: "admin",
    });

    await pool.query(
      `INSERT INTO conversation_threads
         (tenant_id, conversation_id, client_phone, client_name,
          client_id, broker_id, channel, last_message_at, last_message_type,
          normalized_client_phone)
       VALUES (?, ?, ?, 'Shared Caller', NULL, NULL, 'sms', NOW(), 'sms', ?)`,
      [
        TENANT_ID,
        CONVERSATION_ID,
        phone,
        phone.replace(/\D/g, "").slice(-10),
      ],
    );
  }, 90_000);

  afterAll(async () => {
    await cleanupIntegrationTestFixtures(pool, {
      runId: RUN_ID,
      brokerIds,
      clientIds,
      conversationIds: [CONVERSATION_ID],
    });
    await pool?.end();
  });

  it("POST claim without auth → 401", async () => {
    const res = await request(app).post(
      `/api/conversations/${encodeURIComponent(CONVERSATION_ID)}/claim`,
    );
    expect(res.status).toBe(401);
  });

  it("POST claim stamps client + broker when CRM on", async () => {
    const res = await request(app)
      .post(`/api/conversations/${encodeURIComponent(CONVERSATION_ID)}/claim`)
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ first_name: "Claimed", last_name: "Caller" });

    if (process.env.PER_OWNER_CRM_ENABLED === "1") {
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      if (res.body.client_id) clientIds.push(Number(res.body.client_id));
    } else {
      expect([200, 403]).toContain(res.status);
      if (res.body.client_id) clientIds.push(Number(res.body.client_id));
    }
  });

  it("POST claim already claimed → 409", async () => {
    if (process.env.PER_OWNER_CRM_ENABLED !== "1") return;
    const res = await request(app)
      .post(`/api/conversations/${encodeURIComponent(CONVERSATION_ID)}/claim`)
      .set("Authorization", `Bearer ${tokenB}`)
      .send({ first_name: "Other", last_name: "Banker" });
    expect(res.status).toBe(409);
  });
});

function cryptoRandom(): string {
  return `${Date.now().toString(16)}${Math.random().toString(16).slice(2, 10)}`.slice(0, 36);
}
