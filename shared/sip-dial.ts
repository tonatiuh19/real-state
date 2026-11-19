/**
 * SIP desk-phone dial target parsing (Poly CCX / any SIP endpoint registered
 * to the Twilio SIP domain). Source of truth for tests; the runtime copy is
 * inlined in api/index.ts ("SIP desk phone — inlined for Vercel serverless").
 */

export type SipDialTarget =
  | { kind: "emergency"; number: "911" | "933" }
  | { kind: "pstn"; number: string };

/**
 * `sip:5551234567@encore.sip.twilio.com;user=phone` → { kind: "pstn", number: "+15551234567" }.
 * Only NANP (+1) numbers and 911/933 are allowed — international and premium
 * destinations are refused to prevent toll fraud from a compromised phone.
 */
export function parseSipDialTarget(
  sipTo: string | null | undefined,
): SipDialTarget | null {
  if (!sipTo) return null;
  const m = String(sipTo)
    .trim()
    .match(/^sips?:([^@;>]+)@/i);
  const user = decodeURIComponent((m ? m[1] : String(sipTo)).trim());
  const plus = user.startsWith("+");
  const digits = user.replace(/\D/g, "");
  if (!plus && (digits === "911" || digits === "933")) {
    return { kind: "emergency", number: digits as "911" | "933" };
  }
  // Strip a leading "9" outside-line prefix some desk phones add (9 + 1 + 10).
  const d = !plus && digits.length === 12 && digits.startsWith("91")
    ? digits.slice(1)
    : digits;
  let e164: string | null = null;
  if (!plus && d.length === 10) e164 = `+1${d}`;
  else if (d.length === 11 && d.startsWith("1")) e164 = `+${d}`;
  if (!e164) return null;
  // NANP: area code and exchange can't start with 0/1; block 900 premium.
  const area = e164.slice(2, 5);
  const exch = e164.slice(5, 8);
  if (/^[01]/.test(area) || /^[01]/.test(exch) || area === "900") return null;
  return { kind: "pstn", number: e164 };
}

/** Parse main_line_sip_endpoints (JSON array or CSV) into valid sip: URIs. */
export function parseSipEndpoints(raw: string | null | undefined): string[] {
  if (!raw || !String(raw).trim()) return [];
  let values: unknown[];
  try {
    const parsed = JSON.parse(String(raw));
    values = Array.isArray(parsed) ? parsed : [parsed];
  } catch {
    values = String(raw).split(",");
  }
  const out: string[] = [];
  for (const v of values) {
    const s = String(v ?? "").trim();
    if (/^sips?:[^@\s]+@[a-z0-9.-]+$/i.test(s) && !out.includes(s)) out.push(s);
  }
  return out;
}
