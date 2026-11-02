import { describe, expect, it } from "vitest";
import {
  assertBroadcastMmsAudienceOk,
  BROADCAST_MMS_MAX_RECIPIENTS,
  BROADCAST_MMS_QUOTA_MIN_SEGMENTS,
  broadcastSmsQuotaUnits,
  buildEmailCtaButtonHtml,
  buildPortalShortLinkUrl,
  buildShortSmsInviteTemplate,
  estimateBroadcastUnits,
  estimateSmsSegments,
  generateShortLinkCode,
  isAllowedShortLinkTargetUrl,
  shouldSkipBulkForBroadcastMedia,
  smsSegmentWarningLevel,
  smsSegmentsFromBody,
} from "./short-links";

describe("short-links helpers", () => {
  it("GSM-7 short body is 1 segment", () => {
    const body = "Hi there, rates dropped. Call us.";
    const r = estimateSmsSegments(body);
    expect(r.encoding).toBe("GSM-7");
    expect(r.segments).toBe(1);
    expect(smsSegmentsFromBody(body)).toBe(1);
    expect(smsSegmentWarningLevel(r.segments)).toBe("ok");
  });

  it("emoji forces UCS-2 and multiplies segments", () => {
    const long =
      "👋 This isn’t just about selling, it’s about educating our community, providing clarity, and helping families make informed decisions with confidence. 🤝 Please reach out whenever you need payment comparisons.";
    const r = estimateSmsSegments(long);
    expect(r.encoding).toBe("UCS-2");
    expect(r.segments).toBeGreaterThanOrEqual(3);
    expect(smsSegmentsFromBody(long)).toBe(r.segments);
    expect(smsSegmentWarningLevel(r.segments)).not.toBe("ok");
  });

  it("MMS quota units use min segment floor", () => {
    expect(broadcastSmsQuotaUnits("Hi", false)).toBe(1);
    expect(broadcastSmsQuotaUnits("Hi", true)).toBe(
      BROADCAST_MMS_QUOTA_MIN_SEGMENTS,
    );
    const long =
      "👋 This isn’t just about selling, it’s about educating our community, providing clarity, and helping families make informed decisions with confidence. 🤝 Please reach out whenever you need payment comparisons.";
    const bodySegs = smsSegmentsFromBody(long);
    expect(broadcastSmsQuotaUnits(long, true)).toBe(
      Math.max(bodySegs, BROADCAST_MMS_QUOTA_MIN_SEGMENTS),
    );
  });

  it("estimateBroadcastUnits applies UCS-2 + MMS surcharge", () => {
    const ascii = estimateBroadcastUnits({
      channel: "sms",
      smsBody: "Hello rates are down",
      emailRecipientCount: 0,
      smsRecipientCount: 10,
    });
    expect(ascii.sms_segments).toBe(10);

    const withMms = estimateBroadcastUnits({
      channel: "sms",
      smsBody: "Hello rates are down",
      emailRecipientCount: 0,
      smsRecipientCount: 10,
      hasMedia: true,
    });
    expect(withMms.sms_segments).toBe(10 * BROADCAST_MMS_QUOTA_MIN_SEGMENTS);

    const unicode = estimateBroadcastUnits({
      channel: "sms",
      smsBody: "👋 rates ".repeat(40),
      emailRecipientCount: 0,
      smsRecipientCount: 2,
    });
    expect(unicode.sms_segments).toBeGreaterThan(2);
  });

  it("builds portal short URL", () => {
    expect(buildPortalShortLinkUrl("Ab12Cd34")).toBe(
      "https://portal.encoremortgage.org/l/Ab12Cd34",
    );
  });

  it("generates alphanumeric codes", () => {
    const c = generateShortLinkCode(8);
    expect(c).toHaveLength(8);
    expect(c).toMatch(/^[a-zA-Z0-9]+$/);
  });

  it("MMS audience cap", () => {
    expect(assertBroadcastMmsAudienceOk(50).ok).toBe(true);
    expect(assertBroadcastMmsAudienceOk(51).ok).toBe(false);
    expect(BROADCAST_MMS_MAX_RECIPIENTS).toBe(50);
  });

  it("allowlists Encore hosts and rejects open phishing targets", () => {
    expect(
      isAllowedShortLinkTargetUrl(
        "https://portal.encoremortgage.org/flyer.pdf",
      ).ok,
    ).toBe(true);
    expect(
      isAllowedShortLinkTargetUrl("https://admin.encoremortgage.org/x").ok,
    ).toBe(true);
    expect(isAllowedShortLinkTargetUrl("https://evil.example/phish").ok).toBe(
      false,
    );
    expect(
      isAllowedShortLinkTargetUrl("https://cdn.example.com/a.pdf", [
        "cdn.example.com",
      ]).ok,
    ).toBe(true);
    expect(isAllowedShortLinkTargetUrl("http://localhost:8080/api/x").ok).toBe(
      true,
    );
  });

  it("skips Bulk when media_url set", () => {
    expect(shouldSkipBulkForBroadcastMedia(null)).toBe(false);
    expect(shouldSkipBulkForBroadcastMedia("")).toBe(false);
    expect(
      shouldSkipBulkForBroadcastMedia(
        "https://portal.encoremortgage.org/api/link-assets/public/abc",
      ),
    ).toBe(true);
  });

  it("email CTA button html", () => {
    const html = buildEmailCtaButtonHtml({
      url: "https://portal.encoremortgage.org/l/x",
      label: "Open flyer",
    });
    expect(html).toContain("https://portal.encoremortgage.org/l/x");
    expect(html).toContain("Open flyer");
  });

  it("short SMS template", () => {
    const t = buildShortSmsInviteTemplate({
      shortUrl: "https://portal.encoremortgage.org/l/abc",
    });
    expect(t).toContain("{{first_name}}");
    expect(t).toContain("https://portal.encoremortgage.org/l/abc");
  });
});
