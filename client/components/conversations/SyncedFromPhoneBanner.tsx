import React from "react";
import { Smartphone, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface SyncedFromPhoneBannerProps {
  className?: string;
}

/**
 * Shown on phone-synced Group MMS threads — carrier group names are not imported.
 */
export function SyncedFromPhoneBanner({ className }: SyncedFromPhoneBannerProps) {
  return (
    <div
      className={cn(
        "flex items-start gap-2 rounded-lg border border-blue-200/80 bg-blue-50/80 dark:bg-blue-950/30 dark:border-blue-800/60 px-3 py-2.5 text-xs text-blue-900 dark:text-blue-100",
        className,
      )}
    >
      <Smartphone className="h-4 w-4 shrink-0 mt-0.5 text-blue-600 dark:text-blue-400" />
      <div className="space-y-0.5">
        <p className="font-medium">Synced from your phone</p>
        <p className="text-blue-800/90 dark:text-blue-200/90 leading-relaxed flex items-start gap-1">
          <Info className="h-3 w-3 shrink-0 mt-0.5 opacity-70" />
          This group was created on your carrier. Encore shows participants and
          messages — rename the group here anytime; your phone&apos;s label is
          not imported.
        </p>
      </div>
    </div>
  );
}

export default SyncedFromPhoneBanner;
