/**
 * Full per-owner CRM audit — flag gates, phone isolation, create-client paths, static API scan.
 * Usage: npx tsx scripts/smoke-test-per-owner-crm-audit.ts
 */
import "dotenv/config";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import mysql, {
  type Connection,
  type RowDataPacket,
  type ResultSetHeader,
} from "mysql2/promise";
import {
  resolvePerOwnerCrmFromEnv,
  resolvePerOwnerCrmActive,
  resolveClientPhoneConflictScope,
  normalizePhoneLast10,
} from "../shared/per-owner-crm.ts";

const TENANT_ID = Number(process.env.MORTGAGE_TENANT_ID ?? "1");
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

interface CaseResult {
  name: string;
  pass: boolean;
  detail?: string;
}

const cases: CaseResult[] = [];
const pass = (n: string, d?: string) => cases.push({ name: n, pass: true, detail: d });
const fail = (n: string, d?: string) => cases.push({ name: n, pass: false, detail: d });

function requireEnv(name: string): string {
  const v = process.env[name]?.trim();
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

function auditApiIndexStatic() {
  const apiPath = path.join(ROOT, "api/index.ts");
  const src = fs.readFileSync(apiPath, "utf8");

  if (src.includes('from "../shared/per-owner-crm')) {
    fail("static: api must not import shared/per-owner-crm");
  } else pass("static: no shared/per-owner-crm import in api");

  if (src.includes('from "../shared/api.js"')) {
    fail("static: api must not import shared/api.js (transitive per-owner-crm)");
  } else pass("static: no shared/api.js import in api");

  if (src.includes("inlined for Vercel serverless") && src.includes("resolvePerOwnerCrmFromEnv")) {
    pass("static: per-owner CRM helpers inlined in api/index.ts");
  } else fail("static: missing inlined per-owner CRM block");

  if (src.includes("buildClientPhoneConflictPayload")) {
    pass("static: phone conflict payload helper present");
  } else fail("static: missing buildClientPhoneConflictPayload");

  if (src.includes("inactive_reason")) {
    pass("static: CRM config exposes inactive_reason");
  } else fail("static: missing inactive_reason on CRM config");

  const sharedImports = src.match(/from "\.\.\/shared\/[^"]+"/g) ?? [];
  if (sharedImports.length === 0) {
    pass("static: no relative shared/ runtime imports in api");
  } else {
    fail(
      "static: unexpected shared/ imports in api",
      sharedImports.join(", "),
    );
  }
}

function auditFlagGates() {
  const prodEnabled = resolvePerOwnerCrmFromEnv({
    enabled: "1",
    runtime: "production",
    brokerId: 3,
  });
  if (prodEnabled.activeForBroker) {
    pass("flags: ENABLED alone in production → active (single flag)");
  } else fail("flags: prod single flag");

  const off = resolvePerOwnerCrmActive({ enabled: false });
  if (!off.activeForBroker) pass("flags: unset → inactive");

  const scopeLegacy = resolveClientPhoneConflictScope(off, 3);
  if (scopeLegacy === "tenant") {
    pass("flags: inactive CRM → tenant-wide phone conflicts");
  } else fail("flags: scope when inactive");

  const scopeActive = resolveClientPhoneConflictScope(prodEnabled, 3);
  if (scopeActive === "per_owner") {
    pass("flags: active CRM → per-owner phone conflicts");
  } else fail("flags: scope when active");
}

async function insertBroker(conn: Connection, email: string): Promise<number> {
  const [r] = await conn.query<ResultSetHeader>(
    `INSERT INTO brokers
       (tenant_id, email, first_name, last_name, role, status, email_verified, public_token)
     VALUES (?, ?, 'Audit', 'MB', 'admin', 'active', 0, UUID())`,
    [TENANT_ID, email],
  );
  return r.insertId;
}

async function runDbScenarios(conn: Connection) {
  const runId = Date.now();
  const phone = `909555${String(runId).slice(-4)}`;
  const norm = normalizePhoneLast10(phone);

  const mbA = await insertBroker(conn, `audit-a-${runId}@smoke.local`);
  const mbB = await insertBroker(conn, `audit-b-${runId}@smoke.local`);

  await conn.query(
    `INSERT INTO clients
       (tenant_id, email, first_name, last_name, phone, normalized_phone, assigned_broker_id, source, list_visibility)
     VALUES (?, ?, 'Hebert', 'Medina', ?, ?, ?, 'audit', 'active')`,
    [TENANT_ID, `audit-c-a-${runId}@smoke.local`, phone, norm, mbA],
  );

  // Tenant-wide conflict (legacy) — B should see A's row
  const [tenantWide] = await conn.query<RowDataPacket[]>(
    `SELECT id FROM clients WHERE tenant_id = ? AND normalized_phone = ? AND phone IS NOT NULL`,
    [TENANT_ID, norm],
  );
  if (tenantWide.length >= 1) pass("db: tenant-wide query finds cross-owner phone");

  // Per-owner scope — B should NOT see A's row
  const [perOwnerB] = await conn.query<RowDataPacket[]>(
    `SELECT id FROM clients
     WHERE tenant_id = ? AND normalized_phone = ? AND phone IS NOT NULL AND assigned_broker_id = ?`,
    [TENANT_ID, norm, mbB],
  );
  if (perOwnerB.length === 0) pass("db: per-owner scope hides other MB phone row");
  else fail("db: per-owner leak", String(perOwnerB.length));

  // Cross-owner INSERT (simulates POST /api/clients when CRM active)
  try {
    const [ins] = await conn.query<ResultSetHeader>(
      `INSERT INTO clients
         (tenant_id, email, first_name, last_name, phone, normalized_phone, assigned_broker_id, source, list_visibility)
       VALUES (?, ?, 'Hebert', 'Motne', ?, ?, ?, 'audit', 'active')`,
      [TENANT_ID, `audit-c-b-${runId}@smoke.local`, phone, norm, mbB],
    );
    if (ins.insertId) pass("db: cross-owner same phone INSERT allowed (per-owner UNIQUE)");
    else fail("db: cross-owner insert");
  } catch (e) {
    fail("db: cross-owner insert blocked at DB", String(e));
  }

  // Same-owner duplicate blocked
  let dupBlocked = false;
  try {
    await conn.query(
      `INSERT INTO clients
         (tenant_id, email, first_name, last_name, phone, normalized_phone, assigned_broker_id, source)
       VALUES (?, ?, 'X', 'Y', ?, ?, ?, 'audit')`,
      [TENANT_ID, `audit-dup-${runId}@smoke.local`, phone, norm, mbA],
    );
  } catch {
    dupBlocked = true;
  }
  if (dupBlocked) pass("db: same-owner duplicate phone rejected");
  else fail("db: same-owner dup should fail");

  const [count] = await conn.query<RowDataPacket[]>(
    `SELECT COUNT(*) AS c FROM clients WHERE tenant_id = ? AND normalized_phone = ?`,
    [TENANT_ID, norm],
  );
  if (Number(count[0]?.c) >= 2) {
    pass("db: two owner rows coexist for same normalized_phone", String(count[0]?.c));
  } else fail("db: expected 2 rows");
}

function auditEnvDeployment() {
  const enabled = process.env.PER_OWNER_CRM_ENABLED?.trim();
  if (!enabled) {
    pass("env-local: PER_OWNER_CRM_ENABLED unset (local legacy mode)");
  } else {
    pass("env-local: PER_OWNER_CRM_ENABLED is set", enabled);
    const flags = resolvePerOwnerCrmFromEnv({ enabled, brokerId: 1 });
    if (flags.activeForBroker) {
      pass("env-local: ENABLED resolves to activeForBroker=true");
    } else fail("env-local: ENABLED should be active");
  }
}

async function main() {
  console.log("\n=== Per-Owner CRM Full Audit ===\n");

  auditApiIndexStatic();
  auditFlagGates();
  auditEnvDeployment();

  const conn = await mysql.createConnection({
    host: requireEnv("DB_HOST"),
    port: Number(requireEnv("DB_PORT")),
    user: requireEnv("DB_USER"),
    password: requireEnv("DB_PASSWORD"),
    database: requireEnv("DB_NAME"),
    ssl: { rejectUnauthorized: true },
  });

  try {
    await conn.beginTransaction();
    await runDbScenarios(conn);
    await conn.rollback();
  } finally {
    await conn.end();
  }

  const failed = cases.filter((c) => !c.pass);
  for (const c of cases) {
    console.log(`${c.pass ? "✓" : "✗"} ${c.name}${c.detail ? ` — ${c.detail}` : ""}`);
  }
  console.log(`\n${cases.length - failed.length}/${cases.length} passed (DB rolled back)`);

  if (failed.length) {
    console.log("\n--- Action items ---");
    for (const f of failed) {
      console.log(`• ${f.name}${f.detail ? `: ${f.detail}` : ""}`);
    }
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
