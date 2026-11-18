/**
 * HTTP integration — broker delegations (team access) + sendable phone lines.
 *
 * Owner (admin with a personal line) shares clients / realtors / conversations
 * / line with a delegate (admin with no line). Verifies access before, during
 * and after revocation, plus validation and permission edge cases.
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

const RUN_ID = `http-deleg-${Date.now()}`;
const TENANT_ID = 1;

describe("broker delegations HTTP", () => {
  let pool: Pool;
  let app: ReturnType<typeof createServer>;
  const brokerIds: number[] = [];
  const clientIds: number[] = [];
  const ownerLine = uniqueTestE164(`${RUN_ID}-owner`);
  let ownerId = 0;
  let delegateId = 0;
  let partnerId = 0;
  let ownerToken = "";
  let delegateToken = "";
  let partnerToken = "";
  let clientId = 0;
  let delegationId = 0;
  const conversationId = `conv_client_deleg_${Date.now()}`;

  async function insertBroker(
    label: string,
    role: "admin" | "broker",
    callerId: string | null,
    createdBy: number | null = null,
  ) {
    const email = `${RUN_ID}-${label}@example.test`;
    const [ins] = await pool.query<ResultSetHeader>(
      `INSERT INTO brokers
         (tenant_id, email, first_name, last_name, role, status, public_token,
          twilio_caller_id, created_by_broker_id)
       VALUES (?, ?, ?, 'Http', ?, 'active', ?, ?, ?)`,
      [
        TENANT_ID,
        email,
        label,
        role,
        Math.random().toString(36).slice(2) + Date.now().toString(36),
        callerId,
        createdBy,
      ],
    );
    brokerIds.push(ins.insertId);
    const token = await createBrokerSession({ id: ins.insertId, email, role });
    return { id: ins.insertId, token };
  }

  const auth = (t: string) => ({ Authorization: `Bearer ${t}` });

  async function delegateSeesClient(): Promise<boolean> {
    const res = await request(app)
      .get(`/api/clients?search=${encodeURIComponent(RUN_ID)}`)
      .set(auth(delegateToken));
    expect(res.status).toBe(200);
    return (res.body.clients || []).some(
      (c: { id: number }) => Number(c.id) === clientId,
    );
  }

  async function delegateSeesRealtor(): Promise<boolean> {
    const res = await request(app)
      .get(`/api/brokers?scope=realtors&search=${encodeURIComponent(RUN_ID)}`)
      .set(auth(delegateToken));
    expect(res.status).toBe(200);
    const list = res.body.brokers || res.body.data || [];
    return list.some((b: { id: number }) => Number(b.id) === partnerId);
  }

  beforeAll(async () => {
    if (!process.env.DB_HOST || !process.env.JWT_SECRET) {
      throw new Error("DB_HOST and JWT_SECRET required");
    }
    pool = createIntegrationTestPool();
    app = createServer();
    const owner = await insertBroker("Owner", "admin", ownerLine);
    ownerId = owner.id;
    ownerToken = owner.token;
    const delegate = await insertBroker("Delegate", "admin", null);
    delegateId = delegate.id;
    delegateToken = delegate.token;
    const partner = await insertBroker("Partner", "broker", null, ownerId);
    partnerId = partner.id;
    partnerToken = partner.token;

    const [c] = await pool.query<ResultSetHeader>(
      `INSERT INTO clients
         (tenant_id, first_name, last_name, email, income_type, assigned_broker_id, list_visibility)
       VALUES (?, 'Deleg', ?, ?, 'W-2', ?, 'active')`,
      [TENANT_ID, RUN_ID, `${RUN_ID}-client@example.test`, ownerId],
    );
    clientId = c.insertId;
    clientIds.push(clientId);

    await pool.query(
      `INSERT INTO conversation_threads
         (tenant_id, conversation_id, client_id, broker_id, owner_client_scope_broker_id,
          last_message_at, last_message_type, status, inbox_number)
       VALUES (?, ?, ?, ?, ?, NOW(), 'sms', 'active', ?)`,
      [TENANT_ID, conversationId, clientId, ownerId, ownerId, ownerLine],
    );
  }, 90_000);

  async function delegateSeesThread(): Promise<{ list: boolean; messages: number }> {
    const list = await request(app)
      .get("/api/conversations/threads?limit=100&inbox_scope=mine")
      .set(auth(delegateToken));
    expect(list.status).toBe(200);
    const msgs = await request(app)
      .get(`/api/conversations/${conversationId}/messages`)
      .set(auth(delegateToken));
    return {
      list: (list.body.threads || []).some(
        (t: { conversation_id: string }) => t.conversation_id === conversationId,
      ),
      messages: msgs.status,
    };
  }

  afterAll(async () => {
    if (!pool) return;
    await pool
      .query(
        `DELETE FROM broker_delegations WHERE tenant_id = ? AND (owner_broker_id IN (?) OR delegate_broker_id IN (?))`,
        [TENANT_ID, brokerIds, brokerIds],
      )
      .catch(() => undefined);
    await cleanupIntegrationTestFixtures(pool, {
      runId: RUN_ID,
      brokerIds,
      clientIds,
      conversationIds: [conversationId],
    });
    await pool.end();
  });

  it("requires auth", async () => {
    expect((await request(app).get("/api/broker-delegations")).status).toBe(401);
    expect((await request(app).get("/api/voice/lines")).status).toBe(401);
  });

  it("before delegation: delegate cannot see owner's client, realtor or line", async () => {
    expect(await delegateSeesClient()).toBe(false);
    const profile = await request(app)
      .get(`/api/clients/${clientId}/profile`)
      .set(auth(delegateToken));
    expect(profile.status).toBe(403);
    expect(await delegateSeesRealtor()).toBe(false);
    expect(await delegateSeesThread()).toEqual({ list: false, messages: 404 });
    const lines = await request(app)
      .get("/api/voice/lines")
      .set(auth(delegateToken));
    expect(lines.status).toBe(200);
    expect(
      lines.body.lines.some((l: { number: string }) => l.number === ownerLine),
    ).toBe(false);
  });

  it("owner's own line is their default", async () => {
    const res = await request(app).get("/api/voice/lines").set(auth(ownerToken));
    expect(res.status).toBe(200);
    expect(res.body.lines[0]).toMatchObject({
      number: ownerLine,
      kind: "personal",
      is_default: true,
    });
  });

  it("validation: self, partner delegate, other owner, no scopes", async () => {
    const self = await request(app)
      .post("/api/broker-delegations")
      .set(auth(ownerToken))
      .send({ delegate_broker_id: ownerId });
    expect(self.status).toBe(400);

    const toPartner = await request(app)
      .post("/api/broker-delegations")
      .set(auth(ownerToken))
      .send({ delegate_broker_id: partnerId });
    expect(toPartner.status).toBe(400);

    // An admin cannot grant access to someone else's book.
    const hijack = await request(app)
      .post("/api/broker-delegations")
      .set(auth(delegateToken))
      .send({ owner_broker_id: ownerId, delegate_broker_id: delegateId });
    expect(hijack.status).toBe(403);

    const none = await request(app)
      .post("/api/broker-delegations")
      .set(auth(ownerToken))
      .send({
        delegate_broker_id: delegateId,
        can_view_clients: false,
        can_view_realtors: "false",
        can_view_conversations: 0,
        can_send_from_line: false,
      });
    expect(none.status).toBe(400);

    const missing = await request(app)
      .post("/api/broker-delegations")
      .set(auth(ownerToken))
      .send({});
    expect(missing.status).toBe(400);
  });

  it("owner grants full access incl. line", async () => {
    const res = await request(app)
      .post("/api/broker-delegations")
      .set(auth(ownerToken))
      .send({ delegate_broker_id: delegateId, can_send_from_line: true });
    expect(res.status).toBe(200);
    expect(res.body.delegation).toMatchObject({
      owner_broker_id: ownerId,
      delegate_broker_id: delegateId,
      can_view_clients: true,
      can_view_realtors: true,
      can_view_conversations: true,
      can_send_from_line: true,
    });
    delegationId = res.body.delegation.id;

    const list = await request(app)
      .get("/api/broker-delegations")
      .set(auth(delegateToken));
    expect(
      list.body.delegations.some((d: { id: number }) => d.id === delegationId),
    ).toBe(true);
  });

  it("delegate now sees client, profile, realtor and can use owner's line", async () => {
    expect(await delegateSeesClient()).toBe(true);
    const profile = await request(app)
      .get(`/api/clients/${clientId}/profile`)
      .set(auth(delegateToken));
    expect(profile.status).toBe(200);
    expect(await delegateSeesRealtor()).toBe(true);
    expect(await delegateSeesThread()).toEqual({ list: true, messages: 200 });

    const lines = await request(app)
      .get("/api/voice/lines")
      .set(auth(delegateToken));
    const delegated = lines.body.lines.find(
      (l: { number: string }) => l.number === ownerLine,
    );
    expect(delegated).toMatchObject({ kind: "delegated", owner_broker_id: ownerId });
  });

  it("send with a line the broker may not use → 403 (no SMS sent)", async () => {
    const res = await request(app)
      .post("/api/conversations/send")
      .set(auth(partnerToken))
      .send({
        communication_type: "sms",
        client_id: clientId,
        body: "should not send",
        from_line: ownerLine,
      });
    expect(res.status).toBe(403);
  });

  it("partial update: drop line access", async () => {
    const res = await request(app)
      .post("/api/broker-delegations")
      .set(auth(ownerToken))
      .send({ delegate_broker_id: delegateId, can_send_from_line: false });
    expect(res.status).toBe(200);
    expect(res.body.delegation.can_send_from_line).toBe(false);
    const lines = await request(app)
      .get("/api/voice/lines")
      .set(auth(delegateToken));
    expect(
      lines.body.lines.some((l: { number: string }) => l.number === ownerLine),
    ).toBe(false);
  });

  it("partner cannot revoke; delegate revoke removes access", async () => {
    const denied = await request(app)
      .delete(`/api/broker-delegations/${delegationId}`)
      .set(auth(partnerToken));
    expect(denied.status).toBe(403);

    const ok = await request(app)
      .delete(`/api/broker-delegations/${delegationId}`)
      .set(auth(ownerToken));
    expect(ok.status).toBe(200);
    const again = await request(app)
      .delete(`/api/broker-delegations/${delegationId}`)
      .set(auth(ownerToken));
    expect(again.status).toBe(404);

    expect(await delegateSeesClient()).toBe(false);
    expect(await delegateSeesRealtor()).toBe(false);
    expect(await delegateSeesThread()).toEqual({ list: false, messages: 404 });
  });

  it("main line: readable by team, only platform_owner may update", async () => {
    const get = await request(app)
      .get("/api/settings/main-line")
      .set(auth(ownerToken));
    expect(get.status).toBe(200);
    expect(get.body.main_line).toHaveProperty("ring_broker_ids");

    const put = await request(app)
      .put("/api/settings/main-line")
      .set(auth(ownerToken))
      .send({ number: "+15555550100", ring_broker_ids: [] });
    expect(put.status).toBe(403);
  });
});
