import { AlertTriangle, CheckCircle2, Download, Mail } from "lucide-react";
import type { CreditAnalysisResult } from "@shared/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { freeAnalysisCopy, type FreeAnalysisLang } from "@/lib/creditAnalysisCopy";
import { cn } from "@/lib/utils";

interface CreditAnalysisResultViewProps {
  analysis: CreditAnalysisResult;
  language?: FreeAnalysisLang;
  className?: string;
}

export function CreditAnalysisResultView({
  analysis,
  language = "en",
  className,
}: CreditAnalysisResultViewProps) {
  const t = freeAnalysisCopy(language);
  const weak = analysis.extraction_status !== "ok";
  const scores = analysis.scores;

  const downloadHtml = () => {
    const blob = new Blob([analysis.analysis_html || ""], {
      type: "text/html;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `encore-credit-analysis-${analysis.id}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            {!weak && (
              <Badge variant="secondary" className="gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {t.resultBadge}
              </Badge>
            )}
            {weak && (
              <Badge variant="destructive" className="gap-1">
                <AlertTriangle className="h-3.5 w-3.5" />
                {t.extractionWeakBadge}
              </Badge>
            )}
            {analysis.email_sent && (
              <Badge variant="outline" className="gap-1">
                <Mail className="h-3.5 w-3.5" />
                {t.emailSentNotice}
              </Badge>
            )}
            {analysis.email_skipped_no_address && (
              <Badge variant="outline" className="gap-1 text-amber-700 border-amber-300">
                <AlertTriangle className="h-3.5 w-3.5" />
                {t.emailSkippedNoAddress}
              </Badge>
            )}
            {analysis.email_opt_in &&
              !analysis.email_sent &&
              !analysis.email_skipped_no_address && (
                <Badge variant="outline" className="gap-1 text-amber-700 border-amber-300">
                  {t.emailFailed}
                </Badge>
              )}
            {analysis.provider_detected && (
              <Badge variant="outline">{analysis.provider_detected}</Badge>
            )}
          </div>
          <h3 className="text-lg font-semibold text-foreground">
            {t.resultHeading}
          </h3>
          <p className="text-sm text-muted-foreground">{t.resultSubheading}</p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={downloadHtml}>
          <Download className="h-4 w-4 mr-2" />
          {t.download}
        </Button>
      </div>

      {weak && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          <p className="font-medium">{t.extractionWeakHeading}</p>
          <p className="mt-1 text-amber-800/90">{t.extractionWeakBody}</p>
        </div>
      )}

      {scores && (
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {(
            [
              ["TU", scores.transunion],
              ["EX", scores.experian],
              ["EQ", scores.equifax],
            ] as const
          ).map(([label, score]) => (
            <div
              key={label}
              className="rounded-lg border bg-card p-3 text-center"
            >
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="text-xl font-semibold tabular-nums">
                {typeof score === "number" ? score : "—"}
              </p>
            </div>
          ))}
        </div>
      )}

      <div
        className="rounded-lg border bg-background p-4 overflow-x-auto prose prose-sm max-w-none dark:prose-invert"
        dangerouslySetInnerHTML={{ __html: analysis.analysis_html || "" }}
      />
    </div>
  );
}
