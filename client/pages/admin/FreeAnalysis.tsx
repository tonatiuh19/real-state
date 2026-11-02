import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useFormik } from "formik";
import * as Yup from "yup";
import { ExternalLink, FileSearch, Loader2, Upload, Copy, CheckCheck, Link2 } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  ClientLinkCombobox,
  type LinkedClientValue,
} from "@/components/ClientLinkCombobox";
import ClientGoalCombobox from "@/components/ClientGoalCombobox";
import { CreditAnalysisResultView } from "@/components/credit/CreditAnalysisResultView";
import { DismissibleHelp } from "@/components/DismissibleHelp";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  clearCreditAnalysisResult,
  fetchAdminCreditAnalyses,
  fetchAdminCreditAnalysis,
  runAdminCreditAnalysis,
} from "@/store/slices/creditAnalysisSlice";
import { fetchClientProfile } from "@/store/slices/clientDetailSlice";
import { fetchMyShareLink } from "@/store/slices/brokersSlice";
import { freeAnalysisCopy, type FreeAnalysisLang } from "@/lib/creditAnalysisCopy";
import { CREDIT_ANALYSIS_MAX_FILE_BYTES } from "@/lib/credit-analysis/upload";
import { buildFreeAnalysisPortalShareUrl } from "@/lib/portalDeepLink";
import { useToast } from "@/hooks/use-toast";
import { logger } from "@/lib/logger";
import type { CreditAnalysisMode } from "@shared/api";
import { cn } from "@/lib/utils";

const HELP_STORAGE_KEY = "encore.free-analysis.help.dismissed.v3";

const schema = Yup.object({
  mode: Yup.mixed<CreditAnalysisMode>().oneOf(["client", "agent"]).required(),
  language: Yup.mixed<FreeAnalysisLang>().oneOf(["en", "es"]).required(),
  goal: Yup.string().trim().optional(),
  email_opt_in: Yup.boolean().required(),
});

