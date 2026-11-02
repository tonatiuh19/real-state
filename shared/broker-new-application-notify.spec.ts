import { describe, it, expect } from "vitest";
import {
  uniqueFiniteBrokerIds,
  shouldEmailBrokerAddress,
  publicApplyLoanTypeLabel,
  shouldSendBrokerNewPublicApplicationEmail,
  brokerNewApplicationEmailSubject,
} from "./broker-new-application-notify";

describe("uniqueFiniteBrokerIds", () => {
  it("dedupes and drops null/undefined/non-finite", () => {
    expect(
      uniqueFiniteBrokerIds([450002, null, 450002, undefined, NaN, 99]),
    ).toEqual([450002, 99]);
  });

  it("returns empty for no assignees", () => {
    expect(uniqueFiniteBrokerIds([null, undefined])).toEqual([]);
  });
});

describe("shouldEmailBrokerAddress", () => {
  it("accepts real emails", () => {
    expect(shouldEmailBrokerAddress("Alyssa@encoremortgage.org")).toBe(true);
  });

  it("rejects empty and noemail_ placeholders", () => {
    expect(shouldEmailBrokerAddress("")).toBe(false);
    expect(shouldEmailBrokerAddress("   ")).toBe(false);
    expect(shouldEmailBrokerAddress("noemail_450002@example.com")).toBe(false);
    expect(shouldEmailBrokerAddress(null)).toBe(false);
  });
});

describe("publicApplyLoanTypeLabel", () => {
  it("maps known types and falls back", () => {
    expect(publicApplyLoanTypeLabel("purchase")).toBe("Purchase");
    expect(publicApplyLoanTypeLabel("refinance")).toBe("Refinance");
    expect(publicApplyLoanTypeLabel("home_equity")).toBe("home_equity");
    expect(publicApplyLoanTypeLabel(null)).toBe("Loan");
  });
});

describe("shouldSendBrokerNewPublicApplicationEmail", () => {
  it("sends only when at least one broker is resolved", () => {
    expect(shouldSendBrokerNewPublicApplicationEmail([450002])).toBe(true);
    expect(shouldSendBrokerNewPublicApplicationEmail([])).toBe(false);
  });
});

describe("brokerNewApplicationEmailSubject", () => {
  it("includes client and application number", () => {
    expect(
      brokerNewApplicationEmailSubject("Griselda Munguia", "LA64479201"),
    ).toBe("New application from Griselda Munguia — LA64479201");
  });
});
