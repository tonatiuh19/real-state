/**
 * Encore Mortgage — Free Analysis PDF text extractors (pure functions).
 * Ported from Optimum Credit. Takes extracted text only — no DB, no Express, no Claude.
 * Keep in sync with the marked inline copy in api/index.ts (Vercel serverless).
 */

export type CreditAnalysisNegativeItem = {
  type: string;
  creditor?: string;
  bureaus?: string[];
  detail?: string;
};

export type ReportProvider =
  | "identityiq"
  | "smartcredit"
  | "myscoreiq"
  | "xactus"
  | "generic";

export type BureauScores = {
  transunion: number | null;
  experian: number | null;
  equifax: number | null;
};

export function detectProvider(text: string): ReportProvider {
  const t = text.toLowerCase();
  // SmartCredit primary; IdentityIQ / MyScoreIQ(MFSN-family) / Xactus / myFICO / generic.
  // Not Credit Karma / OCR — text-based tri-merge PDFs only.
  if (t.includes("smartcredit") || t.includes("smart credit"))
    return "smartcredit";
  if (t.includes("identityiq") || t.includes("identity iq"))
    return "identityiq";
  if (
    t.includes("myscoreiq") ||
    t.includes("my score iq") ||
    t.includes("myfreescorenow") ||
    t.includes("my free score now")
  )
    return "myscoreiq";
  if (isXactusReport(t)) return "xactus";
  if (t.includes("myfico") || t.includes("my fico")) return "generic";
  return "generic";
}

/** Statewide / Xactus-style reseller tri-merge (Client Code X-…, TUC/EXP/EQX, Credit Assure). */
function isXactusReport(t: string): boolean {
  if (t.includes("xactus")) return true;
  if (/client\s*code:\s*x-?\d+/i.test(t)) return true;
  if (
    t.includes("repositories: tuc/exp/eqx") ||
    t.includes("repositories:tuc/exp/eqx")
  )
    return true;
  // Common Xactus / Statewide header + CreditXpert Credit Assure blocks
  const hasReedRd = t.includes("370 reed rd");
  const hasCreditAssure =
    t.includes("credit assure") || t.includes("creditxpert");
  const hasFicoVersions =
    /fico\s*score\s*4/i.test(t) &&
    /fico\s*score\s*2/i.test(t) &&
    /fico\s*score\s*5/i.test(t);
  if ((hasReedRd || hasCreditAssure) && hasFicoVersions) return true;
  if (t.includes("order verifications") && hasFicoVersions && t.includes("statewide"))
    return true;
  return false;
}

function scoreInRange(n: number): boolean {
  return Number.isFinite(n) && n >= 300 && n <= 850;
}

function extractBureauScoreGeneric(
  text: string,
  bureau: string,
): number | null {
  const patterns = [
    new RegExp(`${bureau}[^\\d]{0,60}(\\d{3})`, "i"),
    new RegExp(`${bureau.slice(0, 3)}[^\\d]{0,30}(\\d{3})`, "i"),
    new RegExp(`(${bureau.slice(0, 2)})\\s*[:\\-]?\\s*(\\d{3})`, "i"),
  ];
  for (const re of patterns) {
    const m = text.match(re);
    const score = m ? Number(m[m.length - 1]) : NaN;
    if (scoreInRange(score)) return score;
  }
  return null;
}

/**
 * Xactus / Statewide tri-merge:
 *  - Explicit lines: "TransUnion 550" / "Experian 622" / "Equifax 594"
 *  - FICO model mapping: Score 4 → TU, Score 2 → EX, Score 5 → EQ
 *  - "Name TransUnion FICO Score 4 Fair Isaac 309-839" (range, not the score)
 */
