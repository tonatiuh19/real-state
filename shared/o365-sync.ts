/** Office 365 mailbox sync tuning — shared between API and tests. */

export const SYNC_INITIAL_LOOKBACK_DAYS = 30;
export const SYNC_OVERLAP_MINUTES = 30;
export const SYNC_EXTERNAL_ID_BATCH_SIZE = 200;

/**
 * ISO-8601 lower bound for Graph `receivedDateTime ge` filter.
 * First sync: 30-day lookback. Subsequent: last_sync_at minus overlap buffer.
 */
export function resolveO365SyncSinceIso(
  lastSyncAt: string | null | undefined,
  now: Date = new Date(),
): string {
  if (!lastSyncAt) {
    const since = new Date(
      now.getTime() - SYNC_INITIAL_LOOKBACK_DAYS * 24 * 60 * 60 * 1000,
    );
    return since.toISOString();
  }
  const parsed = new Date(lastSyncAt);
  const anchor = Number.isNaN(parsed.getTime()) ? now : parsed;
  const since = new Date(
    anchor.getTime() - SYNC_OVERLAP_MINUTES * 60 * 1000,
  );
  return since.toISOString();
}

export function chunkArray<T>(items: T[], size: number): T[][] {
  if (size <= 0) return items.length ? [items] : [];
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}
