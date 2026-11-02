/**
 * Validates broker new-public-application notify rules + DB columns needed by the
 * email helper. Does NOT send email or create applications.
 *
 * Usage: npx tsx scripts/smoke-test-broker-new-application-notify.ts
 */
import "dotenv/config";
import mysql, { type RowDataPacket } from "mysql2/promise";
import {
  brokerNewApplicationEmailSubject,
  publicApplyLoanTypeLabel,
  shouldEmailBrokerAddress,
  shouldSendBrokerNewPublicApplicationEmail,
  uniqueFiniteBrokerIds,
} from "../shared/broker-new-application-notify.ts";

const TENANT_ID = Number(process.env.MORTGAGE_TENANT_ID ?? "1");

interface CaseResult {
  name: string;
  pass: boolean;
  detail?: string;
}

const cases: CaseResult[] = [];

function pass(name: string, detail?: string) {
  cases.push({ name, pass: true, detail });
}

function fail(name: string, detail?: string) {
  cases.push({ name, pass: false, detail });
}

function requireEnv(name: string): string {
  const v = process.env[name]?.trim();
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

async function main() {
  // Pure rule checks (no network)
  const ids = uniqueFiniteBrokerIds([450002, null, 450002, undefined]);
  if (ids.length === 1 && ids[0] === 450002) {
    pass("dedupe broker ids", JSON.stringify(ids));
  } else {
    fail("dedupe broker ids", JSON.stringify(ids));
  }

  if (
    shouldEmailBrokerAddress("Alyssa@encoremortgage.org") &&
    !shouldEmailBrokerAddress("noemail_x@example.com") &&
    !shouldEmailBrokerAddress("")
  ) {
    pass("email address guard");
  } else {
    fail("email address guard");
  }

  if (
    shouldSendBrokerNewPublicApplicationEmail([450002]) &&
    !shouldSendBrokerNewPublicApplicationEmail([])
  ) {
    pass("send gate: share-link only");
  } else {
    fail("send gate: share-link only");
  }

  if (publicApplyLoanTypeLabel("purchase") === "Purchase") {
    pass("loan type label");
  } else {
    fail("loan type label");
  }

  const subject = brokerNewApplicationEmailSubject("Test Client", "LA1");
  if (subject.includes("Test Client") && subject.includes("LA1")) {
    pass("email subject shape", subject);
  } else {
    fail("email subject shape", subject);
  }

  const conn = await mysql.createConnection({
    host: requireEnv("DB_HOST"),
    port: Number(process.env.DB_PORT || 4000),
    user: requireEnv("DB_USER"),
    password: requireEnv("DB_PASSWORD"),
    database: requireEnv("DB_NAME"),
    ssl: { rejectUnauthorized: true },
  });

  try {
    const [cols] = await conn.query<RowDataPacket[]>(
      `SELECT COLUMN_NAME FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'brokers'
         AND COLUMN_NAME IN ('id','first_name','last_name','email','role','status','tenant_id')`,
      [requireEnv("DB_NAME")],
    );
    const names = new Set(cols.map((c) => String(c.COLUMN_NAME)));
    const required = [
      "id",
      "first_name",
      "last_name",
      "email",
      "role",
      "status",
      "tenant_id",
    ];
    const missing = required.filter((c) => !names.has(c));
    if (missing.length === 0) {
      pass("brokers columns for notify query");
    } else {
      fail("brokers columns for notify query", missing.join(","));
    }

    // Alyssa Madrid (reported case) — must still have a real email if active
    const [alyssa] = await conn.query<RowDataPacket[]>(
      `SELECT id, email, status, role, first_name, last_name
       FROM brokers
       WHERE tenant_id = ? AND (
         email = 'Alyssa@encoremortgage.org'
         OR (LOWER(first_name) = 'alyssa' AND LOWER(last_name) = 'madrid')
       )
       LIMIT 1`,
      [TENANT_ID],
    );
    if (!alyssa.length) {
      fail("Alyssa Madrid broker row", "not found");
    } else {
      const row = alyssa[0];
      const ok =
        row.status === "active" && shouldEmailBrokerAddress(String(row.email));
      if (ok) {
        pass(
          "Alyssa Madrid eligible for email",
          `#${row.id} ${row.email} (${row.role})`,
        );
      } else {
        fail(
          "Alyssa Madrid eligible for email",
          `status=${row.status} email=${row.email}`,
        );
      }
    }
  } finally {
    await conn.end();
  }

  const failed = cases.filter((c) => !c.pass);
  for (const c of cases) {
    console.log(`${c.pass ? "PASS" : "FAIL"}  ${c.name}${c.detail ? ` — ${c.detail}` : ""}`);
  }
  if (failed.length) {
    console.error(`\n${failed.length} case(s) failed`);
    process.exit(1);
  }
  console.log(`\nAll ${cases.length} checks passed`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
