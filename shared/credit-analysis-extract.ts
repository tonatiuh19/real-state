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

export type ReportProvider = "identityiq" | "smartcredit" | "myscoreiq" | "generic";

export type BureauScores = {
  transunion: number | null;
  experian: number | null;
  equifax: number | null;
};

export function detectProvider(text: string): ReportProvider {
  const t = text.toLowerCase();
  // SmartCredit primary; IdentityIQ / MyScoreIQ(MFSN-family) / myFICO / generic heuristics.
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
  if (t.includes("myfico") || t.includes("my fico")) return "generic";
  return "generic";
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
    if (score >= 300 && score <= 850) return score;
  }
  return null;
}

function extractBureauScoreProvider(
  text: string,
  bureau: "transunion" | "experian" | "equifax",
  provider: ReportProvider,
): number | null {
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
    if (score >= 300 && score <= 850) return score;
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

export function detectNegativeLines(text: string): string[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 8 && l.length < 140);
  const accountPrefix =
    /^([A-Z0-9*\/\s&.'-]{4,60}?)\s+(?:-\s+)?(?:collection|charge|late|inquiry|repossession|foreclosure|bankruptcy|lien|judgment|delinquent|past due|derogatory)/i;
  const seen = new Set<string>();
  const out: string[] = [];
  for (const line of lines) {
    if (!NEGATIVE_LINE_KEYWORDS.test(line)) continue;
    const prefixMatch = line.match(accountPrefix);
    const normalized = (prefixMatch?.[1] ?? line).trim().slice(0, 100);
    const key = normalized.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(normalized);
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
  ["Derogatory Item", /derogatory/i],
];

/** Turn the flat lines from detectNegativeLines into structured items for the API/UI. */
export function classifyNegativeLine(line: string): CreditAnalysisNegativeItem {
  const found = NEGATIVE_TYPE_PATTERNS.find(([, re]) => re.test(line));
  const type = found ? found[0] : "Derogatory Item";
  const creditorGuess = line
    .replace(
      /[-–—]?\s*(collection|charge.?off|charged off|late payment|inquiry|repossession|foreclosure|bankrupt(?:cy)?|lien|judgment|delinquent|past due|derogatory).*$/i,
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
      /credit card|visa|mastercard|discover|amex|american express/,
    ],
    ["collections", /collection agency|placed for collection|\bcollections?\b/],
    ["student_loan", /student loan|sallie mae|navient|dept\.? of education/],
    ["personal_loan", /personal loan|installment loan|signature loan/],
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

