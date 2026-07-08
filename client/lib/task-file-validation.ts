/**
 * Shared validation + routing for client task document uploads.
 *
 * These rules MUST match the PHP upload server (enteratelo-php):
 *  - uploadPDFs.php:   application/pdf, .pdf extension, max 5 MB
 *  - uploadImages.php: image/jpeg | image/png, .jpg/.jpeg/.png
 *
 * Document fields accept EITHER a PDF or a photo. We classify by the actual
 * file (not the field type) and route each file to the correct endpoint, so a
 * client can simply snap a photo of their ID instead of making a PDF.
 *
 * Keeping this pure + shared prevents the "silent" acceptance that let a task
 * be marked complete with no stored document (LA08597405 incident).
 */

export const MAX_PDF_BYTES = 5 * 1024 * 1024; // 5 MB (server hard limit)
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10 MB (client guard)

export type UploadFileType = "pdf" | "image";

export interface FileLike {
  name: string;
  type: string;
  size: number;
}

export interface FileValidationResult {
  ok: boolean;
  fileType?: UploadFileType;
  errorTitle?: string;
  errorMessage?: string;
}

function extensionOf(name: string): string {
  const parts = name.split(".");
  return parts.length > 1 ? (parts.pop() as string).toLowerCase() : "";
}

/**
 * Classify + validate a selected file for a document task field.
 * Returns the routing fileType on success, or a user-facing error otherwise.
 */
export function validateTaskFile(file: FileLike): FileValidationResult {
  const ext = extensionOf(file.name);
  const isPdf = file.type === "application/pdf" || ext === "pdf";
  const isImage =
    file.type === "image/jpeg" ||
    file.type === "image/png" ||
    ["jpg", "jpeg", "png"].includes(ext);

  if (!isPdf && !isImage) {
    return {
      ok: false,
      errorTitle: "Unsupported file",
      errorMessage:
        "Please upload a PDF or a JPG/PNG photo. (iPhone HEIC photos aren't supported — set Camera to 'Most Compatible', or convert to JPG/PDF.)",
    };
  }

  const fileType: UploadFileType = isPdf ? "pdf" : "image";
  const maxBytes = isPdf ? MAX_PDF_BYTES : MAX_IMAGE_BYTES;

  if (file.size > maxBytes) {
    return {
      ok: false,
      fileType,
      errorTitle: "File too large",
      errorMessage: `${isPdf ? "PDF" : "Photo"} must be ${
        isPdf ? "5" : "10"
      } MB or smaller. "${file.name}" is ${(file.size / 1024 / 1024).toFixed(
        1,
      )} MB.`,
    };
  }

  return { ok: true, fileType };
}

/** File input `accept` value for document fields (PDF or photo). */
export const TASK_FILE_ACCEPT =
  ".pdf,application/pdf,image/png,image/jpeg,image/jpg,.jpg,.jpeg,.png";
