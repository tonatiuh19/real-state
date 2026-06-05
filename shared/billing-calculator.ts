/**
 * Platform-owner budget & expenditure math (proposal).
 * @see docs/BILLING_AND_QUOTA_PLAN.md §15
 */

export const BILLING_PLAN_DEFAULTS = {
  platformFeeUsd: 499,
  includedSmsSegments: 1000,
  includedVoiceMinutes: 1500,
  includedEmailSends: 5000,
  includedSchedulerBookings: 100,
  /** Groq llama-3.3-70b — tenant-level monthly pool */
  includedMortgiAiTokens: 500_000,
  overageSmsPer1kUsd: 18,
  overageVoicePer1kUsd: 18,
  overageEmailPer1kUsd: 5,
  overageSchedulerPer50Usd: 10,
  overageMortgiPer100kTokensUsd: 5,
  cogsSmsPerSegmentUsd: 0.012,
  cogsVoicePerMinuteUsd: 0.011,
  cogsEmailPerSendUsd: 0.0004,
  /** ~$0.70 / 1M tokens blended (Groq llama-3.3-70b) */
  cogsMortgiPerTokenUsd: 0.0000007,
  fixedInfraCogsUsd: 340,
  twilioNumberAddonUsd: 9,
  zoomPerBrokerUsd: 13.33,
} as const;

export type BillingPlanConfig = typeof BILLING_PLAN_DEFAULTS;

export type BudgetForecastInputs = {
  convoSmsPerMonth: number;
  convoEmailPerMonth: number;
  voiceMinutesPerMonth: number;
  schedulerBookingsPerMonth: number;
  blastsPerMonth: number;
  recipientsPerBlast: number;
  smsSegmentsPerRecipient: number;
  emailPerBlast: boolean;
  extraTwilioNumbers: number;
  zoomBrokerLicenses: number;
  /** Forecast: Groq tokens / month (from Mortgi chat + tool rounds) */
  mortgiAiTokensPerMonth: number;
};

export type UsageSnapshot = {
  periodStart: string;
  periodEnd: string;
  tenantId: number;
  totalSmsSegments: number;
  broadcastSmsSegments: number;
  convoSmsSegments: number;
  totalEmailSends: number;
  broadcastEmailSends: number;
  callsLogged: number;
  voiceMinutesRecorded: number;
  voiceMinutesEstimated?: number;
  schedulerBookings: number;
  mortgiAiTokens: number;
  mortgiSessions: number;
  mortgiUserMessages: number;
};

/** Production snapshot — refresh: npx tsx scripts/refresh-billing-snapshot.ts */
export const TENANT_1_ACTUAL_30D: UsageSnapshot = {
  periodStart: "2026-05-06",
  periodEnd: "2026-06-05",
  tenantId: 1,
  totalSmsSegments: 831,
  broadcastSmsSegments: 418,
  convoSmsSegments: 413,
  totalEmailSends: 1037,
  broadcastEmailSends: 0,
  callsLogged: 289,
  voiceMinutesRecorded: 158,
  voiceMinutesEstimated: 694,
  schedulerBookings: 7,
  mortgiAiTokens: 802,
  mortgiSessions: 1,
  mortgiUserMessages: 1,
};

/** Broadcast-only economics (shown as dedicated billing section — highest variable cost). */
export type BroadcastEconomics = {
  blastsPerMonth: number;
  recipientsPerBlast: number;
  segmentsPerRecipient: number;
  smsSegments: number;
  emailSends: number;
  cogsUsd: number;
  emailCogsUsd: number;
  /** Single blast at current inputs */
  costPerBlastUsd: number;
  /** % of total SMS segments */
  shareOfSmsPct: number;
  /** % of variable usage COGS (SMS+email portions) */
  shareOfVariableCogsPct: number;
  pctOfIncludedSms: number;
  pctOfIncludedEmail: number;
  /** SMS segments from broadcast that count toward overage */
  smsOverageAttributed: number;
  overageRetailAttributedUsd: number;
};

