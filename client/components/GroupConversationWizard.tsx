import React, { useEffect, useMemo, useState, useRef } from "react";
import { Users, X, Loader2, ChevronRight, ChevronLeft } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { searchClientsForPicker } from "@/store/slices/clientsSlice";
import { fetchBrokers } from "@/store/slices/brokersSlice";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { GroupParticipantInput } from "@shared/api";
import { GROUP_MMS_MAX_PARTICIPANTS } from "@shared/group-conversations";
import ParticipantAvatarStack from "@/components/conversations/ParticipantAvatarStack";

type PickItem =
  | {
      key: string;
      kind: "client";
      id: number;
      label: string;
      phone?: string;
    }
  | {
      key: string;
      kind: "broker";
      id: number;
      label: string;
      phone?: string;
    }
  | { key: string; kind: "phone"; phone: string; label: string };

interface GroupConversationWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (payload: {
    title?: string;
    channel: "sms";
    participants: GroupParticipantInput[];
    body?: string;
    application_id?: number;
  }) => Promise<void>;
  isCreating: boolean;
  billingLocked?: boolean;
  userRole?: string;
  /** Pre-link new group to a loan from Pipeline / CRM */
  applicationId?: number | null;
}

const PHONE_RE = /^[\d\s+\-()+]{7,}$/;

function phoneLast10(raw?: string | null): string | null {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, "");
  if (digits.length < 10) return null;
  return digits.slice(-10);
}

function pickItemPhoneLast10(item: PickItem): string | null {
  if (item.kind === "phone") return phoneLast10(item.phone);
  return phoneLast10(item.phone);
}

function formatPhoneHint(last10: string | null): string {
  if (!last10) return "No phone on file";
  return `(${last10.slice(0, 3)}) ${last10.slice(3, 6)}-${last10.slice(6)}`;
}

