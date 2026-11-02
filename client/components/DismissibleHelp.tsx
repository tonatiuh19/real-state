import { useEffect, useState } from "react";
import { Info, X } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DismissibleHelpProps {
  storageKey: string;
  title: string;
  children: React.ReactNode;
  className?: string;
  dismissLabel?: string;
}

/**
 * Dismissible coach-mark / helper. Persistence is per-browser via localStorage.
 * Reusable across admin tools (Free Analysis, etc.).
 */
export function DismissibleHelp({
  storageKey,
  title,
  children,
  className,
  dismissLabel = "Got it",
}: DismissibleHelpProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(storageKey) === "1") {
        setVisible(false);
        return;
      }
    } catch {
      /* private mode */
    }
    setVisible(true);
  }, [storageKey]);

  const dismiss = () => {
    try {
      localStorage.setItem(storageKey, "1");
    } catch {
      /* ignore */
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <Alert
      className={cn(
        "border-primary/25 bg-primary/5 pr-12 relative",
        className,
      )}
    >
      <Info className="h-4 w-4 text-primary" />
      <AlertTitle className="text-foreground pr-8">{title}</AlertTitle>
      <AlertDescription className="text-muted-foreground space-y-2 mt-1">
        {children}
        <div className="pt-1">
          <Button type="button" size="sm" variant="secondary" onClick={dismiss}>
            {dismissLabel}
          </Button>
        </div>
      </AlertDescription>
      <button
        type="button"
        aria-label={dismissLabel}
        onClick={dismiss}
        className="absolute right-3 top-3 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
      >
        <X className="h-4 w-4" />
      </button>
    </Alert>
  );
}
