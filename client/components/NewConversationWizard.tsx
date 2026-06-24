import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Send,
  MessageSquare,
  X,
  Loader2,
  FileText,
  Hash,
  Mail,
  User,
  ChevronDown,
  Paperclip,
  ImageIcon,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { searchClientsForPicker } from "@/store/slices/clientsSlice";
import { fetchBrokers } from "@/store/slices/brokersSlice";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { logger } from "@/lib/logger";
import { uploadMMSMedia } from "@/lib/cdn-upload";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Template {
  id: number;
  name: string;
  template_type: "email" | "sms" | "whatsapp";
  category: string;
  subject?: string | null;
  body: string;
  variables: string[];
}

interface NewConversationWizardProps {
  isOpen: boolean;
  onClose: () => void;
  templates: Template[];
  onSendMessage: (data: {
    communication_type: "email" | "sms" | "whatsapp";
    recipient_phone?: string;
    recipient_email?: string;
    subject?: string;
    body: string;
    message_type: "text" | "template";
    template_id?: number;
    client_id?: number;
    /** Broker/realtor recipient — mutually exclusive with client_id */
    broker_id?: number;
    media_url?: string;
    media_content_type?: string;
    media_filename?: string;
  }) => Promise<void>;
  isSending: boolean;
  /** Role of the currently-logged-in user — broker search is only shown to admin/platform_owner */
  userRole?: string;
  /** When true, outbound send is blocked by billing/quota gates */
  billingLocked?: boolean;
  /** Show link to open the group wizard instead */
  groupConversationsEnabled?: boolean;
  onOpenGroupWizard?: () => void;
}

type SelectedRecipient =
  | {
      kind: "client";
      clientId: number;
      label: string;
      phone?: string;
      email?: string;
    }
  | {
      kind: "broker";
      brokerId: number;
      label: string;
      phone?: string;
      email?: string;
      role: string;
    }
  | { kind: "raw_phone"; value: string };

function roleBadge(role: string): { text: string; cls: string } {
  if (role === "platform_owner")
    return {
      text: "Platform Owner",
      cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400",
    };
  if (role === "admin")
    return {
      text: "Mortgage Banker",
      cls: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400",
    };
  return {
    text: "Realtor Partner",
    cls: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400",
  };
}

const PHONE_RE = /^[\d\s+\-()+]{7,}$/;

