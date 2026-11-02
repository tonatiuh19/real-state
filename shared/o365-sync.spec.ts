import { describe, expect, it } from "vitest";
import {
  SYNC_INITIAL_LOOKBACK_DAYS,
  SYNC_OVERLAP_MINUTES,
  chunkArray,
  resolveO365SyncSinceIso,
} from "./o365-sync";

describe("resolveO365SyncSinceIso", () => {
  const now = new Date("2026-07-10T12:00:00.000Z");

  it("uses 30-day lookback when last_sync_at is missing", () => {
    const since = resolveO365SyncSinceIso(null, now);
    const expected = new Date(
      now.getTime() - SYNC_INITIAL_LOOKBACK_DAYS * 24 * 60 * 60 * 1000,
    ).toISOString();
    expect(since).toBe(expected);
  });

  it("subtracts overlap buffer from last_sync_at", () => {
    const since = resolveO365SyncSinceIso("2026-07-10T10:00:00.000Z", now);
    const expected = new Date(
      new Date("2026-07-10T10:00:00.000Z").getTime() -
        SYNC_OVERLAP_MINUTES * 60 * 1000,
    ).toISOString();
    expect(since).toBe(expected);
  });

  it("falls back to now when last_sync_at is invalid", () => {
    const since = resolveO365SyncSinceIso("not-a-date", now);
    const expected = new Date(
      now.getTime() - SYNC_OVERLAP_MINUTES * 60 * 1000,
    ).toISOString();
    expect(since).toBe(expected);
  });
});

describe("chunkArray", () => {
  it("splits arrays into fixed-size chunks", () => {
    expect(chunkArray([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
  });

  it("returns empty array for empty input", () => {
    expect(chunkArray([], 10)).toEqual([]);
  });
});
