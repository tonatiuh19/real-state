/**
 * Safe post-login redirect targets for client portal deep links.
 * Only same-origin relative /portal/* paths are allowed.
 */
export function sanitizePortalNextPath(
  raw: string | null | undefined,
  fallback = "/portal",
): string {
  if (!raw) return fallback;
  let decoded = raw;
  try {
    decoded = decodeURIComponent(raw);
  } catch {
    return fallback;
  }
  const path = decoded.trim();
  if (!path.startsWith("/portal")) return fallback;
  if (path.startsWith("//") || path.includes("://")) return fallback;
  if (path.includes("\\") || path.includes("@")) return fallback;
  // block query/hash injection of external schemes
  if (/^[a-z]+:/i.test(path)) return fallback;
  return path;
}

/**
 * Shareable Free Analysis entry — same pattern as the portal wizard share link.
 * Uses the broker's `/apply/{slug|token}` base and appends `/free-analysis`.
 * New visitors can complete Free Analysis without an existing CRM login;
 * the public API creates them as a draft pipeline lead when they are new.
 */
export function buildFreeAnalysisPortalShareUrl(applyShareUrl: string): string {
  const base = applyShareUrl.replace(/\/$/, "");
  if (!base) return "";
  // Already a free-analysis URL
  if (/\/free-analysis\/?$/i.test(base)) return base;
  return `${base}/free-analysis`;
}