const NewConversationWizard: React.FC<NewConversationWizardProps> = ({
  isOpen,
  onClose,
  templates,
  onSendMessage,
  isSending,
  userRole,
  billingLocked = false,
  groupConversationsEnabled = false,
  onOpenGroupWizard,
}) => {
  const dispatch = useAppDispatch();
  const { pickerSearchResults, isPickerSearching } = useAppSelector(
    (s) => s.clients,
  );
  const { brokers } = useAppSelector((s) => s.brokers);
  const { sessionToken } = useAppSelector((s) => s.brokerAuth);
  const canSearchBrokers =
    userRole === "admin" || userRole === "platform_owner";

  // ── Recipient state ──────────────────────────────────────────────────────────
  const [search, setSearch] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [recipient, setRecipient] = useState<SelectedRecipient | null>(null);

  // ── Compose state ────────────────────────────────────────────────────────────
  const [body, setBody] = useState("");

  // ── MMS attachment state ─────────────────────────────────────────────────────
  const [mmsAttachment, setMmsAttachment] = useState<{
    file: File;
    previewUrl: string;
    contentType: string;
  } | null>(null);
  const [isUploadingMMS, setIsUploadingMMS] = useState(false);
  const mmsFileInputRef = useRef<HTMLInputElement>(null);

  // ── Template picker state ─────────────────────────────────────────────────────
  const [templateOpen, setTemplateOpen] = useState(false);

  // ── Refs ──────────────────────────────────────────────────────────────────────
  const searchInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout>>();

  // ── Load brokers for elevated roles (small list) ─────────────────────────
  useEffect(() => {
    if (isOpen && canSearchBrokers) {
      dispatch(fetchBrokers({}));
      setTimeout(() => searchInputRef.current?.focus(), 80);
    } else if (isOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 80);
    }
  }, [isOpen, dispatch, canSearchBrokers]);

  // ── Server-side client search (all pages / platform-wide directory) ───────
  useEffect(() => {
    if (!isOpen || recipient) return;
    const q = search.trim();
    clearTimeout(searchDebounceRef.current);
    if (q.length < 2) return;

    searchDebounceRef.current = setTimeout(() => {
      void dispatch(searchClientsForPicker(q));
    }, 250);

    return () => clearTimeout(searchDebounceRef.current);
  }, [search, isOpen, recipient, dispatch]);

  // ── Reset on close ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) {
      setSearch("");
      setDropdownOpen(false);
      setRecipient(null);
      setBody("");
      setTemplateOpen(false);
      setMmsAttachment(null);
    }
  }, [isOpen]);

  // ── Focus textarea when recipient changes ─────────────────────────────────────
  useEffect(() => {
    if (!recipient) return;
    setTimeout(() => textareaRef.current?.focus(), 80);
  }, [recipient]);

  // ── Helpers ───────────────────────────────────────────────────────────────────

  const q = search.toLowerCase().trim();
  const clientHits =
    q.length >= 2 ? pickerSearchResults.slice(0, 8) : [];

  const filteredBrokers = canSearchBrokers
    ? brokers
        .filter((b) => {
          const q = search.toLowerCase().trim();
          if (!q) return false;
          return (
            b.first_name.toLowerCase().includes(q) ||
            b.last_name.toLowerCase().includes(q) ||
            b.email.toLowerCase().includes(q) ||
            (b.phone ?? "").toLowerCase().includes(q)
          );
        })
        .slice(0, 5)
    : [];

  const isRawPhone = PHONE_RE.test(search.trim());
  const canSendToRaw = isRawPhone;

  const canSend =
    Boolean(recipient) &&
    (body.trim().length > 0 || !!mmsAttachment) &&
    !isSending &&
    !isUploadingMMS &&
    !billingLocked;

  const getRecipientValue = (): {
    phone?: string;
    email?: string;
    clientId?: number;
    brokerId?: number;
  } => {
    if (!recipient) return {};
    if (recipient.kind === "client") {
      return {
        clientId: recipient.clientId,
        phone: recipient.phone,
        email: recipient.email,
      };
    }
    if (recipient.kind === "broker") {
      return {
        brokerId: recipient.brokerId,
        phone: recipient.phone,
        email: recipient.email,
      };
    }
    if (recipient.kind === "raw_phone") return { phone: recipient.value };
    return {};
  };

  const recipientLabel = (): string => {
    if (!recipient) return "";
    if (recipient.kind === "client" || recipient.kind === "broker")
      return recipient.label;
    return recipient.value;
  };

  const selectRecipient = (r: SelectedRecipient) => {
    setRecipient(r);
    setSearch("");
    setDropdownOpen(false);
  };

  const clearRecipient = () => {
    setRecipient(null);
    setSearch("");
    setTimeout(() => searchInputRef.current?.focus(), 50);
  };

  const applyTemplate = (t: Template) => {
    setBody(t.body);
    setTemplateOpen(false);
    setTimeout(() => textareaRef.current?.focus(), 50);
  };

  const handleSend = useCallback(async () => {
    if (!canSend || billingLocked) return;
    const rv = getRecipientValue();

    if (!rv.phone && !rv.brokerId) {
      logger.warn("No phone number available");
      return;
    }

    // Upload MMS attachment first if present
    let mediaUrl: string | undefined;
    let mediaContentType: string | undefined;
    let mediaFilename: string | undefined;
    if (mmsAttachment) {
      setIsUploadingMMS(true);
      try {
        const result = await uploadMMSMedia(
          mmsAttachment.file,
          sessionToken ?? "",
        );
        mediaUrl = result.url;
        mediaContentType = result.content_type;
        mediaFilename = result.filename;
      } catch (err) {
        setIsUploadingMMS(false);
        logger.error("[NewConversationWizard] MMS upload failed:", err);
        return;
      }
      setIsUploadingMMS(false);
    }

    await onSendMessage({
      communication_type: "sms",
      recipient_phone: rv.phone,
      body: body.trim(),
      message_type: "text",
      client_id: rv.clientId,
      broker_id: rv.brokerId,
      media_url: mediaUrl,
      media_content_type: mediaContentType,
      media_filename: mediaFilename,
    });
    onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    canSend,
    billingLocked,
    body,
    recipient,
    mmsAttachment,
    sessionToken,
    onSendMessage,
    onClose,
  ]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      handleSend();
    }
  };

  const relevantTemplates = templates.filter((t) => t.template_type === "sms");

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="p-0 gap-0 overflow-visible rounded-2xl border border-border/60 shadow-2xl bg-background"
        style={{ maxWidth: 520, width: "calc(100vw - 32px)" }}
      >
        {/* ── Header ────────────────────────────────────────────────────────── */}
        <div className="px-5 py-4 border-b border-border/60">
          <h2 className="text-[15px] font-semibold tracking-tight">
            New Message
          </h2>
        </div>

        {/* ── TO field ──────────────────────────────────────────────────────── */}
        <div className="relative px-5 py-3 border-b border-border/60">
          <div className="flex items-center gap-3 min-h-[32px]">
            <span className="text-[13px] font-medium text-muted-foreground shrink-0">
              To
            </span>

            {/* Selected recipient chip */}
            {recipient && (
              <span className="inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-full bg-primary/10 text-primary text-[13px] font-medium">
                {recipientLabel()}
                <button
                  onClick={clearRecipient}
                  className="rounded-full p-0.5 hover:bg-primary/20 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            {/* Search input */}
            {!recipient && (
              <input
                ref={searchInputRef}
                className="flex-1 text-[13px] bg-transparent outline-none placeholder:text-muted-foreground/60 min-w-0"
                placeholder="Search name, phone, or email…"
                value={search}
                autoComplete="off"
                onChange={(e) => {
                  setSearch(e.target.value);
                  setDropdownOpen(true);
                }}
                onFocus={() => search.length > 0 && setDropdownOpen(true)}
                onBlur={() => setTimeout(() => setDropdownOpen(false), 150)}
              />
            )}
          </div>

          {/* ── Dropdown ────────────────────────────────────────────────────── */}
          {dropdownOpen && !recipient && search.length > 0 && (
            <div className="absolute left-0 right-0 top-full z-[60] bg-background border border-border rounded-b-2xl shadow-xl overflow-hidden">
              <ScrollArea className="max-h-60">
                <div className="py-1">
                  {isPickerSearching ? (
                    <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Searching…
                    </div>
                  ) : q.length < 2 ? (
                    <div className="py-6 text-center text-xs text-muted-foreground">
                      Type at least 2 characters to search clients
                    </div>
                  ) : (
                    <>
                      {clientHits.map((c) => (
                        <button
                          key={c.id}
                          className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted/60 transition-colors text-left"
                          onMouseDown={() =>
                            selectRecipient({
                              kind: "client",
                              clientId: c.id,
                              label: `${c.first_name} ${c.last_name}`,
                              phone: c.phone ?? undefined,
                              email: c.email,
                            })
                          }
                        >
                          <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[11px] font-bold shrink-0">
                            {c.first_name[0]}
                            {c.last_name[0]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-medium leading-tight">
                              {c.first_name} {c.last_name}
                            </p>
                            <p className="text-[11px] text-muted-foreground truncate">
                              {c.phone ?? c.email}
                            </p>
                          </div>
                          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-400 shrink-0">
                            Client
                          </span>
                        </button>
                      ))}

                      {/* Broker / realtor results — only for admin & platform_owner */}
                      {filteredBrokers.length > 0 && (
                        <>
                          {clientHits.length > 0 && (
                            <div className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50 border-t border-border/40 mt-1">
                              Team &amp; Partners
                            </div>
                          )}
                          {filteredBrokers.map((b) => {
                            const badge = roleBadge(b.role);
                            return (
                              <button
                                key={`broker-${b.id}`}
                                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted/60 transition-colors text-left"
                                onMouseDown={() =>
                                  selectRecipient({
                                    kind: "broker",
                                    brokerId: b.id,
                                    label: `${b.first_name} ${b.last_name}`,
                                    phone: b.phone ?? undefined,
                                    email: b.email,
                                    role: b.role,
                                  })
                                }
                              >
                                <div className="h-8 w-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-[11px] font-bold shrink-0">
                                  {b.first_name[0]}
                                  {b.last_name[0]}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-[13px] font-medium leading-tight">
                                    {b.first_name} {b.last_name}
                                  </p>
                                  <p className="text-[11px] text-muted-foreground truncate">
                                    {b.phone ?? b.email}
                                  </p>
                                </div>
                                <span
                                  className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full shrink-0 ${badge.cls}`}
                                >
                                  {badge.text}
                                </span>
                              </button>
                            );
                          })}
                        </>
                      )}

                      {/* Send to raw phone / email */}
                      {canSendToRaw && (
                        <button
                          className={cn(
                            "w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted/60 transition-colors text-left",
                            (clientHits.length > 0 ||
                              filteredBrokers.length > 0) &&
                              "border-t border-border/50",
                          )}
                          onMouseDown={() => {
                            selectRecipient({
                              kind: "raw_phone",
                              value: search.trim(),
                            });
                          }}
                        >
                          <div className="h-8 w-8 rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400 flex items-center justify-center shrink-0">
                            {isRawPhone ? (
                              <Hash className="h-4 w-4" />
                            ) : (
                              <Mail className="h-4 w-4" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-[13px] font-medium leading-tight">
                              Send to "{search.trim()}"
                            </p>
                            <p className="text-[11px] text-muted-foreground">
                              SMS · Not in your contacts
                            </p>
                          </div>
                        </button>
                      )}

                      {clientHits.length === 0 &&
                        filteredBrokers.length === 0 &&
                        !canSendToRaw && (
                          <div className="py-8 text-center text-sm text-muted-foreground">
                            <User className="h-8 w-8 mx-auto mb-2 opacity-25" />
                            No contacts found.
                            <br />
                            <span className="text-xs">
                              Try a phone number or email.
                            </span>
                          </div>
                        )}
                    </>
                  )}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>

        {/* ── Toolbar ──────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-2 px-5 py-2.5 border-b border-border/60 bg-muted/20">
          {/* Paperclip / MMS attachment button */}
          <input
            ref={mmsFileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp,video/mp4,video/3gpp,video/quicktime,audio/mpeg,audio/ogg,audio/wav,application/pdf"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              setMmsAttachment({
                file: f,
                previewUrl: f.type.startsWith("image/")
                  ? URL.createObjectURL(f)
                  : "",
                contentType: f.type,
              });
              e.target.value = "";
            }}
          />
          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => mmsFileInputRef.current?.click()}
                  disabled={isUploadingMMS}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-medium bg-background text-muted-foreground hover:bg-muted border border-border/60 transition-all disabled:opacity-50"
                  aria-label="Attach media"
                >
                  <Paperclip className="h-3.5 w-3.5" />
                  Attach
                </button>
              </TooltipTrigger>
              <TooltipContent
                side="top"
                className="max-w-[220px] text-xs leading-relaxed"
              >
                <p className="font-semibold mb-1">Attach MMS media</p>
                <p>
                  Max <span className="font-medium">5 MB</span> · Link expires
                  in <span className="font-medium">72 h</span>
                </p>
                <p className="text-muted-foreground mt-1">
                  JPG · PNG · GIF · WebP · MP4 · MOV · MP3 · OGG · WAV · PDF
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Template picker */}
          {templates.length > 0 && (
            <div className="ml-auto">
              <Popover open={templateOpen} onOpenChange={setTemplateOpen}>
                <PopoverTrigger asChild>
                  <button className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-medium bg-background text-muted-foreground hover:bg-muted border border-border/60 transition-all">
                    <FileText className="h-3.5 w-3.5" />
                    Templates
                    <ChevronDown className="h-3 w-3 opacity-60" />
                  </button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-72 p-0" sideOffset={6}>
                  <Command>
                    <CommandInput placeholder="Search templates…" />
                    <CommandList className="max-h-52">
                      <CommandEmpty>No templates found.</CommandEmpty>
                      <CommandGroup>
                        {(relevantTemplates.length > 0
                          ? relevantTemplates
                          : templates
                        ).map((t) => (
                          <CommandItem
                            key={t.id}
                            value={t.name}
                            onSelect={() => applyTemplate(t)}
                            className="flex flex-col items-start gap-0.5 cursor-pointer"
                          >
                            <span className="text-[13px] font-medium">
                              {t.name}
                            </span>
                            <span className="text-[11px] text-muted-foreground truncate w-full">
                              {t.body.substring(0, 60)}…
                            </span>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          )}
        </div>

        {/* ── Attachment preview ─────────────────────────────────────────────── */}
        {mmsAttachment && (
          <div className="px-5 pt-3">
            <div className="inline-flex items-center gap-2 pl-2 pr-1.5 py-1.5 rounded-lg border border-border/60 bg-muted/40 text-[12px]">
              {mmsAttachment.previewUrl ? (
                <img
                  src={mmsAttachment.previewUrl}
                  alt="attachment preview"
                  className="h-10 w-10 rounded object-cover shrink-0"
                />
              ) : (
                <div className="h-10 w-10 rounded bg-muted flex items-center justify-center shrink-0">
                  <ImageIcon className="h-4 w-4 text-muted-foreground" />
                </div>
              )}
              <span className="text-muted-foreground max-w-[160px] truncate">
                {mmsAttachment.file.name}
              </span>
              <button
                type="button"
                onClick={() => setMmsAttachment(null)}
                className="ml-1 rounded-full p-0.5 hover:bg-muted-foreground/20 transition-colors"
                aria-label="Remove attachment"
              >
                <X className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            </div>
          </div>
        )}

        {/* ── Message textarea ───────────────────────────────────────────────── */}
        <div className="px-5 pt-3 pb-2">
          <Textarea
            ref={textareaRef}
            placeholder={
              recipient
                ? "Write a message…"
                : "Select a recipient to start typing…"
            }
            disabled={!recipient}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={handleKeyDown}
            className="border-0 resize-none text-[13px] focus-visible:ring-0 p-0 min-h-[128px] bg-transparent placeholder:text-muted-foreground/50 leading-relaxed"
          />
        </div>

        {/* ── Footer ────────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-border/60">
          <div className="flex flex-col gap-1 min-w-0">
            {body.length > 0 && (
              <span className="text-[11px] text-muted-foreground tabular-nums">
                {body.length} chars · {Math.ceil(body.length / 160)} SMS
              </span>
            )}
            {groupConversationsEnabled && onOpenGroupWizard && (
              <button
                type="button"
                className="text-[11px] text-primary hover:underline text-left"
                onClick={() => {
                  onClose();
                  onOpenGroupWizard();
                }}
              >
                Messaging multiple people? Create a group →
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden sm:block text-[11px] text-muted-foreground/40 select-none">
              ⌘↵ to send
            </span>
            <Button
              onClick={handleSend}
              disabled={!canSend}
              size="sm"
              className="rounded-full px-4 h-9 gap-1.5 bg-primary hover:bg-primary/90 transition-all duration-150"
            >
              {isSending || isUploadingMMS ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Send className="h-3.5 w-3.5" />
                  Send
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NewConversationWizard;
