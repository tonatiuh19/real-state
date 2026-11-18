import { describe, expect, it } from "vitest";
import type { SendableLine } from "@shared/api";
import { resolveFromLine } from "./phoneLinesSlice";

const lines: SendableLine[] = [
  {
    number: "+15550000001",
    kind: "personal",
    label: "My line",
    owner_broker_id: 1,
    is_default: true,
  },
  {
    number: "+15623370000",
    kind: "main",
    label: "Main line",
    owner_broker_id: null,
    is_default: false,
  },
  {
    number: "+15550000002",
    kind: "delegated",
    label: "Daniel's line",
    owner_broker_id: 2,
    is_default: false,
  },
];

describe("resolveFromLine", () => {
  it("returns null with no lines", () => {
    expect(resolveFromLine([], "+15550000001", "+15623370000")).toBeNull();
  });
  it("defaults to the is_default line", () => {
    expect(resolveFromLine(lines, null)).toBe("+15550000001");
  });
  it("falls back to first line when none is default", () => {
    const l = lines.map((x) => ({ ...x, is_default: false }));
    expect(resolveFromLine(l, null)).toBe("+15550000001");
  });
  it("prefers the thread inbox when it is one of the user's lines", () => {
    expect(resolveFromLine(lines, null, "+15623370000")).toBe("+15623370000");
  });
  it("ignores a thread inbox the user cannot send from", () => {
    expect(resolveFromLine(lines, null, "+19999999999")).toBe("+15550000001");
  });
  it("explicit selection wins over thread inbox", () => {
    expect(resolveFromLine(lines, "+15550000002", "+15623370000")).toBe(
      "+15550000002",
    );
  });
  it("ignores a stale selection not in the list", () => {
    expect(resolveFromLine(lines, "+10000000000", "+15623370000")).toBe(
      "+15623370000",
    );
  });
});
