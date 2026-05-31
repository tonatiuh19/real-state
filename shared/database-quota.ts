/** TiDB Cloud usage-quota lock (ER 1105). */

export function isDatabaseQuotaError(err: unknown): boolean {
  if (!err) return false;
  if (typeof err === "object" && err !== null) {
    const o = err as Record<string, unknown>;
    if (o.quota_exceeded === true) return true;
  }
  const parts: string[] = [];
  if (typeof err === "string") parts.push(err);
  if (typeof err === "object" && err !== null) {
    const o = err as Record<string, unknown>;
    if (typeof o.sqlMessage === "string") parts.push(o.sqlMessage);
    if (typeof o.message === "string") parts.push(o.message);
    if (typeof o.error === "string") parts.push(o.error);
  }
  return /usage quota being exhausted|usage quota.*exhausted/i.test(
    parts.join(" "),
  );
}

export function isQuotaExceededApiResponse(data: unknown): boolean {
  if (!data || typeof data !== "object") return false;
  const d = data as Record<string, unknown>;
  return d.quota_exceeded === true || isDatabaseQuotaError(d.error);
}
