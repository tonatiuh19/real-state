import { useEffect, useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { FileSearch, Loader2, Upload } from "lucide-react";
import { CreditAnalysisResultView } from "@/components/credit/CreditAnalysisResultView";
import ClientGoalCombobox from "@/components/ClientGoalCombobox";
import { Button } from "@/components/ui/button";
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
  fetchPortalCreditAnalyses,
  runPortalCreditAnalysis,
} from "@/store/slices/creditAnalysisSlice";
import { freeAnalysisCopy, type FreeAnalysisLang } from "@/lib/creditAnalysisCopy";
import { CREDIT_ANALYSIS_MAX_FILE_BYTES } from "@/lib/credit-analysis/upload";
import { useToast } from "@/hooks/use-toast";
import { logger } from "@/lib/logger";
import { cn } from "@/lib/utils";

const schema = Yup.object({
  language: Yup.mixed<FreeAnalysisLang>().oneOf(["en", "es"]).required(),
  goal: Yup.string().trim().optional(),
  email_opt_in: Yup.boolean().required(),
});

export default function PortalFreeAnalysis() {
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const {
    portalLatest,
    portalList,
    portalLoading,
    portalSubmitting,
    portalError,
  } = useAppSelector((s) => s.creditAnalysis);

  const [pdf, setPdf] = useState<File | null>(null);

  const formik = useFormik({
    initialValues: {
      language: "en" as FreeAnalysisLang,
      goal: "",
      email_opt_in: false,
    },
    validationSchema: schema,
    onSubmit: async (values) => {
      const copy = freeAnalysisCopy(values.language);
      if (!pdf) {
        toast({
          title: copy.errFile,
          description: copy.uploadHint,
          variant: "destructive",
        });
        return;
      }
      try {
        const analysis = await dispatch(
          runPortalCreditAnalysis({
            pdf,
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
      } catch (e: any) {
        logger.error("Portal free analysis failed", e);
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
    void dispatch(fetchPortalCreditAnalyses());
  }, [dispatch]);

  const onFile = (file: File | null) => {
    if (!file) {
      setPdf(null);
      return;
    }
    if (file.type !== "application/pdf") {
      toast({ title: t.errFile, description: t.uploadHint, variant: "destructive" });
      return;
    }
    if (file.size > CREDIT_ANALYSIS_MAX_FILE_BYTES) {
      toast({ title: t.errFile, description: "Max 4MB", variant: "destructive" });
      return;
    }
    setPdf(file);
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-3xl mx-auto">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <FileSearch className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-semibold">{t.portalTitle}</h1>
        </div>
        <p className="text-sm text-muted-foreground">{t.portalDescription}</p>
      </div>

      <form
        onSubmit={formik.handleSubmit}
        className="rounded-xl border bg-card p-4 space-y-4"
      >
        <div>
          <Label className="mb-2 block">{t.uploadLabel}</Label>
          <label
            className={cn(
              "flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-4 py-8 cursor-pointer hover:bg-muted/40",
              pdf && "border-primary/40 bg-primary/5",
            )}
          >
            <Upload className="h-6 w-6 text-muted-foreground" />
            <span className="text-sm font-medium">
              {pdf ? pdf.name : t.portalUpload}
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

        <div className="grid sm:grid-cols-2 gap-3">
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
        </div>

        <div className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2">
          <Label htmlFor="portal_email_opt_in" className="text-sm">
            {t.emailOptInSelf}
          </Label>
          <Switch
            id="portal_email_opt_in"
            checked={formik.values.email_opt_in}
            onCheckedChange={(v) => formik.setFieldValue("email_opt_in", v)}
          />
        </div>

        {portalError && <p className="text-sm text-destructive">{portalError}</p>}

        <Button type="submit" disabled={portalSubmitting} className="w-full">
          {portalSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {t.running}
            </>
          ) : (
            t.run
          )}
        </Button>
      </form>

      {portalLoading && !portalLatest ? (
        <p className="text-sm text-muted-foreground flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" /> {t.loading}
        </p>
      ) : portalLatest ? (
        <div className="rounded-xl border bg-card p-4">
          <CreditAnalysisResultView
            analysis={portalLatest}
            language={formik.values.language}
          />
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">{t.portalEmpty}</p>
      )}

      {portalList.length > 1 && (
        <p className="text-xs text-muted-foreground">
          {t.historyCount.replace("{n}", String(portalList.length))}
        </p>
      )}
    </div>
  );
}
