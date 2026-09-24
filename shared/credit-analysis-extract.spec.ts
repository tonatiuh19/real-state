import { describe, expect, it } from "vitest";
import {
  detectProvider,
  extractAllScores,
  detectNegativeLines,
  buildNegativeItems,
  inferAnalysisLabelSlugs,
  resolveExtractionStatus,
} from "./credit-analysis-extract";

describe("detectProvider", () => {
  it("prefers SmartCredit", () => {
    expect(detectProvider("SmartCredit Tri-Merge Report")).toBe("smartcredit");
  });
  it("detects IdentityIQ", () => {
    expect(detectProvider("IdentityIQ credit report")).toBe("identityiq");
  });
  it("detects MyFreeScoreNow family as myscoreiq", () => {
    expect(detectProvider("MyFreeScoreNow 3B report")).toBe("myscoreiq");
  });
});

describe("extractAllScores", () => {
  it("reads TU/EX/EQ from SmartCredit-like text", () => {
    const text = `
      SmartCredit Report
      TransUnion Score 702
      Experian Score 688
      Equifax Score 695
    `;
    const s = extractAllScores(text);
    expect(s.transunion).toBe(702);
    expect(s.experian).toBe(688);
    expect(s.equifax).toBe(695);
  });
});

describe("negatives + labels", () => {
  it("classifies collection lines and suggests labels", () => {
    const lines = detectNegativeLines(
      "CAPITAL ONE collection $450\nHard inquiry from AUTO FINANCE\nbankruptcy discharged",
    );
    expect(lines.length).toBeGreaterThan(0);
    const items = buildNegativeItems(lines);
    expect(items.some((i) => /collection|inquiry|bankrupt/i.test(i.type))).toBe(
      true,
    );
    const labels = inferAnalysisLabelSlugs(lines, "mortgage housing FHA");
    expect(labels).toContain("housing");
  });
});

describe("resolveExtractionStatus", () => {
  it("marks non-pdf unsupported", () => {
    expect(resolveExtractionStatus("image/jpeg", "", false)).toBe(
      "unsupported_type",
    );
  });
  it("marks empty pdf empty", () => {
    expect(resolveExtractionStatus("application/pdf", "   ", false)).toBe(
      "empty",
    );
  });
  it("marks parse failure", () => {
    expect(resolveExtractionStatus("application/pdf", "", true)).toBe(
      "parse_failed",
    );
  });
  it("ok when text present", () => {
    expect(
      resolveExtractionStatus("application/pdf", "TransUnion 700", false),
    ).toBe("ok");
  });
});
