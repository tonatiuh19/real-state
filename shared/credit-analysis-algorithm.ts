/**
 * Encore Mortgage — Free Analysis algorithm + HTML builder.
 * Ported from Optimum Credit (algorithm-only; no Claude/Anthropic enhance).
 * Keep in sync with the marked inline copy in api/index.ts (Vercel serverless).
 */

export const ENCORE_COLORS = {
  navy: "#121829",
  gold: "#C0A06A",
  foreground: "#0f172a",
  muted: "#64748b",
  border: "#e2e8f0",
  cardBg: "#f8fafc",
  critical: "#dc2626",
  high: "#ea580c",
  medium: "#ca8a04",
  lower: "#2563eb",
  utilOk: "#16a34a",
} as const;

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}



export type AnalystLang = "English" | "Spanish";
export type DisputePriority = "CRITICAL" | "HIGH" | "MEDIUM" | "LOWER";
export type GoalKind =
  | "fha"
  | "conventional"
  | "jumbo"
  | "auto"
  | "business"
  | "general";

export type AnalystScores = {
  transunion: number | null;
  experian: number | null;
  equifax: number | null;
};

export type AnalystNegativeInput = {
  type: string;
  creditor?: string;
  bureaus?: string[];
  detail?: string;
};

export type AnalystUtilRow = {
  account: string;
  limit: number;
  balance: number;
  pctUsed: number;
  payTo30: number;
  payTo10: number;
};

/** Flat JSON — ALL VALUES FLAT, NO ARRAYS, NO NESTED OBJECTS */
export type CreditAnalysisAnalystFlat = {
  client_name: string;
  analysis_goal: string;
  report_date: string;
  referral_name: string;
  referral_company: string;

  score_transunion: number | null;
  score_experian: number | null;
  score_equifax: number | null;
  score_tu_label: string;
  score_ex_label: string;
  score_eq_label: string;
  middle_score: number | null;
  fha_status: string;
  goal_score: number;
  goal_description: string;
  gap_tu: number | null;
  gap_ex: number | null;
  gap_eq: number | null;

  neg_1_account: string;
  neg_1_type: string;
  neg_1_bureaus: string;
  neg_1_priority: string;
  neg_1_dispute_basis: string;
  neg_2_account: string;
  neg_2_type: string;
  neg_2_bureaus: string;
  neg_2_priority: string;
  neg_2_dispute_basis: string;
  neg_3_account: string;
  neg_3_type: string;
  neg_3_bureaus: string;
  neg_3_priority: string;
  neg_3_dispute_basis: string;
  neg_4_account: string;
  neg_4_type: string;
  neg_4_bureaus: string;
  neg_4_priority: string;
  neg_4_dispute_basis: string;
  neg_5_account: string;
  neg_5_type: string;
  neg_5_bureaus: string;
  neg_5_priority: string;
  neg_5_dispute_basis: string;

  utilization_critical_note: string;
  util_1_account: string;
  util_1_limit: string;
  util_1_balance: string;
  util_1_percent: string;
  util_1_pay30: string;
  util_1_pay10: string;
  util_2_account: string;
  util_2_limit: string;
  util_2_balance: string;
  util_2_percent: string;
  util_2_pay30: string;
  util_2_pay10: string;
  util_3_account: string;
  util_3_limit: string;
  util_3_balance: string;
  util_3_percent: string;
  util_3_pay30: string;
  util_3_pay10: string;
  total_revolving_limit: string;
  total_revolving_balance: string;
  total_revolving_util: string;
  paydown_30_instruction: string;
  paydown_10_instruction: string;

  score_today: number | null;
  score_30_days: number | null;
  score_60_days: number | null;
  score_90_days: number | null;
  score_target: number | null;
  target_timeframe: string;

  round_1_actions: string;
  round_2_actions: string;
  round_3_actions: string;
  positive_accounts_protect: string;

  action_1_time: string;
  action_1_action: string;
  action_1_reason: string;
  action_2_time: string;
  action_2_action: string;
  action_2_reason: string;
  action_3_time: string;
  action_3_action: string;
  action_3_reason: string;
  action_4_time: string;
  action_4_action: string;
  action_4_reason: string;
  action_5_time: string;
  action_5_action: string;
  action_5_reason: string;
  action_6_time: string;
  action_6_action: string;
  action_6_reason: string;

  file_strength_score: number;
  file_strength_rating: string;
  fs_label_1: string;
  fs_open_revolving: string;
  fs_label_2: string;
  fs_installment_mix: string;
  fs_label_3: string;
  fs_mortgage: string;
  fs_label_4: string;
  fs_account_age: string;
  fs_label_5: string;
  fs_post_repair: string;
  tradeline_recommendation: string;

  negative_items_html: string;
  negative_count: number;
  critical_count: number;
  high_count: number;
  utilization_html: string;
  action_plan_html: string;
  mortgage_tu: number | null;
  mortgage_ex: number | null;
  mortgage_eq: number | null;
  tradeline_needed: string;
  client_text_message: string;
  text_language: AnalystLang;
};

export type CreditAnalysisAlgorithmInput = {
  clientName: string;
  firstName: string;
  lastName: string;
  repName?: string | null;
  clientGoal?: string | null;
  language: "en" | "es";
  scores: AnalystScores;
  negatives: AnalystNegativeInput[];
  reportText: string;
  utilization?: AnalystUtilRow[];
  positiveAccounts?: string[];
  reportDate?: string | null;
  weakExtraction?: boolean;
};

type RankedNeg = {
  account: string;
  type: string;
  bureaus: string;
  priority: DisputePriority;
  dispute_basis: string;
};

type TFn = (en: string, es: string) => string;

const PRIORITY_RANK: Record<DisputePriority, number> = {
  CRITICAL: 0,
  HIGH: 1,
  MEDIUM: 2,
  LOWER: 3,
};

const HISPANIC_SURNAME_HINT =
  /\b(garcia|rodriguez|martinez|hernandez|lopez|gonzalez|perez|sanchez|ramirez|torres|flores|rivera|gomez|diaz|reyes|morales|cruz|ortiz|gutierrez|chavez|ramos|ruiz|alvarez|mendoza|castillo|jimenez|moreno|romero|vargas|herrera|medina|aguilar|guerrero|contreras|delgado|vega|campos|soto|guzman|castro|fernandez|munoz|muñoz|silva|rojas|mendez|navarro|dominguez|espinoza|valdez|salazar|guillen|ibarra|carrillo)\b/i;

// escapeHtml is defined once later in this file (shared by email + analyst HTML).

function money(n: number): string {
  return `$${Math.round(n).toLocaleString("en-US")}`;
}

function clampScore(n: number): number {
  return Math.min(850, Math.max(300, Math.round(n)));
}

function makeT(lang: AnalystLang): TFn {
  return (en, es) => (lang === "Spanish" ? es : en);
}

function fsFormat(score: number, max: number, notes: string): string {
  return `${score}/${max} — ${notes}`;
}

export function scoreBandLabel(score: number | null | undefined): string {
  if (score == null || Number.isNaN(score)) return "";
  if (score < 580) return "POOR";
  if (score < 670) return "FAIR";
  if (score < 740) return "GOOD";
  if (score < 800) return "VERY GOOD";
  return "EXCELLENT";
}

/** Median of 3; lower of 2 if one null; single if only one. */
export function computeMiddleScore(scores: AnalystScores): number | null {
  const vals = [scores.transunion, scores.experian, scores.equifax].filter(
    (n): n is number => n != null && !Number.isNaN(n),
  );
  if (vals.length === 0) return null;
  vals.sort((a, b) => a - b);
  if (vals.length === 2) return vals[0];
  return vals[Math.floor(vals.length / 2)];
}

