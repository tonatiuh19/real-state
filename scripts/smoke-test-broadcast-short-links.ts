/**
 * Smoke: short-link helpers + api/index.ts inline drift gate (no live Twilio).
 * Run: npx tsx scripts/smoke-test-broadcast-short-links.ts
 *      npm run validate:broadcast-short-links
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  BROADCAST_MMS_MAX_RECIPIENTS,
  BROADCAST_MMS_QUOTA_MIN_SEGMENTS,
  LINK_ASSET_RETENTION_DAYS,
  assertBroadcastMmsAudienceOk,
  broadcastSmsQuotaUnits,
  buildPortalShortLinkUrl,
  estimateBroadcastUnits,
  estimateSmsSegments,
  generateShortLinkCode,
  isAllowedShortLinkTargetUrl,
  shouldSkipBulkForBroadcastMedia,
  smsSegmentWarningLevel,
} from "../shared/short-links";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

function assertApiInlineDrift() {
  const apiPath = path.join(ROOT, "api/index.ts");
  const src = fs.readFileSync(apiPath, "utf8");

  assert.equal(
    src.includes('from "../shared/short-links'),
    false,
    "api/index.ts must not import shared/short-links (Vercel inline)",
  );
  assert.ok(
    src.includes("Short links (inlined from shared/short-links.ts"),
    "api/index.ts missing short-links inline marker",
  );
  assert.ok(
    src.includes(`const BROADCAST_MMS_MAX_RECIPIENTS = ${BROADCAST_MMS_MAX_RECIPIENTS}`),
    "api BROADCAST_MMS_MAX_RECIPIENTS drifted from shared",
  );
  assert.ok(
    src.includes(
      `const BROADCAST_MMS_QUOTA_MIN_SEGMENTS = ${BROADCAST_MMS_QUOTA_MIN_SEGMENTS}`,
    ),
    "api BROADCAST_MMS_QUOTA_MIN_SEGMENTS drifted from shared",
  );
  assert.ok(
    src.includes(`const LINK_ASSET_RETENTION_DAYS = ${LINK_ASSET_RETENTION_DAYS}`),
    "api LINK_ASSET_RETENTION_DAYS drifted from shared",
  );
  assert.ok(
    src.includes("handleCronPurgeLinkAssets"),
    "api missing purge-link-assets cron handler",
  );
  assert.ok(
    src.includes('"/api/cron/purge-link-assets"'),
    "api missing purge-link-assets route",
  );
  assert.ok(
    src.includes("isAllowedShortLinkTargetUrlInline"),
    "api missing short-link host allowlist helper",
  );
  assert.ok(
    src.includes("requirePlatformOwnerForShortLinks"),
    "api missing platform_owner gate for short links",
  );
  assert.ok(
    src.includes("broadcastSmsQuotaUnits"),
    "api missing broadcastSmsQuotaUnits (MMS quota floor)",
  );

  const vercel = JSON.parse(
    fs.readFileSync(path.join(ROOT, "vercel.json"), "utf8"),
  ) as { routes?: Array<{ src?: string; dest?: string }> };
  const hasL = (vercel.routes ?? []).some(
    (r) => typeof r.src === "string" && r.src.includes("/l/"),
  );
  assert.ok(hasL, "vercel.json missing /l/(.*) → api/index.ts route");
}

function main() {
  assertApiInlineDrift();

  const code = generateShortLinkCode(8);
  assert.match(code, /^[a-zA-Z0-9]{8}$/);
  const url = buildPortalShortLinkUrl(code);
  assert.equal(url, `https://portal.encoremortgage.org/l/${code}`);

  const gsm = estimateSmsSegments("Hi friend, rates dropped. Call us today.");
  assert.equal(gsm.encoding, "GSM-7");
  assert.equal(smsSegmentWarningLevel(gsm.segments), "ok");

  const unicode = estimateSmsSegments("👋 long emoji flyer text ".repeat(20));
  assert.equal(unicode.encoding, "UCS-2");
  assert.ok(unicode.segments >= SMS_SOFT());

  assert.equal(assertBroadcastMmsAudienceOk(BROADCAST_MMS_MAX_RECIPIENTS).ok, true);
  assert.equal(assertBroadcastMmsAudienceOk(BROADCAST_MMS_MAX_RECIPIENTS + 1).ok, false);

  assert.equal(broadcastSmsQuotaUnits("Hi", true), BROADCAST_MMS_QUOTA_MIN_SEGMENTS);
  assert.equal(
    estimateBroadcastUnits({
      channel: "sms",
      smsBody: "Hi",
      emailRecipientCount: 0,
      smsRecipientCount: 10,
      hasMedia: true,
    }).sms_segments,
    10 * BROADCAST_MMS_QUOTA_MIN_SEGMENTS,
  );

  assert.equal(
    isAllowedShortLinkTargetUrl("https://portal.encoremortgage.org/x").ok,
    true,
  );
  assert.equal(isAllowedShortLinkTargetUrl("https://evil.example/x").ok, false);
  assert.equal(
    shouldSkipBulkForBroadcastMedia("https://portal.encoremortgage.org/a"),
    true,
  );
  assert.equal(LINK_ASSET_RETENTION_DAYS, 90);

  console.log("OK smoke-test-broadcast-short-links");
}

function SMS_SOFT() {
  return 3;
}

main();