export function computeBroadcastEconomics(
  params: {
    blastsPerMonth: number;
    recipientsPerBlast: number;
    segmentsPerRecipient: number;
    emailPerBlast: boolean;
    totalSmsSegments: number;
    totalEmailSends: number;
    convoSmsSegments: number;
    convoEmailSends: number;
    overSms: number;
  },
  plan: BillingPlanConfig = BILLING_PLAN_DEFAULTS,
): BroadcastEconomics {
  const smsSegments =
    params.blastsPerMonth *
    params.recipientsPerBlast *
    params.segmentsPerRecipient;
  const emailSends = params.emailPerBlast
    ? params.blastsPerMonth * params.recipientsPerBlast
    : 0;

  const cogsUsd = smsSegments * plan.cogsSmsPerSegmentUsd;
  const emailCogsUsd = emailSends * plan.cogsEmailPerSendUsd;
  const variableCogs =
    params.totalSmsSegments * plan.cogsSmsPerSegmentUsd +
    params.totalEmailSends * plan.cogsEmailPerSendUsd;
  const broadcastVariable = cogsUsd + emailCogsUsd;

  const costPerBlastUsd =
    params.blastsPerMonth > 0
      ? (cogsUsd + emailCogsUsd) / params.blastsPerMonth
      : 0;

  const smsOverageAttributed = Math.min(smsSegments, params.overSms);
  const overageRetailAttributedUsd =
    ceilDiv(smsOverageAttributed, 1000) * plan.overageSmsPer1kUsd;

  return {
    blastsPerMonth: params.blastsPerMonth,
    recipientsPerBlast: params.recipientsPerBlast,
    segmentsPerRecipient: params.segmentsPerRecipient,
    smsSegments,
    emailSends,
    cogsUsd,
    emailCogsUsd,
    costPerBlastUsd,
    shareOfSmsPct:
      params.totalSmsSegments > 0
        ? Math.round((smsSegments / params.totalSmsSegments) * 100)
        : 0,
    shareOfVariableCogsPct:
      variableCogs > 0 ? Math.round((broadcastVariable / variableCogs) * 100) : 0,
    pctOfIncludedSms: pct(smsSegments, plan.includedSmsSegments),
    pctOfIncludedEmail: pct(emailSends, plan.includedEmailSends),
    smsOverageAttributed,
    overageRetailAttributedUsd,
  };
}

export type BudgetBreakdown = {
  blastSmsSegments: number;
  blastEmailSends: number;
  broadcast: BroadcastEconomics;
  totalSmsSegments: number;
  totalEmailSends: number;
  totalVoiceMinutes: number;
  totalSchedulerBookings: number;
  totalMortgiAiTokens: number;
  overSms: number;
  overVoice: number;
  overEmail: number;
  overScheduler: number;
  overMortgiAiTokens: number;
  mortgiCogsUsd: number;
  overageRetailUsd: number;
  platformFeeUsd: number;
  addonsUsd: number;
  ownerTotalUsd: number;
  variableCogsUsd: number;
  estimatedCogsUsd: number;
  estimatedMarginUsd: number;
  pctSms: number;
  pctVoice: number;
  pctEmail: number;
  pctScheduler: number;
  pctMortgiAiTokens: number;
};

export type ExpenditureBreakdown = {
  usage: UsageSnapshot;
  broadcast: BroadcastEconomics;
  voiceMinutesBilled: number;
  variableUsageCogsUsd: number;
  fixedInfraCogsUsd: number;
  totalPlatformCogsUsd: number;
  overageRetailUsd: number;
  platformFeeUsd: number;
  addonsUsd: number;
  /** Platform fee + overage + add-ons for this usage period */
  ownerTotalUsd: number;
  /** ownerTotalUsd − totalPlatformCogsUsd */
  estimatedMarginUsd: number;
  pctSms: number;
  pctVoice: number;
  pctEmail: number;
  pctScheduler: number;
  pctMortgiAiTokens: number;
  mortgiCogsUsd: number;
};

function ceilDiv(a: number, b: number): number {
  return b <= 0 ? 0 : Math.ceil(a / b);
}

function pct(used: number, included: number): number {
  return included > 0 ? Math.min(100, Math.round((used / included) * 100)) : 0;
}

