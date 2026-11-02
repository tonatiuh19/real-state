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
  it("detects Xactus / Statewide tri-merge", () => {
    const text = `
      370 Reed Rd., Suite 100 Broomall, PA 19008
      Client Code: X-12345
      Repositories: TUC/EXP/EQX
      Credit Assure CreditXpert
      FICO Score 4
      FICO Score 2
      FICO Score 5
    `;
    expect(detectProvider(text)).toBe("xactus");
    expect(detectProvider("Xactus Credit Report")).toBe("xactus");
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

  it("reads Xactus bureau scores (FICO 4/2/5 + explicit lines)", () => {
    const text = `
      Client Code: X-999
      Repositories: TUC/EXP/EQX
      370 Reed Rd
      FICO Score 4
      FICO Score 2
      FICO Score 5
      Credit Assure
      TransUnion 550
      Experian 622
      Equifax 594
    `;
    expect(detectProvider(text)).toBe("xactus");
    const s = extractAllScores(text);
    expect(s.transunion).toBe(550);
    expect(s.experian).toBe(622);
    expect(s.equifax).toBe(594);
  });

  it("skips Fair Isaac score ranges on Xactus headers", () => {
    const text = `
      Client Code: X-1
      Repositories: TUC/EXP/EQX
      Lester Garcia TransUnion FICO Score 4 Fair Isaac 309-839
      TransUnion 550
      Experian 622
      Equifax 594
    `;
    const s = extractAllScores(text);
    expect(s.transunion).toBe(550);
    expect(s.experian).toBe(622);
    expect(s.equifax).toBe(594);
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

  it("parses Xactus Underwriting Alerts creditors", () => {
    const text = `
      Client Code: X-1
      Repositories: TUC/EXP/EQX
      Collection Accounts: The following account(s) are reported as collection accounts:
      CAVALRY PORTFOLIO SERV, LVNV FUNDING LLC, DNF ASSOC.
      Order tradeline update to confirm accuracy of reported
      Disputed Accounts: The following account(s) are reported as having been disputed by the
      consumer: LOANME INC (EXP), CITI (TUC). If using an automated underwriting process, order a Rapid
      Charge Off Accounts: The following account(s) are reported as Charge Off accounts:
      CAPITAL ONE, JPMCB CARD SERVICES. Order tradeline update to confirm accuracy of reported
      Credit Summary
      TransUnion 550
      Experian 622
      Equifax 594
    `;
    const lines = detectNegativeLines(text);
    expect(lines.some((l) => /CAVALRY/i.test(l))).toBe(true);
    expect(lines.some((l) => /CAPITAL ONE/i.test(l))).toBe(true);
    expect(lines.some((l) => /LOANME/i.test(l))).toBe(true);
    const items = buildNegativeItems(lines);
    expect(items.some((i) => i.type === "Collection")).toBe(true);
    expect(items.some((i) => i.type === "Charge-Off")).toBe(true);
    expect(items.some((i) => i.type === "Dispute")).toBe(true);
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
    const text = "TransUnion 700 Experian 710 Equifax 705 ".repeat(3);
    expect(resolveExtractionStatus("application/pdf", text, false)).toBe("ok");
  });
});
