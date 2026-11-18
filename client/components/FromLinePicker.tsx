import React, { useEffect } from "react";
import { Building2, PhoneOutgoing, User, Users } from "lucide-react";
import type { SendableLine, SendableLineKind } from "@shared/api";
import { formatPhoneLabel } from "@shared/group-conversations";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchSendableLines,
  resolveFromLine,
  setSelectedFromLine,
} from "@/store/slices/phoneLinesSlice";
import { cn } from "@/lib/utils";

const KIND_ICON: Record<SendableLineKind, React.ElementType> = {
  personal: User,
  main: Building2,
  delegated: Users,
};

export const formatLineLabel = (line: SendableLine): string =>
  `${line.label} · ${formatPhoneLabel(line.number)}`;

interface FromLinePickerProps {
  /** Thread's inbox number (E.164) — preselected when it is one of the user's lines. */
  threadInbox?: string | null;
  className?: string;
  disabled?: boolean;
}

/**
 * Compact "send from" line chip/select. Renders nothing when the user has
 * one (or zero) sendable lines. Selection lives in the phoneLines slice.
 */
export function FromLinePicker({
  threadInbox,
  className,
  disabled,
}: FromLinePickerProps) {
  const dispatch = useAppDispatch();
  const { lines, linesLoaded, linesLoading, selectedFromLine } = useAppSelector(
    (s) => s.phoneLines,
  );

  useEffect(() => {
    if (!linesLoaded && !linesLoading) dispatch(fetchSendableLines());
  }, [dispatch, linesLoaded, linesLoading]);

  if (lines.length <= 1) return null;

  const value = resolveFromLine(lines, selectedFromLine, threadInbox) ?? "";
  const current = lines.find((l) => l.number === value);
  const CurrentIcon = current ? KIND_ICON[current.kind] : PhoneOutgoing;

  return (
    <Select
      value={value}
      onValueChange={(v) => dispatch(setSelectedFromLine(v))}
      disabled={disabled}
    >
      <SelectTrigger
        aria-label="Send from line"
        className={cn(
          "h-8 w-auto max-w-full gap-1.5 rounded-full border-primary/20 bg-primary/5 px-3 text-xs font-medium text-primary transition-colors hover:bg-primary/10 animate-in fade-in-0 slide-in-from-bottom-1",
          className,
        )}
      >
        <CurrentIcon className="h-3.5 w-3.5 shrink-0" />
        <span className="truncate">
          <span className="hidden sm:inline">From </span>
          {current ? formatLineLabel(current) : "Select line"}
        </span>
      </SelectTrigger>
      <SelectContent>
        {lines.map((line) => {
          const Icon = KIND_ICON[line.kind];
          return (
            <SelectItem key={line.number} value={line.number}>
              <span className="flex items-center gap-2">
                <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="font-medium">{line.label}</span>
                <span className="text-muted-foreground">
                  {formatPhoneLabel(line.number)}
                </span>
              </span>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}

export default FromLinePicker;
