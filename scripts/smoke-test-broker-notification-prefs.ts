/**
 * Edge-case smoke for broker notification preferences.
 * Uses a synthetic broker; entire run ROLLS BACK — no lasting prod impact.
 * Does NOT call Resend / send real email.
 *
 * Usage: npx tsx scripts/smoke-test-broker-notification-prefs.ts
 */
import "dotenv/config";
import mysql, {
  type Connection,
  type ResultSetHeader,
  type RowDataPacket,
} from "mysql2/promise";
import {
  applyBrokerNotificationPrefsPatch,
  BROKER_EMAIL_ALERT_COLUMNS,
  BROKER_EMAIL_ALERT_EVENTS,
  collectBrokerAlertRecipients,
  defaultBrokerNotificationPrefs,
  inboundCommunicationToEmailAlertEvent,
  isSendableBrokerEmail,
  mergeBrokerNotificationPrefs,
  resolveBrokerEmailAlertDelivery,
  type BrokerNotificationPrefs,
} from "../shared/broker-notification-prefs.ts";

const TENANT_ID = Number(process.env.MORTGAGE_TENANT_ID ?? "1");
const SMOKE_EMAIL = `smoke-bnp-${Date.now()}@smoke-bnp.local`;

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

async function loadPrefs(
  conn: Connection,
  brokerId: number,
): Promise<BrokerNotificationPrefs> {
  const [rows] = await conn.query<RowDataPacket[]>(
    `SELECT email_new_application, email_voicemail, email_inbound_sms,
            email_inbound_email, email_scheduler_booking, email_reminder_flow_broker,
            secondary_email
     FROM broker_notification_preferences
     WHERE broker_id = ? AND tenant_id = ?
     LIMIT 1`,
    [brokerId, TENANT_ID],
  );
  return mergeBrokerNotificationPrefs(rows[0] ?? null);
}

/** Mirrors API race-safe PUT: INSERT IGNORE + UPDATE only changed columns. */
async function putPartialPrefs(
  conn: Connection,
  brokerId: number,
  body: Record<string, unknown>,
): Promise<BrokerNotificationPrefs> {
  const current = await loadPrefs(conn, brokerId);
  const applied = applyBrokerNotificationPrefsPatch(current, body);
  if (!applied.ok) throw new Error(applied.error);

  await conn.query(
    `INSERT IGNORE INTO broker_notification_preferences (broker_id, tenant_id)
     VALUES (?, ?)`,
    [brokerId, TENANT_ID],
  );

  const setParts: string[] = [];
  const setVals: Array<string | number | null> = [];
  for (const col of applied.changedColumns) {
    setParts.push(`${col} = ?`);
    if (col === "secondary_email") {
      setVals.push(applied.prefs.secondary_email);
    } else {
      setVals.push((applied.prefs as Record<string, unknown>)[col] ? 1 : 0);
    }
  }
  setVals.push(brokerId, TENANT_ID);
  await conn.query(
    `UPDATE broker_notification_preferences
     SET ${setParts.join(", ")}
     WHERE broker_id = ? AND tenant_id = ?`,
    setVals,
  );
  return loadPrefs(conn, brokerId);
}

