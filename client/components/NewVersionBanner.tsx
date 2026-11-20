import React, { useEffect } from "react";
import { RefreshCw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { checkForNewBuild } from "@/store/slices/appVersionSlice";

const CHECK_EVERY_MS = 5 * 60_000;

/**
 * Floating "new version" prompt. Checks on an interval and whenever the tab
 * becomes visible again, so a tab left open for days picks up fixes.
 */
export default function NewVersionBanner() {
  const dispatch = useAppDispatch();
  const updateAvailable = useAppSelector((s) => s.appVersion.updateAvailable);

  useEffect(() => {
    const check = () => {
      if (document.visibilityState === "visible") void dispatch(checkForNewBuild());
    };
    check();
    const id = window.setInterval(check, CHECK_EVERY_MS);
    document.addEventListener("visibilitychange", check);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", check);
    };
  }, [dispatch]);

  if (!updateAvailable) return null;
  return (
    <div className="fixed bottom-4 left-1/2 z-[100] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="flex items-center gap-3 rounded-2xl border border-primary/20 bg-card px-4 py-3 shadow-xl">
        <div className="rounded-full bg-primary/10 p-2">
          <Sparkles className="h-4 w-4 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">New version available</p>
          <p className="text-xs text-muted-foreground">Reload to get the latest fixes.</p>
        </div>
        <Button size="sm" className="gap-1.5" onClick={() => window.location.reload()}>
          <RefreshCw className="h-3.5 w-3.5" />
          Reload
        </Button>
      </div>
    </div>
  );
}