function extractXactusBureauScore(
  text: string,
  bureau: "transunion" | "experian" | "equifax",
): number | null {
  const full =
    bureau === "transunion"
      ? "TransUnion"
      : bureau === "experian"
        ? "Experian"
        : "Equifax";

  // Prefer explicit "Bureau 550" lines (often near Credit Assure / factors footer)
  const explicit = new RegExp(
    `\\b${full}\\b\\s*[:\\-]?\\s*(\\d{3})\\b`,
    "i",
  );
  const explicitMatches = [...text.matchAll(new RegExp(explicit.source, "gi"))];
  for (const m of explicitMatches) {
    const score = Number(m[1]);
    // Skip Fair Isaac ranges like 309-839 (first number is range floor)
    const after = text.slice(
      (m.index ?? 0) + m[0].length,
      (m.index ?? 0) + m[0].length + 8,
    );
    if (/^\s*-\s*\d{3}/.test(after)) continue;
    if (scoreInRange(score)) return score;
  }

  // FICO Score N block: "FICO Score 4\n550" or "FICO Score 5\n[ 594 ]"
  const ficoModel =
    bureau === "transunion" ? "4" : bureau === "experian" ? "2" : "5";
  const ficoBlock = new RegExp(
    `FICO\\s*Score\\s*${ficoModel}\\s*(?:\\[[^\\]]*\\]|[^\\d]{0,40})(\\d{3})`,
    "i",
  );
  const fm = text.match(ficoBlock);
  if (fm) {
    const score = Number(fm[1]);
    if (scoreInRange(score)) return score;
  }

  // Line after FICO Score N
  const ficoNextLine = new RegExp(
    `FICO\\s*Score\\s*${ficoModel}\\s*(?:\\r?\\n)+\\s*\\[?\\s*(\\d{3})\\s*\\]?`,
    "i",
  );
  const fn = text.match(ficoNextLine);
  if (fn) {
    const score = Number(fn[1]);
    if (scoreInRange(score)) return score;
  }

  return extractBureauScoreGeneric(text, full);
}

function extractBureauScoreProvider(
  text: string,
  bureau: "transunion" | "experian" | "equifax",
  provider: ReportProvider,
): number | null {
  if (provider === "xactus") {
    return extractXactusBureauScore(text, bureau);
  }

  const labels: Record<typeof bureau, string[]> = {
    transunion: ["transunion", "trans union", "tu"],
    experian: ["experian", "exp", "ex"],
    equifax: ["equifax", "eq"],
  };

  const providerPatterns: RegExp[] = [];
  const abbrev =
    bureau === "transunion" ? "TU" : bureau === "experian" ? "EX" : "EQ";
  providerPatterns.push(new RegExp(`\\b${abbrev}\\b[^\\d]{0,20}(\\d{3})`, "i"));

  if (
    provider === "identityiq" ||
    provider === "smartcredit" ||
    provider === "myscoreiq"
  ) {
    for (const label of labels[bureau]) {
      providerPatterns.push(
        new RegExp(
          `${label}[^\\d]{0,40}(?:score|vantage|fico)?[^\\d]{0,10}(\\d{3})`,
          "i",
        ),
      );
      providerPatterns.push(
        new RegExp(
          `(?:score|vantage|fico)[^\\d]{0,20}${label}[^\\d]{0,20}(\\d{3})`,
          "i",
        ),
      );
    }
  }

  for (const re of providerPatterns) {
    const m = text.match(re);
    const score = m ? Number(m[1]) : NaN;
    if (scoreInRange(score)) return score;
  }

  const genericName =
    bureau === "transunion"
      ? "TransUnion"
      : bureau === "experian"
        ? "Experian"
        : "Equifax";
  return extractBureauScoreGeneric(text, genericName);
}

export function extractAllScores(
  text: string,
  provider: ReportProvider = detectProvider(text),
): BureauScores {
  return {
    transunion: extractBureauScoreProvider(text, "transunion", provider),
    experian: extractBureauScoreProvider(text, "experian", provider),
    equifax: extractBureauScoreProvider(text, "equifax", provider),
  };
}

function middleScore(scores: BureauScores): number | null {
  const vals = [scores.transunion, scores.experian, scores.equifax].filter(
    (n): n is number => n != null,
  );
  if (vals.length === 0) return null;
  vals.sort((a, b) => a - b);
  return vals[Math.floor(vals.length / 2)];
}