export function computeBudgetForecast(
  inputs: BudgetForecastInputs,
  plan: BillingPlanConfig = BILLING_PLAN_DEFAULTS,
): BudgetBreakdown {
  const blastSmsSegments =
    inputs.blastsPerMonth *
    inputs.recipientsPerBlast *
    inputs.smsSegmentsPerRecipient;
  const blastEmailSends = inputs.emailPerBlast
    ? inputs.blastsPerMonth * inputs.recipientsPerBlast
    : 0;

  const totalSmsSegments = inputs.convoSmsPerMonth + blastSmsSegments;
  const totalEmailSends = inputs.convoEmailPerMonth + blastEmailSends;
  const totalVoiceMinutes = inputs.voiceMinutesPerMonth;
  const totalSchedulerBookings = inputs.schedulerBookingsPerMonth;

  const overSms = Math.max(0, totalSmsSegments - plan.includedSmsSegments);
  const overVoice = Math.max(0, totalVoiceMinutes - plan.includedVoiceMinutes);
  const overEmail = Math.max(0, totalEmailSends - plan.includedEmailSends);
  const overScheduler = Math.max(
    0,
    totalSchedulerBookings - plan.includedSchedulerBookings,
  );
  const totalMortgiAiTokens = inputs.mortgiAiTokensPerMonth;
  const overMortgiAiTokens = Math.max(
    0,
    totalMortgiAiTokens - plan.includedMortgiAiTokens,
  );

  const overageRetailUsd =
    ceilDiv(overSms, 1000) * plan.overageSmsPer1kUsd +
    ceilDiv(overVoice, 1000) * plan.overageVoicePer1kUsd +
    ceilDiv(overEmail, 1000) * plan.overageEmailPer1kUsd +
    ceilDiv(overScheduler, 50) * plan.overageSchedulerPer50Usd +
    ceilDiv(overMortgiAiTokens, 100_000) * plan.overageMortgiPer100kTokensUsd;

  const platformFeeUsd = plan.platformFeeUsd;
  const addonsUsd =
    inputs.extraTwilioNumbers * plan.twilioNumberAddonUsd +
    inputs.zoomBrokerLicenses * plan.zoomPerBrokerUsd;

  const ownerTotalUsd = platformFeeUsd + overageRetailUsd + addonsUsd;

  const mortgiCogsUsd = totalMortgiAiTokens * plan.cogsMortgiPerTokenUsd;
  const variableCogsUsd =
    totalSmsSegments * plan.cogsSmsPerSegmentUsd +
    totalVoiceMinutes * plan.cogsVoicePerMinuteUsd +
    totalEmailSends * plan.cogsEmailPerSendUsd +
    mortgiCogsUsd +
    inputs.extraTwilioNumbers * 1.15;

  const estimatedCogsUsd = plan.fixedInfraCogsUsd + variableCogsUsd;

  const broadcast = computeBroadcastEconomics(
    {
      blastsPerMonth: inputs.blastsPerMonth,
      recipientsPerBlast: inputs.recipientsPerBlast,
      segmentsPerRecipient: inputs.smsSegmentsPerRecipient,
      emailPerBlast: inputs.emailPerBlast,
      totalSmsSegments,
      totalEmailSends,
      convoSmsSegments: inputs.convoSmsPerMonth,
      convoEmailSends: inputs.convoEmailPerMonth,
      overSms,
    },
    plan,
  );

  return {
    blastSmsSegments,
    blastEmailSends,
    broadcast,
    totalSmsSegments,
    totalEmailSends,
    totalVoiceMinutes,
    totalSchedulerBookings,
    totalMortgiAiTokens,
    overSms,
    overVoice,
    overEmail,
    overScheduler,
    overMortgiAiTokens,
    mortgiCogsUsd,
    overageRetailUsd,
    platformFeeUsd,
    addonsUsd,
    ownerTotalUsd,
    variableCogsUsd,
    estimatedCogsUsd,
    estimatedMarginUsd: ownerTotalUsd - estimatedCogsUsd,
    pctSms: pct(totalSmsSegments, plan.includedSmsSegments),
    pctVoice: pct(totalVoiceMinutes, plan.includedVoiceMinutes),
    pctEmail: pct(totalEmailSends, plan.includedEmailSends),
    pctScheduler: pct(totalSchedulerBookings, plan.includedSchedulerBookings),
    pctMortgiAiTokens: pct(totalMortgiAiTokens, plan.includedMortgiAiTokens),
  };
}

export type ExpenditureOptions = {
  extraTwilioNumbers?: number;
  zoomBrokerLicenses?: number;
  /** Use estimated voice minutes when recorded duration under-reports */
  preferEstimatedVoiceMinutes?: boolean;
};

