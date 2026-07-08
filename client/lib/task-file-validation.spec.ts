import { describe, it, expect } from "vitest";
import {
  validateTaskFile,
  MAX_PDF_BYTES,
  MAX_IMAGE_BYTES,
  type FileLike,
} from "./task-file-validation";

const f = (over: Partial<FileLike>): FileLike => ({
  name: "doc.pdf",
  type: "application/pdf",
  size: 1024,
  ...over,
});

describe("validateTaskFile - PDFs", () => {
  it("accepts a valid PDF by mime + extension", () => {
    const r = validateTaskFile(f({ name: "id.pdf", type: "application/pdf" }));
    expect(r.ok).toBe(true);
    expect(r.fileType).toBe("pdf");
  });

  it("accepts a PDF by extension even if mime is empty (mobile)", () => {
    const r = validateTaskFile(f({ name: "scan.PDF", type: "" }));
    expect(r.ok).toBe(true);
    expect(r.fileType).toBe("pdf");
  });

  it("rejects a PDF over 5MB", () => {
    const r = validateTaskFile(
      f({ name: "big.pdf", type: "application/pdf", size: MAX_PDF_BYTES + 1 }),
    );
    expect(r.ok).toBe(false);
    expect(r.fileType).toBe("pdf");
    expect(r.errorTitle).toBe("File too large");
  });

  it("accepts a PDF exactly at the 5MB boundary", () => {
    const r = validateTaskFile(
      f({ name: "edge.pdf", type: "application/pdf", size: MAX_PDF_BYTES }),
    );
    expect(r.ok).toBe(true);
  });
});

describe("validateTaskFile - images", () => {
  it("accepts a JPEG", () => {
    const r = validateTaskFile(f({ name: "photo.jpg", type: "image/jpeg" }));
    expect(r.ok).toBe(true);
    expect(r.fileType).toBe("image");
  });

  it("accepts a PNG", () => {
    const r = validateTaskFile(f({ name: "photo.png", type: "image/png" }));
    expect(r.ok).toBe(true);
    expect(r.fileType).toBe("image");
  });

  it("accepts an image by extension when mime is generic", () => {
    const r = validateTaskFile(
      f({ name: "IMG_0001.JPEG", type: "application/octet-stream" }),
    );
    expect(r.ok).toBe(true);
    expect(r.fileType).toBe("image");
  });

  it("rejects an image over 10MB", () => {
    const r = validateTaskFile(
      f({ name: "huge.png", type: "image/png", size: MAX_IMAGE_BYTES + 1 }),
    );
    expect(r.ok).toBe(false);
    expect(r.fileType).toBe("image");
  });

  it("allows an image between 5MB and 10MB (unlike PDFs)", () => {
    const r = validateTaskFile(
      f({ name: "mid.jpg", type: "image/jpeg", size: 8 * 1024 * 1024 }),
    );
    expect(r.ok).toBe(true);
  });
});

describe("validateTaskFile - unsupported types", () => {
  it("rejects HEIC (iPhone default) with a helpful message", () => {
    const r = validateTaskFile(f({ name: "photo.heic", type: "image/heic" }));
    expect(r.ok).toBe(false);
    expect(r.fileType).toBeUndefined();
    expect(r.errorMessage).toMatch(/HEIC/i);
  });

  it("rejects a Word document", () => {
    const r = validateTaskFile(
      f({
        name: "resume.docx",
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      }),
    );
    expect(r.ok).toBe(false);
  });

  it("rejects a file with no extension and unknown mime", () => {
    const r = validateTaskFile(f({ name: "noext", type: "" }));
    expect(r.ok).toBe(false);
  });

  it("rejects a spoofed .pdf.exe style name (extension is exe)", () => {
    const r = validateTaskFile(f({ name: "invoice.pdf.exe", type: "" }));
    expect(r.ok).toBe(false);
  });

  it("rejects a gif image (only jpg/png supported by server)", () => {
    const r = validateTaskFile(f({ name: "anim.gif", type: "image/gif" }));
    expect(r.ok).toBe(false);
  });
});
