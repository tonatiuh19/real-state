/**
 * HTTP integration — short links, durable MMS upload, draft media, MMS cap.
 */
import "dotenv/config";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import type { Pool, ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { createBrokerSession, createServer } from "./index";
import {
  cleanupIntegrationTestFixtures,
  createIntegrationTestPool,
} from "./testDbCleanup";
import {
  BROADCAST_MMS_MAX_RECIPIENTS,
  shouldSkipBulkForBroadcastMedia,
} from "../shared/short-links";
import { shouldUseBulkSmsEngine as shouldUseBulkFromBulk } from "../shared/broadcast-bulk";

const RUN_ID = `http-shortlink-${Date.now()}`;
const TENANT_ID = 1;

describe("broadcast short links + MMS media HTTP", () => {
  let pool: Pool;
  let app: ReturnType<typeof createServer>;
  let ownerToken = "";
  let ownerId = 0;
  let adminToken = "";
  let adminId = 0;
  let createdCode = "";
  let durableAssetId = "";
  let draftBroadcastId = 0;
  let overCapBroadcastId = 0;
  const brokerIds: number[] = [];

  beforeAll(async () => {
    if (!process.env.DB_HOST || !process.env.JWT_SECRET) {
      throw new Error("DB_HOST and JWT_SECRET required for integration tests");
    }
    pool = createIntegrationTestPool();
    app = createServer();

    const [ownerRows] = await pool.query<RowDataPacket[]>(
      `SELECT id, email, role FROM brokers
       WHERE tenant_id = ? AND status = 'active' AND role = 'platform_owner'
       ORDER BY id ASC LIMIT 1`,
      [TENANT_ID],
    );
    if (!ownerRows.length) {
      throw new Error("No active platform_owner broker for short-link tests");
    }
    ownerId = Number(ownerRows[0].id);
    ownerToken = createBrokerSession({
      id: ownerId,
      email: String(ownerRows[0].email),
      role: "platform_owner",
    });

    const [adminIns] = await pool.query<ResultSetHeader>(
      `INSERT INTO brokers
         (tenant_id, email, first_name, last_name, role, status, public_token)
       VALUES (?, ?, 'Http', 'ShortAdmin', 'admin', 'active', ?)`,
      [TENANT_ID, `${RUN_ID}-admin@example.test`, crypto.randomUUID()],
    );
    adminId = adminIns.insertId;
    brokerIds.push(adminId);
    adminToken = createBrokerSession({
      id: adminId,
      email: `${RUN_ID}-admin@example.test`,
      role: "admin",
    });
  }, 90_000);

  afterAll(async () => {
    for (const id of [draftBroadcastId, overCapBroadcastId]) {
      if (!id) continue;
      try {
        await pool.query(
          `DELETE FROM realtor_broadcast_recipients WHERE broadcast_id = ?`,
          [id],
        );
        await pool.query(`DELETE FROM realtor_broadcasts WHERE id = ?`, [id]);
      } catch {
        /* ignore */
      }
    }
    if (createdCode) {
      try {
        await pool.query(`DELETE FROM short_links WHERE code = ?`, [
          createdCode,
        ]);
      } catch {
        /* ignore */
      }
    }
    if (durableAssetId) {
      try {
        await pool.query(`DELETE FROM link_assets WHERE id = ?`, [
          durableAssetId,
        ]);
      } catch {
        /* ignore */
      }
    }
    await cleanupIntegrationTestFixtures(pool, {
      runId: RUN_ID,
      brokerIds,
    });
    await pool?.end();
  });

  it("POST /api/short-links requires auth", async () => {
    const res = await request(app)
      .post("/api/short-links")
      .send({ target_url: "https://portal.encoremortgage.org/flyer" });
    expect(res.status).toBe(401);
  });

  it("POST /api/short-links rejects non-platform_owner", async () => {
    const res = await request(app)
      .post("/api/short-links")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        target_url: "https://portal.encoremortgage.org/flyer",
        title: `admin deny ${RUN_ID}`,
      });
    expect(res.status).toBe(403);
  });

  it("POST /api/short-links rejects open phishing targets", async () => {
    const res = await request(app)
      .post("/api/short-links")
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({
        target_url: "https://evil.example/phish",
        title: `phish ${RUN_ID}`,
      });
    expect(res.status).toBe(400);
    expect(String(res.body.error || "")).toMatch(/Encore Mortgage domains/i);
  });

  it("POST /api/short-links → GET /l/:code redirects and counts click", async () => {
    const create = await request(app)
      .post("/api/short-links")
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({
        target_url: "https://portal.encoremortgage.org/encore-broadcast-smoke",
        title: `smoke ${RUN_ID}`,
      });
    expect(create.status).toBe(200);
    expect(create.body.success).toBe(true);
    createdCode = String(create.body.short_link.code);
    expect(create.body.short_link.short_url).toContain(`/l/${createdCode}`);

    const redirect = await request(app).get(`/l/${createdCode}`).redirects(0);
    expect(redirect.status).toBe(302);
    expect(String(redirect.headers.location)).toBe(
      "https://portal.encoremortgage.org/encore-broadcast-smoke",
    );

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT click_count FROM short_links WHERE code = ? LIMIT 1`,
      [createdCode],
    );
    expect(Number(rows[0]?.click_count ?? 0)).toBeGreaterThanOrEqual(1);
  });

  it("GET /api/short-links lists recent links for platform_owner", async () => {
    const res = await request(app)
      .get("/api/short-links?limit=10")
      .set("Authorization", `Bearer ${ownerToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.short_links)).toBe(true);
  });

  it("GET /l/unknown → 404", async () => {
    const res = await request(app).get("/l/zzNotARealCode99");
    expect(res.status).toBe(404);
  });

  it("POST /api/short-links/upload durable MMS (create_short_link=false)", async () => {
    const png1x1 = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
      "base64",
    );
    const res = await request(app)
      .post("/api/short-links/upload")
      .set("Authorization", `Bearer ${ownerToken}`)
      .field("create_short_link", "false")
      .attach("file", png1x1, {
        filename: `${RUN_ID}-mms.png`,
        contentType: "image/png",
      });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.asset?.url).toMatch(/\/api\/link-assets\/public\//);
    durableAssetId = String(res.body.asset.id);

    const pub = await request(app).get(
      `/api/link-assets/public/${durableAssetId}`,
    );
    expect(pub.status).toBe(200);
    expect(String(pub.headers["content-type"] || "")).toMatch(/image\/png/);
  });

  it("PATCH draft with media_url + short_link_code round-trip", async () => {
    const [ins] = await pool.query<ResultSetHeader>(
      `INSERT INTO realtor_broadcasts
         (tenant_id, created_by, title, channel, body_sms, audience_filter,
          recipient_count, status, sms_engine)
       VALUES (?, ?, ?, 'sms', ?, ?, 0, 'draft', 'messages')`,
      [
        TENANT_ID,
        ownerId,
        `Draft media ${RUN_ID}`,
        "Draft body for media round-trip",
        JSON.stringify({ segments: ["all_active_realtors"] }),
      ],
    );
    draftBroadcastId = ins.insertId;

    // One SMS recipient — under MMS cap
    await pool.query(
      `INSERT INTO realtor_broadcast_recipients
         (broadcast_id, tenant_id, recipient_name, recipient_phone, sms_status, unsubscribe_token)
       VALUES (?, ?, 'One', '+15551234001', 'pending', ?)`,
      [draftBroadcastId, TENANT_ID, crypto.randomUUID()],
    );

    const mediaUrl = `https://portal.encoremortgage.org/api/link-assets/public/${durableAssetId || "00000000-0000-0000-0000-000000000001"}`;
    const patch = await request(app)
      .patch(`/api/realtor-broadcasts/${draftBroadcastId}`)
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({
        media_url: mediaUrl,
        media_content_type: "image/png",
        media_filename: `${RUN_ID}-mms.png`,
        short_link_code: createdCode || null,
      });
    expect(patch.status).toBe(200);
    expect(patch.body.success).toBe(true);

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT media_url, media_content_type, media_filename, short_link_code, status, sms_engine
       FROM realtor_broadcasts WHERE id = ? LIMIT 1`,
      [draftBroadcastId],
    );
    expect(rows[0]?.status).toBe("draft");
    expect(String(rows[0]?.media_url)).toBe(mediaUrl);
    expect(String(rows[0]?.media_content_type)).toBe("image/png");
    expect(String(rows[0]?.sms_engine)).toBe("messages");
    if (createdCode) {
      expect(String(rows[0]?.short_link_code)).toBe(createdCode);
    }
  });

  it("PATCH draft with media + 51 SMS recipients → 400", async () => {
    const [ins] = await pool.query<ResultSetHeader>(
      `INSERT INTO realtor_broadcasts
         (tenant_id, created_by, title, channel, body_sms, audience_filter,
          recipient_count, status, sms_engine)
       VALUES (?, ?, ?, 'sms', ?, ?, ?, 'draft', 'messages')`,
      [
        TENANT_ID,
        ownerId,
        `MMS over cap ${RUN_ID}`,
        "Over cap body",
        JSON.stringify({ segments: ["all_active_realtors"] }),
        BROADCAST_MMS_MAX_RECIPIENTS + 1,
      ],
    );
    overCapBroadcastId = ins.insertId;

    const placeholders: string[] = [];
    const values: unknown[] = [];
    for (let i = 0; i < BROADCAST_MMS_MAX_RECIPIENTS + 1; i++) {
      placeholders.push("(?, ?, ?, ?, 'pending', ?)");
      values.push(
        overCapBroadcastId,
        TENANT_ID,
        `Cap${i}`,
        `+1555${String(1000000 + i).slice(0, 7)}`,
        crypto.randomUUID(),
      );
    }
    await pool.query(
      `INSERT INTO realtor_broadcast_recipients
         (broadcast_id, tenant_id, recipient_name, recipient_phone, sms_status, unsubscribe_token)
       VALUES ${placeholders.join(",")}`,
      values,
    );

    const mediaUrl =
      durableAssetId
        ? `https://portal.encoremortgage.org/api/link-assets/public/${durableAssetId}`
        : "https://portal.encoremortgage.org/api/link-assets/public/00000000-0000-0000-0000-000000000099";

    const res = await request(app)
      .patch(`/api/realtor-broadcasts/${overCapBroadcastId}`)
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({
        media_url: mediaUrl,
        media_content_type: "image/png",
        media_filename: "overcap.png",
      });
    expect(res.status).toBe(400);
    expect(String(res.body.error || "")).toMatch(/MMS broadcast is limited/i);
  });

  it("Bulk engine is skipped when media is set", () => {
    expect(
      shouldSkipBulkForBroadcastMedia(
        "https://portal.encoremortgage.org/api/link-assets/public/x",
      ),
    ).toBe(true);
    expect(
      shouldUseBulkFromBulk({
        engineSetting: "bulk",
        channel: "sms",
        smsRecipientCount: 500,
        hasMedia: true,
      }),
    ).toBe(false);
  });
});
