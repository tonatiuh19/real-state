/** User-facing billing labels — no Stripe branding or internal mode names. */

import {
  BILLING_PAYMENT_UNAVAILABLE_MESSAGE,
  isBillingPaymentActionableMessage,
} from "@shared/billing-errors";

export { BILLING_PAYMENT_UNAVAILABLE_MESSAGE };

export const SECURE_PAYMENT_NOTE = "Secure encrypted checkout";

export function formatQuotaModeLabel(
  mode: string | null | undefined,
): string {
  switch (mode) {
    case "off":
      return "Preview";
    case "shadow":
      return "Monitoring";
    case "warn":
      return "Active";
    case "enforce":
      return "Enforced";
    default:
      return "Active";
  }
}

export function formatBillingAccessLabel(level: string): string {
  switch (level) {
    case "subscription_grace":
      return "Grace period";
    case "subscription_restricted":
      return "Action required";
    case "subscription_suspended":
      return "Suspended";
    case "quota_blocked":
      return "Quota reached";
    case "soft_warn":
      return "Approaching limit";
    default:
      return level.replace(/_/g, " ");
  }
}

/** Card errors from Payment Element — safe to show briefly to the payer. */
function isPaymentElementCardError(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes("card was declined") ||
    lower.includes("insufficient funds") ||
    lower.includes("expired card") ||
    lower.includes("incorrect cvc") ||
    lower.includes("incorrect zip") ||
    lower.includes("your card") ||
    lower.includes("authentication required")
  );
}

/** Strip processor jargon; log details stay on the server. */
export function sanitizeBillingError(message: string | null | undefined): string {
  const raw = (message ?? "").trim();
  if (!raw) {
    return BILLING_PAYMENT_UNAVAILABLE_MESSAGE;
  }

  if (raw === BILLING_PAYMENT_UNAVAILABLE_MESSAGE) {
    return raw;
  }

  if (isBillingPaymentActionableMessage(raw)) {
    return raw;
  }

  if (isPaymentElementCardError(raw)) {
    return raw.replace(/\bstripe\b/gi, "payment");
  }

  return BILLING_PAYMENT_UNAVAILABLE_MESSAGE;
}
