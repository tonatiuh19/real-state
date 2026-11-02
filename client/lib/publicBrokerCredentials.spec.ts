import { describe, expect, it } from "vitest";
import { formatPublicCredentialLine } from "./publicBrokerCredentials";

describe("formatPublicCredentialLine", () => {
  it("formats mortgage banker with NMLS", () => {
    expect(
      formatPublicCredentialLine({
        kind: "mortgage_banker",
        licenseNumber: "380277",
      }),
    ).toBe("Mortgage Banker · NMLS #380277");
  });

  it("formats realtor with DRE", () => {
    expect(
      formatPublicCredentialLine({
        kind: "realtor",
        licenseNumber: "01215661",
      }),
    ).toBe("Realtor · DRE #01215661");
  });

  it("strips existing prefixes", () => {
    expect(
      formatPublicCredentialLine({
        kind: "mortgage_banker",
        licenseNumber: "NMLS #580077",
      }),
    ).toBe("Mortgage Banker · NMLS #580077");
  });

  it("hides license when missing", () => {
    expect(
      formatPublicCredentialLine({
        kind: "mortgage_banker",
        licenseNumber: null,
      }),
    ).toBe("Mortgage Banker");
    expect(
      formatPublicCredentialLine({ kind: "realtor", licenseNumber: "  " }),
    ).toBe("Realtor");
  });
});
