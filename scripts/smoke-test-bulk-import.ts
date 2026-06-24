/**
 * Bulk CSV import smoke tests (BI-xxx).
 * Unit-only: SMOKE_UNIT_ONLY=1 npm run validate:bulk-import
 */
import "dotenv/config";
import mysql, { type RowDataPacket } from "mysql2/promise";
import {
  BULK_LEAD_SOURCES,
  BULK_PARTNER_TYPES,
  buildClientTemplateCsv,
  buildRealtorTemplateCsv,
  isBulkCsvImportEnabled,
  resolveBulkCsvImportEnabled,
  parseAndValidateBulkCsv,
} from "../shared/bulk-import.js";

const UNIT_ONLY = process.env.SMOKE_UNIT_ONLY === "1";
const TENANT_ID = Number(process.env.MORTGAGE_TENANT_ID ?? "1");

interface CaseResult {
  id: string;
  pass: boolean;
  detail?: string;
}

const cases: CaseResult[] = [];

function pass(id: string, detail?: string) {
  cases.push({ id, pass: true, detail });
}

function fail(id: string, detail?: string) {
  cases.push({ id, pass: false, detail });
}

function assert(id: string, cond: boolean, detail?: string) {
  if (cond) pass(id, detail);
  else fail(id, detail ?? "assertion failed");
}

// ─── Unit tests (no DB) ─────────────────────────────────────────────────────

assert("BI-005-unit", isBulkCsvImportEnabled("1") === true);
assert("BI-005-off", isBulkCsvImportEnabled("0") === false);
assert(
  "BI-005-prod-default",
  resolveBulkCsvImportEnabled({
    VERCEL_ENV: "production",
    NODE_ENV: "production",
  }) === false,
);
assert(
  "BI-005-prod-enabled",
  resolveBulkCsvImportEnabled({
    VERCEL_ENV: "production",
    BULK_CSV_IMPORT_ENABLED: "1",
  }) === true,
);
assert(
  "BI-005-prod-allow",
  resolveBulkCsvImportEnabled({
    VERCEL_ENV: "production",
    BULK_CSV_IMPORT_ALLOW_PRODUCTION: "1",
  }) === true,
);

const clientTemplate = buildClientTemplateCsv();
assert(
  "BI-006",
  clientTemplate.includes("lead_source") && clientTemplate.includes("first_name"),
);

const realtorTemplate = buildRealtorTemplateCsv();
assert(
  "BI-006b",
  realtorTemplate.includes("partner_type") && realtorTemplate.includes("email"),
);

assert("BI-011", !parseAndValidateBulkCsv("", "clients").success, "EMPTY_FILE");
assert(
  "BI-012",
  !parseAndValidateBulkCsv("first_name,last_name,lead_source\n", "clients").success,
  "NO_DATA_ROWS",
);

const badLead = `first_name,last_name,lead_source
A,B,public_wizard`;
const badLeadRes = parseAndValidateBulkCsv(badLead, "clients");
assert(
  "BI-020",
  badLeadRes.success === true && (badLeadRes.error_count ?? 0) >= 1,
  "public_wizard rejected",
);

const missingLead = `first_name,last_name,lead_source
A,B,`;
const missingLeadRes = parseAndValidateBulkCsv(missingLead, "clients");
assert(
  "BI-021",
  missingLeadRes.success === true && (missingLeadRes.error_count ?? 0) >= 1,
  "missing lead_source",
);

const validClient = `first_name,last_name,lead_source,email
Smoke,Import,past_client,smoke-bi-${Date.now()}@bulk-import-smoke.local`;
const validClientRes = parseAndValidateBulkCsv(validClient, "clients");
assert(
  "BI-030",
  validClientRes.success === true && validClientRes.will_create_count === 1,
);

const badPartner = `first_name,last_name,email,partner_type
A,B,bad@example.com,platform_owner`;
const badPartnerRes = parseAndValidateBulkCsv(badPartner, "realtors");
assert(
  "BI-080",
  badPartnerRes.success === true && (badPartnerRes.error_count ?? 0) >= 1,
);

const validRealtor = `first_name,last_name,email,partner_type
Jane,Agent,jane-${Date.now()}@bulk-import-smoke.local,realtor`;
const validRealtorRes = parseAndValidateBulkCsv(validRealtor, "realtors");
assert(
  "BI-071",
  validRealtorRes.success === true && validRealtorRes.will_create_count === 1,
);

assert(
  "BI-enum-clients",
  BULK_LEAD_SOURCES.length === 9 && !BULK_LEAD_SOURCES.includes("public_wizard" as never),
);
assert("BI-enum-realtors", BULK_PARTNER_TYPES.length === 2);

const passwordCol = `first_name,last_name,lead_source,password
A,B,realtor,secret`;
const passwordRes = parseAndValidateBulkCsv(passwordCol, "clients");
assert(
  "BI-015",
  !passwordRes.success || (passwordRes.error_count ?? 0) >= 1,
  "forbidden password column",
);

// ─── Optional DB staging job insert (rollback) ──────────────────────────────

async function runDbSmoke() {
  if (UNIT_ONLY) return;

  const host = process.env.DB_HOST?.trim();
  const user = process.env.DB_USER?.trim();
  const password = process.env.DB_PASSWORD?.trim();
  const database = process.env.DB_NAME?.trim();
  const port = Number(process.env.DB_PORT ?? "4000");
  if (!host || !user || !password || !database) {
    fail("BI-db-skip", "Missing DB env — set SMOKE_UNIT_ONLY=1 to skip");
    return;
  }

  const conn = await mysql.createConnection({
    host,
    port,
    user,
    password,
    database,
    ssl: { rejectUnauthorized: true },
  });

  try {
    await conn.beginTransaction();

    const [tables] = await conn.query<RowDataPacket[]>(
      "SHOW TABLES LIKE 'bulk_import_jobs'",
    );
    assert("BI-db-table", tables.length === 1, "bulk_import_jobs exists");

    const [ins] = await conn.query(
      `INSERT INTO bulk_import_jobs
         (tenant_id, entity, uploaded_by_broker_id, file_name, file_sha256,
          status, preview_json, row_count, expires_at)
       VALUES (?, 'clients', 1, 'smoke.csv', ?, 'validated', '{}', 0, DATE_ADD(NOW(), INTERVAL 1 HOUR))`,
      [TENANT_ID, "a".repeat(64)],
    );
    const jobId = (ins as { insertId: number }).insertId;
    assert("BI-db-insert", jobId > 0, `job ${jobId}`);

    await conn.rollback();
    pass("BI-db-rollback", "transaction rolled back");
  } finally {
    await conn.end();
  }
}

await runDbSmoke();

const failed = cases.filter((c) => !c.pass);
console.log(`\nBulk import smoke: ${cases.length - failed.length}/${cases.length} passed`);
for (const c of cases) {
  const mark = c.pass ? "✓" : "✗";
  console.log(`  ${mark} ${c.id}${c.detail ? ` — ${c.detail}` : ""}`);
}

if (failed.length > 0) {
  process.exit(1);
}
