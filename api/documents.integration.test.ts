/**
 * HTTP integration — documents list/download auth + bulk zip edges.
 */
import "dotenv/config";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import type { Pool, RowDataPacket } from "mysql2/promise";
import { createBrokerSession, createServer } from "./index";
import {
  cleanupIntegrationTestFixtures,
  createIntegrationTestPool,
} from "./testDbCleanup";

const RUN_ID = `http-docs-${Date.now()}`;

describe("documents HTTP", () => {
  let pool: Pool;
  let app: ReturnType<typeof createServer>;
  let token = "";

  beforeAll(async () => {
    if (!process.env.DB_HOST || !process.env.JWT_SECRET) {
      throw new Error("DB_HOST and JWT_SECRET required");
    }
    pool = createIntegrationTestPool();
    app = createServer();

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT id, email, role FROM brokers
       WHERE tenant_id = 1 AND status = 'active'
         AND role IN ('admin','platform_owner')
       ORDER BY id ASC LIMIT 1`,
    );
    if (!rows.length) throw new Error("No admin broker");
    token = createBrokerSession({
      id: Number(rows[0].id),
      email: String(rows[0].email),
      role: String(rows[0].role),
    });
  }, 90_000);

  afterAll(async () => {
    await cleanupIntegrationTestFixtures(pool, { runId: RUN_ID });
    await pool?.end();
  });

  it("POST /api/documents/bulk-download without auth → 401", async () => {
    const res = await request(app)
      .post("/api/documents/bulk-download")
      .send({ document_ids: [1] });
    expect(res.status).toBe(401);
  });

  it("POST /api/documents/bulk-download empty selection → 400", async () => {
    const res = await request(app)
      .post("/api/documents/bulk-download")
      .set("Authorization", `Bearer ${token}`)
      .send({ document_ids: [] });
    expect(res.status).toBe(400);
  });

  it("POST /api/documents/bulk-download >100 ids → 400", async () => {
    const ids = Array.from({ length: 101 }, (_, i) => i + 1);
    const res = await request(app)
      .post("/api/documents/bulk-download")
      .set("Authorization", `Bearer ${token}`)
      .send({ document_ids: ids });
    expect(res.status).toBe(400);
    expect(String(res.body.error || "")).toMatch(/100/i);
  });

  it("GET /api/tasks without auth → 401", async () => {
    const res = await request(app).get("/api/tasks");
    expect(res.status).toBe(401);
  });

  it("GET /api/tasks with token → 200", async () => {
    const res = await request(app)
      .get("/api/tasks")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
  });
});
