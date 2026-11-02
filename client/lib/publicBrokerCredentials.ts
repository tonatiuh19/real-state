/**
 * Public apply-landing title + license line.
 * Realtors → DRE #; mortgage bankers / platform owners → NMLS #.
 * Missing license → title only (no placeholder).
 */
export function formatPublicCredentialLine(opts: {
  /** Use "realtor" for partner brokers; anything else → Mortgage Banker + NMLS */
  kind: "realtor" | "mortgage_banker";
  licenseNumber?: string | null;
}): string {
  const title =
    opts.kind === "realtor" ? "Realtor" : "Mortgage Banker";
  const raw = opts.licenseNumber?.trim();
  if (!raw) return title;
  const cleaned = raw.replace(/^(NMLS|DRE)\s*#?\s*/i, "").trim();
  if (!cleaned) return title;
  const prefix = opts.kind === "realtor" ? "DRE #" : "NMLS #";
  return `${title} · ${prefix}${cleaned}`;
}
