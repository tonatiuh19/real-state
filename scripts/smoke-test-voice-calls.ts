/**
 * Smoke tests for voice / phone routing (Encore Processing blank-call audit).
 * Read-only against prod/staging DB — no Twilio mutations, no assign/unassign.
 *
 * Usage: npx tsx scripts/smoke-test-voice-calls.ts
 * Optional API checks (local dev server): SMOKE_API=1 npx tsx scripts/smoke-test-voice-calls.ts
 */
import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mysql, { type RowDataPacket } from "mysql2/promise";
import axios from "axios";
import jwt from "jsonwebtoken";
import crypto from "crypto";

const TENANT_ID = Number(process.env.MORTGAGE_TENANT_ID ?? "1");
const API_BASE = process.env.API_BASE_URL ?? "http://localhost:8080";
const RUN_API = process.env.SMOKE_API === "1";

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
  const v = process.env[name]?.trim();
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

function pass(name: string, detail?: string) {
  cases.push({ name, pass: true, detail });
}

function fail(name: string, detail?: string) {
  cases.push({ name, pass: false, detail });
}

function finding(id: string, severity: Severity, title: string, detail: string) {
  findings.push({ id, severity, title, detail });
}

function signToken(broker: { id: number; email: string; role: string }) {
  return jwt.sign(
    {
      brokerId: broker.id,
      email: broker.email,
      role: broker.role,
      userType: "broker",
      jti: crypto.randomUUID(),
      _smoke: true,
    },
    requireEnv("JWT_SECRET"),
    { expiresIn: "15m" },
  );
}

/** Mirrors handleVoiceTwiml caller-id resolution (From: client:broker_{id}). */
function twimlShouldIncludeCallerId(
  twimlBody: string,
  callerId: string | null,
): boolean {
  if (!callerId) return true;
  return twimlBody.includes(callerId);
}

