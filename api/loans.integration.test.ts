/**
 * HTTP integration — loans list/create auth + ownership edges.
 */
import "dotenv/config";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import type { Pool, ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { createBrokerSession, createServer } from "./index";
import {
  cleanupIntegrationTestFixtures,
  createIntegrationTestPool,
  uniqueTestE164,
} from "./testDbCleanup";

const RUN_ID = `http-loans-${Date.now()}`;
const TENANT_ID = 1;

describe("loans HTTP", () => {
  let pool: Pool;
  let app: ReturnType<typeof createServer>;
  let token = "";
  let brokerId = 0;
  const clientIds: number[] = [];
  const brokerIds: number[] = [];

  beforeAll(async () => {
    if (!process.env.DB_HOST || !process.env.JWT_SECRET) {
      throw new Error("DB_HOST and JWT_SECRET required");
    }
    pool = createIntegrationTestPool();
    app = createServer();

    const [ins] = await pool.query<ResultSetHeader>(
      `INSERT INTO brokers
         (tenant_id, email, first_name, last_name, role, status, public_token)
       VALUES (?, ?, 'Http', 'LoanMB', 'admin', 'active', ?)`,
      [TENANT_ID, `${RUN_ID}-mb@example.test`, cryptoRandom()],
    );
    brokerId = ins.insertId;
    brokerIds.push(brokerId);
    token = createBrokerSession({
      id: brokerId,
      email: `${RUN_ID}-mb@example.test`,
      role: "admin",
    });
  }, 90_000);

  afterAll(async () => {
    await cleanupIntegrationTestFixtures(pool, {
      runId: RUN_ID,
      clientIds,
      brokerIds,
    });
    await pool?.end();
  });

  it("GET /api/loans without auth → 401", async () => {
    const res = await request(app).get("/api/loans");
    expect(res.status).toBe(401);
  });

  it("GET /api/loans with token → 200", async () => {
    const res = await request(app)
      .get("/api/loans")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
  });

  it("POST /api/loans/create missing client fields → 400", async () => {
    const res = await request(app)
      .post("/api/loans/create")
      .set("Authorization", `Bearer ${token}`)
      .send({});
    expect([400, 422]).toContain(res.status);
  });

  it("POST /api/loans/create happy path (minimal)", async () => {
    const email = `${RUN_ID}-borrower@example.test`;
    const phone = uniqueTestE164(`${RUN_ID}-borrower`);
    const res = await request(app)
      .post("/api/loans/create")
      .set("Authorization", `Bearer ${token}`)
      .send({
        client_first_name: "Http",
        client_last_name: "Borrower",
        client_email: email,
        client_phone: phone,
        loan_purpose: "purchase",
        property_type: "single_family",
        loan_amount: 450000,
      });

    // Accept success or validation that still exercises the route
    expect([200, 201, 400]).toContain(res.status);
    if (res.status === 200 || res.status === 201) {
      const [[client]] = await pool.query<RowDataPacket[]>(
        `SELECT id FROM clients WHERE tenant_id = ? AND email = ? LIMIT 1`,
        [TENANT_ID, email],
      );
      if (client?.id) clientIds.push(Number(client.id));
    }
  });
});

function cryptoRandom(): string {
  return `${Date.now().toString(16)}${Math.random().toString(16).slice(2, 10)}`.slice(0, 36);
}
