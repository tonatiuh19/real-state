import { Workflow } from "lucide-react";
import { cn } from "@/lib/utils";

type ApplicationSubmitFlowLegendProps = {
  /** Public borrower-facing copy vs broker admin copy */
  variant?: "client" | "broker";
  className?: string;
};

/**
 * Explains that submitting an application starts the Application Received
 * reminder flow (welcome email/SMS + nurture sequence).
 */
export function ApplicationSubmitFlowLegend({
  variant = "client",
  className,
}: ApplicationSubmitFlowLegendProps) {
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-xl bg-primary/5 border border-primary/10 p-4 text-sm text-muted-foreground",
        className,
      )}
      role="note"
      aria-label="Application Received automation"
    >
      <Workflow
        className="h-4 w-4 mt-0.5 text-primary shrink-0"
        aria-hidden
      />
      <p>
        {variant === "broker" ? (
          <>
            When you submit this application, the{" "}
            <span className="font-medium text-foreground">
              Application Received
            </span>{" "}
            reminder flow starts automatically — your client will receive welcome
            email and SMS, plus scheduled follow-ups.
          </>
        ) : (
          <>
            When you submit, our{" "}
            <span className="font-medium text-foreground">
              Application Received
            </span>{" "}
            welcome flow starts automatically — you&apos;ll get email and text
            updates about your application.
          </>
        )}
      </p>
    </div>
  );
}