export function classifyGoalKind(goal: string | null | undefined): GoalKind {
  const g = (goal || "").toLowerCase();
  if (/fha/.test(g)) return "fha";
  if (/jumbo/.test(g)) return "jumbo";
  if (/conventional/.test(g)) return "conventional";
  if (/auto|car|vehicle/.test(g)) return "auto";
  if (/business|sba|funding/.test(g)) return "business";
  if (/general|improv/.test(g)) return "general";
  if (/mortgage|home|house|purchase/.test(g)) return "conventional";
  if (!g.trim()) return "general";
  return "general";
}

export function resolveTextLanguage(
  language: "en" | "es",
  lastName: string,
): AnalystLang {
  if (language === "es") return "Spanish";
  if (HISPANIC_SURNAME_HINT.test(lastName.trim())) return "Spanish";
  return "English";
}

export function extractUtilizationFromText(text: string): AnalystUtilRow[] {
  const results: AnalystUtilRow[] = [];
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(
      /([A-Za-z0-9*\/\s]{4,40}?)\s+[\$]?([\d,]+)\s+[\$]?([\d,]+)\s+(\d{1,3})%/,
    );
    if (!m) continue;
    const limit = Number(m[2].replace(/,/g, ""));
    const balance = Number(m[3].replace(/,/g, ""));
    const pctUsed = Number(m[4]);
    if (limit <= 0 || pctUsed > 100) continue;
    results.push({
      account: m[1].trim().slice(0, 40),
      limit,
      balance,
      pctUsed,
      payTo30: Math.max(0, Math.ceil(balance - limit * 0.3)),
      payTo10: Math.max(0, Math.ceil(balance - limit * 0.1)),
    });
  }
  return results.slice(0, 12);
}

function utilColor(pct: number): string {
  if (pct > 80) return ENCORE_COLORS.critical;
  if (pct > 50) return ENCORE_COLORS.high;
  if (pct > 30) return ENCORE_COLORS.medium;
  return ENCORE_COLORS.utilOk;
}

function priorityColor(p: DisputePriority): string {
  if (p === "CRITICAL") return ENCORE_COLORS.critical;
  if (p === "HIGH") return ENCORE_COLORS.high;
  if (p === "MEDIUM") return ENCORE_COLORS.medium;
  return ENCORE_COLORS.lower;
}

