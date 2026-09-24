import { useEffect, useRef, useState } from "react";
import { Check, ChevronsUpDown, Loader2, UserPlus } from "lucide-react";
import { useAppDispatch } from "@/store/hooks";
import {
  createClient,
  searchClientsForPicker,
} from "@/store/slices/clientsSlice";
import type { GetClientsResponse } from "@shared/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

type ClientRow = GetClientsResponse["clients"][number];

export interface ClientLinkComboboxProps {
  value: number | null;
  onValueChange: (clientId: number | null, client?: ClientRow | null) => void;
  disabled?: boolean;
  placeholder?: string;
  selectedDisplayName?: string;
  className?: string;
  /** Shown when create-if-missing is used */
  createLabel?: string;
}

/**
 * Required client linker for Free Analysis — search existing clients or create one.
 * Mirrors BrokerSearchSelect UX patterns.
 */
export function ClientLinkCombobox({
  value,
  onValueChange,
  disabled = false,
  placeholder = "Search by name, email, or phone…",
  selectedDisplayName,
  className,
  createLabel = "Create new client",
}: ClientLinkComboboxProps) {
  const dispatch = useAppDispatch();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [options, setOptions] = useState<ClientRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
  });
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (!open) return;
    clearTimeout(debounceRef.current);
    const q = search.trim();
    debounceRef.current = setTimeout(
      async () => {
        setLoading(true);
        try {
          const result = await dispatch(searchClientsForPicker(q)).unwrap();
          setOptions(result.clients);
        } catch {
          setOptions([]);
        } finally {
          setLoading(false);
        }
      },
      q.length >= 2 ? 250 : 0,
    );
    return () => clearTimeout(debounceRef.current);
  }, [open, search, dispatch]);

  const selectedFromList = options.find((c) => c.id === value);
  const triggerLabel =
    selectedDisplayName ||
    (selectedFromList
      ? `${selectedFromList.first_name} ${selectedFromList.last_name}`
      : value
        ? `Client #${value}`
        : placeholder);

  const handleCreate = async () => {
    setCreateError(null);
    if (!form.first_name.trim() || !form.last_name.trim()) {
      setCreateError("First and last name are required");
      return;
    }
    setCreating(true);
    try {
      const created = await dispatch(
        createClient({
          first_name: form.first_name.trim(),
          last_name: form.last_name.trim(),
          email: form.email.trim() || undefined,
          phone: form.phone.trim() || undefined,
        } as any),
      ).unwrap();
      const client = (created as any).client || created;
      const id = Number(client.id);
      onValueChange(id, client);
      setCreateOpen(false);
      setOpen(false);
      setForm({ first_name: "", last_name: "", email: "", phone: "" });
    } catch (err: any) {
      setCreateError(
        typeof err === "string"
          ? err
          : err?.error || err?.message || "Could not create client",
      );
    } finally {
      setCreating(false);
    }
  };

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className={cn(
              "h-10 w-full justify-between font-normal text-sm",
              !value && "text-muted-foreground",
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
                    <p className="border-b px-3 py-2 text-xs text-muted-foreground">
                      Type 2+ characters to search
                      {options.length > 0
                        ? ` (showing ${options.length})`
                        : ""}
                      .
                    </p>
                  )}
                  <CommandEmpty>No clients found.</CommandEmpty>
                  <CommandGroup>
                    {options.map((client) => {
                      const label = `${client.first_name} ${client.last_name}`;
                      return (
                        <CommandItem
                          key={client.id}
                          value={`${label} ${client.email || ""} ${client.id}`}
                          onSelect={() => {
                            onValueChange(client.id, client);
                            setOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              value === client.id
                                ? "opacity-100"
                                : "opacity-0",
                            )}
                          />
                          <span className="truncate">
                            {label}
                            {client.email ? (
                              <span className="text-muted-foreground">
                                {" "}
                                · {client.email}
                              </span>
                            ) : null}
                          </span>
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                  <CommandSeparator />
                  <CommandGroup>
                    <CommandItem
                      value="__create__"
                      onSelect={() => {
                        setCreateOpen(true);
                        setOpen(false);
                      }}
                    >
                      <UserPlus className="mr-2 h-4 w-4" />
                      {createLabel}
                    </CommandItem>
                  </CommandGroup>
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{createLabel}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="grid gap-1.5">
              <Label htmlFor="ca-fn">First name</Label>
              <Input
                id="ca-fn"
                value={form.first_name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, first_name: e.target.value }))
                }
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="ca-ln">Last name</Label>
              <Input
                id="ca-ln"
                value={form.last_name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, last_name: e.target.value }))
                }
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="ca-em">Email (optional)</Label>
              <Input
                id="ca-em"
                type="email"
                value={form.email}
                onChange={(e) =>
                  setForm((f) => ({ ...f, email: e.target.value }))
                }
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="ca-ph">Phone (optional)</Label>
              <Input
                id="ca-ph"
                value={form.phone}
                onChange={(e) =>
                  setForm((f) => ({ ...f, phone: e.target.value }))
                }
              />
            </div>
            {createError && (
              <p className="text-sm text-destructive">{createError}</p>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setCreateOpen(false)}
            >
              Cancel
            </Button>
            <Button type="button" onClick={handleCreate} disabled={creating}>
              {creating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Create & link
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
