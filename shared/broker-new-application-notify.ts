/**
 * Pure helpers for broker email alerts when a client submits via a public share link.
 * Runtime send lives in api/index.ts (Vercel serverless); keep this as the source of truth
 * for recipient rules and copy so smoke/unit tests can validate without the API bundle.
 */

export function uniqueFiniteBrokerIds(
  ids: Array<number | null | undefined>,
): number[] {
  return [...new Set(ids.filter((id): id is number => typeof id === "number" && Number.isFinite(id)))];
}

/** Skip placeholder / missing broker emails (same guard as voicemail alerts). */
export function shouldEmailBrokerAddress(
  email: string | null | undefined,
): boolean {
  const trimmed = String(email || "").trim();
  if (!trimmed) return false;
  if (trimmed.toLowerCase().startsWith("noemail_")) return false;
  return true;
}

export function publicApplyLoanTypeLabel(
  loanType?: string | null,
): string {
  if (loanType === "refinance") return "Refinance";
  if (loanType === "purchase") return "Purchase";
  return loanType || "Loan";
}

/**
 * Only email when a share-link (or otherwise resolved) banker/partner exists.
 * Empty list keeps legacy bell-only fanout to all admins without inbox spam.
 */
export function shouldSendBrokerNewPublicApplicationEmail(
  brokerIds: number[],
): boolean {
  return uniqueFiniteBrokerIds(brokerIds).length > 0;
}

export function brokerNewApplicationEmailSubject(
  clientName: string,
  applicationNumber: string,
): string {
  const name = clientName.trim() || "a client";
  return `New application from ${name} — ${applicationNumber}`;
}