function extractBalanceHint(detail: string): number | null {
  const m = detail.match(/\$?\s*([\d,]{2,})/);
  if (!m) return null;
  const n = Number(m[1].replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
}

function countBureaus(text: string, explicit?: string[]): number {
  if (explicit?.length) return explicit.length;
  let n = 0;
  if (/\b(TU|TransUnion)\b/i.test(text)) n++;
  if (/\b(EX|Experian)\b/i.test(text)) n++;
  if (/\b(EQ|Equifax)\b/i.test(text)) n++;
  return n;
}

function formatBureaus(hay: string, explicit?: string[]): string {
  if (explicit?.length) return explicit.join("/");
  const found: string[] = [];
  if (/\b(TU|TransUnion)\b/i.test(hay)) found.push("TU");
  if (/\b(EX|Experian)\b/i.test(hay)) found.push("EX");
  if (/\b(EQ|Equifax)\b/i.test(hay)) found.push("EQ");
  return found.length ? found.join("/") : "TU/EX/EQ";
}

export function rankNegativeItem(n: AnalystNegativeInput): RankedNeg {
  const hay = `${n.type} ${n.creditor || ""} ${n.detail || ""}`;
  const type = n.type || "Derogatory Item";
  const account = (n.creditor || type).slice(0, 60);
  const bureauCount = countBureaus(hay, n.bureaus);
  const bureaus = formatBureaus(hay, n.bureaus);
  const bal = extractBalanceHint(n.detail || "");

  let priority: DisputePriority = "MEDIUM";
  let basis =
    "FCRA accuracy review — verify reporting and dispute unsupported items.";

  if (/inqui/i.test(hay)) {
    priority = "LOWER";
    basis =
      "Hard inquiry — verify permissible purpose under FCRA; dispute unauthorized inquiries.";
  } else if (
    /personal|address|name|ssn|dob|identity/i.test(hay) &&
    /error|incorrect|wrong/i.test(hay)
  ) {
    priority = "LOWER";
    basis =
      "Personal information error — request correction of inaccurate consumer data (FCRA).";
  } else if (
    /90\+|90 day|120/i.test(hay) &&
    /late|delinquen|past due|active/i.test(hay)
  ) {
    priority = "CRITICAL";
    basis =
      "Active 90+ delinquency — high-impact; dispute inaccurate status/dates with all reporting bureaus.";
  } else if (/charge.?off|charged off/i.test(hay)) {
    if (bureauCount > 0 && bureauCount < 3) {
      priority = "CRITICAL";
      basis =
        "Charge-off not consistent across all 3 bureaus — prioritize metro inconsistency dispute (FCRA).";
    } else {
      priority = "HIGH";
      basis =
        "Charge-off on file — dispute inaccurate balance, status, or dates; request method of verification.";
    }
  } else if (/collection/i.test(hay)) {
    if (bal != null && bal < 500) {
      priority = "MEDIUM";
      basis =
        "Small collection (<$500) — dispute validation under FDCPA/FCRA; verify original creditor & amount.";
    } else {
      priority = "HIGH";
      basis =
        "Collection account — demand validation (FDCPA) and dispute inaccurate reporting (FCRA).";
    }
  } else if (/late|past due|delinquen/i.test(hay)) {
    priority = "HIGH";
    basis =
      "Recent late payment — dispute incorrect late marks; verify payment history dates.";
  } else if (/bankrupt|foreclos|repossess|judgment|lien/i.test(hay)) {
    priority = "HIGH";
    basis =
      "Public-record / severe derogatory — verify court data accuracy and reporting period (FCRA).";
  }

  return { account, type, bureaus, priority, dispute_basis: basis };
}

function adjustmentFactors(
  util: AnalystUtilRow[],
  negatives: RankedNeg[],
  reportText: string,
): number {
  const totalLimit = util.reduce((s, u) => s + u.limit, 0);
  const totalBal = util.reduce((s, u) => s + u.balance, 0);
  const utilPct = totalLimit > 0 ? (totalBal / totalLimit) * 100 : 0;
  const highUtil = utilPct > 50;
  const recentLates = negatives.some((n) => /late|delinquen/i.test(n.type));
  const collections = negatives.some((n) => /collection|charge/i.test(n.type));
  const accountMentions = (reportText.match(/\baccount\b/gi) || []).length;
  const thinFile =
    accountMentions > 0 && accountMentions < 4 && util.length < 2;

  let delta = 25;
  if (highUtil) delta += utilPct > 80 ? 18 : 12;
  if (recentLates) delta += 20;
  if (collections) delta += 28;
  if (thinFile) delta += 15;
  if (!highUtil && !recentLates && !collections && !thinFile) delta = 18;
  return Math.min(55, Math.max(15, delta));
}

function nextTierGoal(mid: number): number {
  if (mid < 580) return 580;
  if (mid < 670) return 670;
  if (mid < 740) return 740;
  if (mid < 800) return 800;
  return Math.min(850, mid + 20);
}

function autoTier(score: number): { tier: string; label: string } {
  if (score >= 720) return { tier: "Tier 1", label: "best rates" };
  if (score >= 680) return { tier: "Tier 2", label: "competitive rates" };
  if (score >= 620)
    return { tier: "Tier 3", label: "standard/subprime border" };
  return { tier: "Subprime", label: "higher-cost financing" };
}

function estimateAccountAgeYears(text: string): number {
  const m = text.match(/(\d{1,2})\s*(?:yrs?|years)\s*(?:old|history|age)?/i);
  if (m) return Number(m[1]);
  if (/opened\s+\d{2}\/\d{2}\/(19|20)\d{2}/i.test(text)) return 5;
  return 3;
}

function countOpenRevolving(util: AnalystUtilRow[], text: string): number {
  if (util.length > 0) return util.length;
  const cards = (text.match(/revolving|credit card|bank card/gi) || []).length;
  return Math.min(5, Math.floor(cards / 2));
}

function hasInstallment(text: string): boolean {
  return /installment|auto loan|student|mortgage|personal loan/i.test(text);
}

function hasAuto(text: string): boolean {
  return /auto loan|vehicle|car loan|automobile/i.test(text);
}

function hasMortgage(text: string): boolean {
  return /mortgage|home equity|heloc/i.test(text);
}

function hasBusinessLine(text: string): boolean {
  return /business (credit|line|card)|sba|d&b|dun/i.test(text);
}

function localizeDisputeBasis(basis: string, lang: AnalystLang): string {
  if (lang !== "Spanish") return basis;
  return basis
    .replace(
      "FCRA accuracy review — verify reporting and dispute unsupported items.",
      "Revisión de exactitud FCRA — verificar el reporte y disputar ítems no respaldados.",
    )
    .replace(
      "Hard inquiry — verify permissible purpose under FCRA; dispute unauthorized inquiries.",
      "Consulta dura — verificar propósito permisible bajo FCRA; disputar consultas no autorizadas.",
    )
    .replace(
      "Personal information error — request correction of inaccurate consumer data (FCRA).",
      "Error de información personal — solicitar corrección de datos inexactos (FCRA).",
    )
    .replace(
      "Active 90+ delinquency — high-impact; dispute inaccurate status/dates with all reporting bureaus.",
      "Morosidad activa 90+ — alto impacto; disputar estado/fechas inexactas con las 3 agencias.",
    )
    .replace(
      "Charge-off not consistent across all 3 bureaus — prioritize metro inconsistency dispute (FCRA).",
      "Cargo fallido inconsistente entre las 3 agencias — priorizar disputa por inconsistencia (FCRA).",
    )
    .replace(
      "Charge-off on file — dispute inaccurate balance, status, or dates; request method of verification.",
      "Cargo fallido en el archivo — disputar saldo, estado o fechas; solicitar método de verificación.",
    )
    .replace(
      "Small collection (<$500) — dispute validation under FDCPA/FCRA; verify original creditor & amount.",
      "Cobro pequeño (<$500) — disputar validación bajo FDCPA/FCRA; verificar acreedor original y monto.",
    )
    .replace(
      "Collection account — demand validation (FDCPA) and dispute inaccurate reporting (FCRA).",
      "Cuenta en cobro — exigir validación (FDCPA) y disputar reporte inexacto (FCRA).",
    )
    .replace(
      "Recent late payment — dispute incorrect late marks; verify payment history dates.",
      "Pago atrasado reciente — disputar marcas incorrectas; verificar fechas del historial.",
    )
    .replace(
      "Public-record / severe derogatory — verify court data accuracy and reporting period (FCRA).",
      "Registro público / negativo severo — verificar exactitud judicial y período de reporte (FCRA).",
    );
}

function buildNegativeHtml(items: RankedNeg[]): string {
  return items
    .map(
      (n) =>
        `<tr><td style="padding:8px;border-bottom:1px solid ${ENCORE_COLORS.border};"><strong>${escapeHtml(n.account)}</strong></td><td style="padding:8px;border-bottom:1px solid ${ENCORE_COLORS.border};">${escapeHtml(n.type)}</td><td style="padding:8px;border-bottom:1px solid ${ENCORE_COLORS.border};text-align:center;">${escapeHtml(n.bureaus)}</td><td style="padding:8px;border-bottom:1px solid ${ENCORE_COLORS.border};text-align:center;color:${priorityColor(n.priority)};font-weight:bold;">${n.priority}</td><td style="padding:8px;border-bottom:1px solid ${ENCORE_COLORS.border};font-size:12px;">${escapeHtml(n.dispute_basis)}</td></tr>`,
    )
    .join("");
}

function buildUtilHtml(rows: AnalystUtilRow[]): string {
  return rows
    .map(
      (u) =>
        `<tr><td style="padding:8px;border-bottom:1px solid ${ENCORE_COLORS.border};"><strong>${escapeHtml(u.account)}</strong></td><td style="padding:8px;border-bottom:1px solid ${ENCORE_COLORS.border};">${money(u.limit)}</td><td style="padding:8px;border-bottom:1px solid ${ENCORE_COLORS.border};">${money(u.balance)}</td><td style="padding:8px;border-bottom:1px solid ${ENCORE_COLORS.border};color:${utilColor(u.pctUsed)};font-weight:bold;">${u.pctUsed}%</td><td style="padding:8px;border-bottom:1px solid ${ENCORE_COLORS.border};">${money(u.payTo30)}</td><td style="padding:8px;border-bottom:1px solid ${ENCORE_COLORS.border};">${money(u.payTo10)}</td></tr>`,
    )
    .join("");
}

function buildActionPlanHtml(
  actions: Array<{ time: string; action: string; reason: string }>,
): string {
  return actions
    .map(
      (a) =>
        `<tr><td style="padding:10px;border-bottom:1px solid ${ENCORE_COLORS.border};font-weight:bold;white-space:nowrap;background:${ENCORE_COLORS.navy};color:${ENCORE_COLORS.gold};">${escapeHtml(a.time)}</td><td style="padding:10px;border-bottom:1px solid ${ENCORE_COLORS.border};font-weight:bold;color:${ENCORE_COLORS.foreground};">${escapeHtml(a.action)}</td><td style="padding:10px;border-bottom:1px solid ${ENCORE_COLORS.border};color:${ENCORE_COLORS.muted};font-size:13px;">${escapeHtml(a.reason)}</td></tr>`,
    )
    .join("");
}

function lendingConversion(
  kind: GoalKind,
  scores: AnalystScores,
  mid: number | null,
  delta: number,
  t: TFn,
): {
  fha_status: string;
  goal_score: number;
  goal_description: string;
  mortgage_tu: number | null;
  mortgage_ex: number | null;
  mortgage_eq: number | null;
  lendingMid: number | null;
} {
  const convert = (s: number | null, bump: number) =>
    s == null ? null : clampScore(s - (delta + bump));

  if (kind === "fha" || kind === "conventional" || kind === "jumbo") {
    const mortgage_tu = convert(scores.transunion, 5); // ~FICO 4
    const mortgage_ex = convert(scores.experian, 0); // ~FICO 2
    const mortgage_eq = convert(scores.equifax, 8); // ~FICO 5
    const lendingMid = computeMiddleScore({
      transunion: mortgage_tu,
      experian: mortgage_ex,
      equifax: mortgage_eq,
    });
    const m = lendingMid ?? mid ?? 0;

    if (kind === "fha") {
      let status: string;
      if (m >= 580)
        status = t(
          "FHA Eligible (3.5% down path) — focus on rate optimization",
          "Elegible FHA (enganche 3.5%) — enfocarse en optimizar tasa",
        );
      else if (m >= 500)
        status = t(
          "FHA possible with 10% down (500–579) — strengthen mid score toward 580+",
          "FHA posible con 10% de enganche (500–579) — fortalecer puntaje medio hacia 580+",
        );
      else
        status = t(
          "Below typical FHA thresholds — prioritize score repair before application",
          "Por debajo de umbrales FHA típicos — priorizar reparación antes de aplicar",
        );
      return {
        fha_status: status,
        goal_score: Math.max(620, Math.min(680, nextTierGoal(m))),
        goal_description: t(
          "Target mortgage mid score typically 620–680 for stronger FHA pricing",
          "Meta de puntaje hipotecario medio típicamente 620–680 para mejor precio FHA",
        ),
        mortgage_tu,
        mortgage_ex,
        mortgage_eq,
        lendingMid,
      };
    }

    if (kind === "conventional") {
      const ok = m >= 620;
      return {
        fha_status: t(
          `Conventional Loan Eligibility: ${ok ? "Eligible at minimum — ideal 740+" : "Below 620 minimum — repair needed"}`,
          `Elegibilidad Hipoteca Convencional: ${ok ? "Elegible al mínimo — ideal 740+" : "Bajo el mínimo 620 — se necesita reparación"}`,
        ),
        goal_score: Math.max(
          680,
          Math.min(740, nextTierGoal(Math.max(m, 620))),
        ),
        goal_description: t(
          "Conventional programs typically need 620+; best pricing near 740+",
          "Programas convencionales suelen requerir 620+; mejor precio cerca de 740+",
        ),
        mortgage_tu,
        mortgage_ex,
        mortgage_eq,
        lendingMid,
      };
    }

    // jumbo
    const ok = m >= 700;
    return {
      fha_status: t(
        `Jumbo Loan Eligibility: ${ok ? "Meets common 700+ floor — ideal 740+" : "Below typical 700 Jumbo floor"}`,
        `Elegibilidad Préstamo Jumbo: ${ok ? "Cumple piso común 700+ — ideal 740+" : "Bajo el piso típico Jumbo de 700"}`,
      ),
      goal_score: Math.max(720, Math.min(760, nextTierGoal(Math.max(m, 700)))),
      goal_description: t(
        "Jumbo underwriting commonly looks for 700+, with 740+ preferred",
        "Suscripción Jumbo suele buscar 700+, con preferencia 740+",
      ),
      mortgage_tu,
      mortgage_ex,
      mortgage_eq,
      lendingMid,
    };
  }

  if (kind === "auto") {
    const autoDelta = Math.min(30, Math.max(10, Math.round(delta * 0.55)));
    const mortgage_tu =
      scores.transunion == null
        ? null
        : clampScore(scores.transunion - autoDelta + 2);
    const mortgage_ex =
      scores.experian == null ? null : clampScore(scores.experian - autoDelta);
    const mortgage_eq =
      scores.equifax == null
        ? null
        : clampScore(scores.equifax - autoDelta - 2);
    const lendingMid = computeMiddleScore({
      transunion: mortgage_tu,
      experian: mortgage_ex,
      equifax: mortgage_eq,
    });
    const m = lendingMid ?? mid ?? 0;
    const tier = autoTier(m);
    return {
      fha_status: t(
        `Auto Financing Tier: ${tier.tier} — ${tier.label}`,
        `Nivel Financiamiento Auto: ${tier.tier} — ${tier.label}`,
      ),
      goal_score: m < 660 ? 660 : m < 720 ? 720 : Math.min(760, m + 20),
      goal_description: t(
        "Auto lending scores often differ 10–30 pts from FICO 8; Tier 1 starts at 720+",
        "Puntajes auto suelen diferir 10–30 pts del FICO 8; Tier 1 inicia en 720+",
      ),
      mortgage_tu,
      mortgage_ex,
      mortgage_eq,
      lendingMid,
    };
  }

  if (kind === "business") {
    const m = mid ?? 0;
    let status: string;
    if (m >= 680)
      status = t(
        "Business Funding Eligibility: Strong for SBA / lines of credit",
        "Elegibilidad Financiamiento Empresarial: Fuerte para SBA / líneas de crédito",
      );
    else if (m >= 650)
      status = t(
        "Business Funding Eligibility: Possible for some SBA programs; strengthen toward 680+",
        "Elegibilidad Financiamiento Empresarial: Posible en algunos programas SBA; fortalecer hacia 680+",
      );
    else if (m >= 600)
      status = t(
        "Business Funding Eligibility: Some term loans possible; SBA/LOC prefer 680+",
        "Elegibilidad Financiamiento Empresarial: Algunos préstamos a plazo posibles; SBA/LOC prefieren 680+",
      );
    else
      status = t(
        "Business Funding Eligibility: Below common lender floors — prioritize personal FICO 8 repair",
        "Elegibilidad Financiamiento Empresarial: Bajo pisos comunes — priorizar reparación de FICO 8 personal",
      );
    return {
      fha_status: status,
      goal_score: Math.max(680, Math.min(720, nextTierGoal(m || 600))),
      goal_description: t(
        "Most business lenders use personal FICO 8 or SBSS; 680+ preferred",
        "La mayoría de prestamistas usan FICO 8 personal o SBSS; se prefiere 680+",
      ),
      mortgage_tu: scores.transunion,
      mortgage_ex: scores.experian,
      mortgage_eq: scores.equifax,
      lendingMid: mid,
    };
  }

  // general
  const m = mid ?? 0;
  const band = scoreBandLabel(m) || "FAIR";
  return {
    fha_status: t(
      `General Credit Health: ${band}`,
      `Salud Crediticia General: ${band}`,
    ),
    goal_score: nextTierGoal(m || 580),
    goal_description: t(
      "Focus on overall credit health and the next score tier",
      "Enfocarse en la salud crediticia general y el siguiente nivel de puntaje",
    ),
    mortgage_tu: scores.transunion,
    mortgage_ex: scores.experian,
    mortgage_eq: scores.equifax,
    lendingMid: mid,
  };
}

function timelineLabel(kind: GoalKind, t: TFn): string {
  if (kind === "auto")
    return t("Auto lending score progression", "Progresión puntaje auto");
  if (kind === "business")
    return t(
      "Business lending score progression",
      "Progresión puntaje financiamiento empresarial",
    );
  if (kind === "general")
    return t("Credit score progression", "Progresión del puntaje de crédito");
  return t(
    "Mortgage mid score progression",
    "Progresión puntaje hipotecario medio",
  );
}

function buildFileStrength(
  kind: GoalKind,
  util: AnalystUtilRow[],
  text: string,
  ranked: RankedNeg[],
  scores: AnalystScores,
  t: TFn,
): {
  labels: [string, string, string, string, string];
  values: [string, string, string, string, string];
  total: number;
  rating: string;
  tradelineNeeded: boolean;
  tradelineRec: string;
} {
  const openRev = countOpenRevolving(util, text);
  let fs1 = 0;
  let n1 = "";
  if (openRev >= 3) {
    fs1 = 20;
    n1 = t("3+ open bank cards / low util", "3+ tarjetas abiertas / util baja");
  } else if (openRev >= 1) {
    fs1 = 10;
    n1 = t("1–2 open revolving", "1–2 revolving abiertas");
  } else {
    fs1 = 0;
    n1 = t("no open bank revolving", "sin revolving bancario abierto");
  }

  const types =
    (util.length > 0 || /credit card|revolving/i.test(text) ? 1 : 0) +
    (/installment|student|personal loan/i.test(text) ? 1 : 0) +
    (hasAuto(text) ? 1 : 0) +
    (hasMortgage(text) ? 1 : 0);
  let fs2 = 10;
  let n2 = t("1 account type", "1 tipo de cuenta");
  if (types >= 3) {
    fs2 = 20;
    n2 = t("revolving + installment + auto", "revolving + installment + auto");
  } else if (types === 2) {
    fs2 = 15;
    n2 = t("2 account types", "2 tipos de cuenta");
  }

  let label3 = "";
  let fs3 = 0;
  let n3 = "";
  if (kind === "fha" || kind === "conventional" || kind === "jumbo") {
    label3 = t("Mortgage History", "Historial Hipotecario");
    if (hasMortgage(text)) {
      fs3 = 20;
      n3 = t("active mortgage on file", "hipoteca activa en archivo");
    } else {
      fs3 = 0;
      n3 = t(
        "no mortgage (expected for new buyers)",
        "sin hipoteca (esperado en compradores nuevos)",
      );
    }
  } else if (kind === "auto") {
    label3 = t("Auto Loan History", "Historial de Auto");
    if (/paid as agreed|never late/i.test(text) && hasAuto(text)) {
      fs3 = 20;
      n3 = t("prior auto loan paid on time", "auto previo pagado a tiempo");
    } else if (hasAuto(text)) {
      fs3 = 10;
      n3 = t("current auto loan", "auto actual");
    } else {
      fs3 = 0;
      n3 = t("no auto history", "sin historial de auto");
    }
  } else if (kind === "business") {
    label3 = t("Business Credit Lines", "Líneas de Crédito Empresarial");
    if (hasBusinessLine(text)) {
      fs3 = 20;
      n3 = t("business credit line on file", "línea empresarial en archivo");
    } else if (util.length > 0 || /credit card/i.test(text)) {
      fs3 = 10;
      n3 = t("personal lines only", "solo líneas personales");
    } else {
      fs3 = 0;
      n3 = t("none", "ninguna");
    }
  } else {
    label3 = t("Account Diversity", "Diversidad de Cuentas");
    const div =
      (hasMortgage(text) ? 1 : 0) +
      (hasAuto(text) ? 1 : 0) +
      (util.length > 0 || /credit card/i.test(text) ? 1 : 0);
    if (div >= 3) {
      fs3 = 20;
      n3 = t("mortgage + auto + cards", "hipoteca + auto + tarjetas");
    } else if (div === 2) {
      fs3 = 15;
      n3 = t("2 types", "2 tipos");
    } else if (div === 1) {
      fs3 = 10;
      n3 = t("1 type", "1 tipo");
    } else {
      fs3 = 5;
      n3 = t("thin file", "archivo delgado");
    }
  }

  const age = estimateAccountAgeYears(text);
  let fs4 = 5;
  let n4 = t("under 2 years", "menos de 2 años");
  if (age >= 7) {
    fs4 = 20;
    n4 = t("7+ years", "7+ años");
  } else if (age >= 3) {
    fs4 = 12;
    n4 = t("3–6 years", "3–6 años");
  }

  const remain = Math.min(ranked.length, 5);
  let fs5 = 20;
  let n5 = t("none expected after repair", "ninguno esperado tras reparación");
  if (remain >= 3) {
    fs5 = 5;
    n5 = t("3+ may remain", "3+ pueden permanecer");
  } else if (remain >= 1) {
    fs5 = 10;
    n5 = t("1–2 may remain", "1–2 pueden permanecer");
  }

  const total = fs1 + fs2 + fs3 + fs4 + fs5;
  let rating = "WEAK";
  if (total >= 80) rating = "STRONG";
  else if (total >= 60) rating = "GOOD";
  else if (total >= 40) rating = "MODERATE";

  const exNull = scores.experian == null;
  const tradelineNeeded =
    openRev === 0 ||
    exNull ||
    openRev + (hasInstallment(text) ? 1 : 0) < 2 ||
    age < 2 ||
    (text.match(/\baccount\b/gi) || []).length < 4;

  const tradelineRec = tradelineNeeded
    ? t(
        "Authorized-user / seasoned tradeline support may help deepen thin areas of the file after disputes begin.",
        "Una tradeline autorizada / sazonada puede ayudar a fortalecer áreas delgadas del archivo tras iniciar disputas.",
      )
    : t(
        "File depth looks adequate — prioritize disputes and utilization before adding tradelines.",
        "La profundidad del archivo parece adecuada — priorizar disputas y utilización antes de agregar tradelines.",
      );

  return {
    labels: [
      t(
        "Open Revolving Accounts (3+ needed)",
        "Cuentas Revolving Abiertas (se necesitan 3+)",
      ),
      t("Credit Mix", "Mezcla de Crédito"),
      label3,
      t("Account Age", "Antigüedad de Cuentas"),
      t("Negative Items Post-Repair", "Ítems Negativos Post-Reparación"),
    ],
    values: [
      fsFormat(fs1, 20, n1),
      fsFormat(fs2, 20, n2),
      fsFormat(fs3, 20, n3),
      fsFormat(fs4, 20, n4),
      fsFormat(fs5, 20, n5),
    ],
    total,
    rating,
    tradelineNeeded,
    tradelineRec,
  };
}

function bullet(items: string[]): string {
  return items.map((i) => `★ ${i}`).join("\n");
}

export function runCreditAnalysisAlgorithm(
  input: CreditAnalysisAlgorithmInput,
): CreditAnalysisAnalystFlat {
  const lang = resolveTextLanguage(input.language, input.lastName);
  const t = makeT(lang);
  const goalRaw =
    (input.clientGoal || "").trim() ||
    t("General Improvement", "Mejora General");
  const goalKind = classifyGoalKind(input.clientGoal);
  const scores = input.scores;
  const mid = computeMiddleScore(scores);
  const util =
    input.utilization ?? extractUtilizationFromText(input.reportText || "");
  const ranked = [...input.negatives.map(rankNegativeItem)].sort(
    (a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority],
  );
  for (const n of ranked) {
    n.dispute_basis = localizeDisputeBasis(n.dispute_basis, lang);
  }

  const delta = adjustmentFactors(util, ranked, input.reportText || "");
  const lending = lendingConversion(goalKind, scores, mid, delta, t);
  const lendingToday = lending.lendingMid ?? mid;

  const totalLimit = util.reduce((s, u) => s + u.limit, 0);
  const totalBal = util.reduce((s, u) => s + u.balance, 0);
  const totalPct =
    totalLimit > 0 ? Math.round((totalBal / totalLimit) * 100) : 0;
  const topUtil = [...util].sort((a, b) => b.pctUsed - a.pctUsed).slice(0, 3);

  const goalScore = lending.goal_score;
  const today = lendingToday;
  const gapToGoal = today != null ? Math.max(0, goalScore - today) : goalScore;
  const score_30 =
    today == null
      ? null
      : clampScore(today + Math.min(25, Math.round(gapToGoal * 0.2)));
  const score_60 =
    today == null
      ? null
      : clampScore(today + Math.min(45, Math.round(gapToGoal * 0.45)));
  const score_90 =
    today == null
      ? null
      : clampScore(today + Math.min(70, Math.round(gapToGoal * 0.7)));
  const score_target =
    today == null ? goalScore : clampScore(Math.min(goalScore, score_90! + 15));

  const top5 = ranked.slice(0, 5);
  const negSlots = [0, 1, 2, 3, 4].map((i) => top5[i] || null);

  const utilSlots = [0, 1, 2].map((i) => topUtil[i] || null);

  const fs = buildFileStrength(
    goalKind,
    util,
    input.reportText || "",
    ranked,
    scores,
    t,
  );

  const topNames = top5.map((n) => n.account).filter(Boolean);
  const round1 = bullet(
    [
      topNames[0]
        ? t(
            `Dispute ${topNames[0]} (${top5[0]?.priority}) with all reporting bureaus`,
            `Disputar ${topNames[0]} (${top5[0]?.priority}) con todas las agencias`,
          )
        : t(
            "Audit personal info & freeze unauthorized inquiries",
            "Auditar info personal y congelar consultas no autorizadas",
          ),
      topNames[1]
        ? t(
            `Package documentation for ${topNames[1]}`,
            `Preparar documentación para ${topNames[1]}`,
          )
        : t(
            "Pull method-of-verification requests for top derogatories",
            "Solicitar método de verificación de los principales negativos",
          ),
      t(
        "Keep all open accounts current — no new late marks",
        "Mantener todas las cuentas al corriente — sin nuevos atrasos",
      ),
    ].slice(0, 4),
  );

  const round2 = bullet([
    t(
      "Follow up Round 1 disputes; escalate inconsistent bureau responses",
      "Seguimiento de disputas Ronda 1; escalar respuestas inconsistentes",
    ),
    topNames[2]
      ? t(
          `Second-wave dispute on ${topNames[2]}`,
          `Segunda ola de disputa sobre ${topNames[2]}`,
        )
      : t(
          "Re-dispute remaining HIGH items with fresh evidence",
          "Redisputar ítems HIGH restantes con evidencia nueva",
        ),
    totalPct > 30
      ? t(
          "Re-check revolving utilization after paydown progress",
          "Revisar utilización revolving tras avances de pago",
        )
      : t(
          "Protect positive accounts — do not close oldest cards",
          "Proteger cuentas positivas — no cerrar las tarjetas más antiguas",
        ),
  ]);

  const round3 = bullet([
    t(
      "Final challenge on stubborn negatives still reporting",
      "Desafío final a negativos persistentes que siguen reportando",
    ),
    t(
      "Confirm deletions/updates across TU, EX, and EQ",
      "Confirmar eliminaciones/actualizaciones en TU, EX y EQ",
    ),
    fs.tradelineNeeded
      ? t(
          "Evaluate seasoned tradeline if file still thin for goal",
          "Evaluar tradeline sazonada si el archivo sigue delgado para la meta",
        )
      : t(
          "Lock in utilization under 10–30% before funding applications",
          "Fijar utilización bajo 10–30% antes de solicitudes de financiamiento",
        ),
  ]);

  const actions = [
    {
      time: t("WEEK 1", "SEMANA 1"),
      action: t(
        "Complete credit analysis review & dispute intake",
        "Completar revisión del análisis e ingreso de disputas",
      ),
      reason: t(
        "Establish accurate baseline and priority queue",
        "Establecer línea base precisa y cola de prioridades",
      ),
    },
    {
      time: t("WEEK 1–2", "SEMANA 1–2"),
      action: t(
        "File Round 1 disputes on CRITICAL/HIGH items",
        "Presentar disputas Ronda 1 en ítems CRITICAL/HIGH",
      ),
      reason: t(
        "Highest-impact negatives move first",
        "Los negativos de mayor impacto se atienden primero",
      ),
    },
    {
      time: t("MONTH 1", "MES 1"),
      action:
        totalPct > 30
          ? t(
              "Lower revolving utilization toward 30%",
              "Bajar utilización revolving hacia 30%",
            )
          : t(
              "Hold utilization at or under 30%",
              "Mantener utilización en o bajo 30%",
            ),
      reason: t(
        "Utilization is a fast-moving FICO lever",
        "La utilización es una palanca FICO de movimiento rápido",
      ),
    },
    {
      time: t("MONTH 2", "MES 2"),
      action: t(
        "Round 2 follow-ups + bureau consistency checks",
        "Seguimientos Ronda 2 + chequeos de consistencia entre agencias",
      ),
      reason: t(
        "Catch metro 2 mismatches and incomplete deletions",
        "Detectar inconsistencias metro 2 y eliminaciones incompletas",
      ),
    },
    {
      time: t("MONTH 2–3", "MES 2–3"),
      action: t(
        "Round 3 + goal-specific readiness check",
        "Ronda 3 + revisión de preparación según la meta",
      ),
      reason: lending.goal_description,
    },
    {
      time: t("MONTH 3+", "MES 3+"),
      action: fs.tradelineNeeded
        ? t(
            "Consider file-strength options (tradeline / mix)",
            "Considerar opciones de fortaleza (tradeline / mezcla)",
          )
        : t(
            "Re-score & prepare lending application package",
            "Re-puntuar y preparar paquete de solicitud de financiamiento",
          ),
      reason: t(
        "Align timing with goal score and lender guidelines",
        "Alinear el momento con el puntaje meta y guías del prestamista",
      ),
    },
  ];

  const positives =
    input.positiveAccounts && input.positiveAccounts.length
      ? input.positiveAccounts.slice(0, 5).join("; ")
      : t(
          "Keep oldest revolving accounts open and paid as agreed.",
          "Mantener abiertas las revolving más antiguas y pagadas según acuerdo.",
        );

  const rep =
    (input.repName || "").trim() ||
    t("Your Encore Advisor", "Tu Asesor Encore");
  const premium =
    "https://www.encoremortgage.org";

  let line1: string;
  let line2: string;
  if (goalKind === "auto") {
    line1 = t(
      `Hi ${input.firstName}, your estimated auto lending mid score is ${lendingToday ?? "—"}.`,
      `Hola ${input.firstName}, tu puntaje medio estimado de auto es ${lendingToday ?? "—"}.`,
    );
    line2 = lending.fha_status;
  } else if (goalKind === "business") {
    line1 = t(
      `Hi ${input.firstName}, your business lending score (personal FICO 8 mid) is ${lendingToday ?? "—"}.`,
      `Hola ${input.firstName}, tu puntaje de financiamiento empresarial (FICO 8 medio) es ${lendingToday ?? "—"}.`,
    );
    line2 = lending.fha_status;
  } else if (goalKind === "general") {
    line1 = t(
      `Hi ${input.firstName}, your current mid score is ${mid ?? "—"}.`,
      `Hola ${input.firstName}, tu puntaje medio actual es ${mid ?? "—"}.`,
    );
    line2 = t(
      `There's clear room to climb toward ${goalScore} with a focused dispute plan.`,
      `Hay un claro margen para subir hacia ${goalScore} con un plan de disputas enfocado.`,
    );
  } else {
    line1 = t(
      `Hi ${input.firstName}, your estimated mortgage mid score is ${lendingToday ?? "—"}.`,
      `Hola ${input.firstName}, tu puntaje hipotecario medio estimado es ${lendingToday ?? "—"}.`,
    );
    line2 = lending.fha_status;
  }
  const line3 = t(
    `When you're ready, start here: ${premium}`,
    `Cuando estés listo, comienza aquí: ${premium}`,
  );
  const client_text_message = `${line1} ${line2}\n${line3}\n- ${rep} | Encore Mortgage`;

  const utilNote =
    totalPct > 50
      ? t(
          "Utilization is elevated — paying revolving balances down is one of the fastest score levers.",
          "La utilización está elevada — bajar saldos revolving es una de las palancas más rápidas.",
        )
      : totalPct > 30
        ? t(
            "Utilization is above the ideal 30% band on one or more cards.",
            "La utilización está por encima del rango ideal del 30% en una o más tarjetas.",
          )
        : t(
            "Revolving utilization looks manageable — protect it while disputes run.",
            "La utilización revolving se ve manejable — protégela mientras corren las disputas.",
          );

  const gap = (s: number | null) =>
    s == null || goalScore == null ? null : Math.max(0, goalScore - s);

  const out: CreditAnalysisAnalystFlat = {
    client_name: input.clientName,
    analysis_goal: goalRaw,
    report_date: input.reportDate || new Date().toISOString().slice(0, 10),
    referral_name: "Encore Mortgage",
    referral_company: "Encore Mortgage",

    score_transunion: scores.transunion,
    score_experian: scores.experian,
    score_equifax: scores.equifax,
    score_tu_label: scoreBandLabel(scores.transunion),
    score_ex_label: scoreBandLabel(scores.experian),
    score_eq_label: scoreBandLabel(scores.equifax),
    middle_score: mid,
    fha_status: lending.fha_status,
    goal_score: goalScore,
    goal_description: lending.goal_description,
    gap_tu: gap(lending.mortgage_tu ?? scores.transunion),
    gap_ex: gap(lending.mortgage_ex ?? scores.experian),
    gap_eq: gap(lending.mortgage_eq ?? scores.equifax),

    neg_1_account: negSlots[0]?.account || "",
    neg_1_type: negSlots[0]?.type || "",
    neg_1_bureaus: negSlots[0]?.bureaus || "",
    neg_1_priority: negSlots[0]?.priority || "",
    neg_1_dispute_basis: negSlots[0]?.dispute_basis || "",
    neg_2_account: negSlots[1]?.account || "",
    neg_2_type: negSlots[1]?.type || "",
    neg_2_bureaus: negSlots[1]?.bureaus || "",
    neg_2_priority: negSlots[1]?.priority || "",
    neg_2_dispute_basis: negSlots[1]?.dispute_basis || "",
    neg_3_account: negSlots[2]?.account || "",
    neg_3_type: negSlots[2]?.type || "",
    neg_3_bureaus: negSlots[2]?.bureaus || "",
    neg_3_priority: negSlots[2]?.priority || "",
    neg_3_dispute_basis: negSlots[2]?.dispute_basis || "",
    neg_4_account: negSlots[3]?.account || "",
    neg_4_type: negSlots[3]?.type || "",
    neg_4_bureaus: negSlots[3]?.bureaus || "",
    neg_4_priority: negSlots[3]?.priority || "",
    neg_4_dispute_basis: negSlots[3]?.dispute_basis || "",
    neg_5_account: negSlots[4]?.account || "",
    neg_5_type: negSlots[4]?.type || "",
    neg_5_bureaus: negSlots[4]?.bureaus || "",
    neg_5_priority: negSlots[4]?.priority || "",
    neg_5_dispute_basis: negSlots[4]?.dispute_basis || "",

    utilization_critical_note: utilNote,
    util_1_account: utilSlots[0]?.account || "",
    util_1_limit: utilSlots[0] ? money(utilSlots[0].limit) : "",
    util_1_balance: utilSlots[0] ? money(utilSlots[0].balance) : "",
    util_1_percent: utilSlots[0] ? `${utilSlots[0].pctUsed}%` : "",
    util_1_pay30: utilSlots[0] ? money(utilSlots[0].payTo30) : "",
    util_1_pay10: utilSlots[0] ? money(utilSlots[0].payTo10) : "",
    util_2_account: utilSlots[1]?.account || "",
    util_2_limit: utilSlots[1] ? money(utilSlots[1].limit) : "",
    util_2_balance: utilSlots[1] ? money(utilSlots[1].balance) : "",
    util_2_percent: utilSlots[1] ? `${utilSlots[1].pctUsed}%` : "",
    util_2_pay30: utilSlots[1] ? money(utilSlots[1].payTo30) : "",
    util_2_pay10: utilSlots[1] ? money(utilSlots[1].payTo10) : "",
    util_3_account: utilSlots[2]?.account || "",
    util_3_limit: utilSlots[2] ? money(utilSlots[2].limit) : "",
    util_3_balance: utilSlots[2] ? money(utilSlots[2].balance) : "",
    util_3_percent: utilSlots[2] ? `${utilSlots[2].pctUsed}%` : "",
    util_3_pay30: utilSlots[2] ? money(utilSlots[2].payTo30) : "",
    util_3_pay10: utilSlots[2] ? money(utilSlots[2].payTo10) : "",
    total_revolving_limit: money(totalLimit),
    total_revolving_balance: money(totalBal),
    total_revolving_util: `${totalPct}%`,
    paydown_30_instruction:
      totalPct > 30
        ? t(
            `Pay down about ${money(Math.max(0, totalBal - totalLimit * 0.3))} across revolving to reach ~30% util.`,
            `Abona aproximadamente ${money(Math.max(0, totalBal - totalLimit * 0.3))} en revolving para llegar a ~30% de util.`,
          )
        : t(
            "Already near or under 30% — maintain statement balances.",
            "Ya cerca o bajo 30% — mantén los saldos del estado de cuenta.",
          ),
    paydown_10_instruction:
      totalPct > 10
        ? t(
            `For stronger scoring, target ~10% util (~${money(Math.max(0, totalBal - totalLimit * 0.1))} paydown).`,
            `Para un puntaje más fuerte, apunta a ~10% util (~${money(Math.max(0, totalBal - totalLimit * 0.1))} de abono).`,
          )
        : t(
            "Utilization already near the 10% sweet spot.",
            "La utilización ya está cerca del punto ideal del 10%.",
          ),

    score_today: today,
    score_30_days: score_30,
    score_60_days: score_60,
    score_90_days: score_90,
    score_target,
    target_timeframe: `${timelineLabel(goalKind, t)} · ${t("≈ 90 days", "≈ 90 días")}`,

    round_1_actions: round1,
    round_2_actions: round2,
    round_3_actions: round3,
    positive_accounts_protect: positives,

    action_1_time: actions[0].time,
    action_1_action: actions[0].action,
    action_1_reason: actions[0].reason,
    action_2_time: actions[1].time,
    action_2_action: actions[1].action,
    action_2_reason: actions[1].reason,
    action_3_time: actions[2].time,
    action_3_action: actions[2].action,
    action_3_reason: actions[2].reason,
    action_4_time: actions[3].time,
    action_4_action: actions[3].action,
    action_4_reason: actions[3].reason,
    action_5_time: actions[4].time,
    action_5_action: actions[4].action,
    action_5_reason: actions[4].reason,
    action_6_time: actions[5].time,
    action_6_action: actions[5].action,
    action_6_reason: actions[5].reason,

    file_strength_score: fs.total,
    file_strength_rating: fs.rating,
    fs_label_1: fs.labels[0],
    fs_open_revolving: fs.values[0],
    fs_label_2: fs.labels[1],
    fs_installment_mix: fs.values[1],
    fs_label_3: fs.labels[2],
    fs_mortgage: fs.values[2],
    fs_label_4: fs.labels[3],
    fs_account_age: fs.values[3],
    fs_label_5: fs.labels[4],
    fs_post_repair: fs.values[4],
    tradeline_recommendation: fs.tradelineRec,

    negative_items_html: buildNegativeHtml(ranked),
    negative_count: ranked.length,
    critical_count: ranked.filter((n) => n.priority === "CRITICAL").length,
    high_count: ranked.filter((n) => n.priority === "HIGH").length,
    utilization_html: buildUtilHtml(util),
    action_plan_html: buildActionPlanHtml(actions),
    mortgage_tu: lending.mortgage_tu,
    mortgage_ex: lending.mortgage_ex,
    mortgage_eq: lending.mortgage_eq,
    tradeline_needed: fs.tradelineNeeded ? t("Yes", "Sí") : t("No", "No"),
    client_text_message,
    text_language: lang,
  };

  if (input.weakExtraction) {
    out.utilization_critical_note = t(
      "Limited PDF text extraction — scores and tables may be incomplete. Re-upload a text-based SmartCredit PDF for a full analysis.",
      "Extracción limitada del PDF — puntajes y tablas pueden estar incompletos. Sube un PDF de texto de SmartCredit para un análisis completo.",
    );
    out.fha_status = t(
      "Analysis limited — could not fully read the report",
      "Análisis limitado — no se pudo leer el informe por completo",
    );
  }

  return out;
}

/**
 * Rich HTML narrative for email + result panel (Encore navy/gold styling).
 */
export function buildAnalystAnalysisHtml(opts: {
  firstName: string;
  analyst: CreditAnalysisAnalystFlat;
  weakExtraction?: boolean;
  croaDisclosure: string;
}): { html: string; text: string } {
  const a = opts.analyst;
  const isEs = a.text_language === "Spanish";
  const C = ENCORE_COLORS;

  if (opts.weakExtraction) {
    const html = `
      <h2 style="margin:0 0 12px;font-size:20px;font-weight:800;color:${C.foreground};">${isEs ? `Tu análisis de crédito, ${escapeHtml(opts.firstName)}` : `Your Credit Analysis, ${escapeHtml(opts.firstName)}`}</h2>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#334155;">${escapeHtml(a.utilization_critical_note)}</p>
      <p style="margin:16px 0 0;font-size:12px;line-height:1.5;color:#94a3b8;">${opts.croaDisclosure}</p>
    `.trim();
    return {
      html,
      text: [
        isEs
          ? `Tu análisis de crédito, ${opts.firstName}`
          : `Your Credit Analysis, ${opts.firstName}`,
        a.utilization_critical_note,
        opts.croaDisclosure,
      ].join("\n\n"),
    };
  }

  const scoreRow = (label: string, score: number | null, band: string) =>
    `<td style="padding:12px;text-align:center;border:1px solid ${C.border};">
      <div style="font-size:11px;font-weight:700;letter-spacing:0.06em;color:${C.muted};text-transform:uppercase;">${label}</div>
      <div style="font-size:28px;font-weight:800;color:${C.navy};margin:6px 0;">${score ?? "—"}</div>
      <div style="font-size:11px;font-weight:700;color:${C.gold};">${escapeHtml(band || "—")}</div>
    </td>`;

  const html = `
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:800;color:${C.navy};">${isEs ? `Tu análisis de crédito, ${escapeHtml(opts.firstName)}` : `Your Credit Analysis, ${escapeHtml(opts.firstName)}`}</h2>
    <p style="margin:0 0 20px;font-size:14px;color:${C.muted};">${isEs ? "Meta" : "Goal"}: <strong style="color:${C.foreground};">${escapeHtml(a.analysis_goal)}</strong></p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;border-collapse:collapse;">
      <tr>
        ${scoreRow("TransUnion", a.score_transunion, a.score_tu_label)}
        ${scoreRow("Experian", a.score_experian, a.score_ex_label)}
        ${scoreRow("Equifax", a.score_equifax, a.score_eq_label)}
      </tr>
    </table>

    <div style="margin:0 0 20px;padding:16px;border-radius:12px;background:${C.cardBg};border:1px solid ${C.border};">
      <div style="font-size:12px;font-weight:700;color:${C.gold};letter-spacing:0.04em;text-transform:uppercase;margin-bottom:6px;">${isEs ? "Puntaje medio / meta" : "Mid score / goal"}</div>
      <p style="margin:0 0 8px;font-size:15px;color:#334155;"><strong style="color:${C.navy};font-size:22px;">${a.middle_score ?? "—"}</strong>
        → <strong style="color:${C.gold};">${a.goal_score}</strong></p>
      <p style="margin:0;font-size:14px;color:#334155;">${escapeHtml(a.fha_status)}</p>
      <p style="margin:8px 0 0;font-size:13px;color:${C.muted};">${escapeHtml(a.goal_description)}</p>
    </div>

    ${
      a.negative_count > 0
        ? `<h3 style="margin:0 0 8px;font-size:15px;font-weight:800;color:${C.navy};">${isEs ? "Ítems negativos (prioridad de disputa)" : "Negative items (dispute priority)"}</h3>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;border-collapse:collapse;font-size:13px;">
        <tr style="background:${C.navy};color:${C.gold};">
          <th style="padding:8px;text-align:left;">${isEs ? "Cuenta" : "Account"}</th>
          <th style="padding:8px;text-align:left;">${isEs ? "Tipo" : "Type"}</th>
          <th style="padding:8px;text-align:center;">${isEs ? "Agencias" : "Bureaus"}</th>
          <th style="padding:8px;text-align:center;">${isEs ? "Prioridad" : "Priority"}</th>
          <th style="padding:8px;text-align:left;">${isEs ? "Base" : "Basis"}</th>
        </tr>
        ${a.negative_items_html}
      </table>`
        : `<p style="margin:0 0 20px;font-size:14px;color:${C.utilOk};font-weight:600;">${isEs ? "No detectamos ítems negativos obvios." : "No obvious negative items detected."}</p>`
    }

    ${
      a.utilization_html
        ? `<h3 style="margin:0 0 8px;font-size:15px;font-weight:800;color:${C.navy};">${isEs ? "Utilización revolving" : "Revolving utilization"}</h3>
      <p style="margin:0 0 8px;font-size:13px;color:${C.muted};">${escapeHtml(a.utilization_critical_note)}</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 8px;border-collapse:collapse;font-size:13px;">
        <tr style="background:${C.cardBg};">
          <th style="padding:8px;text-align:left;">${isEs ? "Cuenta" : "Account"}</th>
          <th style="padding:8px;text-align:left;">${isEs ? "Límite" : "Limit"}</th>
          <th style="padding:8px;text-align:left;">${isEs ? "Saldo" : "Balance"}</th>
          <th style="padding:8px;text-align:left;">Util%</th>
          <th style="padding:8px;text-align:left;">→30%</th>
          <th style="padding:8px;text-align:left;">→10%</th>
        </tr>
        ${a.utilization_html}
      </table>
      <p style="margin:0 0 20px;font-size:12px;color:${C.muted};">${escapeHtml(a.total_revolving_util)} util · ${escapeHtml(a.paydown_30_instruction)}</p>`
        : ""
    }

    <h3 style="margin:0 0 8px;font-size:15px;font-weight:800;color:${C.navy};">${isEs ? "Línea de tiempo estimada" : "Estimated timeline"}</h3>
    <p style="margin:0 0 4px;font-size:13px;color:${C.muted};">${escapeHtml(a.target_timeframe)}</p>
    <p style="margin:0 0 20px;font-size:14px;color:#334155;">
      <strong>${a.score_today ?? "—"}</strong> → 30d <strong>${a.score_30_days ?? "—"}</strong> → 60d <strong>${a.score_60_days ?? "—"}</strong> → 90d <strong>${a.score_90_days ?? "—"}</strong> → ${isEs ? "meta" : "target"} <strong style="color:${C.gold};">${a.score_target ?? "—"}</strong>
    </p>

    <h3 style="margin:0 0 8px;font-size:15px;font-weight:800;color:${C.navy};">${isEs ? "Fortaleza del archivo" : "File strength"}: ${a.file_strength_score}/100 · ${escapeHtml(a.file_strength_rating)}</h3>
    <ul style="margin:0 0 20px;padding-left:18px;font-size:13px;color:#334155;line-height:1.7;">
      <li><strong>${escapeHtml(a.fs_label_1)}</strong> — ${escapeHtml(a.fs_open_revolving)}</li>
      <li><strong>${escapeHtml(a.fs_label_2)}</strong> — ${escapeHtml(a.fs_installment_mix)}</li>
      <li><strong>${escapeHtml(a.fs_label_3)}</strong> — ${escapeHtml(a.fs_mortgage)}</li>
      <li><strong>${escapeHtml(a.fs_label_4)}</strong> — ${escapeHtml(a.fs_account_age)}</li>
      <li><strong>${escapeHtml(a.fs_label_5)}</strong> — ${escapeHtml(a.fs_post_repair)}</li>
    </ul>

    <h3 style="margin:0 0 8px;font-size:15px;font-weight:800;color:${C.navy};">${isEs ? "Plan de acción" : "Action plan"}</h3>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;border-collapse:collapse;font-size:13px;">
      ${a.action_plan_html}
    </table>

    <div style="margin:0 0 16px;padding:14px;border-left:3px solid ${C.gold};background:${C.cardBg};">
      <div style="font-size:12px;font-weight:700;color:${C.navy};margin-bottom:6px;">${isEs ? "Mensaje para el cliente" : "Client message"}</div>
      <p style="margin:0;font-size:13px;line-height:1.6;color:#334155;white-space:pre-wrap;">${escapeHtml(a.client_text_message)}</p>
    </div>

    <p style="margin:16px 0 0;font-size:12px;line-height:1.5;color:#94a3b8;">${opts.croaDisclosure}</p>
  `.trim();

  const text = [
    isEs
      ? `Tu análisis de crédito, ${opts.firstName}`
      : `Your Credit Analysis, ${opts.firstName}`,
    `Goal: ${a.analysis_goal}`,
    `TU ${a.score_transunion ?? "—"} (${a.score_tu_label}) · EX ${a.score_experian ?? "—"} (${a.score_ex_label}) · EQ ${a.score_equifax ?? "—"} (${a.score_eq_label})`,
    `Mid: ${a.middle_score ?? "—"} → Goal: ${a.goal_score}`,
    a.fha_status,
    a.goal_description,
    `Negatives: ${a.negative_count} (CRITICAL ${a.critical_count}, HIGH ${a.high_count})`,
    a.neg_1_account &&
      `${a.neg_1_priority}: ${a.neg_1_account} — ${a.neg_1_type}`,
    a.neg_2_account &&
      `${a.neg_2_priority}: ${a.neg_2_account} — ${a.neg_2_type}`,
    a.neg_3_account &&
      `${a.neg_3_priority}: ${a.neg_3_account} — ${a.neg_3_type}`,
    `Timeline: ${a.score_today} → ${a.score_30_days} → ${a.score_60_days} → ${a.score_90_days} → ${a.score_target}`,
    `File strength: ${a.file_strength_score}/100 ${a.file_strength_rating}`,
    a.client_text_message,
    opts.croaDisclosure,
  ]
    .filter(Boolean)
    .join("\n\n");

  return { html, text };
}

