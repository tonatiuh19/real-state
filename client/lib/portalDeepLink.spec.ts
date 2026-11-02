import { describe, expect, it } from "vitest";
import {
  buildFreeAnalysisPortalShareUrl,
  sanitizePortalNextPath,
} from "./portalDeepLink";

describe("sanitizePortalNextPath", () => {
  it("allows portal free-analysis", () => {
    expect(sanitizePortalNextPath("/portal/free-analysis")).toBe(
      "/portal/free-analysis",
    );
  });

  it("rejects external and non-portal paths", () => {
    expect(sanitizePortalNextPath("https://evil.com")).toBe("/portal");
    expect(sanitizePortalNextPath("//evil.com")).toBe("/portal");
    expect(sanitizePortalNextPath("/admin")).toBe("/portal");
    expect(sanitizePortalNextPath(null)).toBe("/portal");
  });
});

describe("buildFreeAnalysisPortalShareUrl", () => {
  it("appends free-analysis to broker apply share URL", () => {
    expect(
      buildFreeAnalysisPortalShareUrl("https://portal.example.com/apply/alex"),
    ).toBe("https://portal.example.com/apply/alex/free-analysis");
  });

  it("is idempotent when already a free-analysis URL", () => {
    expect(
      buildFreeAnalysisPortalShareUrl(
        "https://portal.example.com/apply/alex/free-analysis",
      ),
    ).toBe("https://portal.example.com/apply/alex/free-analysis");
  });

  it("handles trailing slash on apply URL", () => {
    expect(
      buildFreeAnalysisPortalShareUrl("https://portal.example.com/apply/alex/"),
    ).toBe("https://portal.example.com/apply/alex/free-analysis");
  });
});
