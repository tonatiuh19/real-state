import React, { useState } from "react";
import {
  AlertTriangle,
  ChevronDown,
  Mic,
  MicOff,
  RefreshCw,
  WifiOff,
  CreditCard,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { VoiceErrorInfo } from "@/utils/voiceErrors";
import { isMicError } from "@/utils/voiceErrors";

interface VoiceErrorAlertProps {
  error: VoiceErrorInfo;
  onRetry?: () => void;
  retryLabel?: string;
  onChooseMic?: () => void;
  onDismiss?: () => void;
  /** Start with the "How to fix" steps expanded. */
  defaultExpanded?: boolean;
  className?: string;
}

const iconFor = (error: VoiceErrorInfo) => {
  if (isMicError(error)) return MicOff;
  if (error.category === "connection" || error.category === "service")
    return WifiOff;
  if (error.category === "quota") return CreditCard;
  return AlertTriangle;
};

/**
 * Reusable alert for voice/calling failures. Shows a friendly title + message,
 * collapsible fix steps, and Retry / Choose microphone actions.
 */
const VoiceErrorAlert: React.FC<VoiceErrorAlertProps> = ({
  error,
  onRetry,
  retryLabel = "Retry",
  onChooseMic,
  onDismiss,
  defaultExpanded = false,
  className,
}) => {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const Icon = iconFor(error);
  const warn = error.category === "quota" || error.category === "service";

  return (
    <div
      role="alert"
      className={cn(
        "rounded-lg border px-3 py-2.5 text-xs animate-in fade-in slide-in-from-top-1 duration-200",
        warn
          ? "bg-amber-50 border-amber-200 text-amber-800"
          : "bg-red-50 border-red-200 text-red-700",
        className,
      )}
    >
      <div className="flex items-start gap-2">
        <Icon className="h-4 w-4 shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0 leading-snug">
          <p className="font-semibold">{error.title}</p>
          <p className="opacity-90">{error.message}</p>
        </div>
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="shrink-0 rounded p-0.5 opacity-60 hover:opacity-100 transition-opacity"
            aria-label="Dismiss"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {error.steps.length > 0 && (
        <div className="mt-2 pl-6">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="flex items-center gap-1 font-medium underline-offset-2 hover:underline"
            aria-expanded={expanded}
          >
            How to fix
            <ChevronDown
              className={cn(
                "h-3 w-3 transition-transform duration-200",
                expanded && "rotate-180",
              )}
            />
          </button>
          {expanded && (
            <ol className="mt-1.5 list-decimal space-y-1 pl-4 animate-in fade-in duration-150">
              {error.steps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          )}
        </div>
      )}

      {(onRetry || (onChooseMic && error.showMicPicker)) && (
        <div className="mt-2.5 flex flex-wrap gap-2 pl-6">
          {onRetry && (
            <Button
              size="sm"
              variant="outline"
              className="h-7 gap-1.5 bg-background text-xs"
              onClick={onRetry}
            >
              <RefreshCw className="h-3 w-3" />
              {retryLabel}
            </Button>
          )}
          {onChooseMic && error.showMicPicker && (
            <Button
              size="sm"
              variant="outline"
              className="h-7 gap-1.5 bg-background text-xs"
              onClick={onChooseMic}
            >
              <Mic className="h-3 w-3" />
              Choose microphone
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default VoiceErrorAlert;
