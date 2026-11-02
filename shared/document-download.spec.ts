import { describe, expect, it } from "vitest";
import {
  buildTinyJpeg,
  buildTinyPng,
  isHtmlBuffer,
  pngToRgb,
  prepareDocumentDownloadBytes,
  resolveCdnFileUrl,
} from "./document-download";
import { buildStoreZip } from "./zip-store";

describe("resolveCdnFileUrl", () => {
  it("prefixes relative /data/encore paths with /data/api base", () => {
    expect(
      resolveCdnFileUrl("/data/encore/1/images/a.jpg"),
    ).toBe(
      "https://disruptinglabs.com/data/api/data/encore/1/images/a.jpg",
    );
  });

  it("passes through absolute https URLs", () => {
    expect(resolveCdnFileUrl("https://cdn.example/x.pdf")).toBe(
      "https://cdn.example/x.pdf",
    );
  });

  it("returns null for empty path", () => {
    expect(resolveCdnFileUrl("")).toBeNull();
  });
});

describe("pngToRgb", () => {
  it("decodes 1x1 RGB PNG", () => {
    const decoded = pngToRgb(buildTinyPng());
    expect(decoded).not.toBeNull();
    expect(decoded!.width).toBe(1);
    expect(decoded!.height).toBe(1);
    expect([...decoded!.rgb]).toEqual([255, 0, 0]);
  });
});

describe("prepareDocumentDownloadBytes", () => {
  it("rejects HTML CDN miss bodies", () => {
    const html = Buffer.from("<!DOCTYPE html><html><body>404</body></html>");
    expect(isHtmlBuffer(html)).toBe(true);
    expect(prepareDocumentDownloadBytes(html, { documentType: "image" })).toBeNull();
  });

  it("wraps JPEG as PDF with .pdf extension", () => {
    const jpeg = buildTinyJpeg();
    const prepared = prepareDocumentDownloadBytes(jpeg, {
      documentType: "image",
    });
    expect(prepared).not.toBeNull();
    expect(prepared!.extension).toBe("pdf");
    expect(prepared!.contentType).toBe("application/pdf");
    expect(prepared!.data.subarray(0, 5).toString("utf8")).toBe("%PDF-");
  });

  it("wraps PNG as PDF with .pdf extension", () => {
    const png = buildTinyPng();
    const prepared = prepareDocumentDownloadBytes(png, {
      documentType: "image",
    });
    expect(prepared).not.toBeNull();
    expect(prepared!.extension).toBe("pdf");
    expect(prepared!.contentType).toBe("application/pdf");
    expect(prepared!.data.subarray(0, 5).toString("utf8")).toBe("%PDF-");
  });

  it("passes through PDF bytes", () => {
    const pdf = Buffer.from("%PDF-1.4\n%%EOF\n");
    const prepared = prepareDocumentDownloadBytes(pdf, {});
    expect(prepared!.extension).toBe("pdf");
    expect(prepared!.data.equals(pdf)).toBe(true);
  });
});

describe("buildStoreZip", () => {
  it("builds a zip that contains the PDF entry name", () => {
    const jpeg = buildTinyJpeg();
    const prepared = prepareDocumentDownloadBytes(jpeg, {
      documentType: "image",
    })!;
    const zip = buildStoreZip([
      { name: "LA1_ID.pdf", data: prepared.data },
    ]);
    expect(zip.subarray(0, 4).readUInt32LE(0)).toBe(0x04034b50);
    expect(zip.toString("utf8")).toContain("LA1_ID.pdf");
  });
});
