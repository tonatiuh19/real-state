import React, { useState, useCallback, useEffect } from "react";
import {
  Target,
  TrendingUp,
  TrendingDown,
  Edit2,
  Check,
  X,
  RefreshCw,
  Globe,
  User,
  Users,
  ChevronDown,
  Zap,
  Award,
  BarChart3,
  FileCheck,
  Home,
  CalendarDays,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchBrokerMetrics,
  updateBrokerMetrics,
} from "@/store/slices/dashboardSlice";
import { fetchBrokers } from "@/store/slices/brokersSlice";
import type {
  BrokerMonthlyMetrics,
  UpdateBrokerMetricsRequest,
} from "@shared/api";
import { logger } from "@/lib/logger";

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const SOURCE_LABELS: Record<string, string> = {
  current_client_referral: "Current Client Referral",
  past_client: "Past Client",
  past_client_referral: "Past Client Referral",
  personal_friend: "Personal Friend",
  realtor: "Realtor",
  advertisement: "Advertisement",
  business_partner: "Business Partner",
  builder: "Builder",
  other: "Other",
};

const SOURCE_CODES: Record<string, string> = {
  current_client_referral: "CCR",
  past_client: "PC",
  past_client_referral: "PR",
  personal_friend: "PF",
  realtor: "RLTR",
  advertisement: "AD",
  business_partner: "BUS",
  builder: "BLDR",
  other: "—",
};

const ALL_SOURCES = Object.keys(SOURCE_LABELS);

// Inline editable number cell
function EditableCell({
  value,
  onSave,
  isPercent = false,
  className,
}: {
  value: number | null;
  onSave: (v: number | null) => void;
  isPercent?: boolean;
  className?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value ?? ""));

  const commit = () => {
    const parsed = draft.trim() === "" ? null : parseFloat(draft);
    if (draft.trim() !== "" && isNaN(parsed!)) {
      setDraft(String(value ?? ""));
      setEditing(false);
      return;
    }
    onSave(parsed);
    setEditing(false);
  };

  const cancel = () => {
    setDraft(String(value ?? ""));
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="flex items-center gap-1 justify-center">
        <Input
          className="h-6 w-20 text-xs p-1 text-center"
          value={draft}
          autoFocus
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit();
            if (e.key === "Escape") cancel();
          }}
        />
        <button onClick={commit} className="text-primary hover:text-primary/80">
          <Check className="h-3 w-3" />
        </button>
        <button
          onClick={cancel}
          className="text-muted-foreground hover:text-foreground"
        >
          <X className="h-3 w-3" />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => {
        setDraft(String(value ?? ""));
        setEditing(true);
      }}
      className={cn(
        "group flex items-center gap-1 hover:text-primary transition-colors",
        className,
      )}
    >
      <span>{value != null ? (isPercent ? `${value}%` : value) : "—"}</span>
      <Edit2 className="h-3 w-3 opacity-0 group-hover:opacity-60 transition-opacity" />
    </button>
  );
}

