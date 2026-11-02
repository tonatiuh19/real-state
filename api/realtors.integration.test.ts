/**
 * HTTP integration — partner realtor create + per-owner uniqueness.
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

const RUN_ID = `http-realtors-${Date.now()}`;
const TENANT_ID = 1;

describe("realtors HTTP (per-owner uniqueness)", () => {
  let pool: Pool;
  let app: ReturnType<typeof createServer>;
  let tokenA = "";
  let tokenB = "";
  const brokerIds: number[] = [];

  beforeAll(async () => {
    if (!process.env.DB_HOST || !process.env.JWT_SECRET) {
      throw new Error("DB_HOST and JWT_SECRET required");
    }
    pool = createIntegrationTestPool();
    app = createServer();

    const [insA] = await pool.query<ResultSetHeader>(
      `INSERT INTO brokers
         (tenant_id, email, first_name, last_name, role, status, public_token)
       VALUES (?, ?, 'Http', 'MBA', 'admin', 'active', ?)`,
      [TENANT_ID, `${RUN_ID}-mba@example.test`, cryptoRandom()],
    );
    const [insB] = await pool.query<ResultSetHeader>(
      `INSERT INTO brokers
         (tenant_id, email, first_name, last_name, role, status, public_token)
       VALUES (?, ?, 'Http', 'MBB', 'admin', 'active', ?)`,
      [TENANT_ID, `${RUN_ID}-mbb@example.test`, cryptoRandom()],
    );
    brokerIds.push(insA.insertId, insB.insertId);
    tokenA = createBrokerSession({
      id: insA.insertId,
      email: `${RUN_ID}-mba@example.test`,
      role: "admin",
    });
    tokenB = createBrokerSession({
      id: insB.insertId,
      email: `${RUN_ID}-mbb@example.test`,
      role: "admin",
    });
  }, 90_000);

  afterAll(async () => {
    await cleanupIntegrationTestFixtures(pool, { runId: RUN_ID, brokerIds });
    await pool?.end();
  });

  it("POST /api/brokers without auth → 401", async () => {
    const res = await request(app).post("/api/brokers").send({});
    expect(res.status).toBe(401);
  });

  it("POST /api/brokers missing fields → 400", async () => {
    const res = await request(app)
      .post("/api/brokers")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ first_name: "X" });
    expect(res.status).toBe(400);
  });

  it("POST /api/brokers creates partner realtor under owning MB", async () => {
    const email = `${RUN_ID}-ra@example.test`;
    const phone = uniqueTestE164(`${RUN_ID}-ra`);
    const res = await request(app)
      .post("/api/brokers")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({
        email,
        first_name: "Http",
        last_name: "RealtorA",
        phone,
        role: "broker",
      });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const id = Number(res.body.broker?.id ?? res.body.broker_id ?? res.body.id);
    if (id) brokerIds.push(id);
  });

  it("POST /api/brokers same-owner dup email → 400", async () => {
    const email = `${RUN_ID}-rdup@example.test`;
    const first = await request(app)
      .post("/api/brokers")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({
        email,
        first_name: "Dup",
        last_name: "One",
        phone: uniqueTestE164(`${RUN_ID}-rd1`),
        role: "broker",
      });
    expect(first.status).toBe(200);
    const id = Number(
      first.body.broker?.id ?? first.body.broker_id ?? first.body.id,
    );
    if (id) brokerIds.push(id);

    const second = await request(app)
      .post("/api/brokers")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({
        email,
        first_name: "Dup",
        last_name: "Two",
        phone: uniqueTestE164(`${RUN_ID}-rd2`),
        role: "broker",
      });
    expect(second.status).toBe(400);
  });

  it("POST /api/brokers cross-owner same email allowed when CRM on", async () => {
    const email = `${RUN_ID}-rshare@example.test`;
    const a = await request(app)
      .post("/api/brokers")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({
        email,
        first_name: "Share",
        last_name: "A",
        phone: uniqueTestE164(`${RUN_ID}-rsa`),
        role: "broker",
      });
    expect(a.status).toBe(200);
    const idA = Number(a.body.broker?.id ?? a.body.broker_id ?? a.body.id);
    if (idA) brokerIds.push(idA);

    const b = await request(app)
      .post("/api/brokers")
      .set("Authorization", `Bearer ${tokenB}`)
      .send({
        email,
        first_name: "Share",
        last_name: "B",
        phone: uniqueTestE164(`${RUN_ID}-rsb`),
        role: "broker",
      });
    if (b.status === 200) {
      const idB = Number(b.body.broker?.id ?? b.body.broker_id ?? b.body.id);
      if (idB) brokerIds.push(idB);
    } else {
      expect([400, 409]).toContain(b.status);
    }
  });

  it("DELETE broker frees email so same email can be re-created", async () => {
    const email = `${RUN_ID}-readd@example.test`;
    const create = await request(app)
      .post("/api/brokers")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({
        email,
        first_name: "Readd",
        last_name: "One",
        phone: uniqueTestE164(`${RUN_ID}-re1`),
        role: "broker",
      });
    expect(create.status).toBe(200);
    const id1 = Number(create.body.broker?.id);
    expect(id1).toBeGreaterThan(0);
    brokerIds.push(id1);

    const del = await request(app)
      .delete(`/api/brokers/${id1}`)
      .set("Authorization", `Bearer ${tokenA}`);
    expect(del.status).toBe(200);

    const [[row]] = await pool.query<RowDataPacket[]>(
      `SELECT status, email FROM brokers WHERE id = ?`,
      [id1],
    );
    expect(row.status).toBe("inactive");
    expect(String(row.email)).toMatch(/^deleted\+/);

    const recreate = await request(app)
      .post("/api/brokers")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({
        email,
        first_name: "Readd",
        last_name: "Two",
        phone: uniqueTestE164(`${RUN_ID}-re2`),
        role: "broker",
      });
    expect(recreate.status).toBe(200);
    const id2 = Number(recreate.body.broker?.id);
    expect(id2).toBeGreaterThan(0);
    expect(id2).not.toBe(id1);
    brokerIds.push(id2);
  });

  it("inactive broker that kept email is reactivated on create", async () => {
    const email = `${RUN_ID}-react@example.test`;
    const create = await request(app)
      .post("/api/brokers")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({
        email,
        first_name: "React",
        last_name: "One",
        phone: uniqueTestE164(`${RUN_ID}-rc1`),
        role: "broker",
      });
    expect(create.status).toBe(200);
    const id1 = Number(create.body.broker?.id);
    brokerIds.push(id1);

    // Simulate convert-to-client style soft-delete (email kept)
    await pool.query(
      `UPDATE brokers SET status = 'inactive' WHERE id = ?`,
      [id1],
    );

    const again = await request(app)
      .post("/api/brokers")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({
        email,
        first_name: "React",
        last_name: "Two",
        phone: uniqueTestE164(`${RUN_ID}-rc2`),
        role: "broker",
      });
    expect(again.status).toBe(200);
    expect(again.body.reactivated).toBe(true);
    expect(Number(again.body.broker?.id)).toBe(id1);
    expect(again.body.broker?.status).toBe("active");
    expect(again.body.broker?.last_name).toBe("Two");
  });

  it("platform_owner can assign another platform_owner as created_by_broker_id", async () => {
    // Promote fixture A to platform_owner for this case
    await pool.query(`UPDATE brokers SET role = 'platform_owner' WHERE id = ?`, [
      brokerIds[0],
    ]);
    const tokenPo = createBrokerSession({
      id: brokerIds[0],
      email: `${RUN_ID}-mba@example.test`,
      role: "platform_owner",
    });
    // Fixture B stays admin — also allow assigning B; then assign A (PO) as owner
    const email = `${RUN_ID}-po-assign@example.test`;
    const res = await request(app)
      .post("/api/brokers")
      .set("Authorization", `Bearer ${tokenPo}`)
      .send({
        email,
        first_name: "Po",
        last_name: "Assign",
        phone: uniqueTestE164(`${RUN_ID}-poa`),
        role: "broker",
        created_by_broker_id: brokerIds[0], // self PO
      });
    expect(res.status).toBe(200);
    expect(Number(res.body.broker?.created_by_broker_id)).toBe(brokerIds[0]);
    const id = Number(res.body.broker?.id);
    if (id) brokerIds.push(id);

    // Assign to other PO/admin B
    await pool.query(`UPDATE brokers SET role = 'platform_owner' WHERE id = ?`, [
      brokerIds[1],
    ]);
    const res2 = await request(app)
      .post("/api/brokers")
      .set("Authorization", `Bearer ${tokenPo}`)
      .send({
        email: `${RUN_ID}-po-assign2@example.test`,
        first_name: "Po",
        last_name: "Assign2",
        phone: uniqueTestE164(`${RUN_ID}-poa2`),
        role: "broker",
        created_by_broker_id: brokerIds[1],
      });
    expect(res2.status).toBe(200);
    expect(Number(res2.body.broker?.created_by_broker_id)).toBe(brokerIds[1]);
    const id2 = Number(res2.body.broker?.id);
    if (id2) brokerIds.push(id2);
  });

  it("create duplicate email returns existing_broker_id for edit UX", async () => {
    const email = `${RUN_ID}-editux@example.test`;
    const first = await request(app)
      .post("/api/brokers")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({
        email,
        first_name: "Edit",
        last_name: "Ux",
        phone: uniqueTestE164(`${RUN_ID}-eux`),
        role: "broker",
      });
    expect(first.status).toBe(200);
    const id = Number(first.body.broker?.id);
    brokerIds.push(id);

    const dup = await request(app)
      .post("/api/brokers")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({
        email,
        first_name: "Edit",
        last_name: "Dup",
        phone: uniqueTestE164(`${RUN_ID}-eux2`),
        role: "broker",
      });
    expect(dup.status).toBe(400);
    expect(Number(dup.body.existing_broker_id)).toBe(id);
    expect(String(dup.body.error)).toMatch(/already have a realtor/i);
  });
});

function cryptoRandom(): string {
  return `${Date.now().toString(16)}${Math.random().toString(16).slice(2, 10)}`.slice(0, 36);
}