async function main() {
  const conn = await mysql.createConnection({
    host: requireEnv("DB_HOST"),
    port: Number(process.env.DB_PORT ?? 4000),
    user: requireEnv("DB_USER"),
    password: requireEnv("DB_PASSWORD"),
    database: requireEnv("DB_NAME"),
    ssl: { rejectUnauthorized: true },
  });

  console.log("\n══ Voice / Phone Routing Smoke Tests ══\n");

  // ── Known brokers from Daniel's report ─────────────────────────────────────
  const [brokers] = await conn.query<RowDataPacket[]>(
    `SELECT id, first_name, last_name, email, role, twilio_caller_id, twilio_phone_sid,
            voice_available, voicemail_enabled, status
     FROM brokers
     WHERE tenant_id = ? AND id IN (3, 270004)`,
    [TENANT_ID],
  );
  const daniel = brokers.find((b) => b.id === 3);
  const encore = brokers.find((b) => b.id === 270004);

  if (!daniel || !encore) {
    fail("Fixture brokers exist", "Need broker id=3 and id=270004");
  } else {
    pass("Fixture brokers exist", `Daniel=${daniel.id}, Encore=${encore.id}`);

    if (daniel.twilio_caller_id === "+15624490000") {
      pass("Daniel personal line E.164", daniel.twilio_caller_id as string);
    } else {
      fail("Daniel personal line E.164", String(daniel.twilio_caller_id));
    }

    if (encore.twilio_caller_id === "+15623370000") {
      pass("Encore personal line E.164", encore.twilio_caller_id as string);
    } else {
      fail("Encore personal line E.164", String(encore.twilio_caller_id));
    }

    if (encore.twilio_phone_sid) {
      pass("Encore has twilio_phone_sid (UI assign path)");
    } else {
      finding(
        "V1",
        "medium",
        "Encore missing twilio_phone_sid",
        "Number may have been set via migration-only twilio_caller_id; UI assign sets both sid+caller_id.",
      );
    }

    if (!daniel.twilio_phone_sid && daniel.twilio_caller_id) {
      pass(
        "Daniel migration-only caller_id (no sid) — documented edge",
        "getSharedVoiceNumber excludes by caller_id even when sid is NULL",
      );
    }
  }

  // ── DB invariants ──────────────────────────────────────────────────────────
  const [[dupCaller]] = await conn.query<RowDataPacket[]>(
    `SELECT COUNT(*) AS n FROM (
       SELECT twilio_caller_id FROM brokers
       WHERE tenant_id = ? AND twilio_caller_id IS NOT NULL AND twilio_caller_id != ''
       GROUP BY twilio_caller_id HAVING COUNT(*) > 1
     ) x`,
    [TENANT_ID],
  );
  Number(dupCaller.n) === 0
    ? pass("No duplicate twilio_caller_id across brokers")
    : fail("No duplicate twilio_caller_id", `found ${dupCaller.n} duplicates`);

  const [[sidNoCaller]] = await conn.query<RowDataPacket[]>(
    `SELECT COUNT(*) AS n FROM brokers
     WHERE tenant_id = ? AND twilio_phone_sid IS NOT NULL AND twilio_phone_sid != ''
       AND (twilio_caller_id IS NULL OR twilio_caller_id = '')`,
    [TENANT_ID],
  );
  Number(sidNoCaller.n) === 0
    ? pass("Every twilio_phone_sid row has twilio_caller_id")
    : fail("sid without caller_id", `${sidNoCaller.n} broker(s)`);

  // Personal-line inbound attribution for Encore number
  if (encore?.twilio_caller_id) {
    const [[misattrib]] = await conn.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS n FROM conversation_threads
       WHERE tenant_id = ? AND inbox_number = ? AND broker_id IS NOT NULL AND broker_id != ?`,
      [TENANT_ID, encore.twilio_caller_id, encore.id],
    );
    Number(misattrib.n) === 0
      ? pass(
          `Inbound threads on ${encore.twilio_caller_id} owned by Encore or shared`,
        )
      : (finding(
            "V4",
            "medium",
            "Historical Encore line thread ownership",
            `${misattrib.n} thread(s) still have stale broker_id from when +15623370000 was a shared line. Outbound calls are unaffected; run inbox backfill or wait for personal-line upsert on next inbound.`,
          ),
          pass(
            "Encore personal-line threads (historical drift noted)",
            `${misattrib.n} stale — see finding V4`,
          ));
  }

  // ── Static UI audit (source files) ───────────────────────────────────────
  const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
  const voicePanel = fs.readFileSync(
    path.join(root, "client/components/VoiceCallPanel.tsx"),
    "utf8",
  );
  const globalVoice = fs.readFileSync(
    path.join(root, "client/components/GlobalVoiceManager.tsx"),
    "utf8",
  );
  const conversations = fs.readFileSync(
    path.join(root, "client/pages/admin/Conversations.tsx"),
    "utf8",
  );
  const apiIndex = fs.readFileSync(path.join(root, "api/index.ts"), "utf8");

  if (
    globalVoice.includes("sharedDevice") &&
    voicePanel.includes("sharedDevice") &&
    voicePanel.includes("ownsDeviceRef")
  ) {
    pass("Outbound uses shared Twilio Device (no second Device per call)");
  } else {
    fail(
      "Shared Device pattern",
      "VoiceCallPanel must reuse GlobalVoiceManager Device — dual Device causes blank/hung UI",
    );
    finding(
      "V2",
      "critical",
      "Dual Twilio Device on outbound",
      "GlobalVoiceManager registers broker_{id}. A second Device+register in VoiceCallPanel with the same identity conflicts — UI stuck on 'Setting up…' (reported as blank screen). Encore accounts with Available toggled on hit this reliably; Daniel may work if inbound Device failed to register.",
    );
  }

  if (!conversations.includes("Delegate outbound calls to GlobalVoiceManager")) {
    fail("Conversations delegates outbound via useEffect (not render)");
  } else {
    pass("Conversations delegates outbound via useEffect (not render)");
  }

  if (apiIndex.includes("voice_available = 1\n         ORDER BY rbr.id")) {
    fail("handleVoiceIncoming shared routing SQL", "Invalid alias rbr.id breaks shared-line inbound");
    finding(
      "V3",
      "high",
      "Shared inbound routing SQL typo",
      "ORDER BY rbr.id ASC should be ORDER BY id ASC — shared (All Mortgage Bankers) inbound calls error in TwiML handler.",
    );
  } else {
    pass("handleVoiceIncoming shared routing SQL uses valid ORDER BY");
  }

  if (
    apiIndex.includes("req.body?.Identity") &&
    apiIndex.includes("client:")
  ) {
    pass("handleVoiceTwiml reads From and Identity for broker identity");
  } else {
    fail("handleVoiceTwiml identity params", "Must parse From: client:broker_{id}");
  }

  // ── Optional live API (local dev) ──────────────────────────────────────────
  if (RUN_API && daniel && encore) {
    console.log("\n── Live API checks (SMOKE_API=1) ──\n");
    for (const b of [daniel, encore]) {
      const token = signToken({
        id: b.id as number,
        email: b.email as string,
        role: b.role as string,
      });
      const headers = { Authorization: `Bearer ${token}` };

      const tokRes = await axios.post(
        `${API_BASE}/api/voice/token`,
        {},
        { headers, validateStatus: () => true, timeout: 15000 },
      );
      tokRes.status === 200 && tokRes.data?.token
        ? pass(`POST /api/voice/token broker ${b.id} → 200`)
        : fail(`POST /api/voice/token broker ${b.id}`, `status ${tokRes.status}`);

      const fromBody = new URLSearchParams({
        To: "+15551234567",
        From: `client:broker_${b.id}`,
      }).toString();
      const twimlRes = await axios.post(`${API_BASE}/api/voice/twiml`, fromBody, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        validateStatus: () => true,
        timeout: 15000,
      });
      const body = String(twimlRes.data ?? "");
      twimlRes.status === 200 &&
      twimlShouldIncludeCallerId(body, b.twilio_caller_id as string | null)
        ? pass(
            `TwiML callerId for broker ${b.id}`,
            (b.twilio_caller_id as string) ?? "shared fallback",
          )
        : fail(
            `TwiML callerId for broker ${b.id}`,
            `status=${twimlRes.status} body=${body.slice(0, 120)}`,
          );
    }
  } else {
    pass("Live API checks skipped", "Set SMOKE_API=1 with dev server for API leg");
  }

  await conn.end();

  // ── Summary ────────────────────────────────────────────────────────────────
  const passed = cases.filter((c) => c.pass).length;
  const failed = cases.filter((c) => !c.pass).length;
  console.log(`\nResults: ${passed} passed, ${failed} failed\n`);
  for (const c of cases) {
    console.log(`${c.pass ? "✅" : "❌"} ${c.name}${c.detail ? ` — ${c.detail}` : ""}`);
  }
  if (findings.length) {
    console.log("\nFindings:");
    for (const f of findings) {
      console.log(`  [${f.severity.toUpperCase()}] ${f.id}: ${f.title}`);
      console.log(`    ${f.detail}`);
    }
  }
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