// Stat KPI card
function KpiCard({
  icon,
  label,
  actual,
  goal,
  editable,
  onSaveGoal,
  onSaveActual,
  isPartner,
  accentColor = "primary",
}: {
  icon: React.ReactNode;
  label: string;
  actual: number;
  goal: number;
  editable?: boolean;
  onSaveGoal?: (v: number | null) => void;
  onSaveActual?: (v: number | null) => void;
  isPartner?: boolean;
  accentColor?: "primary" | "emerald" | "amber" | "sky";
}) {
  const pct = goal > 0 ? Math.min(Math.round((actual / goal) * 100), 100) : 0;
  const over = actual >= goal;
  const delta = actual - goal;

  const barColor = {
    primary: "bg-primary",
    emerald: "bg-emerald-500",
    amber: "bg-amber-400",
    sky: "bg-sky-500",
  }[accentColor];

  const iconBg = {
    primary: "bg-primary/10 text-primary",
    emerald: "bg-emerald-500/10 text-emerald-600",
    amber: "bg-amber-400/10 text-amber-600",
    sky: "bg-sky-500/10 text-sky-600",
  }[accentColor];

  return (
    <div className="relative flex flex-col gap-2 rounded-xl border border-border bg-card p-4 shadow-sm overflow-hidden">
      {/* subtle gradient top-right glow */}
      <div
        className={cn(
          "pointer-events-none absolute -top-6 -right-6 h-24 w-24 rounded-full opacity-10 blur-2xl",
          {
            primary: "bg-primary",
            emerald: "bg-emerald-400",
            amber: "bg-amber-300",
            sky: "bg-sky-400",
          }[accentColor],
        )}
      />
      <div className="flex items-start justify-between">
        <div className={cn("rounded-lg p-2", iconBg)}>{icon}</div>
        <span
          className={cn(
            "flex items-center gap-0.5 text-xs font-semibold",
            over ? "text-emerald-500" : "text-destructive",
          )}
        >
          {over ? (
            <TrendingUp className="h-3 w-3" />
          ) : (
            <TrendingDown className="h-3 w-3" />
          )}
          {delta >= 0 ? `+${delta}` : delta}
        </span>
      </div>

      <div>
        <p className="text-xs text-muted-foreground font-medium">{label}</p>
        <div className="flex items-baseline gap-2 mt-0.5">
          {onSaveActual && !isPartner ? (
            <span className="text-2xl font-extrabold leading-none">
              <EditableCell
                value={actual}
                onSave={onSaveActual}
                className="text-2xl font-extrabold"
              />
            </span>
          ) : (
            <span className="text-2xl font-extrabold leading-none">
              {actual}
            </span>
          )}
          <span className="text-xs text-muted-foreground">
            /{" "}
            {onSaveGoal && !isPartner ? (
              <EditableCell value={goal} onSave={onSaveGoal} />
            ) : (
              <span className="text-amber-500 font-semibold">{goal}</span>
            )}
          </span>
        </div>
      </div>

      {/* progress bar */}
      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500",
            barColor,
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-[10px] text-muted-foreground text-right -mt-1">
        {pct}% of goal
      </p>
    </div>
  );
}

// Conversion rate gauge card
function RateCard({
  label,
  actual,
  goal,
  editable,
  onSaveGoal,
  isPartner,
}: {
  label: string;
  actual: number;
  goal: number;
  editable?: boolean;
  onSaveGoal?: (v: number | null) => void;
  isPartner?: boolean;
}) {
  const over = actual >= goal;
  return (
    <div className="relative flex flex-col items-center justify-center gap-1 rounded-xl border border-border bg-card p-4 shadow-sm text-center overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
      <span
        className={cn(
          "text-3xl font-extrabold",
          over ? "text-emerald-500" : "text-primary",
        )}
      >
        {actual}%
      </span>
      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest leading-tight">
        {label}
      </p>
      <div className="flex items-center gap-1 mt-1">
        <span className="text-[10px] text-muted-foreground">Goal:</span>
        {editable && onSaveGoal && !isPartner ? (
          <span className="text-[11px] font-bold text-amber-500">
            <EditableCell value={goal} onSave={onSaveGoal} />
          </span>
        ) : (
          <span className="text-[11px] font-bold text-amber-500">{goal}%</span>
        )}
      </div>
      <span
        className={cn(
          "text-[10px] font-medium",
          over ? "text-emerald-500" : "text-destructive",
        )}
      >
        {over ? "✓ On Track" : "↓ Below Goal"}
      </span>
    </div>
  );
}

// ------------------------------------------------------------
// Main component
// ------------------------------------------------------------
interface BrokerMetricsPanelProps {
  year?: number;
  month?: number;
  isPartner?: boolean;
}