async function main() {
  // ── Pure edge matrix (no DB) ─────────────────────────────────────────────
  {
    const d = defaultBrokerNotificationPrefs();
    const criticalOn = (
      ["new_application", "voicemail", "inbound_sms", "scheduler_booking", "reminder_flow_broker"] as const
    ).every((e) =>
      resolveBrokerEmailAlertDelivery({
        prefs: d,
        event: e,
        accountEmail: "a@x.com",
      }).send,
    );
    const inboundEmailOff = !resolveBrokerEmailAlertDelivery({
      prefs: d,
      event: "inbound_email",
      accountEmail: "a@x.com",
    }).send;
    if (criticalOn && inboundEmailOff) {
      pass("defaults: critical on, inbound_email off");
    } else {
      fail("defaults: critical on, inbound_email off");
    }
  }

  {
    const prefs = {
      ...defaultBrokerNotificationPrefs(),
      email_inbound_sms: false,
      email_inbound_email: false,
    };
    const sms = resolveBrokerEmailAlertDelivery({
      prefs,
      event: "inbound_sms",
      accountEmail: "a@x.com",
    });
    const email = resolveBrokerEmailAlertDelivery({
      prefs,
      event: "inbound_email",
      accountEmail: "a@x.com",
    });
    const app = resolveBrokerEmailAlertDelivery({
      prefs,
      event: "new_application",
      accountEmail: "a@x.com",
    });
    if (!sms.send && !email.send && app.send) {
      pass("selective opt-out preserves other events");
    } else {
      fail("selective opt-out preserves other events");
    }
  }

  {
    const r = resolveBrokerEmailAlertDelivery({
      prefs: {
        ...defaultBrokerNotificationPrefs(),
        secondary_email: "ops@example.com",
      },
      event: "voicemail",
      accountEmail: "noemail_1@imported.local",
    });
    if (r.send && r.recipients.length === 1 && r.recipients[0] === "ops@example.com") {
      pass("secondary-only when account noemail_");
    } else {
      fail("secondary-only when account noemail_", JSON.stringify(r));
    }
  }

  {
    if (
      inboundCommunicationToEmailAlertEvent("whatsapp") === "inbound_sms" &&
      inboundCommunicationToEmailAlertEvent("call") === null
    ) {
      pass("inbound channel → event mapping");
    } else {
      fail("inbound channel → event mapping");
    }
  }

  {
    // Simulate concurrent toggles: two patches from same current snapshot
    const current = defaultBrokerNotificationPrefs();
    const a = applyBrokerNotificationPrefsPatch(current, {
      email_voicemail: false,
    });
    const b = applyBrokerNotificationPrefsPatch(current, {
      email_inbound_sms: false,
    });
    if (
      a.ok &&
      b.ok &&
      a.changedColumns.length === 1 &&
      b.changedColumns.length === 1 &&
      a.changedColumns[0] !== b.changedColumns[0]
    ) {
      pass("concurrent patches touch disjoint columns");
    } else {
      fail("concurrent patches touch disjoint columns");
    }
  }

  if (!isSendableBrokerEmail("plaintext") && isSendableBrokerEmail("x@y.z")) {
    pass("sendable email validation edge");
  } else {
    fail("sendable email validation edge");
  }

  const conn = await mysql.createConnection({
    host: requireEnv("DB_HOST"),
    port: Number(process.env.DB_PORT || 4000),
    user: requireEnv("DB_USER"),
    password: requireEnv("DB_PASSWORD"),
    database: requireEnv("DB_NAME"),
    ssl: { rejectUnauthorized: true },
  });

  await conn.beginTransaction();
  let brokerId = 0;

  try {
    // Schema presence
    const [cols] = await conn.query<RowDataPacket[]>(
      `SELECT COLUMN_NAME FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'broker_notification_preferences'`,
      [requireEnv("DB_NAME")],
    );
    const names = new Set(cols.map((c) => String(c.COLUMN_NAME)));
    const required = [
      "broker_id",
      "tenant_id",
      ...Object.values(BROKER_EMAIL_ALERT_COLUMNS),
      "secondary_email",
    ];
    const missing = required.filter((c) => !names.has(c));
    if (missing.length === 0) pass("table columns present");
    else fail("table columns present", missing.join(","));

    // Synthetic broker
    const [ins] = await conn.query<ResultSetHeader>(
      `INSERT INTO brokers
        (tenant_id, email, first_name, last_name, role, status, email_verified, public_token)
       VALUES (?, ?, 'Smoke', 'BNP', 'admin', 'active', 0, UUID())`,
      [TENANT_ID, SMOKE_EMAIL],
    );
    brokerId = ins.insertId;

    // Missing row = defaults all ON
    const before = await loadPrefs(conn, brokerId);
    if (
      before.email_new_application &&
      before.email_voicemail &&
      before.secondary_email === null
    ) {
      pass("missing row merges to all-on defaults");
    } else {
      fail("missing row merges to all-on defaults", JSON.stringify(before));
    }

    const deliveryDefault = resolveBrokerEmailAlertDelivery({
      prefs: before,
      event: "new_application",
      accountEmail: SMOKE_EMAIL,
    });
    if (
      deliveryDefault.send &&
      deliveryDefault.recipients[0] === SMOKE_EMAIL
    ) {
      pass("delivery with defaults uses account email");
    } else {
      fail("delivery with defaults uses account email", JSON.stringify(deliveryDefault));
    }

    // Partial put: turn off voicemail only
    const afterVm = await putPartialPrefs(conn, brokerId, {
      email_voicemail: false,
    });
    if (
      afterVm.email_voicemail === false &&
      afterVm.email_new_application === true
    ) {
      pass("partial PUT: voicemail off keeps application on");
    } else {
      fail("partial PUT: voicemail off keeps application on", JSON.stringify(afterVm));
    }

    // Second partial put: turn off inbound_sms — must NOT restore voicemail
    const afterSms = await putPartialPrefs(conn, brokerId, {
      email_inbound_sms: false,
    });
    if (
      afterSms.email_voicemail === false &&
      afterSms.email_inbound_sms === false &&
      afterSms.email_new_application === true
    ) {
      pass("race-safe sequential partial PUTs preserve prior offs");
    } else {
      fail(
        "race-safe sequential partial PUTs preserve prior offs",
        JSON.stringify(afterSms),
      );
    }

    // Secondary email
    const afterSec = await putPartialPrefs(conn, brokerId, {
      secondary_email: "  Ops+Smoke@Example.COM ",
    });
    if (afterSec.secondary_email === "ops+smoke@example.com") {
      pass("secondary email normalized on PUT");
    } else {
      fail("secondary email normalized on PUT", String(afterSec.secondary_email));
    }

    const recipients = collectBrokerAlertRecipients(
      SMOKE_EMAIL,
      afterSec.secondary_email,
    );
    if (
      recipients.length === 2 &&
      recipients[1] === "ops+smoke@example.com"
    ) {
      pass("recipients include account + secondary");
    } else {
      fail("recipients include account + secondary", JSON.stringify(recipients));
    }

    // Clear secondary
    const cleared = await putPartialPrefs(conn, brokerId, {
      secondary_email: null,
    });
    if (cleared.secondary_email === null) {
      pass("clear secondary email");
    } else {
      fail("clear secondary email");
    }

    // Invalid secondary rejected by apply helper (API would 400)
    const bad = applyBrokerNotificationPrefsPatch(cleared, {
      secondary_email: "not-valid",
    });
    if (!bad.ok) pass("invalid secondary rejected");
    else fail("invalid secondary rejected");

    // Empty patch rejected
    const empty = applyBrokerNotificationPrefsPatch(cleared, {});
    if (!empty.ok) pass("empty patch rejected");
    else fail("empty patch rejected");

    // Prefs off → no send
    const offDelivery = resolveBrokerEmailAlertDelivery({
      prefs: afterSms,
      event: "voicemail",
      accountEmail: SMOKE_EMAIL,
    });
    if (!offDelivery.send && offDelivery.reason === "prefs_off") {
      pass("prefs_off blocks delivery");
    } else {
      fail("prefs_off blocks delivery", JSON.stringify(offDelivery));
    }

    // Alyssa still eligible in live data (read-only)
    const [alyssa] = await conn.query<RowDataPacket[]>(
      `SELECT id, email, status FROM brokers
       WHERE tenant_id = ? AND email = 'Alyssa@encoremortgage.org'
       LIMIT 1`,
      [TENANT_ID],
    );
    if (
      alyssa.length &&
      alyssa[0].status === "active" &&
      isSendableBrokerEmail(String(alyssa[0].email))
    ) {
      const aPrefs = await loadPrefs(conn, Number(alyssa[0].id));
      const aDel = resolveBrokerEmailAlertDelivery({
        prefs: aPrefs,
        event: "new_application",
        accountEmail: String(alyssa[0].email),
      });
      if (aDel.send) {
        pass(
          "Alyssa Madrid still receives new_application by default",
          `#${alyssa[0].id}`,
        );
      } else {
        fail(
          "Alyssa Madrid still receives new_application by default",
          JSON.stringify(aDel),
        );
      }
    } else {
      pass("Alyssa Madrid check skipped (not present)");
    }

    // FK: preferences row exists for smoke broker
    const [prefRows] = await conn.query<RowDataPacket[]>(
      `SELECT broker_id FROM broker_notification_preferences WHERE broker_id = ?`,
      [brokerId],
    );
    if (prefRows.length === 1) pass("prefs row created for smoke broker");
    else fail("prefs row created for smoke broker");
  } catch (err) {
    fail("unexpected smoke error", err instanceof Error ? err.message : String(err));
  } finally {
    await conn.rollback();
    await conn.end();
  }

  // Confirm rollback: smoke email should not exist
  {
    const verify = await mysql.createConnection({
      host: requireEnv("DB_HOST"),
      port: Number(process.env.DB_PORT || 4000),
      user: requireEnv("DB_USER"),
      password: requireEnv("DB_PASSWORD"),
      database: requireEnv("DB_NAME"),
      ssl: { rejectUnauthorized: true },
    });
    try {
      const [gone] = await verify.query<RowDataPacket[]>(
        `SELECT id FROM brokers WHERE email = ? AND tenant_id = ? LIMIT 1`,
        [SMOKE_EMAIL, TENANT_ID],
      );
      if (gone.length === 0) pass("rollback removed smoke broker");
      else fail("rollback removed smoke broker", `still id=${gone[0].id}`);
    } finally {
      await verify.end();
    }
  }

  const failed = cases.filter((c) => !c.pass);
  for (const c of cases) {
    console.log(
      `${c.pass ? "PASS" : "FAIL"}  ${c.name}${c.detail ? ` — ${c.detail}` : ""}`,
    );
  }
  if (failed.length) {
    console.error(`\n${failed.length} case(s) failed`);
    process.exit(1);
  }
  console.log(`\nAll ${cases.length} checks passed (rolled back)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