const NEGATIVE_LINE_KEYWORDS =
  /collection|charge.?off|late payment|inquiry|repossession|foreclosure|bankruptcy|lien|judgment|delinquent|past due|derogatory|charged off/i;

/** Pull creditor names from Xactus Underwriting Alerts blocks. */
function extractXactusAlertCreditors(text: string): string[] {
  const out: string[] = [];
  const blocks: Array<[string, RegExp]> = [
    [
      "Collection",
      /Collection Accounts:\s*The following account\(s\) are reported as collection accounts:\s*([\s\S]*?)(?=Disputed Accounts:|Charge Off Accounts:|Credit Summary|$)/i,
    ],
    [
      "Charge-Off",
      /Charge Off Accounts:\s*The following account\(s\) are reported as Charge Off accounts:\s*([\s\S]*?)(?=Disputed Accounts:|Collection Accounts:|Credit Summary|$)/i,
    ],
    [
      "Dispute",
      /Disputed Accounts:\s*The following account\(s\)[^:]*:\s*([\s\S]*?)(?=Charge Off Accounts:|Collection Accounts:|Credit Summary|$)/i,
    ],
  ];
  for (const [type, re] of blocks) {
    const m = text.match(re);
    if (!m?.[1]) continue;
    let chunk = m[1]
      .replace(/\s+/g, " ")
      .replace(/\.\s*Order\b.*$/i, "")
      .replace(/\.\s*If using\b.*$/i, "")
      .replace(/\*\s*$/g, "")
      .trim();
    // "CAVALRY PORTFOLIO SERV, LVNV FUNDING LLC, ..." or "LOANME INC (EXP), CITI (TUC)"
    const parts = chunk
      .split(/,\s*/)
      .map((p) => p.replace(/\([^)]*\)/g, "").replace(/\.+$/, "").trim())
      .filter(Boolean);
    for (const name of parts.slice(0, 10)) {
      if (name.length < 3 || name.length > 60) continue;
      if (/^the following/i.test(name)) continue;
      if (/^(order|if using|information|tradeline|consumer)/i.test(name))
        continue;
      out.push(`${name} ${type}`);
    }
  }
  return out;
}

