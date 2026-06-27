import { useEffect, useRef, useState } from "react";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { useAppDispatch } from "@/store/hooks";
import { fetchBrokers } from "@/store/slices/brokersSlice";
import type { Broker, BrokerListScope } from "@shared/api";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

function brokerRoleLabel(role: Broker["role"]): string {
  if (role === "platform_owner") return "Platform Owner";
  if (role === "admin") return "Mortgage Banker";
  return "Partner";
}

export interface BrokerSearchSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  /** API scope — mortgage-bankers = admins + platform owners; omit = full directory */
  scope?: BrokerListScope;
  allowUnassigned?: boolean;
  /** Shown on the trigger when value is set but not in the current result set */
  selectedDisplayName?: string;
  className?: string;
}

export function BrokerSearchSelect({
  value,
  onValueChange,
  disabled = false,
  placeholder = "Search by name or email…",
  scope,
  allowUnassigned = true,
  selectedDisplayName,
  className,
}: BrokerSearchSelectProps) {
  const dispatch = useAppDispatch();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [options, setOptions] = useState<Broker[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (!open) return;
    clearTimeout(debounceRef.current);
    const q = search.trim();
    debounceRef.current = setTimeout(
      async () => {
        setLoading(true);
        try {
          const result = await dispatch(
            fetchBrokers({
              limit: 100,
              sortBy: "first_name",
              sortOrder: "ASC",
              search: q.length >= 2 ? q : undefined,
              scope,
            }),
          ).unwrap();
          setOptions(result.brokers);
        } catch {
          setOptions([]);
        } finally {
          setLoading(false);
        }
      },
      q.length >= 2 ? 250 : 0,
    );
    return () => clearTimeout(debounceRef.current);
  }, [open, search, scope, dispatch]);

  const selectedFromList = options.find((b) => String(b.id) === value);
  const triggerLabel =
    value === "unassigned"
      ? "Unassigned"
      : selectedDisplayName ||
        (selectedFromList
          ? `${selectedFromList.first_name} ${selectedFromList.last_name} (${brokerRoleLabel(selectedFromList.role)})`
          : placeholder);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "h-9 w-full justify-between font-normal text-sm",
            className,
          )}
        >
          <span className="truncate">{triggerLabel}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-[--radix-popover-trigger-width] p-0"
        sideOffset={4}
      >
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={placeholder}
            value={search}
            onValueChange={setSearch}
            className="h-9"
          />
          <CommandList className="max-h-72">
            {loading ? (
              <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Searching…
              </div>
            ) : (
              <>
                {search.trim().length < 2 && (
                  <p className="px-3 py-2 text-xs text-muted-foreground border-b">
                    Type 2+ characters to search the full directory
                    {options.length > 0
                      ? ` (showing first ${options.length})`
                      : ""}
                    .
                  </p>
                )}
                <CommandEmpty>No brokers found.</CommandEmpty>
                <CommandGroup>
                  {allowUnassigned && (
                    <CommandItem
                      value="unassigned"
                      onSelect={() => {
                        onValueChange("unassigned");
                        setOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          value === "unassigned" ? "opacity-100" : "opacity-0",
                        )}
                      />
                      Unassigned
                    </CommandItem>
                  )}
                  {options
                    .filter((b) => b.status === "active")
                    .map((broker) => {
                      const id = String(broker.id);
                      const label = `${broker.first_name} ${broker.last_name} (${brokerRoleLabel(broker.role)})`;
                      return (
                        <CommandItem
                          key={broker.id}
                          value={`${broker.first_name} ${broker.last_name} ${broker.email} ${id}`}
                          onSelect={() => {
                            onValueChange(id);
                            setOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              value === id ? "opacity-100" : "opacity-0",
                            )}
                          />
                          <span className="truncate">{label}</span>
                        </CommandItem>
                      );
                    })}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
