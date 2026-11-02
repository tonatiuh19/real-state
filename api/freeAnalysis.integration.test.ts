/**
 * HTTP integration — public Free Analysis share link + new-lead path.
 * Requires credit_analyses migration applied.
 */
import "dotenv/config";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import type { Pool, ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { createServer } from "./index";
import {
  cleanupIntegrationTestFixtures,
  createIntegrationTestPool,
  uniqueTestE164,
} from "./testDbCleanup";

const RUN_ID = `http-fa-${Date.now()}`;
const TENANT_ID = 1;

/** Minimal valid-ish PDF bytes (pdf-parse may yield empty text → weak extraction still persists). */
function minimalPdfBuffer(): Buffer {
  const body = `%PDF-1.4
1 0 obj<< /Type /Catalog /Pages 2 0 R >>endobj
2 0 obj<< /Type /Pages /Kids [3 0 R] /Count 1 >>endobj
3 0 obj<< /Type /Page /Parent 2 0 R /MediaBox [0 0 200 200] >>endobj
xref
0 4
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
trailer<< /Size 4 /Root 1 0 R >>
startxref
190
%%EOF`;
  return Buffer.from(body, "utf8");
}

function cryptoRandom(): string {
  return `${Date.now().toString(16)}-${Math.random().toString(16).slice(2)}`;
}

describe("public Free Analysis HTTP (/api/apply/free-analysis)", () => {
  let pool: Pool;
  let app: ReturnType<typeof createServer>;
  let brokerId = 0;
  let brokerSlug = "";
  const clientIds: number[] = [];
  const brokerIds: number[] = [];
  let tableReady = false;

  beforeAll(async () => {
    if (!process.env.DB_HOST || !process.env.JWT_SECRET) {
      throw new Error("DB_HOST and JWT_SECRET required");
    }
    pool = createIntegrationTestPool();
    app = createServer();

    const [tables] = await pool.query<RowDataPacket[]>(
      `SHOW TABLES LIKE 'credit_analyses'`,
    );
    tableReady = tables.length > 0;
    if (!tableReady) {
      console.warn(
        "[free-analysis integration] credit_analyses missing — skip live cases (run migration)",
      );
      return;
    }

    brokerSlug = `fa-${RUN_ID.slice(-8)}`.toLowerCase().replace(/[^a-z0-9-]/g, "");
    const phone = uniqueTestE164(`${RUN_ID}-broker`);
    const [ins] = await pool.query<ResultSetHeader>(
      `INSERT INTO brokers
         (tenant_id, email, first_name, last_name, phone, normalized_phone,
          role, status, public_token, slug)
       VALUES (?, ?, 'Fa', 'Broker', ?, ?, 'admin', 'active', ?, ?)`,
      [
        TENANT_ID,
        `${RUN_ID}-broker@example.test`,
        phone,
        phone.replace(/\D/g, "").slice(-10),
        cryptoRandom(),
        brokerSlug,
      ],
    );
    brokerId = ins.insertId;
    brokerIds.push(brokerId);
  }, 90_000);

  afterAll(async () => {
    if (pool) {
      await cleanupIntegrationTestFixtures(pool, {
        runId: RUN_ID,
        clientIds,
        brokerIds,
      });
      await pool.end();
    }
  });

  it("rejects invalid broker token with 404", async () => {
    if (!tableReady) return;
    const res = await request(app)
      .post("/api/apply/free-analysis")
      .field("broker_token", "does-not-exist-fa-token")
      .field("first_name", "Test")
      .field("last_name", "Lead")
      .field("email", `${RUN_ID}-invalid@example.test`)
      .attach("pdf", minimalPdfBuffer(), {
        filename: "report.pdf",
        contentType: "application/pdf",
      });
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it("rejects missing pdf with 400", async () => {
    if (!tableReady) return;
    const res = await request(app)
      .post("/api/apply/free-analysis")
      .field("broker_token", brokerSlug)
      .field("first_name", "Test")
      .field("last_name", "Lead")
      .field("email", `${RUN_ID}-nopdf@example.test`);
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("creates new lead with source free_analysis, income_type, draft loan", async () => {
    if (!tableReady) return;
    const email = `${RUN_ID}-new@example.test`;
    const phone = uniqueTestE164(`${RUN_ID}-new`);
    const res = await request(app)
      .post("/api/apply/free-analysis")
      .field("broker_token", brokerSlug)
      .field("first_name", "New")
      .field("last_name", "Prospect")
      .field("email", email)
      .field("phone", phone)
      .field("language", "en")
      .attach("pdf", minimalPdfBuffer(), {
        filename: "report.pdf",
        contentType: "application/pdf",
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.is_new_lead).toBe(true);
    expect(res.body.client_id).toBeTruthy();
    expect(res.body.draft_id).toBeTruthy();
    expect(res.body.analysis?.id).toBeTruthy();
    clientIds.push(Number(res.body.client_id));

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT id, source, income_type, first_name, last_name, normalized_phone, assigned_broker_id
       FROM clients WHERE id = ?`,
      [res.body.client_id],
    );
    expect(rows[0]?.source).toBe("free_analysis");
    expect(rows[0]?.income_type).toBe("W-2");
    expect(rows[0]?.first_name).toBe("New");
    expect(rows[0]?.normalized_phone).toBe(phone.replace(/\D/g, "").slice(-10));
    expect(Number(rows[0]?.assigned_broker_id)).toBe(brokerId);

    const [loans] = await pool.query<RowDataPacket[]>(
      `SELECT id, status, notes FROM loan_applications WHERE id = ?`,
      [res.body.draft_id],
    );
    expect(loans[0]?.status).toBe("draft");
  }, 120_000);

  it("does not overwrite existing client name; no second draft when loan exists", async () => {
    if (!tableReady) return;
    const email = `${RUN_ID}-existing@example.test`;
    const phone = uniqueTestE164(`${RUN_ID}-ex`);
    const [ins] = await pool.query<ResultSetHeader>(
      `INSERT INTO clients
         (tenant_id, email, first_name, last_name, phone, normalized_phone,
          income_type, assigned_broker_id, status, email_verified, source)
       VALUES (?, ?, 'Keep', 'Name', ?, ?, 'W-2', ?, 'active', 0, 'broker_created')`,
      [
        TENANT_ID,
        email,
        phone,
        phone.replace(/\D/g, "").slice(-10),
        brokerId,
      ],
    );
    const existingId = ins.insertId;
    clientIds.push(existingId);

    const [loanIns] = await pool.query<ResultSetHeader>(
      `INSERT INTO loan_applications
         (tenant_id, application_number, client_user_id, broker_user_id,
          loan_type, loan_amount, status, current_step, total_steps, priority)
       VALUES (?, ?, ?, ?, 'purchase', 100000, 'draft', 1, 8, 'medium')`,
      [TENANT_ID, `LA${Date.now().toString().slice(-8)}`, existingId, brokerId],
    );

    const res = await request(app)
      .post("/api/apply/free-analysis")
      .field("broker_token", brokerSlug)
      .field("first_name", "Attacker")
      .field("last_name", "Overwrite")
      .field("email", email)
      .field("language", "en")
      .attach("pdf", minimalPdfBuffer(), {
        filename: "report.pdf",
        contentType: "application/pdf",
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.client_id).toBe(existingId);
    expect(res.body.is_new_lead).toBe(false);
    expect(res.body.draft_id == null).toBe(true);

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT first_name, last_name FROM clients WHERE id = ?`,
      [existingId],
    );
    expect(rows[0]?.first_name).toBe("Keep");
    expect(rows[0]?.last_name).toBe("Name");

    const [loanCount] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS n FROM loan_applications WHERE client_user_id = ?`,
      [existingId],
    );
    expect(Number(loanCount[0]?.n)).toBe(1);
    void loanIns;
  }, 120_000);

  it("creates draft for existing client with no loans", async () => {
    if (!tableReady) return;
    const email = `${RUN_ID}-noloan@example.test`;
    const [ins] = await pool.query<ResultSetHeader>(
      `INSERT INTO clients
         (tenant_id, email, first_name, last_name, income_type,
          assigned_broker_id, status, email_verified, source)
       VALUES (?, ?, 'No', 'Loan', 'W-2', ?, 'active', 0, 'broker_created')`,
      [TENANT_ID, email, brokerId],
    );
    const existingId = ins.insertId;
    clientIds.push(existingId);

    const res = await request(app)
      .post("/api/apply/free-analysis")
      .field("broker_token", brokerSlug)
      .field("first_name", "Ignored")
      .field("last_name", "Name")
      .field("email", email)
      .attach("pdf", minimalPdfBuffer(), {
        filename: "report.pdf",
        contentType: "application/pdf",
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.client_id).toBe(existingId);
    expect(res.body.is_new_lead).toBe(true);
    expect(res.body.draft_id).toBeTruthy();

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT first_name FROM clients WHERE id = ?`,
      [existingId],
    );
    expect(rows[0]?.first_name).toBe("No");
  }, 120_000);
});
