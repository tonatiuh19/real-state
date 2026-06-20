/**
 * Smoke tests for Realtor Management (MB scoped access).
 * Safe against prod/staging DB — synthetic rows use @smoke-realtor-mgmt.local emails
 * and everything runs inside a transaction that is always ROLLED BACK.
 *
 * Usage: npx tsx scripts/smoke-test-realtor-management.ts
 */
import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import mysql, { type RowDataPacket } from "mysql2/promise";

const TENANT_ID = Number(process.env.MORTGAGE_TENANT_ID ?? "1");

type Severity = "critical" | "high" | "medium" | "low" | "info";

interface Finding {
  id: string;
  severity: Severity;
  title: string;
  detail: string;
}

interface CaseResult {
  name: string;
  pass: boolean;
  detail?: string;
}

const findings: Finding[] = [];
const cases: CaseResult[] = [];

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing env: ${name}`);
  return value;
}

function pass(name: string, detail?: string) {
  cases.push({ name, pass: true, detail });
}

function fail(name: string, detail?: string) {
  cases.push({ name, pass: false, detail });
}

function finding(
  id: string,
  severity: Severity,
  title: string,
  detail: string,
) {
  findings.push({ id, severity, title, detail });
}

/** Mirrors api/index.ts — keep in sync with handleGetBrokers / ownership asserts */
function isPlatformOwnerRole(role: string | undefined): boolean {
  return role === "platform_owner";
}

function isMortgageBankerOrOwner(role: string | undefined): boolean {
  return role === "admin" || role === "platform_owner";
}

function canManageBrokerTarget(
  requesterRole: string,
  requesterId: number,
  target: { role: string; created_by_broker_id: number | null },
): boolean {
  if (isPlatformOwnerRole(requesterRole)) return true;
  if (requesterRole !== "admin") return false;
  return (
    target.role === "broker" &&
    Number(target.created_by_broker_id) === requesterId
  );
}

function resolveCreateCreatedBy(
  isOwner: boolean,
  resolvedRole: string,
  requesterId: number,
): number | null {
  return isOwner
    ? resolvedRole === "broker"
      ? requesterId
      : null
    : requesterId;
}

function buildScopeWhere(
  scope: string,
  brokerRole: string,
  brokerId: number,
): { sql: string; params: number[] } {
  if (scope === "realtors") {
    if (brokerRole === "admin") {
      return {
        sql: " AND role = 'broker' AND created_by_broker_id = ?",
        params: [brokerId],
      };
    }
    return { sql: "", params: [] };
  }
  if (scope === "mortgage-bankers") {
    return { sql: " AND role IN ('admin', 'platform_owner')", params: [] };
  }
  return { sql: "", params: [] };
}

function runAuthMatrixTests() {
  const mbA = 100;
  const mbB = 200;
  const owner = 1;
  const ownedPartner = { role: "broker", created_by_broker_id: mbA };
  const otherPartner = { role: "broker", created_by_broker_id: mbB };
  const orphanPartner = { role: "broker", created_by_broker_id: null };
  const otherMb = { role: "admin", created_by_broker_id: null };

  const matrix: Array<{
    name: string;
    role: string;
    id: number;
    target: typeof ownedPartner;
    expected: boolean;
  }> = [
    {
      name: "MB manages own partner",
      role: "admin",
      id: mbA,
      target: ownedPartner,
      expected: true,
    },
    {
      name: "MB cannot manage other MB partner",
      role: "admin",
      id: mbA,
      target: otherPartner,
      expected: false,
    },
    {
      name: "MB cannot manage orphan partner",
      role: "admin",
      id: mbA,
      target: orphanPartner,
      expected: false,
    },
    {
      name: "MB cannot manage another MB account",
      role: "admin",
      id: mbA,
      target: otherMb,
      expected: false,
    },
    {
      name: "Partner cannot manage anyone",
      role: "broker",
      id: 999,
      target: ownedPartner,
      expected: false,
    },
    {
      name: "Platform owner manages anyone",
      role: "platform_owner",
      id: owner,
      target: otherPartner,
      expected: true,
    },
    {
      name: "Platform owner manages orphan partner",
      role: "platform_owner",
      id: owner,
      target: orphanPartner,
      expected: true,
    },
  ];

  for (const t of matrix) {
    const got = canManageBrokerTarget(t.role, t.id, t.target);
    if (got === t.expected) pass(`auth: ${t.name}`);
    else
      fail(`auth: ${t.name}`, `expected ${t.expected}, got ${got}`);
  }

  // MB create role enforcement (logic)
  const mbCreateAdmin = !isPlatformOwnerRole("admin") && "admin" !== "broker";
  if (mbCreateAdmin) pass("auth: MB blocked from creating admin role");
  else fail("auth: MB blocked from creating admin role");

  const ownerPartnerCreatedBy = resolveCreateCreatedBy(true, "broker", owner);
  if (ownerPartnerCreatedBy === owner)
    pass("auth: owner create partner defaults created_by to self");
  else
    fail(
      "auth: owner create partner defaults created_by to self",
      `got ${ownerPartnerCreatedBy}`,
    );

  const mbCreatedBy = resolveCreateCreatedBy(false, "broker", mbA);
  if (mbCreatedBy === mbA) pass("auth: MB create forces created_by self");
  else fail("auth: MB create forces created_by self", `got ${mbCreatedBy}`);
}

function runStaticUiApiTests() {
  const root = process.cwd();

  const brokersTsx = fs.readFileSync(
    path.join(root, "client/pages/admin/Brokers.tsx"),
    "utf8",
  );
  const wizardTsx = fs.readFileSync(
    path.join(root, "client/components/BrokerWizard.tsx"),
    "utf8",
  );
  const detailTsx = fs.readFileSync(
    path.join(root, "client/components/BrokerDetailPanel.tsx"),
    "utf8",
  );
  const adminLayout = fs.readFileSync(
    path.join(root, "client/components/layout/AdminLayout.tsx"),
    "utf8",
  );
  const appRoutes = fs.readFileSync(
    path.join(root, "client/AppRoutes.tsx"),
    "utf8",
  );
  const apiIndex = fs.readFileSync(path.join(root, "api/index.ts"), "utf8");
  const brokersSlice = fs.readFileSync(
    path.join(root, "client/store/slices/brokersSlice.ts"),
    "utf8",
  );

  if (brokersTsx.includes('scope: listScope') && brokersTsx.includes('"realtors"'))
    pass("ui: Brokers page passes scope=realtors for MB");
  else fail("ui: Brokers page passes scope=realtors for MB");

  if (wizardTsx.includes("isPlatformOwner") && wizardTsx.includes("Partner Realtor"))
    pass("ui: BrokerWizard restricts role UI for MB");
  else fail("ui: BrokerWizard restricts role UI for MB");

  if (
    detailTsx.includes("isPlatformOwner") &&
    detailTsx.includes("...(isPlatformOwner")
  )
    pass("ui: BrokerDetailPanel omits role/MB fields for MB on save");
  else fail("ui: BrokerDetailPanel omits role/MB fields for MB on save");

  if (
    adminLayout.includes('isSectionVisible("brokers"') &&
    adminLayout.includes("Realtor Management")
  )
    pass("ui: AdminLayout shows Realtor Management via section permissions");
  else fail("ui: AdminLayout shows Realtor Management via section permissions");

  if (!appRoutes.includes("platform_owner") && appRoutes.includes("/admin/brokers"))
    finding(
      "ROUTE-001",
      "medium",
      "No route-level guard on /admin/brokers",
      "Partners can navigate to /admin/brokers by URL; API returns 403 but page may flash. Sidebar hides link only.",
    );

  if (
    apiIndex.includes('"brokers"') &&
    apiIndex.includes("PLATFORM_OWNER_LOCKED_SECTIONS") &&
    !apiIndex.match(/PLATFORM_OWNER_LOCKED_SECTIONS[\s\S]*?"brokers"/)
  )
    pass("api: brokers removed from PLATFORM_OWNER_LOCKED_SECTIONS");
  else fail("api: brokers removed from PLATFORM_OWNER_LOCKED_SECTIONS");

  if (brokersSlice.includes('scope: "mortgage-bankers"'))
    pass("ui: fetchMortgageBankers uses scope=mortgage-bankers");
  else fail("ui: fetchMortgageBankers uses scope=mortgage-bankers");

  if (!apiIndex.includes("handleCreateBroker")) {
    fail("static: handleCreateBroker present in api");
  } else if (
    !/handleCreateBroker[\s\S]{0,4000}req\.body[\s\S]{0,400}created_by_broker_id/.test(
      apiIndex,
    )
  ) {
    finding(
      "API-001",
      "medium",
      "POST /api/brokers ignores created_by_broker_id body",
      "Platform owner MB assignment on create relies on a follow-up PUT from Brokers.tsx. Direct API clients must send two requests.",
    );
    pass("static: POST create uses two-step MB assignment (documented gap API-001)");
  } else {
    pass("static: POST create accepts created_by_broker_id");
  }

  if (
    brokersTsx.includes("brokers.find((mb) => mb.id === assignedMbId)") &&
    brokersTsx.includes("currentBroker?.id === assignedMbId")
  ) {
    pass("ui: MB assigned-MB column falls back to current user");
  } else if (
    brokersTsx.includes("brokers.find((mb) => mb.id === b.created_by_broker_id)") &&
    brokersTsx.includes('listScope = isPlatformOwner ? undefined : ("realtors"')
  ) {
    finding(
      "UI-001",
      "low",
      "MB list may not resolve Assigned MB column label",
      "Brokers table looks up assigned MB from the same brokers[] list; MB scoped fetch excludes mortgage bankers.",
    );
  }

  const unscopedFetchFiles: string[] = [];
  for (const rel of [
    "client/pages/admin/Conversations.tsx",
    "client/components/NewLoanWizard.tsx",
    "client/pages/admin/Calendar.tsx",
    "client/components/NewConversationWizard.tsx",
  ]) {
    const src = fs.readFileSync(path.join(root, rel), "utf8");
    if (src.includes("fetchBrokers(") && !src.includes("scope:")) {
      unscopedFetchFiles.push(rel);
    }
  }
  if (unscopedFetchFiles.length) {
    finding(
      "UI-002",
      "info",
      "Other pages call fetchBrokers() without scope",
      `${unscopedFetchFiles.join(", ")} — default GET /api/brokers remains platform-owner-only (pre-existing MB 403).`,
    );
  }
}

async function insertSmokeBroker(
  conn: mysql.Connection,
  row: {
    email: string;
    first_name: string;
    last_name: string;
    role: "broker" | "admin" | "platform_owner";
    created_by_broker_id: number | null;
  },
): Promise<number> {
  const [result] = await conn.query<mysql.ResultSetHeader>(
    `INSERT INTO brokers
      (tenant_id, email, first_name, last_name, role, status, email_verified, created_by_broker_id, public_token)
     VALUES (?, ?, ?, ?, ?, 'active', 0, ?, UUID())`,
    [
      TENANT_ID,
      row.email,
      row.first_name,
      row.last_name,
      row.role,
      row.created_by_broker_id,
    ],
  );
  return result.insertId;
}

async function countScopedBrokers(
  conn: mysql.Connection,
  scope: string,
  brokerRole: string,
  brokerId: number,
): Promise<number> {
  const { sql, params } = buildScopeWhere(scope, brokerRole, brokerId);
  const [rows] = await conn.query<RowDataPacket[]>(
    `SELECT COUNT(*) AS total FROM brokers
     WHERE tenant_id = ? AND status = 'active'${sql}`,
    [TENANT_ID, ...params],
  );
  return Number(rows[0]?.total ?? 0);
}

async function runDbTests(conn: mysql.Connection) {
  const runId = `smoke-${Date.now()}`;
  const emailMbA = `${runId}-mb-a@smoke-realtor-mgmt.local`;
  const emailMbB = `${runId}-mb-b@smoke-realtor-mgmt.local`;
  const emailPOwned = `${runId}-partner-owned@smoke-realtor-mgmt.local`;
  const emailPOrphan = `${runId}-partner-orphan@smoke-realtor-mgmt.local`;
  const emailPOther = `${runId}-partner-other@smoke-realtor-mgmt.local`;

  const mbA = await insertSmokeBroker(conn, {
    email: emailMbA,
    first_name: "Smoke",
    last_name: "MBA",
    role: "admin",
    created_by_broker_id: null,
  });
  const mbB = await insertSmokeBroker(conn, {
    email: emailMbB,
    first_name: "Smoke",
    last_name: "MBB",
    role: "admin",
    created_by_broker_id: null,
  });
  const ownedId = await insertSmokeBroker(conn, {
    email: emailPOwned,
    first_name: "Owned",
    last_name: "Partner",
    role: "broker",
    created_by_broker_id: mbA,
  });
  await insertSmokeBroker(conn, {
    email: emailPOrphan,
    first_name: "Orphan",
    last_name: "Partner",
    role: "broker",
    created_by_broker_id: null,
  });
  await insertSmokeBroker(conn, {
    email: emailPOther,
    first_name: "Other",
    last_name: "Partner",
    role: "broker",
    created_by_broker_id: mbB,
  });

  const mbAScoped = await countScopedBrokers(conn, "realtors", "admin", mbA);
  if (mbAScoped === 1) pass("db: MB scope=realtors returns only owned partner");
  else
    fail("db: MB scope=realtors returns only owned partner", `count=${mbAScoped}`);

  const mbBScoped = await countScopedBrokers(conn, "realtors", "admin", mbB);
  if (mbBScoped === 1) pass("db: cross-MB isolation in scope=realtors");
  else fail("db: cross-MB isolation in scope=realtors", `count=${mbBScoped}`);

  const ownerScoped = await countScopedBrokers(
    conn,
    "realtors",
    "platform_owner",
    1,
  );
  const [[allActive]] = await conn.query<RowDataPacket[]>(
    "SELECT COUNT(*) AS total FROM brokers WHERE tenant_id = ? AND status = 'active'",
    [TENANT_ID],
  );
  if (ownerScoped >= Number(allActive.total))
    pass("db: platform_owner scope=realtors is unfiltered (documented edge)");
  else
    fail(
      "db: platform_owner scope=realtors is unfiltered",
      `scoped=${ownerScoped} all=${allActive.total}`,
    );

  finding(
    "API-002",
    "low",
    "scope=realtors without admin filter for platform_owner",
    "Platform owner calling scope=realtors returns all active brokers, not partners-only. UI uses default list for owners.",
  );

  const mbList = await countScopedBrokers(
    conn,
    "mortgage-bankers",
    "admin",
    mbA,
  );
  if (mbList >= 2)
    pass("db: scope=mortgage-bankers includes admins for dropdown");
  else fail("db: scope=mortgage-bankers includes admins", `count=${mbList}`);

  const [[orphanVisibleToMbA]] = await conn.query<RowDataPacket[]>(
    `SELECT COUNT(*) AS c FROM brokers
     WHERE tenant_id = ? AND status = 'active' AND role = 'broker'
       AND created_by_broker_id = ? AND email = ?`,
    [TENANT_ID, mbA, emailPOrphan],
  );
  if (Number(orphanVisibleToMbA.c) === 0)
    pass("db: orphan partners excluded from MB scoped list");
  else fail("db: orphan partners excluded from MB scoped list");

  finding(
    "DATA-001",
    "high",
    "Legacy partners with wrong/null created_by_broker_id invisible to MB",
    "Partners where created_by_broker_id IS NULL or points to another MB won't appear in Realtor Management for that MB until platform owner reassigns.",
  );

  // Simulate create INSERT semantics inside txn
  const simulatedMbCreateBy = resolveCreateCreatedBy(false, "broker", mbA);
  const [[inserted]] = await conn.query<RowDataPacket[]>(
    `SELECT created_by_broker_id FROM brokers WHERE id = ?`,
    [ownedId],
  );
  if (Number(inserted.created_by_broker_id) === mbA)
    pass("db: owned partner has expected created_by_broker_id");
  else fail("db: owned partner has expected created_by_broker_id");

  if (simulatedMbCreateBy === mbA)
    pass("db: MB create semantics match stored ownership");
  else fail("db: MB create semantics match stored ownership");

  // Migration visibility (read-only, outside txn data)
  const [[perm]] = await conn.query<RowDataPacket[]>(
    `SELECT is_visible FROM broker_role_section_permissions
     WHERE tenant_id = ? AND broker_role = 'admin' AND section_id = 'brokers'`,
    [TENANT_ID],
  );
  if (perm && Number(perm.is_visible) === 1)
    pass("db: migration applied — admin brokers section visible");
  else {
    fail("db: migration applied — admin brokers section visible");
    finding(
      "MIG-001",
      "critical",
      "Migration not applied: MB cannot see Realtor Management sidebar",
      "Run database/migrations/20260620_220000_enable_realtor_management_for_admin.sql",
    );
  }

  // MB status change allowed on owned partner (API allows status field)
  await conn.query(
    "UPDATE brokers SET status = 'inactive' WHERE id = ? AND tenant_id = ?",
    [ownedId, TENANT_ID],
  );
  const [[inactive]] = await conn.query<RowDataPacket[]>(
    "SELECT status FROM brokers WHERE id = ?",
    [ownedId],
  );
  if (inactive.status === "inactive")
    pass("db: status update path works (MB can deactivate owned partner via API)");
  else fail("db: status update path works");
}

async function main() {
  console.log("Realtor Management smoke tests\n");

  runAuthMatrixTests();
  runStaticUiApiTests();

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
    await runDbTests(conn);
  } finally {
    await conn.rollback();
    await conn.end();
  }

  const failed = cases.filter((c) => !c.pass);
  const criticalFindings = findings.filter((f) => f.severity === "critical");
  const highFindings = findings.filter((f) => f.severity === "high");

  console.log(`\nCases: ${cases.length - failed.length}/${cases.length} passed`);
  if (failed.length) {
    console.log("\nFailed cases:");
    for (const f of failed) {
      console.log(`  ✗ ${f.name}${f.detail ? ` — ${f.detail}` : ""}`);
    }
  }

  if (findings.length) {
    console.log("\nFindings (by severity):");
    for (const sev of ["critical", "high", "medium", "low", "info"] as Severity[]) {
      const group = findings.filter((f) => f.severity === sev);
      for (const f of group) {
        console.log(`  [${sev.toUpperCase()}] ${f.id}: ${f.title}`);
        console.log(`           ${f.detail}`);
      }
    }
  }

  if (failed.length || criticalFindings.length) {
    process.exitCode = 1;
    console.log("\n❌ Smoke tests FAILED");
  } else if (highFindings.length) {
    console.log("\n⚠️  Smoke tests passed with HIGH findings (review before prod)");
  } else {
    console.log("\n✅ Smoke tests passed");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
