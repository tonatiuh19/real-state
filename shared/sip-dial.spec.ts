import { describe, expect, it } from "vitest";
import { parseSipDialTarget, parseSipEndpoints } from "./sip-dial";

const D = "encore.sip.twilio.com";

describe("parseSipDialTarget", () => {
  it("10-digit, 11-digit and E.164 dialing", () => {
    expect(parseSipDialTarget(`sip:5624490000@${D}`)).toEqual({ kind: "pstn", number: "+15624490000" });
    expect(parseSipDialTarget(`sip:15624490000@${D};user=phone`)).toEqual({ kind: "pstn", number: "+15624490000" });
    expect(parseSipDialTarget(`sip:+15624490000@${D}`)).toEqual({ kind: "pstn", number: "+15624490000" });
    expect(parseSipDialTarget(`sip:%2B15624490000@${D}`)).toEqual({ kind: "pstn", number: "+15624490000" });
    expect(parseSipDialTarget(`<sip:5624490000@${D}>`)?.kind).toBe("pstn");
  });

  it("outside-line 9 prefix", () => {
    expect(parseSipDialTarget(`sip:915624490000@${D}`)).toEqual({ kind: "pstn", number: "+15624490000" });
  });

  it("emergency numbers", () => {
    expect(parseSipDialTarget(`sip:911@${D}`)).toEqual({ kind: "emergency", number: "911" });
    expect(parseSipDialTarget(`sip:933@${D}`)).toEqual({ kind: "emergency", number: "933" });
  });

  it("refuses international, premium, short and junk", () => {
    expect(parseSipDialTarget(`sip:+525512345678@${D}`)).toBeNull();
    expect(parseSipDialTarget(`sip:011525512345678@${D}`)).toBeNull();
    expect(parseSipDialTarget(`sip:9005551234@${D}`)).toBeNull();
    expect(parseSipDialTarget(`sip:1234@${D}`)).toBeNull();
    expect(parseSipDialTarget(`sip:0125551234@${D}`)).toBeNull();
    expect(parseSipDialTarget(`sip:frontdesk@${D}`)).toBeNull();
    expect(parseSipDialTarget("")).toBeNull();
    expect(parseSipDialTarget(null)).toBeNull();
  });
});

describe("parseSipEndpoints", () => {
  it("parses json/csv and drops invalid", () => {
    expect(parseSipEndpoints(`["sip:frontdesk@${D}","nope","sip:frontdesk@${D}"]`)).toEqual([`sip:frontdesk@${D}`]);
    expect(parseSipEndpoints(`sip:a@${D}, sip:b@${D}`)).toEqual([`sip:a@${D}`, `sip:b@${D}`]);
    expect(parseSipEndpoints("")).toEqual([]);
  });
});
