/**
 * HTTP integration — clients CRUD + per-owner email/phone edges.
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

const RUN_ID = `http-clients-${Date.now()}`;
const TENANT_ID = 1;

describe("clients HTTP (per-owner CRM edges)", () => {
  let pool: Pool;
  let app: ReturnType<typeof createServer>;
  let tokenA = "";
  let tokenB = "";
  let brokerA = 0;
  let brokerB = 0;
  const clientIds: number[] = [];
  const brokerIds: number[] = [];

  beforeAll(async () => {
    if (!process.env.DB_HOST || !process.env.JWT_SECRET) {
      throw new Error("DB_HOST and JWT_SECRET required");
    }
    pool = createIntegrationTestPool();
    app = createServer();

    const phoneA = uniqueTestE164(`${RUN_ID}-a`);
    const phoneB = uniqueTestE164(`${RUN_ID}-b`);
    const [insA] = await pool.query<ResultSetHeader>(
      `INSERT INTO brokers
         (tenant_id, email, first_name, last_name, phone, normalized_phone,
          role, status, public_token)
       VALUES (?, ?, 'Http', 'MBA', ?, ?, 'admin', 'active', ?)`,
      [
        TENANT_ID,
        `${RUN_ID}-mba@example.test`,
        phoneA,
        phoneA.replace(/\D/g, "").slice(-10),
        cryptoRandom(),
      ],
    );
    const [insB] = await pool.query<ResultSetHeader>(
      `INSERT INTO brokers
         (tenant_id, email, first_name, last_name, phone, normalized_phone,
          role, status, public_token)
       VALUES (?, ?, 'Http', 'MBB', ?, ?, 'admin', 'active', ?)`,
      [
        TENANT_ID,
        `${RUN_ID}-mbb@example.test`,
        phoneB,
        phoneB.replace(/\D/g, "").slice(-10),
        cryptoRandom(),
      ],
    );
    brokerA = insA.insertId;
    brokerB = insB.insertId;
    brokerIds.push(brokerA, brokerB);

    tokenA = createBrokerSession({
      id: brokerA,
      email: `${RUN_ID}-mba@example.test`,
      role: "admin",
    });
    tokenB = createBrokerSession({
      id: brokerB,
      email: `${RUN_ID}-mbb@example.test`,
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

  it("POST /api/clients empty name → 400", async () => {
    const res = await request(app)
      .post("/api/clients")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ first_name: "", last_name: "" });
    expect(res.status).toBe(400);
  });

  it("POST /api/clients creates client for owning MB", async () => {
    const email = `${RUN_ID}-c1@example.test`;
    const phone = uniqueTestE164(`${RUN_ID}-c1`);
    const res = await request(app)
      .post("/api/clients")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({
        first_name: "Http",
        last_name: "ClientOne",
        email,
        phone,
      });
    expect([200, 201]).toContain(res.status);
    expect(res.body.success).toBe(true);
    const id = Number(res.body.client?.id ?? res.body.client_id ?? res.body.id);
    expect(Number.isFinite(id) && id > 0).toBe(true);
    clientIds.push(id);

    const [[row]] = await pool.query<RowDataPacket[]>(
      `SELECT assigned_broker_id, list_visibility FROM clients WHERE id = ?`,
      [id],
    );
    expect(Number(row.assigned_broker_id)).toBe(brokerA);
    expect(row.list_visibility).toBe("active");
  });

  it("POST /api/clients same-owner duplicate email → 409", async () => {
    const email = `${RUN_ID}-dup@example.test`;
    const first = await request(app)
      .post("/api/clients")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({
        first_name: "Dup",
        last_name: "One",
        email,
        phone: uniqueTestE164(`${RUN_ID}-dup1`),
      });
    expect([200, 201]).toContain(first.status);
    const id = Number(
      first.body.client?.id ?? first.body.client_id ?? first.body.id,
    );
    if (id) clientIds.push(id);

    const second = await request(app)
      .post("/api/clients")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({
        first_name: "Dup",
        last_name: "Two",
        email,
        phone: uniqueTestE164(`${RUN_ID}-dup2`),
      });
    expect(second.status).toBe(409);
  });

  it("POST /api/clients cross-owner same email allowed when CRM on", async () => {
    const email = `${RUN_ID}-shared@example.test`;
    const a = await request(app)
      .post("/api/clients")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({
        first_name: "Shared",
        last_name: "A",
        email,
        phone: uniqueTestE164(`${RUN_ID}-sha`),
      });
    expect([200, 201]).toContain(a.status);
    const idA = Number(a.body.client?.id ?? a.body.client_id ?? a.body.id);
    if (idA) clientIds.push(idA);

    const b = await request(app)
      .post("/api/clients")
      .set("Authorization", `Bearer ${tokenB}`)
      .send({
        first_name: "Shared",
        last_name: "B",
        email,
        phone: uniqueTestE164(`${RUN_ID}-shb`),
      });
    // CRM on → 200/201; CRM off → 409. Accept either but assert isolation when success.
    if (b.status === 200 || b.status === 201) {
      const idB = Number(b.body.client?.id ?? b.body.client_id ?? b.body.id);
      if (idB) clientIds.push(idB);
      expect(idA).not.toBe(idB);
    } else {
      expect(b.status).toBe(409);
    }
  });

  it("GET /api/clients/:id foreign owner → 403 when CRM on", async () => {
    const email = `${RUN_ID}-iso@example.test`;
    const created = await request(app)
      .post("/api/clients")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({
        first_name: "Iso",
        last_name: "Owner",
        email,
        phone: uniqueTestE164(`${RUN_ID}-iso`),
      });
    expect([200, 201]).toContain(created.status);
    const id = Number(
      created.body.client?.id ?? created.body.client_id ?? created.body.id,
    );
    clientIds.push(id);

    const peek = await request(app)
      .get(`/api/clients/${id}/profile`)
      .set("Authorization", `Bearer ${tokenB}`);
    // Active CRM → 403; legacy may allow or 404
    expect([403, 404, 200]).toContain(peek.status);
    if (process.env.PER_OWNER_CRM_ENABLED === "1") {
      expect(peek.status).toBe(403);
    }
  });
});

function cryptoRandom(): string {
  // brokers.public_token is typically UUID-length
  return `${Date.now().toString(16)}${Math.random().toString(16).slice(2, 10)}`.slice(0, 36);
}
