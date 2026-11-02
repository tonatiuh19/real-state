/**
 * HTTP integration — health + auth edges (optimum-credit style).
 */
import "dotenv/config";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import { createBrokerSession, createServer } from "./index";
import {
  cleanupIntegrationTestFixtures,
  createIntegrationTestPool,
} from "./testDbCleanup";
import type { Pool, RowDataPacket } from "mysql2/promise";

const RUN_ID = `http-health-${Date.now()}`;

describe("health + auth HTTP", () => {
  let pool: Pool;
  let app: ReturnType<typeof createServer>;
  let brokerToken = "";
  let brokerId = 0;

  beforeAll(async () => {
    if (!process.env.DB_HOST || !process.env.JWT_SECRET) {
      throw new Error("DB_HOST and JWT_SECRET required for integration tests");
    }
    pool = createIntegrationTestPool();
    app = createServer();

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT id, email, role FROM brokers
       WHERE tenant_id = 1 AND status = 'active'
         AND role IN ('admin','platform_owner')
       ORDER BY id ASC LIMIT 1`,
    );
    if (!rows.length) throw new Error("No active admin broker for tests");
    brokerId = Number(rows[0].id);
    brokerToken = createBrokerSession({
      id: brokerId,
      email: String(rows[0].email),
      role: String(rows[0].role),
    });
  }, 90_000);

  afterAll(async () => {
    await cleanupIntegrationTestFixtures(pool, { runId: RUN_ID });
    await pool?.end();
  });

  it("GET /api/health → 200", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
  });

  it("GET /api/ping → 200", async () => {
    const res = await request(app).get("/api/ping");
    expect(res.status).toBe(200);
  });

  it("GET /api/clients without auth → 401", async () => {
    const res = await request(app).get("/api/clients");
    expect(res.status).toBe(401);
  });

  it("GET /api/clients with garbage token → 401", async () => {
    const res = await request(app)
      .get("/api/clients")
      .set("Authorization", "Bearer not-a-jwt");
    expect(res.status).toBe(401);
  });

  it("GET /api/clients with valid broker token → 200", async () => {
    const res = await request(app)
      .get("/api/clients")
      .set("Authorization", `Bearer ${brokerToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