export function GroupConversationWizard({
  isOpen,
  onClose,
  onCreate,
  isCreating,
  billingLocked = false,
  userRole,
  applicationId = null,
}: GroupConversationWizardProps) {
  const dispatch = useAppDispatch();
  const { pickerSearchResults, isPickerSearching } = useAppSelector(
    (s) => s.clients,
  );
  const { brokers } = useAppSelector((s) => s.brokers);
  const { user: currentBroker } = useAppSelector((s) => s.brokerAuth);
  const sendingLineLast10 = phoneLast10(currentBroker?.twilio_caller_id ?? null);
  const canSearchBrokers =
    userRole === "admin" || userRole === "platform_owner";

  const [step, setStep] = useState(0);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<PickItem[]>([]);
  const [title, setTitle] = useState("");
  const [firstMessage, setFirstMessage] = useState("");
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (isOpen && canSearchBrokers) {
      dispatch(fetchBrokers());
    } else if (!isOpen) {
      setStep(0);
      setSearch("");
      setSelected([]);
      setTitle("");
      setFirstMessage("");
    }
  }, [isOpen, dispatch, canSearchBrokers]);

  useEffect(() => {
    if (!isOpen) return;
    const q = search.trim();
    clearTimeout(searchDebounceRef.current);
    if (q.length < 2) return;
    searchDebounceRef.current = setTimeout(() => {
      void dispatch(searchClientsForPicker(q));
    }, 250);
    return () => clearTimeout(searchDebounceRef.current);
  }, [search, isOpen, dispatch]);

  const suggestions = useMemo(() => {
    const q = search.trim().toLowerCase();
    const items: PickItem[] = [];

    if (q.length >= 2) {
      for (const c of pickerSearchResults) {
        items.push({
          key: `client-${c.id}`,
          kind: "client",
          id: c.id,
          label: `${c.first_name} ${c.last_name}`.trim(),
          phone: c.phone ?? undefined,
        });
      }
    }

    if (canSearchBrokers) {
      for (const b of brokers) {
        if (b.status !== "active") continue;
        const brokerPhoneLast10 = phoneLast10(
          b.phone ?? (b as { twilio_caller_id?: string | null }).twilio_caller_id,
        );
        if (sendingLineLast10 && brokerPhoneLast10 === sendingLineLast10) continue;
        const label = `${b.first_name} ${b.last_name}`.trim();
        if (q && !label.toLowerCase().includes(q)) continue;
        items.push({
          key: `broker-${b.id}`,
          kind: "broker",
          id: b.id,
          label,
          phone: b.phone ?? undefined,
        });
      }
    }

    if (PHONE_RE.test(search.trim())) {
      const rawPhone = search.trim();
      const rawLast10 = phoneLast10(rawPhone);
      if (sendingLineLast10 && rawLast10 === sendingLineLast10) {
        return items.slice(0, 20);
      }
      items.unshift({
        key: `phone-${rawPhone}`,
        kind: "phone",
        phone: rawPhone,
        label: rawPhone,
      });
    }

    return items.slice(0, 20);
  }, [pickerSearchResults, brokers, search, canSearchBrokers, sendingLineLast10]);

  const toggle = (item: PickItem) => {
    setSelected((prev) => {
      const exists = prev.some((p) => p.key === item.key);
      if (exists) return prev.filter((p) => p.key !== item.key);
      if (prev.length >= GROUP_MMS_MAX_PARTICIPANTS) return prev;
      return [...prev, item];
    });
  };

  const participantsPayload = (): GroupParticipantInput[] =>
    selected.map((s) => {
      if (s.kind === "client") return { type: "client", client_id: s.id };
      if (s.kind === "broker") return { type: "broker", broker_id: s.id };
      return { type: "phone", phone: s.phone };
    });

  const selectedPhoneKeys = useMemo(() => {
    const keys = new Set<string>();
    for (const item of selected) {
      const last10 = pickItemPhoneLast10(item);
      if (last10) keys.add(last10);
    }
    return keys;
  }, [selected]);

  const canProceedPeopleStep = selected.length >= 2;

  const previewTitle =
    title.trim() ||
    (selected.length >= 2
      ? `${selected[0].label}, ${selected[1].label}${
          selected.length > 2 ? ` +${selected.length - 2}` : ""
        }`
      : "Group conversation");

  const handleSubmit = async () => {
    await onCreate({
      title: title.trim() || undefined,
      channel: "sms",
      participants: participantsPayload(),
      body: firstMessage.trim() || undefined,
      ...(applicationId ? { application_id: applicationId } : {}),
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            New group conversation
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 pb-2">
          <div className="flex gap-2 text-xs text-muted-foreground">
            {["People", "Details", "Review"].map((label, i) => (
              <span
                key={label}
                className={cn(
                  "flex-1 text-center py-1 rounded-md",
                  step === i && "bg-primary/10 text-primary font-medium",
                )}
              >
                {label}
              </span>
            ))}
          </div>
        </div>

        <ScrollArea className="max-h-[55vh] px-6">
          {step === 0 && (
            <div className="space-y-3 pb-4 animate-in fade-in duration-200">
              <Input
                placeholder="Search clients, realtors, or type a phone…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search.trim().length > 0 && search.trim().length < 2 ? (
                <p className="text-xs text-muted-foreground">
                  Type at least 2 characters to search clients
                </p>
              ) : null}
              {isPickerSearching ? (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Searching…
                </p>
              ) : null}
              <p className="text-xs text-muted-foreground">
                {selected.length} of {GROUP_MMS_MAX_PARTICIPANTS} selected
                {selected.length >= 2 && selectedPhoneKeys.size < 2
                  ? " · need 2 different phone numbers"
                  : ""}
              </p>
              {selected.length >= 2 && selectedPhoneKeys.size < 2 ? (
                <p className="text-xs text-amber-700 dark:text-amber-400 rounded-md border border-amber-200/80 bg-amber-50/80 dark:bg-amber-950/30 px-3 py-2">
                  Some contacts have no phone on file in CRM — we&apos;ll use their
                  SMS conversation number when available. Add a phone in the client
                  profile if group creation still fails.
                </p>
              ) : null}
              {selected.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {selected.map((s) => (
                    <Badge
                      key={s.key}
                      variant="secondary"
                      className="gap-1 pr-1 animate-in slide-in-from-bottom-2"
                    >
                      <span className="flex flex-col items-start leading-tight">
                        <span>{s.label}</span>
                        <span className="text-[10px] font-normal text-muted-foreground">
                          {formatPhoneHint(pickItemPhoneLast10(s))}
                        </span>
                      </span>
                      <button
                        type="button"
                        className="ml-1 rounded-full hover:bg-muted p-0.5"
                        onClick={() =>
                          setSelected((p) => p.filter((x) => x.key !== s.key))
                        }
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
              <div className="border rounded-lg divide-y max-h-48 overflow-y-auto">
                {suggestions.map((item) => {
                  const on = selected.some((s) => s.key === item.key);
                  return (
                    <button
                      key={item.key}
                      type="button"
                      className={cn(
                        "w-full text-left px-3 py-2 text-sm hover:bg-muted/60 flex justify-between",
                        on && "bg-primary/5",
                      )}
                      onClick={() => toggle(item)}
                    >
                      <span className="min-w-0 truncate">{item.label}</span>
                      <span className="text-xs text-muted-foreground shrink-0 ml-2 text-right">
                        <span className="capitalize">{item.kind}</span>
                        {item.kind !== "phone" ? (
                          <span className="block normal-case">
                            {formatPhoneHint(pickItemPhoneLast10(item))}
                          </span>
                        ) : null}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4 pb-4 animate-in fade-in duration-200">
              {applicationId ? (
                <div className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-xs text-primary">
                  Linked to loan application #{applicationId}
                </div>
              ) : null}
              <div>
                <label className="text-xs font-medium text-muted-foreground">
                  Group name
                </label>
                <Input
                  className="mt-1"
                  placeholder="e.g. Flores purchase team"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">
                  First message (optional)
                </label>
                <Textarea
                  className="mt-1 min-h-[80px]"
                  placeholder="Message to the group…"
                  value={firstMessage}
                  onChange={(e) => setFirstMessage(e.target.value)}
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 pb-4 animate-in fade-in duration-200">
              <div className="rounded-lg border bg-card p-4 flex gap-3">
                <ParticipantAvatarStack
                  names={selected.map((s) => s.label)}
                />
                <div>
                  <p className="font-semibold">{previewTitle}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {selected.length} people · SMS group
                  </p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground rounded-md border px-3 py-2 leading-relaxed">
                Each person receives an individual text from your business line.
                Encore keeps one shared thread for your team — replies are merged
                here automatically. Native phone apps will not show a group chat
                like iMessage or WhatsApp.
              </p>
              {firstMessage ? (
                <p className="text-sm text-muted-foreground border-l-2 border-primary/30 pl-3">
                  {firstMessage}
                </p>
              ) : null}
            </div>
          )}
        </ScrollArea>

        <div className="flex items-center justify-between gap-2 px-6 py-4 border-t bg-muted/30">
          <Button
            variant="ghost"
            size="sm"
            disabled={step === 0 || isCreating}
            onClick={() => setStep((s) => s - 1)}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          {step < 2 ? (
            <Button
              size="sm"
              disabled={!canProceedPeopleStep}
              onClick={() => setStep((s) => s + 1)}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button
              size="sm"
              disabled={isCreating || billingLocked}
              onClick={handleSubmit}
            >
              {isCreating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Create group"
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default GroupConversationWizard;