export function computeActualExpenditure(
  usage: UsageSnapshot,
  options: ExpenditureOptions = {},
  plan: BillingPlanConfig = BILLING_PLAN_DEFAULTS,
): ExpenditureBreakdown {
  const extraTwilioNumbers = options.extraTwilioNumbers ?? 0;
  const zoomBrokerLicenses = options.zoomBrokerLicenses ?? 10;

  const voiceMinutesBilled =
    options.preferEstimatedVoiceMinutes && usage.voiceMinutesEstimated != null
      ? usage.voiceMinutesEstimated
      : Math.max(usage.voiceMinutesRecorded, usage.voiceMinutesEstimated ?? 0);

  const mortgiCogsUsd = usage.mortgiAiTokens * plan.cogsMortgiPerTokenUsd;
  const variableUsageCogsUsd =
    usage.totalSmsSegments * plan.cogsSmsPerSegmentUsd +
    voiceMinutesBilled * plan.cogsVoicePerMinuteUsd +
    usage.totalEmailSends * plan.cogsEmailPerSendUsd +
    mortgiCogsUsd +
    extraTwilioNumbers * 1.15;

  const totalPlatformCogsUsd = plan.fixedInfraCogsUsd + variableUsageCogsUsd;

  const forecast = computeBudgetForecast(
    {
      convoSmsPerMonth: usage.convoSmsSegments,
      convoEmailPerMonth: usage.totalEmailSends - usage.broadcastEmailSends,
      voiceMinutesPerMonth: voiceMinutesBilled,
      schedulerBookingsPerMonth: usage.schedulerBookings,
      blastsPerMonth: 0,
      recipientsPerBlast: 0,
      smsSegmentsPerRecipient: 1,
      emailPerBlast: false,
      extraTwilioNumbers,
      zoomBrokerLicenses,
      mortgiAiTokensPerMonth: usage.mortgiAiTokens,
    },
    plan,
  );

  const ownerTotalUsd = forecast.ownerTotalUsd;
  const estimatedMarginUsd = ownerTotalUsd - totalPlatformCogsUsd;

  const broadcast = computeBroadcastEconomics(
    {
      blastsPerMonth: 0,
      recipientsPerBlast: 0,
      segmentsPerRecipient: 1,
      emailPerBlast: false,
      totalSmsSegments: usage.totalSmsSegments,
      totalEmailSends: usage.totalEmailSends,
      convoSmsSegments: usage.convoSmsSegments,
      convoEmailSends: usage.totalEmailSends - usage.broadcastEmailSends,
      overSms: forecast.overSms,
    },
    plan,
  );
  // Override with actual blast-derived segments (no blast count in snapshot)
  const broadcastCogsUsd =
    usage.broadcastSmsSegments * plan.cogsSmsPerSegmentUsd +
    usage.broadcastEmailSends * plan.cogsEmailPerSendUsd;
  const broadcastActual: BroadcastEconomics = {
    ...broadcast,
    smsSegments: usage.broadcastSmsSegments,
    emailSends: usage.broadcastEmailSends,
    cogsUsd: usage.broadcastSmsSegments * plan.cogsSmsPerSegmentUsd,
    emailCogsUsd: usage.broadcastEmailSends * plan.cogsEmailPerSendUsd,
    costPerBlastUsd: 0,
    shareOfSmsPct:
      usage.totalSmsSegments > 0
        ? Math.round(
            (usage.broadcastSmsSegments / usage.totalSmsSegments) * 100,
          )
        : 0,
    shareOfVariableCogsPct:
      variableUsageCogsUsd > 0
        ? Math.round((broadcastCogsUsd / variableUsageCogsUsd) * 100)
        : 0,
    pctOfIncludedSms: pct(
      usage.broadcastSmsSegments,
      plan.includedSmsSegments,
    ),
    pctOfIncludedEmail: pct(
      usage.broadcastEmailSends,
      plan.includedEmailSends,
    ),
  };

  return {
    usage,
    broadcast: broadcastActual,
    voiceMinutesBilled,
    variableUsageCogsUsd,
    fixedInfraCogsUsd: plan.fixedInfraCogsUsd,
    totalPlatformCogsUsd,
    overageRetailUsd: forecast.overageRetailUsd,
    platformFeeUsd: plan.platformFeeUsd,
    addonsUsd: forecast.addonsUsd,
    ownerTotalUsd,
    estimatedMarginUsd,
    pctSms: pct(usage.totalSmsSegments, plan.includedSmsSegments),
    pctVoice: pct(voiceMinutesBilled, plan.includedVoiceMinutes),
    pctEmail: pct(usage.totalEmailSends, plan.includedEmailSends),
    pctScheduler: pct(usage.schedulerBookings, plan.includedSchedulerBookings),
    pctMortgiAiTokens: pct(usage.mortgiAiTokens, plan.includedMortgiAiTokens),
    mortgiCogsUsd,
  };
}
