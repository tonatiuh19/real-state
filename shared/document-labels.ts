/**
 * Semantic download labels for checklist / task documents.
 * Used by client download UX and API Content-Disposition naming.
 */

export type DocumentDownloadLabel =
  | "ID"
  | "Seguro"
  | "Bank_Statement"
  | "Document";

/** Map task / field titles to a stable download stem (Daniel: ID / Seguro / Bank). */
export function resolveDocumentDownloadLabel(input: {
  taskTitle?: string | null;
  fieldName?: string | null;
  fieldLabel?: string | null;
}): DocumentDownloadLabel {
  const hay = [
    input.fieldName,
    input.fieldLabel,
    input.taskTitle,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (
    /\bssn\b/.test(hay) ||
    hay.includes("social security") ||
    hay.includes("seguro") ||
    hay.includes("borrower_ssn") ||
    hay.includes("spouse_ssn")
  ) {
    return "Seguro";
  }
  if (
    hay.includes("borrower_id") ||
    hay.includes("spouse_id") ||
    /\bid\b/.test(hay) ||
    hay.includes("identification") ||
    hay.includes("driver") ||
    hay.includes("passport") ||
    hay.includes("green card")
  ) {
    return "ID";
  }
  if (hay.includes("bank") || hay.includes("statement")) {
    return "Bank_Statement";
  }
  return "Document";
}

/** Build a safe download filename: LA123_ID.pdf or LA123_Seguro_spouse.pdf */
export function buildDocumentDownloadFilename(opts: {
  applicationNumber?: string | null;
  label: DocumentDownloadLabel;
  fieldName?: string | null;
  fieldLabel?: string | null;
  extension?: string;
}): string {
  const ext = (opts.extension || "pdf").replace(/^\./, "") || "pdf";
  const loan = (opts.applicationNumber || "DOC")
    .replace(/[^\w.-]+/g, "_")
    .slice(0, 40);
  let suffix = "";
  const field = `${opts.fieldName || ""} ${opts.fieldLabel || ""}`.toLowerCase();
  if (field.includes("spouse") || field.includes("co-borrower")) {
    suffix = "_spouse";
  } else if (field.includes("month_1") || field.includes("month 1")) {
    suffix = "_Month1";
  } else if (field.includes("month_2") || field.includes("month 2")) {
    suffix = "_Month2";
  }
  return `${loan}_${opts.label}${suffix}.${ext}`;
}
