import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useFormik } from "formik";
import * as Yup from "yup";
import { motion } from "framer-motion";
import {
  AlertCircle,
  ArrowRight,
  FileSearch,
  Loader2,
  Upload,
  Shield,
  X,
} from "lucide-react";
import { CreditAnalysisResultView } from "@/components/credit/CreditAnalysisResultView";
import ClientGoalCombobox from "@/components/ClientGoalCombobox";
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
import { fetchBrokerPublicInfo } from "@/store/slices/applicationWizardSlice";
import {
  runPublicFreeAnalysis,
  clearPublicFreeAnalysis,
} from "@/store/slices/creditAnalysisSlice";
import { freeAnalysisCopy, type FreeAnalysisLang } from "@/lib/creditAnalysisCopy";
import { CREDIT_ANALYSIS_MAX_FILE_BYTES } from "@/lib/credit-analysis/upload";
import { useToast } from "@/hooks/use-toast";
import { logger } from "@/lib/logger";
import { cn } from "@/lib/utils";
import { MetaHelmet } from "@/components/MetaHelmet";

const schema = Yup.object({
  first_name: Yup.string().trim().required("Required"),
  last_name: Yup.string().trim().required("Required"),
  email: Yup.string().trim().email("Invalid email").required("Required"),
  phone: Yup.string().trim().optional(),
  language: Yup.mixed<FreeAnalysisLang>().oneOf(["en", "es"]).required(),
  goal: Yup.string().trim().optional(),
  email_opt_in: Yup.boolean().required(),
});

function SmallBrokerAvatar({
  person,
}: {
  person: {
    first_name: string;
    last_name: string;
    avatar_url: string | null;
  };
}) {
  return (
    <div className="h-8 w-8 rounded-full overflow-hidden ring-2 ring-primary/20 border border-primary/30 shrink-0">
      {person.avatar_url ? (
        <img
          src={person.avatar_url}
          alt={`${person.first_name} ${person.last_name}`}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="h-full w-full bg-primary flex items-center justify-center text-white text-xs font-bold">
          {person.first_name?.[0] || ""}
          {person.last_name?.[0] || ""}
        </div>
      )}
    </div>
  );
}

/**
 * Public Free Analysis — share-link UX matched to `/apply/:brokerToken` wizard shell.
 */
