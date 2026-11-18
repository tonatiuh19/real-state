import { describe, expect, it } from "vitest";
import {
  buildSendableLines,
  delegatedOwnerIdsForScope,
  isSendableLine,
  normalizeLineE164,
  parseRingBrokerIds,
  scopeBrokerIdSet,
} from "./broker-delegation";

describe("broker-delegation", () => {
  it("normalizes phones", () => {
    expect(normalizeLineE164("562-337-0000")).toBe("+15623370000");
    expect(normalizeLineE164("15623370000")).toBe("+15623370000");
    expect(normalizeLineE164("+15623370000")).toBe("+15623370000");
    expect(normalizeLineE164("123")).toBeNull();
    expect(normalizeLineE164(null)).toBeNull();
  });

  it("parses ring broker ids from json/csv/garbage", () => {
    expect(parseRingBrokerIds("[2880002, 3]")).toEqual([2880002, 3]);
    expect(parseRingBrokerIds("5, 5, x, -1, 7")).toEqual([5, 7]);
    expect(parseRingBrokerIds("")).toEqual([]);
    expect(parseRingBrokerIds("12")).toEqual([12]);
  });

  it("filters delegations by scope", () => {
    const rows = [
      {
        owner_broker_id: 3,
        delegate_broker_id: 9,
        can_view_clients: 1,
        can_view_realtors: 0,
        can_view_conversations: 1,
        can_send_from_line: 1,
      },
      {
        owner_broker_id: 4,
        delegate_broker_id: 9,
        can_view_clients: 0,
        can_view_realtors: 1,
        can_view_conversations: 0,
        can_send_from_line: 0,
      },
      {
        owner_broker_id: 9,
        delegate_broker_id: 9,
        can_view_clients: 1,
        can_view_realtors: 1,
        can_view_conversations: 1,
        can_send_from_line: 1,
      },
    ];
    expect(delegatedOwnerIdsForScope(rows, 9, "clients")).toEqual([3]);
    expect(delegatedOwnerIdsForScope(rows, 9, "realtors")).toEqual([4]);
    expect(delegatedOwnerIdsForScope(rows, 9, "line")).toEqual([3]);
    expect(delegatedOwnerIdsForScope(rows, 1, "clients")).toEqual([]);
    expect(scopeBrokerIdSet(9, [3, 9])).toEqual([9, 3]);
  });

  it("builds sendable lines with main line default when no personal line", () => {
    const lines = buildSendableLines({
      personalLine: null,
      mainLine: "5623370000",
      delegatedLines: [
        { owner_broker_id: 3, owner_name: "Daniel", number: "+15624490000" },
        { owner_broker_id: 4, owner_name: "NoLine", number: null },
      ],
    });
    expect(lines.map((l) => [l.number, l.kind, l.is_default])).toEqual([
      ["+15623370000", "main", true],
      ["+15624490000", "delegated", false],
    ]);
    expect(isSendableLine(lines, "562-449-0000")).toBe(true);
    expect(isSendableLine(lines, "+15625737760")).toBe(false);
  });

  it("personal line is default and duplicates collapse", () => {
    const lines = buildSendableLines({
      personalLine: "+15624490000",
      mainLine: "+15624490000",
      delegatedLines: [],
    });
    expect(lines).toHaveLength(1);
    expect(lines[0].kind).toBe("personal");
  });
});