export function detectNegativeLines(text: string): string[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 8 && l.length < 140);
  const accountPrefix =
    /^([A-Z0-9*\/\s&.'-]{4,60}?)\s+(?:-\s+)?(?:collection|charge|late|inquiry|repossession|foreclosure|bankruptcy|lien|judgment|delinquent|past due|derogatory)/i;
  const seen = new Set<string>();
  const out: string[] = [];

  const push = (raw: string) => {
    const normalized = raw.trim().slice(0, 100);
    if (normalized.length < 4) return;
    const key = normalized.toLowerCase();
    if (seen.has(key)) return;
    // Skip meta/header / factor-code noise
    if (/^client code:/i.test(normalized)) return;
    if (/^historical$/i.test(normalized)) return;
    if (/^past due$/i.test(normalized)) return;
    if (/^collections\/charge-offs:?$/i.test(normalized)) return;
    if (/^bankruptcy:?$/i.test(normalized)) return;
    if (/collection accounts:\s*the following/i.test(normalized)) return;
    if (/charge off accounts:\s*the following/i.test(normalized)) return;
    if (/disputed accounts:\s*the following/i.test(normalized)) return;
    if (/^•?\s*\d{2,3}\s*-/.test(normalized)) return;
    if (/^order (tradeline|a rapid)/i.test(normalized)) return;
    seen.add(key);
    out.push(normalized);
  };

  if (detectProvider(text) === "xactus") {
    for (const alert of extractXactusAlertCreditors(text)) push(alert);
    // Underwriting Alerts are authoritative; skip noisy tradeline/factor keyword lines
    if (out.length > 0) return out.slice(0, 25);
  }

  for (const line of lines) {
    if (!NEGATIVE_LINE_KEYWORDS.test(line)) continue;
    if (/^B\s+I\s+/i.test(line)) continue;
    if (/\t/.test(line)) continue;
    const prefixMatch = line.match(accountPrefix);
    push(prefixMatch?.[1] ?? line);
    if (out.length >= 25) break;
  }
  return out.slice(0, 25);
}

const NEGATIVE_TYPE_PATTERNS: Array<[string, RegExp]> = [
  ["Bankruptcy", /bankrupt/i],
  ["Foreclosure", /foreclosure/i],
  ["Repossession", /repossession/i],
  ["Charge-Off", /charge.?off|charged off/i],
  ["Collection", /collection/i],
  ["Judgment", /judgment/i],
  ["Lien", /\blien\b/i],
  ["Late Payment", /late payment|past due|delinquent/i],
  ["Hard Inquiry", /inquiry/i],
  ["Dispute", /disput/i],
  ["Derogatory Item", /derogatory/i],
];

/** Turn the flat lines from detectNegativeLines into structured items for the API/UI. */
export function classifyNegativeLine(line: string): CreditAnalysisNegativeItem {
  const found = NEGATIVE_TYPE_PATTERNS.find(([, re]) => re.test(line));
  const type = found ? found[0] : "Derogatory Item";
  const creditorGuess = line
    .replace(
      /[-–—]?\s*(collection|charge.?off|charged off|late payment|inquiry|repossession|foreclosure|bankrupt(?:cy)?|lien|judgment|delinquent|past due|derogatory|dispute).*$/i,
      "",
    )
    .trim();
  const creditor =
    creditorGuess &&
    creditorGuess.length > 1 &&
    creditorGuess.length < line.length
      ? creditorGuess
      : undefined;
  return { type, creditor, detail: line };
}

export function buildNegativeItems(lines: string[]): CreditAnalysisNegativeItem[] {
  return lines.map(classifyNegativeLine);
}

/**
 * Map detected negative lines + full report text to analysis label slugs.
 * Slugs must match the seeded `labels` rows (layer='analysis') from
 * database/migrations/20260731_190000_prospects_labels_analysis.sql.
 */
export function inferAnalysisLabelSlugs(
  negatives: string[],
  text: string,
): string[] {
  const haystack = `${negatives.join(" \n ")}\n${text}`.toLowerCase();
  const rules: Array<[string, RegExp]> = [
    ["housing", /mortgage|foreclosure|\brent\b|landlord|housing/],
    ["auto", /auto loan|vehicle|car loan|repossession|\bauto\b/],
    [
      "credit_card",
      /credit card|visa|mastercard|discover|amex|american express|jpmcb card|citi|capital one/,
    ],
    ["collections", /collection agency|placed for collection|\bcollections?\b|cavalry|lvnv|dnf assoc/],
    ["student_loan", /student loan|sallie mae|navient|dept\.? of education/],
    ["personal_loan", /personal loan|installment loan|signature loan|loanme/],
    ["medical", /medical|hospital|clinic|health ?care/],
    ["bankruptcy", /bankrupt/],
    ["inquiry", /hard inquiry|\binquiry\b/],
  ];
  const matched = new Set<string>();
  for (const [slug, re] of rules) {
    if (re.test(haystack)) matched.add(slug);
  }
  if (matched.size === 0 && negatives.length > 0) {
    matched.add("other_derogatory");
  }
  return Array.from(matched);
}

export type CreditAnalysisExtractionStatus =
  | "ok"
  | "empty"
  | "parse_failed"
  | "unsupported_type";

export function resolveExtractionStatus(
  mime: string | null | undefined,
  text: string,
  parseFailed: boolean,
): CreditAnalysisExtractionStatus {
  if (mime !== "application/pdf") return "unsupported_type";
  if (parseFailed) return "parse_failed";
  if (text.trim().length < 80) return "empty";
  return "ok";
}

// silence unused helper warning in some TS configs
void middleScore;
