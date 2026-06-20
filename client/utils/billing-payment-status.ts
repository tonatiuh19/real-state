import type {
  BillingConfigPayload,
  BillingExpenditurePayload,
  UnifiedQuotaSummary,
} from "@shared/api";

export type BillingPaymentStatus = {
  shouldWarn: boolean;
  paymentRequired: boolean;
  overDimensions: string[];
  maxPct: number;
  /** Best pack for current usage pressure */
  suggestedPackId: string | null;
};

const PACK_BY_LABEL: Record<string, string> = {
  SMS: "sms_1k",
  Email: "email_1k",
  Voice: "voice_1k",
  Scheduler: "scheduler_50",
  "Mortgi AI": "mortgi_100k",
};

export function suggestTopUpPackId(params: {
  expenditure: BillingExpenditurePayload | null;
  quota?: UnifiedQuotaSummary | null;
}): string {
  const slices: Array<{ label: string; pct: number; pack: string }> = [
    {
      label: "SMS",
      pct: params.expenditure?.pctSms ?? params.quota?.sms_segments.pct ?? 0,
      pack: "sms_1k",
    },
    {
      label: "Email",
      pct: params.expenditure?.pctEmail ?? params.quota?.email_sends.pct ?? 0,
      pack: "email_1k",
    },
    {
      label: "Voice",
      pct: params.expenditure?.pctVoice ?? params.quota?.voice_minutes.pct ?? 0,
      pack: "voice_1k",
    },
    {
      label: "Scheduler",
      pct:
        params.expenditure?.pctScheduler ??
        params.quota?.scheduler_bookings.pct ??
        0,
      pack: "scheduler_50",
    },
    {
      label: "Mortgi AI",
      pct:
        params.expenditure?.pctMortgiAiTokens ??
        params.quota?.mortgi_ai_tokens.pct ??
        0,
      pack: "mortgi_100k",
    },
  ];
  slices.sort((a, b) => b.pct - a.pct);
  const top = slices[0];
  if (top.pct >= 70) return top.pack;
  return "sms_1k";
}

export function getBillingPaymentStatus(params: {
  config: BillingConfigPayload | null;
  expenditure: BillingExpenditurePayload | null;
  quota?: UnifiedQuotaSummary | null;
}): BillingPaymentStatus {
  const { config, expenditure, quota } = params;
  const mode = config?.billingQuotaMode ?? "off";
  const suggestedPackId = suggestTopUpPackId({ expenditure, quota });

  if (mode !== "warn" && mode !== "enforce") {
    return {
      shouldWarn: false,
      paymentRequired: false,
      overDimensions: [],
      maxPct: 0,
      suggestedPackId,
    };
  }

  const slices: Array<{ label: string; pct: number }> = [
    { label: "SMS", pct: expenditure?.pctSms ?? quota?.sms_segments.pct ?? 0 },
    { label: "Email", pct: expenditure?.pctEmail ?? quota?.email_sends.pct ?? 0 },
    { label: "Voice", pct: expenditure?.pctVoice ?? quota?.voice_minutes.pct ?? 0 },
    { label: "Scheduler", pct: expenditure?.pctScheduler ?? quota?.scheduler_bookings.pct ?? 0 },
    {
      label: "Mortgi AI",
      pct: expenditure?.pctMortgiAiTokens ?? quota?.mortgi_ai_tokens.pct ?? 0,
    },
  ];

  const maxPct = Math.max(...slices.map((s) => s.pct), 0);
  const warnDims = slices.filter((s) => s.pct >= 80).map((s) => s.label);
  const blockedDims = slices.filter((s) => s.pct >= 100).map((s) => s.label);

  const paymentRequired = mode === "enforce" && blockedDims.length > 0;
  const shouldWarn = !paymentRequired && (maxPct >= 80 || warnDims.length > 0);

  const primaryBlocked = blockedDims[0] ?? warnDims[0];
  const packFromDims = primaryBlocked ? PACK_BY_LABEL[primaryBlocked] : null;

  return {
    shouldWarn,
    paymentRequired,
    overDimensions: paymentRequired ? blockedDims : warnDims,
    maxPct,
    suggestedPackId: packFromDims ?? suggestedPackId,
  };
}

export function billingTopUpHref(packId?: string | null): string {
  const base = "/admin/billing?topup=1";
  if (!packId) return base;
  return `${base}&pack=${encodeURIComponent(packId)}`;
}