export default function FreeAnalysis() {
  const [searchParams] = useSearchParams();
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const { submitting, error, result, history, historyLoading } = useAppSelector(
    (s) => s.creditAnalysis,
  );
  const { brokerShareLink, shareLinkLoading } = useAppSelector(
    (s) => s.brokers,
  );

  const queryClientId = useMemo(() => {
    const raw = searchParams.get("clientId");
    const n = raw ? parseInt(raw, 10) : NaN;
    return Number.isFinite(n) ? n : null;
  }, [searchParams]);

  const [client, setClient] = useState<LinkedClientValue | null>(null);
  const [pdf, setPdf] = useState<File | null>(null);
  const [helpEpoch, setHelpEpoch] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    void dispatch(fetchMyShareLink());
  }, [dispatch]);

  const shareUrl = useMemo(() => {
    const applyUrl = brokerShareLink?.share_url;
    return applyUrl ? buildFreeAnalysisPortalShareUrl(applyUrl) : "";
  }, [brokerShareLink?.share_url]);

  const formik = useFormik({
    initialValues: {
      mode: "agent" as CreditAnalysisMode,
      language: "en" as FreeAnalysisLang,
      goal: "",
      email_opt_in: false,
    },
    validationSchema: schema,
    onSubmit: async (values) => {
      const copy = freeAnalysisCopy(values.language);
      if (!client?.id) {
        toast({
          title: copy.errClient,
          variant: "destructive",
        });
        return;
      }
      if (!pdf) {
        toast({
          title: copy.errFile,
          variant: "destructive",
        });
        return;
      }
      try {
        const analysis = await dispatch(
          runAdminCreditAnalysis({
            client_id: client.id,
            pdf,
            mode: values.mode,
            language: values.language,
            goal: values.goal || undefined,
            email_opt_in: values.email_opt_in,
          }),
        ).unwrap();
        if (analysis.email_skipped_no_address) {
          toast({
            title: copy.analysisReadyToast,
            description: copy.emailSkippedNoAddress,
          });
        } else if (values.email_opt_in && !analysis.email_sent) {
          toast({
            title: copy.analysisReadyToast,
            description: copy.emailFailed,
          });
        } else {
          toast({ title: copy.analysisReadyToast });
        }
        void dispatch(fetchAdminCreditAnalyses(client.id));
      } catch (e: any) {
        logger.error("Free analysis failed", e);
        toast({
          title: copy.analysisFailedToast,
          description: typeof e === "string" ? e : e?.message || copy.tryAgain,
          variant: "destructive",
        });
      }
    },
  });

  const t = freeAnalysisCopy(formik.values.language);

  useEffect(() => {
    if (!queryClientId) return;
    void dispatch(fetchClientProfile(queryClientId))
      .unwrap()
      .then((profile: any) => {
        setClient({
          id: profile.id,
          first_name: profile.first_name,
          last_name: profile.last_name,
          email: profile.email,
          phone: profile.phone ?? null,
        });
      })
      .catch((e) => logger.warn("Could not preload client for Free Analysis", e));
  }, [dispatch, queryClientId]);

  useEffect(() => {
    if (!client?.id) return;
    void dispatch(fetchAdminCreditAnalyses(client.id));
  }, [client?.id, dispatch]);

  useEffect(() => {
    return () => {
      dispatch(clearCreditAnalysisResult());
    };
  }, [dispatch]);

  const onFile = (file: File | null) => {
    if (!file) {
      setPdf(null);
      return;
    }
    if (file.type !== "application/pdf") {
      toast({
        title: t.errFile,
        description: t.uploadHint,
        variant: "destructive",
      });
      return;
    }
    if (file.size > CREDIT_ANALYSIS_MAX_FILE_BYTES) {
      toast({
        title: t.errFile,
        description: "Max 4MB",
        variant: "destructive",
      });
      return;
    }
    setPdf(file);
  };

  const showTipsAgain = () => {
    try {
      localStorage.removeItem(HELP_STORAGE_KEY);
    } catch {
      /* ignore */
    }
    setHelpEpoch((n) => n + 1);
  };

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <PageHeader
        title={t.pageTitle}
        description={t.pageDescription}
        icon={<FileSearch className="h-5 w-5" />}
        actions={
          <Button type="button" variant="ghost" size="sm" onClick={showTipsAgain}>
            {t.helpShowAgain}
          </Button>
        }
      />

      <DismissibleHelp
        key={helpEpoch}
        storageKey={HELP_STORAGE_KEY}
        title={t.helpTitle}
        dismissLabel={t.helpDismiss}
      >
        <p>{t.helpStep1}</p>
        <p>{t.helpStep2}</p>
        <p>{t.helpStep3}</p>
        <p>{t.helpStep4}</p>
        <p>{t.helpStep5}</p>
      </DismissibleHelp>

      <div className="rounded-xl border bg-card p-4 sm:p-5 space-y-3">
        <div className="flex items-start gap-2">
          <Link2 className="h-4 w-4 mt-0.5 text-primary shrink-0" />
          <div className="space-y-1 min-w-0">
            <h2 className="font-semibold text-foreground">{t.shareLinkTitle}</h2>
            <p className="text-sm text-muted-foreground">{t.shareLinkBody}</p>
          </div>
        </div>
        {shareLinkLoading && !shareUrl ? (
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            {t.shareLinkLoading}
          </p>
        ) : !shareUrl ? (
          <p className="text-sm text-destructive">{t.shareLinkError}</p>
        ) : (
          <div className="flex flex-col sm:flex-row gap-2">
            <Input readOnly value={shareUrl} className="font-mono text-xs sm:text-sm" />
            <div className="flex gap-2 shrink-0">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={async () => {
                  await navigator.clipboard.writeText(shareUrl);
                  setCopied(true);
                  toast({ title: t.shareLinkCopied });
                  window.setTimeout(() => setCopied(false), 2000);
                }}
              >
                {copied ? (
                  <CheckCheck className="h-4 w-4 mr-1.5" />
                ) : (
                  <Copy className="h-4 w-4 mr-1.5" />
                )}
                {copied ? t.shareLinkCopied : t.shareLinkCopy}
              </Button>
              <Button type="button" variant="ghost" size="sm" asChild>
                <a href={shareUrl} target="_blank" rel="noreferrer">
                  {t.shareLinkOpen}
                  <ExternalLink className="h-3.5 w-3.5 ml-1.5" />
                </a>
              </Button>
            </div>
          </div>
        )}
        <div className="rounded-lg border border-dashed bg-muted/30 p-3 text-sm">
          <p className="font-medium text-foreground">{t.clientViewTitle}</p>
          <p className="mt-1 text-muted-foreground">{t.clientViewBody}</p>
        </div>
      </div>

      <form
        onSubmit={formik.handleSubmit}
        className="rounded-xl border bg-card p-4 sm:p-6 space-y-5"
      >
        <div>
          <Label className="mb-2 block">{t.clientRequired}*</Label>
          <ClientLinkCombobox value={client} onChange={setClient} />
        </div>

        <div>
          <Label className="mb-2 block">{t.uploadLabel}*</Label>
          <label
            className={cn(
              "flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-4 py-8 cursor-pointer hover:bg-muted/40 transition-colors",
              pdf && "border-primary/40 bg-primary/5",
            )}
          >
            <Upload className="h-6 w-6 text-muted-foreground" />
            <span className="text-sm font-medium">
              {pdf ? pdf.name : t.choosePdf}
            </span>
            <span className="text-xs text-muted-foreground text-center">
              {t.uploadHint}
            </span>
            <input
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={(e) => onFile(e.target.files?.[0] ?? null)}
            />
          </label>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label className="mb-2 block">{t.goalLabel}</Label>
            <ClientGoalCombobox
              value={formik.values.goal}
              onChange={(v) => formik.setFieldValue("goal", v)}
              language={formik.values.language}
            />
          </div>
          <div>
            <Label className="mb-2 block">{t.languageLabel}</Label>
            <Select
              value={formik.values.language}
              onValueChange={(v) =>
                formik.setFieldValue("language", v as FreeAnalysisLang)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="es">Español</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="mb-2 block">{t.modeLabel}</Label>
            <Select
              value={formik.values.mode}
              onValueChange={(v) =>
                formik.setFieldValue("mode", v as CreditAnalysisMode)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="client">{t.modeClient}</SelectItem>
                <SelectItem value="agent">{t.modeAgent}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2">
            <Label htmlFor="email_opt_in" className="text-sm">
              {t.emailOptIn}
            </Label>
            <Switch
              id="email_opt_in"
              checked={formik.values.email_opt_in}
              onCheckedChange={(v) => formik.setFieldValue("email_opt_in", v)}
            />
          </div>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {t.running}
            </>
          ) : (
            t.run
          )}
        </Button>
      </form>

      {result && (
        <div className="rounded-xl border bg-card p-4 sm:p-6">
          <CreditAnalysisResultView
            analysis={result}
            language={formik.values.language}
          />
        </div>
      )}

      {client?.id && (
        <div className="rounded-xl border bg-card p-4 sm:p-6 space-y-3">
          <h2 className="font-semibold">{t.historyHeading}</h2>
          {historyLoading ? (
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> {t.loading}
            </p>
          ) : history.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t.emptyHistory}</p>
          ) : (
            <ul className="space-y-2">
              {history.map((row) => (
                <li
                  key={row.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm"
                >
                  <span>
                    #{row.id} · {new Date(row.generated_at).toLocaleString()} ·{" "}
                    {row.extraction_status}
                    {row.provider_detected ? ` · ${row.provider_detected}` : ""}
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => void dispatch(fetchAdminCreditAnalysis(row.id))}
                  >
                    {t.view}
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
