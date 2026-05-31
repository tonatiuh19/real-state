import { AlertCircle } from "lucide-react";
import { useAppSelector } from "@/store/hooks";
import { cn } from "@/lib/utils";

type Props = { className?: string };

export function DatabaseQuotaBanner({ className }: Props) {
  const exceeded = useAppSelector((s) => s.brokerAuth.databaseQuotaExceeded);
  if (!exceeded) return null;

  return (
    <div
      role="alert"
      className={cn(
        "flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive",
        className,
      )}
    >
      <AlertCircle className="h-4 w-4 shrink-0" />
      <span>
        Credit limit exceeded. Please update billing information, then refresh
        this page to continue.
      </span>
    </div>
  );
}
