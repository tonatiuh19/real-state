/**
 * CRM + documents edge cases for all brokers (not Daniel-specific).
 * Cross-owner email/phone uniqueness, realtor per-owner uniqueness,
 * template multi-slot fields, labeled download helpers, zip cap.
 *
 * Safe: runs in a transaction that is always ROLLED BACK.
 * Usage: npx tsx scripts/smoke-test-crm-docs-edge.ts
 */
import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mysql, {
  type Connection,
  type ResultSetHeader,
  type RowDataPacket,
} from "mysql2/promise";
import {
  normalizePhoneLast10,
  pickClientEmailMatch,
  resolveClientEmailConflictScope,
  resolvePerOwnerCrmFromEnv,
  resolveRealtorConflictScope,
} from "../shared/per-owner-crm.ts";
import {
  buildDocumentDownloadFilename,
  resolveDocumentDownloadLabel,
} from "../shared/document-labels.ts";

const TENANT_ID = Number(process.env.MORTGAGE_TENANT_ID ?? "1");
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const runId = `crmdocs_${Date.now()}`;

interface CaseResult {
  name: string;
  pass: boolean;
  detail?: string;
}

const cases: CaseResult[] = [];
const pass = (n: string, d?: string) =>
  cases.push({ name: n, pass: true, detail: d });
const fail = (n: string, d?: string) =>
  cases.push({ name: n, pass: false, detail: d });

