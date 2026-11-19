/**
 * HTTP integration — front-desk SIP phone (Twilio SIP Domain) + main-line
 * desk-first ringing. Only TwiML is inspected: no real calls are placed.
 * The outbound-status test writes one call row for a synthetic number and
 * removes it afterwards.
 */
import "dotenv/config";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import twilio from "twilio";
import type { Pool, RowDataPacket } from "mysql2/promise";
import { createServer } from "./index";
import { createIntegrationTestPool, uniqueTestE164 } from "./testDbCleanup";

const RUN_ID = `http-sip-${Date.now()}`;
const TENANT_ID = 1;

describe("SIP desk phone HTTP", () => {
  let pool: Pool;
  let app: ReturnType<typeof createServer>;
  let mainLine = "";
  let domainSid = "";
  let ringIds: number[] = [];
  const callSid = `CA${RUN_ID.replace(/\D/g, "").padEnd(32, "0").slice(0, 32)}`;
  const target = uniqueTestE164(`${RUN_ID}-dest`);

  function twilioPost(path: string, params: Record<string, string>) {
    const req = request(app).post(path).type("form").send(params);
    const token = process.env.TWILIO_AUTH_TOKEN;
    const appUrl = process.env.APP_URL;
    if (token && appUrl) {
      req.set(
        "X-Twilio-Signature",
        twilio.getExpectedTwilioSignature(token, `${appUrl}${path}`, params),
      );
    }
    return req;
  }

  beforeAll(async () => {
    pool = createIntegrationTestPool();
    app = createServer();
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT setting_key, setting_value FROM system_settings
       WHERE tenant_id = ? AND setting_key IN ('main_line_number','main_line_sip_domain_sid','main_line_ring_broker_ids')`,
      [TENANT_ID],
    );
    const m = new Map(rows.map((r) => [String(r.setting_key), String(r.setting_value ?? "")]));
    mainLine = m.get("main_line_number") || "";
    domainSid = m.get("main_line_sip_domain_sid") || "";
    try {
      ringIds = JSON.parse(m.get("main_line_ring_broker_ids") || "[]");
    } catch {
      ringIds = [];
    }
  }, 60_000);

  afterAll(async () => {
    if (!pool) return;
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT conversation_id FROM communications WHERE tenant_id = ? AND external_id = ?`,
      [TENANT_ID, callSid],
    );
    await pool.query(`DELETE FROM communications WHERE tenant_id = ? AND external_id = ?`, [TENANT_ID, callSid]);
    for (const r of rows) {
      await pool
        .query(
          `DELETE FROM conversation_threads ct WHERE ct.tenant_id = ? AND ct.conversation_id = ? AND ct.client_id IS NULL
             AND NOT EXISTS (SELECT 1 FROM communications c WHERE c.conversation_id = ct.conversation_id)`,
          [TENANT_ID, r.conversation_id],
        )
        .catch(() => undefined);
    }
    await pool.end();
  });

  it("rejects calls from an unknown SIP domain (other tenants / spoofing)", async () => {
    const res = await twilioPost("/api/voice/sip-outbound", {
      CallSid: callSid,
      SipDomainSid: "SD00000000000000000000000000000000",
      From: "sip:frontdesk@evil.sip.twilio.com",
      To: "sip:5624490000@evil.sip.twilio.com",
    });
    expect(res.status).toBe(200);
    expect(res.text).toContain("<Reject");
    expect(res.text).not.toContain("<Dial");
  });

  it("valid desk call dials with main-line caller ID, recorded", async (ctx) => {
    if (!domainSid || !mainLine) ctx.skip();
    const res = await twilioPost("/api/voice/sip-outbound", {
      CallSid: callSid,
      SipDomainSid: domainSid,
      From: "sip:frontdesk@x.sip.twilio.com",
      To: "sip:5624490000@x.sip.twilio.com;user=phone",
    });
    expect(res.text).toContain(`callerId="${mainLine}"`);
    expect(res.text).toContain("<Number>+15624490000</Number>");
    expect(res.text).toContain("record-from-answer-dual");
  });

  it("911 goes straight out, unrecorded; international refused", async (ctx) => {
    if (!domainSid || !mainLine) ctx.skip();
    const e = await twilioPost("/api/voice/sip-outbound", {
      CallSid: callSid,
      SipDomainSid: domainSid,
      To: "sip:911@x.sip.twilio.com",
    });
    expect(e.text).toContain("<Number>911</Number>");
    expect(e.text).not.toContain("record=");
    const intl = await twilioPost("/api/voice/sip-outbound", {
      CallSid: callSid,
      SipDomainSid: domainSid,
      To: "sip:+525512345678@x.sip.twilio.com",
    });
    expect(intl.text).toContain("<Say");
    expect(intl.text).not.toContain("<Dial");
  });

  it("desk unanswered → browser ring group; answered → done", async (ctx) => {
    if (!mainLine) ctx.skip();
    const miss = await twilioPost("/api/voice/main-line-desk-status", {
      CallSid: callSid,
      DialCallStatus: "no-answer",
      To: mainLine,
    });
    expect(miss.text).toContain("<Client>");
    expect(miss.text).toContain("/api/voice/dial-status");
    for (const id of ringIds) expect(miss.text).toContain(`broker_${id}`);

    const ok = await twilioPost("/api/voice/main-line-desk-status", {
      CallSid: callSid,
      DialCallStatus: "completed",
      To: mainLine,
    });
    expect(ok.text).toBe("<Response></Response>");
  });

  it("outbound status logs the call once (idempotent)", async (ctx) => {
    if (!mainLine) ctx.skip();
    const path = `/api/voice/sip-outbound-status?to=${encodeURIComponent(target)}`;
    const params = { CallSid: callSid, DialCallStatus: "completed", DialCallDuration: "0" };
    await twilioPost(path, params);
    await twilioPost(path, params);
    // Logging runs after the response — give it a moment.
    let n = 0;
    for (let i = 0; i < 20 && n === 0; i++) {
      await new Promise((r) => setTimeout(r, 300));
      const [[row]] = await pool.query<RowDataPacket[]>(
        `SELECT COUNT(*) AS n FROM communications WHERE tenant_id = ? AND external_id = ?`,
        [TENANT_ID, callSid],
      );
      n = Number(row.n);
    }
    expect(n).toBe(1);
  });
});