const BrokerMetricsPanel: React.FC<BrokerMetricsPanelProps> = ({
  year: propYear,
  month: propMonth,
  isPartner = false,
}) => {
  const dispatch = useAppDispatch();
  const {
    brokerMetrics: metrics,
    metricsLoading,
    metricsError,
  } = useAppSelector((state) => state.dashboard);
  const { brokers } = useAppSelector((state) => state.brokers);

  const [selectedBrokerIds, setSelectedBrokerIds] = useState<number[]>([]);
  const [selectorOpen, setSelectorOpen] = useState(false);

  const now = new Date();
  const year = propYear ?? now.getFullYear();
  const month = propMonth ?? now.getMonth() + 1;

  useEffect(() => {
    if (!isPartner && brokers.length === 0) {
      dispatch(fetchBrokers());
    }
  }, [isPartner, brokers.length, dispatch]);

  const load = useCallback(
    (ids: number[]) => {
      dispatch(fetchBrokerMetrics({ year, month, filterBrokerIds: ids }));
    },
    [dispatch, year, month],
  );

  const save = useCallback(
    (patch: Partial<UpdateBrokerMetricsRequest>) => {
      dispatch(updateBrokerMetrics({ year, month, ...patch }));
    },
    [dispatch, year, month],
  );

  const toggleBroker = (id: number) => {
    setSelectedBrokerIds((prev) => {
      const next = prev.includes(id)
        ? prev.filter((x) => x !== id)
        : [...prev, id];
      load(next);
      return next;
    });
  };

  const selectAll = () => {
    setSelectedBrokerIds([]);
    load([]);
  };

  const refresh = () => load(selectedBrokerIds);

  if (metricsLoading && !metrics) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground text-sm">
          <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-primary" />
          Loading metrics…
        </CardContent>
      </Card>
    );
  }

  if (metricsError && !metrics) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-destructive text-sm">
          {metricsError}
        </CardContent>
      </Card>
    );
  }

  const m: BrokerMonthlyMetrics = metrics ?? {
    year,
    month,
    lead_to_credit_goal: 70,
    credit_to_preapp_goal: 50,
    lead_to_closing_goal: 25,
    leads_goal: 40,
    credit_pulls_goal: 28,
    closings_goal: 10,
    leads_actual: 0,
    credit_pulls_actual: 0,
    pre_approvals_actual: 0,
    closings_actual: 0,
    prev_year_leads: null,
    prev_year_closings: null,
    lead_sources: [],
  };

  const monthName = MONTH_NAMES[m.month - 1];
  const sourceMap = new Map(m.lead_sources.map((s) => [s.category, s.count]));
  const totalLeadsFromSources = ALL_SOURCES.reduce(
    (s, k) =>
      s + (sourceMap.get(k as import("@shared/api").LeadSourceCategory) ?? 0),
    0,
  );

  // Computed rates
  const leadToCreditActual =
    m.leads_actual > 0
      ? Math.round((m.credit_pulls_actual / m.leads_actual) * 100)
      : 0;
  const creditToPreappActual =
    m.credit_pulls_actual > 0
      ? Math.round((m.pre_approvals_actual / m.credit_pulls_actual) * 100)
      : 0;
  const leadToClosingActual =
    m.leads_actual > 0
      ? Math.round((m.closings_actual / m.leads_actual) * 100)
      : 0;
  const prevYearLeadToClosing =
    m.prev_year_leads && m.prev_year_leads > 0 && m.prev_year_closings != null
      ? Math.round((m.prev_year_closings / m.prev_year_leads) * 100)
      : null;

  const selectorLabel =
    selectedBrokerIds.length === 0
      ? "All Brokers"
      : selectedBrokerIds.length === 1
        ? (() => {
            const b = brokers.find((b) => b.id === selectedBrokerIds[0]);
            return b ? `${b.first_name} ${b.last_name}` : "1 Broker";
          })()
        : `${selectedBrokerIds.length} Brokers`;

  return (
    <TooltipProvider>
      <Card className="overflow-hidden border-border/60">
        {/* ── Header ── */}
        <CardHeader className="pb-4 bg-gradient-to-r from-card to-secondary/30 border-b border-border/50">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20">
                <Target className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base font-bold">
                  {selectedBrokerIds.length === 0
                    ? "Performance Metrics"
                    : selectedBrokerIds.length === 1
                      ? (() => {
                          const b = brokers.find(
                            (b) => b.id === selectedBrokerIds[0],
                          );
                          return b
                            ? `${b.first_name} ${b.last_name}`
                            : "Broker";
                        })()
                      : `${selectedBrokerIds.length} Brokers`}
                </CardTitle>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                  <CalendarDays className="h-3 w-3" />
                  {monthName} {m.year}
                  {metricsLoading && (
                    <RefreshCw className="h-3 w-3 animate-spin ml-1" />
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {!isPartner && (
                <Popover open={selectorOpen} onOpenChange={setSelectorOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 w-48 justify-between text-xs font-normal bg-background/80"
                    >
                      <span className="flex items-center gap-1.5 truncate">
                        {selectedBrokerIds.length === 0 ? (
                          <Globe className="h-3.5 w-3.5 shrink-0 text-primary" />
                        ) : selectedBrokerIds.length === 1 ? (
                          <User className="h-3.5 w-3.5 shrink-0 text-primary" />
                        ) : (
                          <Users className="h-3.5 w-3.5 shrink-0 text-primary" />
                        )}
                        <span className="truncate">{selectorLabel}</span>
                      </span>
                      <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 p-2" align="end">
                    <div className="space-y-0.5">
                      <label className="flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer hover:bg-accent transition-colors">
                        <Checkbox
                          checked={selectedBrokerIds.length === 0}
                          onCheckedChange={selectAll}
                        />
                        <Globe className="h-3.5 w-3.5 text-primary" />
                        <span className="text-sm font-medium">All Brokers</span>
                      </label>
                      <div className="border-t my-1" />
                      {brokers.map((b) => (
                        <label
                          key={b.id}
                          className="flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer hover:bg-accent transition-colors"
                        >
                          <Checkbox
                            checked={selectedBrokerIds.includes(b.id)}
                            onCheckedChange={() => toggleBroker(b.id)}
                          />
                          <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <span className="text-sm flex-1 truncate">
                            {b.first_name} {b.last_name}
                          </span>
                          <span
                            className={cn(
                              "text-[10px] px-1.5 py-0.5 rounded font-semibold shrink-0",
                              b.role === "broker"
                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                                : "bg-primary/10 text-primary",
                            )}
                          >
                            {b.role === "broker" ? "Partner" : "MB"}
                          </span>
                        </label>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              )}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={refresh}
                    disabled={metricsLoading}
                    className="h-8 bg-background/80"
                  >
                    <RefreshCw
                      className={cn(
                        "h-3.5 w-3.5",
                        metricsLoading && "animate-spin",
                      )}
                    />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Refresh metrics</TooltipContent>
              </Tooltip>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-5 space-y-6">
          {/* ── Conversion Rate Goals ── */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Zap className="h-4 w-4 text-amber-500" />
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                Conversion Rate Goals
              </h3>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <RateCard
                label="Lead → Credit"
                actual={leadToCreditActual}
                goal={m.lead_to_credit_goal}
                editable
                onSaveGoal={(v) => save({ lead_to_credit_goal: v ?? 0 })}
                isPartner={isPartner}
              />
              <RateCard
                label="Credit → Pre-App"
                actual={creditToPreappActual}
                goal={m.credit_to_preapp_goal}
                editable
                onSaveGoal={(v) => save({ credit_to_preapp_goal: v ?? 0 })}
                isPartner={isPartner}
              />
              <RateCard
                label="Lead → Closing"
                actual={leadToClosingActual}
                goal={m.lead_to_closing_goal}
                editable
                onSaveGoal={(v) => save({ lead_to_closing_goal: v ?? 0 })}
                isPartner={isPartner}
              />
            </div>
          </section>

          {/* ── KPI Cards ── */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 className="h-4 w-4 text-primary" />
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                Monthly Actuals vs Goals
              </h3>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <KpiCard
                icon={<Users className="h-4 w-4" />}
                label="Leads"
                actual={m.leads_actual}
                goal={m.leads_goal}
                onSaveGoal={(v) => save({ leads_goal: v ?? 0 })}
                isPartner={isPartner}
                accentColor="primary"
              />
              <KpiCard
                icon={<Zap className="h-4 w-4" />}
                label="Credit Pulls"
                actual={m.credit_pulls_actual}
                goal={m.credit_pulls_goal}
                onSaveGoal={(v) => save({ credit_pulls_goal: v ?? 0 })}
                onSaveActual={(v) => save({ credit_pulls_actual: v ?? 0 })}
                isPartner={isPartner}
                accentColor="sky"
              />
              <KpiCard
                icon={<FileCheck className="h-4 w-4" />}
                label="Pre-Approvals"
                actual={m.pre_approvals_actual}
                goal={Math.round(
                  (m.leads_goal * m.credit_to_preapp_goal) / 100,
                )}
                isPartner={isPartner}
                accentColor="emerald"
              />
              <KpiCard
                icon={<Home className="h-4 w-4" />}
                label="Closings"
                actual={m.closings_actual}
                goal={m.closings_goal}
                onSaveGoal={(v) => save({ closings_goal: v ?? 0 })}
                isPartner={isPartner}
                accentColor="amber"
              />
            </div>
          </section>

          {/* ── Previous Year ── */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Award className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                Previous Year Data ({m.year - 1})
              </h3>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-border bg-card p-4 flex flex-col gap-1">
                <p className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wide">
                  {m.year - 1} Leads
                </p>
                <div className="text-xl font-extrabold">
                  {!isPartner ? (
                    <EditableCell
                      value={m.prev_year_leads}
                      onSave={(v) => save({ prev_year_leads: v })}
                    />
                  ) : (
                    <span>{m.prev_year_leads ?? "—"}</span>
                  )}
                </div>
              </div>
              <div className="rounded-xl border border-border bg-card p-4 flex flex-col gap-1">
                <p className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wide">
                  {m.year - 1} Closings
                </p>
                <div className="text-xl font-extrabold">
                  {!isPartner ? (
                    <EditableCell
                      value={m.prev_year_closings}
                      onSave={(v) => save({ prev_year_closings: v })}
                    />
                  ) : (
                    <span>{m.prev_year_closings ?? "—"}</span>
                  )}
                </div>
              </div>
              <div className="rounded-xl border border-border bg-card p-4 flex flex-col gap-1">
                <p className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wide">
                  {m.year - 1} Close Rate
                </p>
                <span
                  className={cn(
                    "text-xl font-extrabold",
                    prevYearLeadToClosing != null
                      ? "text-primary"
                      : "text-muted-foreground",
                  )}
                >
                  {prevYearLeadToClosing != null
                    ? `${prevYearLeadToClosing}%`
                    : "—"}
                </span>
              </div>
            </div>
          </section>

          {/* ── Lead Source Analysis ── */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                  Lead Source Analysis
                </h3>
              </div>
              <span className="text-xs text-muted-foreground">
                Total:{" "}
                <strong className="text-foreground">
                  {totalLeadsFromSources}
                </strong>
              </span>
            </div>
            <div className="rounded-xl border border-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[360px] text-sm">
                  <thead>
                    <tr className="bg-muted/40 border-b border-border">
                      <th className="px-3 py-2 text-left text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                        Code
                      </th>
                      <th className="px-4 py-2 text-left text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                        Source
                      </th>
                      <th className="px-4 py-2 text-center text-[10px] font-bold text-muted-foreground uppercase tracking-widest w-16">
                        Count
                      </th>
                      <th className="px-4 py-2 text-right text-[10px] font-bold text-muted-foreground uppercase tracking-widest w-14">
                        Share
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {ALL_SOURCES.map((key, i) => {
                      const count =
                        sourceMap.get(
                          key as import("@shared/api").LeadSourceCategory,
                        ) ?? 0;
                      const share =
                        totalLeadsFromSources > 0
                          ? Math.round((count / totalLeadsFromSources) * 100)
                          : 0;
                      return (
                        <tr
                          key={key}
                          className={cn(
                            "border-b border-border/40 transition-colors hover:bg-accent/40",
                            i % 2 === 1 && "bg-muted/20",
                          )}
                        >
                          <td className="px-3 py-2.5">
                            <span className="inline-block whitespace-nowrap text-[10px] font-bold px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                              {SOURCE_CODES[key]}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-sm text-foreground/80">
                            {SOURCE_LABELS[key]}
                          </td>
                          <td className="px-4 py-2.5 text-center">
                            <span
                              className={cn(
                                "font-bold text-sm",
                                count > 0
                                  ? "text-foreground"
                                  : "text-muted-foreground/50",
                              )}
                            >
                              {count}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-right">
                            {count > 0 ? (
                              <span className="text-xs font-semibold text-primary">
                                {share}%
                              </span>
                            ) : (
                              <span className="text-xs text-muted-foreground/40">
                                —
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
};

export default BrokerMetricsPanel;
