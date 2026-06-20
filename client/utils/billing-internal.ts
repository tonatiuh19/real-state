import type { BillingConfigPayload } from "@shared/api";

/** Encore-internal COGS/margin UI — gated by API `billingInternalEconomicsEnabled`. */
export function showBillingInternalEconomics(
  config: Pick<BillingConfigPayload, "billingInternalEconomicsEnabled"> | null | undefined,
): boolean {
  return Boolean(config?.billingInternalEconomicsEnabled);
}
