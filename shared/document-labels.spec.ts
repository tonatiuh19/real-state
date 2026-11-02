import { describe, it, expect } from "vitest";
import {
  buildDocumentDownloadFilename,
  resolveDocumentDownloadLabel,
} from "./document-labels";

describe("resolveDocumentDownloadLabel", () => {
  it("maps ID tasks", () => {
    expect(
      resolveDocumentDownloadLabel({ taskTitle: "Government-Issued ID" }),
    ).toBe("ID");
    expect(
      resolveDocumentDownloadLabel({ fieldName: "borrower_id" }),
    ).toBe("ID");
  });

  it("maps Seguro / SSN", () => {
    expect(
      resolveDocumentDownloadLabel({
        taskTitle: "Social Security Card (SSN)",
      }),
    ).toBe("Seguro");
    expect(
      resolveDocumentDownloadLabel({ fieldLabel: "Borrower Social Security Card" }),
    ).toBe("Seguro");
  });

  it("maps bank statements", () => {
    expect(
      resolveDocumentDownloadLabel({ taskTitle: "2 Months Bank Statements" }),
    ).toBe("Bank_Statement");
  });
});

describe("buildDocumentDownloadFilename", () => {
  it("includes loan number and spouse/month suffixes", () => {
    expect(
      buildDocumentDownloadFilename({
        applicationNumber: "LA12345678",
        label: "ID",
        extension: "pdf",
      }),
    ).toBe("LA12345678_ID.pdf");

    expect(
      buildDocumentDownloadFilename({
        applicationNumber: "LA12345678",
        label: "Seguro",
        fieldName: "spouse_ssn",
        extension: "jpg",
      }),
    ).toBe("LA12345678_Seguro_spouse.jpg");

    expect(
      buildDocumentDownloadFilename({
        applicationNumber: "LA99",
        label: "Bank_Statement",
        fieldName: "bank_statement_month_2",
      }),
    ).toBe("LA99_Bank_Statement_Month2.pdf");
  });
});