export default function PublicFreeAnalysis() {
  const { brokerToken } = useParams<{ brokerToken: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { toast } = useToast();

  const brokerInfo = useAppSelector((s) => s.applicationWizard.brokerInfo);
  const brokerInfoLoading = useAppSelector(
    (s) => s.applicationWizard.brokerInfoLoading,
  );
  const brokerInfoError = useAppSelector(
    (s) => s.applicationWizard.brokerInfoError,
  );
  const { publicSubmitting, publicResult, publicIsNewLead, publicError } =
    useAppSelector((s) => s.creditAnalysis);

  const [pdf, setPdf] = useState<File | null>(null);

  useEffect(() => {
    dispatch(clearPublicFreeAnalysis());
    if (brokerToken) {
      void dispatch(fetchBrokerPublicInfo(brokerToken));
    }
  }, [brokerToken, dispatch]);

  const formik = useFormik({
    initialValues: {
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      language: "en" as FreeAnalysisLang,
      goal: "",
      email_opt_in: false,
    },
    validationSchema: schema,
    onSubmit: async (values) => {
      const copy = freeAnalysisCopy(values.language);
      if (!brokerToken) {
        toast({ title: copy.analysisFailedToast, variant: "destructive" });
        return;
      }
      if (!pdf) {
        toast({
          title: copy.errFile,
          description: copy.uploadHint,
          variant: "destructive",
        });
        return;
      }
      try {
        const result = await dispatch(
          runPublicFreeAnalysis({
            broker_token: brokerToken,
            first_name: values.first_name.trim(),
            last_name: values.last_name.trim(),
            email: values.email.trim(),
            phone: values.phone.trim() || undefined,
            pdf,
            language: values.language,
            goal: values.goal || undefined,
            email_opt_in: values.email_opt_in,
          }),
        ).unwrap();
        if (result.is_new_lead) {
          toast({
            title: copy.analysisReadyToast,
            description: copy.publicNewLeadNotice,
          });
        } else if (result.analysis.email_skipped_no_address) {
          toast({
            title: copy.analysisReadyToast,
            description: copy.emailSkippedNoAddress,
          });
        } else if (values.email_opt_in && !result.analysis.email_sent) {
          toast({
            title: copy.analysisReadyToast,
            description: copy.emailFailed,
          });
        } else {
          toast({ title: copy.analysisReadyToast });
        }
      } catch (e: any) {
        logger.error("Public free analysis failed", e);
        toast({
          title: copy.analysisFailedToast,
          description: typeof e === "string" ? e : e?.message || copy.tryAgain,
          variant: "destructive",
        });
      }
    },
  });

  const t = freeAnalysisCopy(formik.values.language);
  const isHomeTeam =
    !!brokerInfo &&
    brokerInfo.role === "broker" &&
    !!brokerInfo.mortgage_banker;

  if (brokerInfoLoading) {
    return (
      <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center gap-3 bg-background">
        <Loader2 className="h-7 w-7 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">{t.loading}</p>
      </div>
    );
  }

  if (brokerInfoError || !brokerInfo) {
    return (
      <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center px-4 bg-gray-50">
        <img
          src="https://disruptinglabs.com/data/encore/assets/images/logo.png"
          alt="Encore Mortgage"
          className="h-12 w-auto mb-8"
        />
        <div className="w-full max-w-sm bg-white rounded-2xl border border-gray-200 shadow-sm p-8 text-center">
          <AlertCircle className="h-10 w-10 text-red-400 mx-auto mb-3" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">
            {t.publicLinkInvalidTitle}
          </h1>
          <p className="text-sm text-gray-500 mb-5">{t.publicLinkInvalidBody}</p>
          <Button variant="outline" onClick={() => navigate("/")}>
            {t.publicGoHome}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-background overflow-y-auto">
      <MetaHelmet
        title={`${t.publicPageTitle} — Encore Mortgage`}
        description={t.publicPageDescription}
      />

      {/* Same sticky header chrome as ApplicationWizard */}
      <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-xl border-b">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-4 min-w-0">
            <Link
              to="/"
              className="flex items-center transition-transform hover:scale-105 shrink-0"
            >
              <img
                src="https://disruptinglabs.com/data/encore/assets/images/logo.png"
                alt="Encore Mortgage"
                className="h-10 w-auto"
              />
            </Link>
            <div className="h-4 w-px bg-border hidden sm:block" />
            <div className="hidden sm:flex items-center gap-2.5 min-w-0">
              {isHomeTeam ? (
                <div className="flex items-center shrink-0">
                  <SmallBrokerAvatar person={brokerInfo} />
                  <div className="-ml-2 z-10">
                    <SmallBrokerAvatar person={brokerInfo.mortgage_banker!} />
                  </div>
                </div>
              ) : (
                <SmallBrokerAvatar person={brokerInfo} />
              )}
              <div className="flex flex-col gap-0.5 min-w-0">
                <span className="text-sm font-medium text-muted-foreground leading-none">
                  {t.publicPageTitle}
                </span>
                <span className="text-xs text-primary font-medium leading-none truncate">
                  {isHomeTeam
                    ? `${brokerInfo.first_name} & ${brokerInfo.mortgage_banker!.first_name}`
                    : `with ${brokerInfo.first_name} ${brokerInfo.last_name}`}
                </span>
              </div>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => navigate("/")}
            className="rounded-full shrink-0"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        <div className="h-1 bg-primary/10">
          <div className="h-full w-1/3 bg-primary rounded-none" />
        </div>
      </header>

      <div className="flex-1 flex flex-col">
        <div className="container max-w-3xl py-10 md:py-14 flex-1 flex flex-col">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="space-y-6"
          >
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-semibold">
                <FileSearch className="h-3.5 w-3.5" />
                {t.publicPageTitle}
              </div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
                {t.publicPageTitle}
              </h1>
              <p className="text-muted-foreground text-base md:text-lg max-w-2xl leading-relaxed">
                {t.publicWithBroker.replace(
                  "{name}",
                  `${brokerInfo.first_name} ${brokerInfo.last_name}`.trim(),
                )}
              </p>
            </div>

            <div className="rounded-2xl border border-primary/15 bg-primary/5 px-4 py-3 text-sm text-muted-foreground flex gap-2.5">
              <Shield className="h-4 w-4 shrink-0 mt-0.5 text-primary" />
              <p>{t.publicClientHelper}</p>
            </div>

            {publicResult ? (
              <div className="space-y-5">
                {publicIsNewLead && (
                  <p className="text-sm rounded-2xl border border-primary/30 bg-primary/5 px-4 py-3 text-foreground">
                    {t.publicNewLeadNotice}
                  </p>
                )}
                <div className="rounded-2xl border bg-card p-5 sm:p-6 shadow-sm">
                  <CreditAnalysisResultView
                    analysis={publicResult}
                    language={formik.values.language}
                  />
                </div>
                <div className="flex flex-col sm:flex-row gap-3 pt-1">
                  <Button
                    type="button"
                    className="rounded-xl px-6 font-bold shadow-lg shadow-primary/20"
                    onClick={() =>
                      navigate(
                        `/client-login?next=${encodeURIComponent("/portal/free-analysis")}`,
                      )
                    }
                  >
                    {t.publicContinuePortal}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-xl"
                    onClick={() => navigate(`/apply/${brokerToken}`)}
                  >
                    {t.publicStartApplication}
                  </Button>
                </div>
              </div>
            ) : (
              <form
                onSubmit={formik.handleSubmit}
                className="rounded-2xl border bg-card p-5 sm:p-8 shadow-sm space-y-5"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="fa-first" className="text-sm font-semibold">
                      {t.publicFirstName}*
                    </Label>
                    <Input
                      id="fa-first"
                      name="first_name"
                      value={formik.values.first_name}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      className="h-11"
                    />
                    {formik.touched.first_name && formik.errors.first_name && (
                      <p className="text-xs text-destructive">
                        {formik.errors.first_name}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="fa-last" className="text-sm font-semibold">
                      {t.publicLastName}*
                    </Label>
                    <Input
                      id="fa-last"
                      name="last_name"
                      value={formik.values.last_name}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      className="h-11"
                    />
                    {formik.touched.last_name && formik.errors.last_name && (
                      <p className="text-xs text-destructive">
                        {formik.errors.last_name}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="fa-email" className="text-sm font-semibold">
                    {t.publicEmail}*
                  </Label>
                  <Input
                    id="fa-email"
                    name="email"
                    type="email"
                    value={formik.values.email}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className="h-11"
                    placeholder="you@example.com"
                  />
                  {formik.touched.email && formik.errors.email && (
                    <p className="text-xs text-destructive">
                      {formik.errors.email}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="fa-phone" className="text-sm font-semibold">
                    {t.publicPhone}
                  </Label>
                  <Input
                    id="fa-phone"
                    name="phone"
                    type="tel"
                    value={formik.values.phone}
                    onChange={formik.handleChange}
                    className="h-11"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-sm font-semibold">
                    {t.uploadLabel}*
                  </Label>
                  <label
                    className={cn(
                      "flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-4 py-10 cursor-pointer transition-colors",
                      pdf
                        ? "border-primary/50 bg-primary/5"
                        : "border-muted-foreground/25 hover:border-primary/40",
                    )}
                  >
                    <Upload className="h-6 w-6 text-muted-foreground" />
                    <span className="text-sm font-semibold">
                      {pdf ? pdf.name : t.choosePdf}
                    </span>
                    <span className="text-xs text-muted-foreground text-center">
                      {t.uploadHint}
                    </span>
                    <input
                      type="file"
                      accept="application/pdf"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0] || null;
                        if (!f) {
                          setPdf(null);
                          return;
                        }
                        if (
                          f.type &&
                          f.type !== "application/pdf" &&
                          !f.name.toLowerCase().endsWith(".pdf")
                        ) {
                          toast({
                            title: t.errFile,
                            description: t.uploadHint,
                            variant: "destructive",
                          });
                          e.target.value = "";
                          return;
                        }
                        if (f.size > CREDIT_ANALYSIS_MAX_FILE_BYTES) {
                          toast({
                            title: t.errFile,
                            variant: "destructive",
                          });
                          e.target.value = "";
                          return;
                        }
                        setPdf(f);
                      }}
                    />
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-sm font-semibold">{t.goalLabel}</Label>
                    <ClientGoalCombobox
                      value={formik.values.goal}
                      onChange={(v) => formik.setFieldValue("goal", v)}
                      language={formik.values.language}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-semibold">
                      {t.languageLabel}
                    </Label>
                    <Select
                      value={formik.values.language}
                      onValueChange={(v) =>
                        formik.setFieldValue("language", v as FreeAnalysisLang)
                      }
                    >
                      <SelectTrigger className="h-11">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="es">Español</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 rounded-xl border px-4 py-3">
                  <Label
                    htmlFor="fa-email-opt"
                    className="text-sm font-medium cursor-pointer"
                  >
                    {t.emailOptInSelf}
                  </Label>
                  <Switch
                    id="fa-email-opt"
                    checked={formik.values.email_opt_in}
                    onCheckedChange={(c) =>
                      formik.setFieldValue("email_opt_in", c)
                    }
                  />
                </div>

                {publicError && (
                  <p className="text-sm text-destructive">{publicError}</p>
                )}

                <Button
                  type="submit"
                  className="w-full h-12 rounded-xl text-base font-bold shadow-lg shadow-primary/20"
                  disabled={publicSubmitting}
                >
                  {publicSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {t.running}
                    </>
                  ) : (
                    <>
                      {t.run}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