function requireEnv(name: string): string {
  const v = process.env[name]?.trim();
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

async function runTests(conn: Connection) {
  const activeFlags = resolvePerOwnerCrmFromEnv({
    enabled: "1",
    runtime: "production",
    brokerId: 3,
  });

  // ── Pure helpers (all brokers) ──
  if (resolveClientEmailConflictScope(activeFlags, 3) === "per_owner") {
    pass("email-scope: per_owner when CRM active + assigned broker");
  } else fail("email-scope: expected per_owner");

  if (
    resolveRealtorConflictScope(activeFlags, {
      role: "broker",
      createdByBrokerId: 3,
    }) === "per_owner"
  ) {
    pass("realtor-scope: per_owner for partner realtor under owning MB");
  } else fail("realtor-scope: expected per_owner");

  const emailPick = pickClientEmailMatch(
    [
      { id: 1, assigned_broker_id: 3 },
      { id: 2, assigned_broker_id: 9 },
    ],
    9,
  );
  if (emailPick.clientId === 2 && !emailPick.ambiguous) {
    pass("email-resolve: prefers owning broker row");
  } else fail("email-resolve: owner preference", JSON.stringify(emailPick));

  const ambiguous = pickClientEmailMatch(
    [
      { id: 1, assigned_broker_id: 3 },
      { id: 2, assigned_broker_id: 9 },
    ],
    null,
  );
  if (ambiguous.ambiguous && ambiguous.clientId == null) {
    pass("email-resolve: ambiguous when no owner and multiple rows");
  } else fail("email-resolve: ambiguity", JSON.stringify(ambiguous));

  const idLabel = resolveDocumentDownloadLabel({
    taskTitle: "Government-Issued ID",
    fieldName: "spouse_id",
    fieldLabel: "Spouse / Co-borrower ID",
  });
  if (idLabel === "ID") {
    pass("labels: spouse_id maps to ID download label");
  } else fail("labels: spouse_id", idLabel);

  const bankName = buildDocumentDownloadFilename({
    applicationNumber: "LA123",
    label: "Bank_Statement",
    fieldName: "bank_statement_month_2",
    fieldLabel: "Bank Statement – Month 2",
    extension: "pdf",
  });
  if (
    bankName.includes("LA123") &&
    bankName.includes("Month2") &&
    bankName.endsWith(".pdf")
  ) {
    pass("labels: bank month filename includes loan # + Month2", bankName);
  } else fail("labels: bank filename", bankName);

  // ── Seed two MBs ──
  const [mbA] = await conn.query<ResultSetHeader>(
    `INSERT INTO brokers
       (tenant_id, email, first_name, last_name, phone, normalized_phone, role, status, public_token)
     VALUES (?, ?, 'Edge', 'MBA', NULL, NULL, 'admin', 'active', ?)`,
    [TENANT_ID, `${runId}_mba@smoke.local`, cryptoRandom()],
  );
  const [mbB] = await conn.query<ResultSetHeader>(
    `INSERT INTO brokers
       (tenant_id, email, first_name, last_name, phone, normalized_phone, role, status, public_token)
     VALUES (?, ?, 'Edge', 'MBB', NULL, NULL, 'admin', 'active', ?)`,
    [TENANT_ID, `${runId}_mbb@smoke.local`, cryptoRandom()],
  );
  const brokerA = mbA.insertId;
  const brokerB = mbB.insertId;

  const sharedEmail = `${runId}_client@smoke.local`;
  const sharedPhone = "5625550199";
  const phoneNorm = normalizePhoneLast10(sharedPhone);

  // Cross-owner same email allowed
  await conn.query(
    `INSERT INTO clients
       (tenant_id, email, first_name, last_name, phone, normalized_phone,
        assigned_broker_id, source, list_visibility, status)
     VALUES (?, ?, 'Edge', 'ClientA', ?, ?, ?, 'smoke', 'active', 'active')`,
    [TENANT_ID, sharedEmail, sharedPhone, phoneNorm, brokerA],
  );
  try {
    await conn.query(
      `INSERT INTO clients
         (tenant_id, email, first_name, last_name, phone, normalized_phone,
          assigned_broker_id, source, list_visibility, status)
       VALUES (?, ?, 'Edge', 'ClientB', ?, ?, ?, 'smoke', 'active', 'active')`,
      [TENANT_ID, sharedEmail, "5625550188", "5625550188", brokerB],
    );
    pass("db: cross-owner same email INSERT allowed (5A)");
  } catch (e: any) {
    fail("db: cross-owner same email should be allowed", String(e?.message ?? e));
  }

  // Same-owner email rejected
  try {
    await conn.query(
      `INSERT INTO clients
         (tenant_id, email, first_name, last_name, phone, normalized_phone,
          assigned_broker_id, source, list_visibility, status)
       VALUES (?, ?, 'Edge', 'DupA', '5625550177', '5625550177', ?, 'smoke', 'active', 'active')`,
      [TENANT_ID, sharedEmail, brokerA],
    );
    fail("db: same-owner duplicate email should be rejected");
  } catch {
    pass("db: same-owner duplicate email rejected by UNIQUE");
  }

  // Realtor uniqueness per created_by_broker_id
  const realtorEmail = `${runId}_realtor@smoke.local`;
  const realtorPhone = "5625550166";
  const realtorNorm = normalizePhoneLast10(realtorPhone);
  await conn.query(
    `INSERT INTO brokers
       (tenant_id, email, first_name, last_name, phone, normalized_phone,
        role, status, public_token, created_by_broker_id)
     VALUES (?, ?, 'Edge', 'RealtorA', ?, ?, 'broker', 'active', ?, ?)`,
    [
      TENANT_ID,
      realtorEmail,
      realtorPhone,
      realtorNorm,
      cryptoRandom(),
      brokerA,
    ],
  );
  try {
    await conn.query(
      `INSERT INTO brokers
         (tenant_id, email, first_name, last_name, phone, normalized_phone,
          role, status, public_token, created_by_broker_id)
       VALUES (?, ?, 'Edge', 'RealtorB', ?, ?, 'broker', 'active', ?, ?)`,
      [
        TENANT_ID,
        realtorEmail,
        realtorPhone,
        realtorNorm,
        cryptoRandom(),
        brokerB,
      ],
    );
    pass("db: cross-owner same realtor email+phone allowed (6D)");
  } catch (e: any) {
    fail(
      "db: cross-owner realtor should be allowed",
      String(e?.message ?? e),
    );
  }
  try {
    await conn.query(
      `INSERT INTO brokers
         (tenant_id, email, first_name, last_name, phone, normalized_phone,
          role, status, public_token, created_by_broker_id)
       VALUES (?, ?, 'Edge', 'RealtorDup', ?, ?, 'broker', 'active', ?, ?)`,
      [
        TENANT_ID,
        realtorEmail,
        "5625550155",
        "5625550155",
        cryptoRandom(),
        brokerA,
      ],
    );
    fail("db: same-owner realtor email dup should be rejected");
  } catch {
    pass("db: same-owner realtor email rejected by UNIQUE");
  }

  // Template multi-slots live in DB (everyone’s loans)
  const [idFields] = await conn.query<RowDataPacket[]>(
    `SELECT field_name, is_required FROM task_form_fields
     WHERE task_template_id = 34 AND field_name IN ('borrower_id','spouse_id','document_upload')
     ORDER BY field_name`,
  );
  const idNames = new Set(idFields.map((r) => String(r.field_name)));
  if (idNames.has("spouse_id")) {
    pass("templates: ID has spouse_id optional slot");
  } else {
    fail("templates: missing spouse_id on template 34", [...idNames].join(","));
  }
  const spouse = idFields.find((r) => r.field_name === "spouse_id");
  if (spouse && Number(spouse.is_required) === 0) {
    pass("templates: spouse_id is optional");
  } else if (spouse) {
    fail("templates: spouse_id should be optional");
  }

  const [bankFields] = await conn.query<RowDataPacket[]>(
    `SELECT field_name, is_required FROM task_form_fields
     WHERE task_template_id = 58
       AND field_name IN ('bank_statement_month_1','bank_statement_month_2','document_upload')
     ORDER BY field_name`,
  );
  const bankNames = bankFields.map((r) => String(r.field_name));
  if (
    bankNames.includes("bank_statement_month_1") &&
    bankNames.includes("bank_statement_month_2")
  ) {
    pass("templates: bank Month 1+2 slots on template 58");
  } else {
    fail("templates: bank month slots", bankNames.join(","));
  }
  const requiredBank = bankFields.filter((r) => Number(r.is_required) === 1);
  if (requiredBank.length >= 2) {
    pass("templates: both bank months are required");
  } else {
    fail(
      "templates: bank months should both be required",
      String(requiredBank.length),
    );
  }

  // Zip cap + completion guards present in API source
  const apiSrc = fs.readFileSync(path.join(ROOT, "api/index.ts"), "utf8");
  if (apiSrc.includes("ids.length > 100") || apiSrc.includes("Maximum 100 documents")) {
    pass("api: bulk zip cap is 100 documents");
  } else {
    fail("api: missing 100-doc zip cap");
  }
  if (apiSrc.includes("resolveClientByEmailSafe")) {
    pass("api: resolveClientByEmailSafe present for portal/wizard/email");
  } else {
    fail("api: missing resolveClientByEmailSafe");
  }
  if (
    apiSrc.includes("missingRequired") &&
    apiSrc.includes("is_required = 1")
  ) {
    pass("api: completion requires all is_required file fields");
  } else {
    fail("api: completion multi-field guard missing");
  }
  if (
    apiSrc.includes("https://disruptinglabs.com/data/api") &&
    apiSrc.includes("prepareDocumentDownloadBytes") &&
    apiSrc.includes("jpegToSinglePagePdf") &&
    apiSrc.includes("pngToSinglePagePdf")
  ) {
    pass("api: CDN /data/api + JPEG→PDF download helpers present");
  } else {
    fail("api: missing CDN or JPEG→PDF download helpers");
  }
  if (
    apiSrc.includes("deleted+") &&
    apiSrc.includes("findInactiveBrokerEmailForReactivate")
  ) {
    pass("api: soft-delete frees email + inactive realtor reactivate path");
  } else {
    fail("api: missing realtor soft-delete free/reactivate helpers");
  }
}

function cryptoRandom(): string {
  return `${runId}_${Math.random().toString(36).slice(2, 12)}`;
}

async function main() {
  const conn = await mysql.createConnection({
    host: requireEnv("DB_HOST"),
    port: Number(process.env.DB_PORT ?? "3306"),
    user: requireEnv("DB_USER"),
    password: requireEnv("DB_PASSWORD"),
    database: requireEnv("DB_NAME"),
    ssl: { rejectUnauthorized: true },
  });

  try {
    await conn.beginTransaction();
    await runTests(conn);
    await conn.rollback();
    console.log("\n=== CRM + Documents Edge Smoke (all brokers) ===\n");
    let failed = 0;
    for (const c of cases) {
      console.log(
        `${c.pass ? "✅" : "❌"} ${c.name}${c.detail ? ` — ${c.detail}` : ""}`,
      );
      if (!c.pass) failed++;
    }
    console.log(
      `\n${cases.length - failed}/${cases.length} passed (transaction rolled back)\n`,
    );
    if (failed > 0) process.exit(1);
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    await conn.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
