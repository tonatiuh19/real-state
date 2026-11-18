/**
 * Broker delegations + shared main line — pure helpers.
 *
 * Source of truth for client, smoke tests and types. The runtime copy used by
 * the API is inlined in api/index.ts ("Broker delegations + main line — inlined
 * for Vercel serverless"). Keep both in sync.
 */

export type DelegationScope = "clients" | "realtors" | "conversations" | "line";

export interface BrokerDelegationRow {
  owner_broker_id: number;
  delegate_broker_id: number;
  can_view_clients: number | boolean;
  can_view_realtors: number | boolean;
  can_view_conversations: number | boolean;
  can_send_from_line: number | boolean;
}

export type SendableLineKind = "main" | "personal" | "delegated";

export interface SendableLine {
  /** E.164 number */
  number: string;
  kind: SendableLineKind;
  label: string;
  owner_broker_id: number | null;
  is_default: boolean;
}

export const DELEGATION_SCOPE_COLUMN: Record<
  DelegationScope,
  keyof BrokerDelegationRow
> = {
  clients: "can_view_clients",
  realtors: "can_view_realtors",
  conversations: "can_view_conversations",
  line: "can_send_from_line",
};

/** Normalize a US/E.164 phone to E.164; returns null when it can't be. */
export function normalizeLineE164(
  phone: string | null | undefined,
): string | null {
  if (!phone) return null;
  const digits = String(phone).replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  if (String(phone).trim().startsWith("+") && digits.length >= 8)
    return `+${digits}`;
  return null;
}

/** Parse main_line_ring_broker_ids (JSON array or CSV) into unique positive ints. */
export function parseRingBrokerIds(raw: string | null | undefined): number[] {
  if (!raw || !String(raw).trim()) return [];
  let values: unknown[] = [];
  try {
    const parsed = JSON.parse(String(raw));
    values = Array.isArray(parsed) ? parsed : [parsed];
  } catch {
    values = String(raw).split(",");
  }
  const out: number[] = [];
  for (const v of values) {
    const n = Number(String(v).trim());
    if (Number.isInteger(n) && n > 0 && !out.includes(n)) out.push(n);
  }
  return out;
}

/** Owner ids a delegate may act for under `scope` (active rows only expected). */
export function delegatedOwnerIdsForScope(
  rows: BrokerDelegationRow[],
  delegateBrokerId: number,
  scope: DelegationScope,
): number[] {
  const col = DELEGATION_SCOPE_COLUMN[scope];
  const out: number[] = [];
  for (const r of rows) {
    if (Number(r.delegate_broker_id) !== delegateBrokerId) continue;
    if (!Number(r[col])) continue;
    const owner = Number(r.owner_broker_id);
    if (owner !== delegateBrokerId && !out.includes(owner)) out.push(owner);
  }
  return out;
}

/** [self, ...delegated owners] — the id set used in ownership `IN (?)` clauses. */
export function scopeBrokerIdSet(
  brokerId: number,
  delegatedOwnerIds: number[],
): number[] {
  return [brokerId, ...delegatedOwnerIds.filter((id) => id !== brokerId)];
}

/**
 * Lines a broker may send from, default first:
 *   personal line (if any) → main line → delegated owners' lines.
 * When the broker has no personal line the main line is the default.
 */
export function buildSendableLines(input: {
  personalLine: string | null;
  mainLine: string | null;
  delegatedLines: Array<{
    owner_broker_id: number;
    owner_name: string;
    number: string | null;
  }>;
}): SendableLine[] {
  const lines: SendableLine[] = [];
  const seen = new Set<string>();
  const push = (line: Omit<SendableLine, "is_default">) => {
    if (seen.has(line.number)) return;
    seen.add(line.number);
    lines.push({ ...line, is_default: lines.length === 0 });
  };
  const personal = normalizeLineE164(input.personalLine);
  const main = normalizeLineE164(input.mainLine);
  if (personal)
    push({
      number: personal,
      kind: "personal",
      label: "My line",
      owner_broker_id: null,
    });
  if (main)
    push({
      number: main,
      kind: "main",
      label: "Main line",
      owner_broker_id: null,
    });
  for (const d of input.delegatedLines) {
    const n = normalizeLineE164(d.number);
    if (!n) continue;
    push({
      number: n,
      kind: "delegated",
      label: `${d.owner_name}'s line`,
      owner_broker_id: d.owner_broker_id,
    });
  }
  return lines;
}

/** Whether `requested` is one of the broker's sendable lines. */
export function isSendableLine(
  lines: SendableLine[],
  requested: string | null | undefined,
): boolean {
  const n = normalizeLineE164(requested);
  return !!n && lines.some((l) => l.number === n);
}
