import { useEffect, useId, useRef, useState } from "react";
import {
  Building2,
  Car,
  ChevronDown,
  CreditCard,
  Home,
  KeyRound,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const CLIENT_GOAL_PRESET_IDS = [
  "conventional_mortgage",
  "fha_loan",
  "business_funding",
  "auto_financing",
  "jumbo_loan",
  "general_improvement",
] as const;

export type ClientGoalPresetId = (typeof CLIENT_GOAL_PRESET_IDS)[number];

const PRESET_LABELS_EN: Record<ClientGoalPresetId, string> = {
  conventional_mortgage: "Conventional Mortgage",
  fha_loan: "FHA Loan",
  business_funding: "Business Funding",
  auto_financing: "Auto Financing",
  jumbo_loan: "Jumbo Loan",
  general_improvement: "General Improvement",
};

const PRESET_LABELS_ES: Record<ClientGoalPresetId, string> = {
  conventional_mortgage: "Hipoteca convencional",
  fha_loan: "Préstamo FHA",
  business_funding: "Financiamiento empresarial",
  auto_financing: "Financiamiento de auto",
  jumbo_loan: "Préstamo jumbo",
  general_improvement: "Mejora general",
};

const PRESET_ICONS: Record<ClientGoalPresetId, LucideIcon> = {
  conventional_mortgage: Home,
  fha_loan: KeyRound,
  business_funding: CreditCard,
  auto_financing: Car,
  jumbo_loan: Building2,
  general_improvement: TrendingUp,
};

interface ClientGoalComboboxProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  className?: string;
  id?: string;
  name?: string;
  disabled?: boolean;
  language?: "en" | "es";
}

/**
 * Combobox: pick a preset goal or type a custom one freely.
 */
export default function ClientGoalCombobox({
  value,
  onChange,
  onBlur,
  placeholder = "Select or type a goal…",
  className,
  id,
  name,
  disabled,
  language = "en",
}: ClientGoalComboboxProps) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const labels = language === "es" ? PRESET_LABELS_ES : PRESET_LABELS_EN;

  const presets = CLIENT_GOAL_PRESET_IDS.map((presetId) => ({
    id: presetId,
    label: labels[presetId],
    Icon: PRESET_ICONS[presetId],
  }));

  const filtered = value.trim()
    ? presets.filter((p) =>
        p.label.toLowerCase().includes(value.trim().toLowerCase()),
      )
    : presets;

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <div className="relative">
        <input
          id={id}
          name={name}
          disabled={disabled}
          value={value}
          placeholder={placeholder}
          autoComplete="off"
          aria-autocomplete="list"
          aria-controls={listId}
          aria-expanded={open}
          role="combobox"
          onFocus={() => setOpen(true)}
          onBlur={onBlur}
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
          }}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 pr-9 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        />
        <button
          type="button"
          disabled={disabled}
          aria-label="Toggle goals"
          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
          onClick={() => setOpen((o) => !o)}
        >
          <ChevronDown className="h-4 w-4" />
        </button>
      </div>
      {open && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
        >
          {filtered.length === 0 ? (
            <li className="px-2 py-1.5 text-xs text-muted-foreground">
              Keep typing for a custom goal
            </li>
          ) : (
            filtered.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  role="option"
                  className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    onChange(p.label);
                    setOpen(false);
                  }}
                >
                  <p.Icon className="h-4 w-4 text-muted-foreground" />
                  {p.label}
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
