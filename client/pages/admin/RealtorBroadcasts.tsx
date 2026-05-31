import { useEffect, useState, useRef, useCallback } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchBroadcasts,
  fetchBroadcastDetail,
  fetchBroadcastRecipients,
  previewBroadcastAudience,
  createBroadcast,
  cancelBroadcast,
  deleteBroadcast,
  clearAudiencePreview,
  clearActiveBroadcast,
  updateBroadcastProgress,
  saveBroadcastDraft,
  fetchLatestDraft,
  retrySendFailed,
  exportBroadcastRecipients,
  fetchSavedSegments,
  createSavedSegment,
  deleteSavedSegment,
} from "@/store/slices/realtorBroadcastSlice";
import {
  fetchEmailTemplates,
  fetchSmsTemplates,
} from "@/store/slices/communicationTemplatesSlice";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Megaphone,
  Mail,
  MessageSquare,
  Users,
  Calendar,
  Send,
  Ban,
  Trash2,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Eye,
  RotateCcw,
  Loader2,
  Info,
  Search,
  Download,
  BookmarkPlus,
  BookOpen,
} from "lucide-react";
import { getSharedAblyClient } from "@/lib/ably-client";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import type {
  RealtorBroadcast,
  RealtorBroadcastChannel,
  RealtorBroadcastAudienceFilter,
  BroadcastSavedSegment,
} from "@shared/api";
import { cn } from "@/lib/utils";
import { logger } from "@/lib/logger";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const CHANNEL_OPTIONS = [
  { value: "email", label: "Email only", icon: Mail },
  { value: "sms", label: "SMS only", icon: MessageSquare },
  { value: "both", label: "Email + SMS", icon: Megaphone },
] as const;

const SEGMENT_OPTIONS = [
  { value: "all_active_realtors", label: "All active registered realtors" },
  { value: "prospects", label: "Realtor prospects (all stages)" },
  { value: "all_clients", label: "All active clients" },
  { value: "refi_rates_dropped", label: "Refi rates dropped list" },
];

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; icon: React.ReactNode }
> = {
  draft: {
    label: "Draft",
    color: "bg-gray-100 text-gray-700",
    icon: <Clock className="h-3 w-3" />,
  },
  scheduled: {
    label: "Scheduled",
    color: "bg-blue-100 text-blue-700",
    icon: <Calendar className="h-3 w-3" />,
  },
  sending: {
    label: "Sending…",
    color: "bg-amber-100 text-amber-700",
    icon: <Loader2 className="h-3 w-3 animate-spin" />,
  },
  sent: {
    label: "Sent",
    color: "bg-green-100 text-green-700",
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
  failed: {
    label: "Failed",
    color: "bg-red-100 text-red-700",
    icon: <XCircle className="h-3 w-3" />,
  },
  cancelled: {
    label: "Cancelled",
    color: "bg-gray-100 text-gray-500",
    icon: <Ban className="h-3 w-3" />,
  },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.draft;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
        cfg.color,
      )}
    >
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

function smsSegments(text: string): number {
  return Math.ceil((text || "").length / 160) || 1;
}

function smsCostEstimate(body: string, recipientCount: number): string {
  const segs = smsSegments(body);
  const cost = segs * recipientCount * 0.0079;
  return `≈ $${cost.toFixed(2)}`;
}

function roleLabel(s: { source: string; role?: string | null }): {
  text: string;
  cls: string;
} {
  if (s.source === "client")
    return { text: "Client", cls: "bg-teal-100 text-teal-700" };
  if (s.source === "prospect")
    return { text: "Prospect", cls: "bg-green-100 text-green-700" };
  if (s.role === "platform_owner")
    return { text: "Platform Owner", cls: "bg-amber-100 text-amber-700" };
  if (s.role === "admin")
    return { text: "Mortgage Banker", cls: "bg-purple-100 text-purple-700" };
  return { text: "Realtor Partner", cls: "bg-blue-100 text-blue-700" };
}

// ─── Wizard Step Types ────────────────────────────────────────────────────────

interface WizardState {
  title: string;
  channel: RealtorBroadcastChannel;
  subject: string;
  body_email: string;
  body_sms: string;
  segments: string[];
  excluded_ids: number[];
  stage_filter: string[];
  tag_filter: string[];
  scheduled_at: string;
  send_now: boolean;
}

const WIZARD_DEFAULTS: WizardState = {
  title: "",
  channel: "email",
  subject: "",
  body_email: "",
  body_sms: "",
  segments: ["all_active_realtors"],
  excluded_ids: [],
  stage_filter: [],
  tag_filter: [],
  scheduled_at: "",
  send_now: true,
};

const WIZARD_STEPS = [
  { id: 1, label: "Compose" },
  { id: 2, label: "Audience" },
  { id: 3, label: "Schedule" },
  { id: 4, label: "Review & Send" },
];

const QUILL_MODULES = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ["bold", "italic", "underline"],
    [{ list: "ordered" }, { list: "bullet" }],
    ["link"],
    ["clean"],
  ],
};

const QUILL_FORMATS = ["header", "bold", "italic", "underline", "list", "link"];

// ─── Merge tag autocomplete ───────────────────────────────────────────────────

const MERGE_TAGS = [
  { tag: "{{first_name}}", label: "First name", desc: 'e.g. "Sarah"' },
  { tag: "{{last_name}}", label: "Last name", desc: 'e.g. "Johnson"' },
  { tag: "{{full_name}}", label: "Full name", desc: 'e.g. "Sarah Johnson"' },
  { tag: "{{broker_name}}", label: "Your name", desc: "the sender" },
  { tag: "{{company_name}}", label: "Company", desc: "tenant name" },
] as const;

function MergeTagDropdown({
  onSelect,
  onClose,
}: {
  onSelect: (tag: string) => void;
  onClose: () => void;
}) {
  return (
    <div className="absolute z-50 left-0 top-full mt-1 w-64 rounded-md border bg-popover shadow-lg animate-in fade-in slide-in-from-top-1 duration-100">
      <div className="p-1">
        <p className="px-2 py-1 text-[11px] text-muted-foreground font-semibold uppercase tracking-wide">
          Insert merge tag
        </p>
        {MERGE_TAGS.map(({ tag, label, desc }) => (
          <button
            key={tag}
            type="button"
            onMouseDown={(e) => {
              // mousedown fires before blur — prevent the input losing focus
              e.preventDefault();
              onSelect(tag);
              onClose();
            }}
            className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm hover:bg-accent hover:text-accent-foreground transition-colors text-left"
          >
            <code className="text-[11px] bg-muted rounded px-1 shrink-0 font-mono">
              {tag}
            </code>
            <span className="text-muted-foreground text-xs">{desc}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/** Insert a merge tag at the `{{` position in a plain input/textarea */
function insertTagInField(
  tag: string,
  el: HTMLInputElement | HTMLTextAreaElement,
  value: string,
  setValue: (v: string) => void,
) {
  const cursor = el.selectionStart ?? value.length;
  const before = value.slice(0, cursor - 2); // strip the "{{"
  const after = value.slice(cursor);
  setValue(before + tag + after);
  requestAnimationFrame(() => {
    el.focus();
    const pos = before.length + tag.length;
    el.setSelectionRange(pos, pos);
  });
}

// ─── Wizard ───────────────────────────────────────────────────────────────────

function BroadcastWizard({ onSuccess }: { onSuccess: () => void }) {
  const dispatch = useAppDispatch();
  const {
    audiencePreview,
    isPreviewing,
    isSending,
    error,
    latestDraft,
    savedSegments,
  } = useAppSelector((state) => state.realtorBroadcasts);
  const { user: currentBroker } = useAppSelector((state) => state.brokerAuth);
  const { emailTemplates, smsTemplates } = useAppSelector(
    (s) => s.communicationTemplates,
  );
  const hasTwilioNumber = !!(currentBroker as any)?.twilio_caller_id;

  const [step, setStep] = useState(1);
  const [form, setForm] = useState<WizardState>(WIZARD_DEFAULTS);
  const [draftId, setDraftId] = useState<number | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [previewRequested, setPreviewRequested] = useState(false);
  const [recipientSearch, setRecipientSearch] = useState("");
  const [recipientTypeFilter, setRecipientTypeFilter] = useState<
    "all" | "broker" | "prospect" | "client"
  >("all");
  const [saveSegmentName, setSaveSegmentName] = useState("");
  const [showSaveSegment, setShowSaveSegment] = useState(false);
  const [showSegmentPresets, setShowSegmentPresets] = useState(false);
  const previewTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Merge tag autocomplete refs & state
  const subjectInputRef = useRef<HTMLInputElement>(null);
  const smsTextareaRef = useRef<HTMLTextAreaElement>(null);
  const quillRef = useRef<ReactQuill>(null);
  const [showSubjectTags, setShowSubjectTags] = useState(false);
  const [showSmsTags, setShowSmsTags] = useState(false);
  const [showQuillTags, setShowQuillTags] = useState(false);

  const updateForm = useCallback(
    (patch: Partial<WizardState>) => setForm((prev) => ({ ...prev, ...patch })),
    [],
  );

  // Load templates + latest draft + saved segments on mount
  useEffect(() => {
    dispatch(fetchEmailTemplates());
    dispatch(fetchSmsTemplates());
    dispatch(fetchLatestDraft());
    dispatch(fetchSavedSegments());
  }, [dispatch]);

  useEffect(() => {
    if (!latestDraft || draftId) return;
    setDraftId(latestDraft.id);
    const af =
      latestDraft.audience_filter as RealtorBroadcastAudienceFilter | null;
    updateForm({
      title: latestDraft.title ?? "",
      channel: (latestDraft.channel as RealtorBroadcastChannel) ?? "email",
      subject: (latestDraft as any).subject ?? "",
      body_email: (latestDraft as any).body_email ?? "",
      body_sms: (latestDraft as any).body_sms ?? "",
      segments: af?.segments ?? ["all_active_realtors"],
      excluded_ids: af?.excluded_ids ?? [],
      stage_filter: af?.stage_filter ?? [],
      tag_filter: af?.tag_filter ?? [],
    });
  }, [latestDraft, draftId, updateForm]);

  // Step transition with auto-save
  const goToStep = useCallback(
    async (n: number) => {
      if (draftId) {
        const af: RealtorBroadcastAudienceFilter = {
          segments: form.segments,
          excluded_ids: form.excluded_ids,
          stage_filter: form.stage_filter,
          tag_filter: form.tag_filter,
        };
        dispatch(
          saveBroadcastDraft({
            id: draftId,
            title: form.title || undefined,
            channel: form.channel,
            subject: form.subject || undefined,
            body_email: form.body_email || undefined,
            body_sms: form.body_sms || undefined,
            audience_filter: af,
            scheduled_at: form.scheduled_at || undefined,
          }),
        );
      }
      setStep(n);
    },
    [draftId, form, dispatch],
  );

  // Auto-preview on audience change
  useEffect(() => {
    if (step !== 2 || !form.segments.length) return;
    if (previewTimeout.current) clearTimeout(previewTimeout.current);
    previewTimeout.current = setTimeout(() => {
      dispatch(
        previewBroadcastAudience({
          channel: form.channel,
          audience_filter: {
            segments: form.segments,
            // excluded_ids intentionally NOT sent — selections are client-side only
            // so the full list is always returned and the user can re-check anyone
            stage_filter: form.stage_filter,
            tag_filter: form.tag_filter,
          },
        }),
      );
      setPreviewRequested(true);
    }, 600);
    return () => {
      if (previewTimeout.current) clearTimeout(previewTimeout.current);
    };
  }, [
    dispatch,
    step,
    form.segments,
    form.channel,
    form.stage_filter,
    form.tag_filter,
  ]);

  // Clean up preview on unmount
  useEffect(() => {
    return () => {
      dispatch(clearAudiencePreview());
    };
  }, [dispatch]);

  const canAdvanceStep1 =
    form.title.trim() &&
    ((form.channel === "sms" && form.body_sms.trim()) ||
      (form.channel === "email" && form.body_email.trim()) ||
      (form.channel === "both" &&
        form.body_email.trim() &&
        form.body_sms.trim()));

  const handleSaveSegment = async () => {
    if (!saveSegmentName.trim()) return;
    const filter: RealtorBroadcastAudienceFilter = {
      segments: form.segments,
      excluded_ids: form.excluded_ids,
      stage_filter: form.stage_filter,
      tag_filter: form.tag_filter,
    };
    await dispatch(
      createSavedSegment({ name: saveSegmentName.trim(), filter_json: filter }),
    );
    dispatch(fetchSavedSegments());
    setSaveSegmentName("");
    setShowSaveSegment(false);
  };

  const handleLoadSegment = (seg: BroadcastSavedSegment) => {
    const f = seg.filter_json;
    updateForm({
      segments: f.segments ?? [],
      excluded_ids: f.excluded_ids ?? [],
      stage_filter: f.stage_filter ?? [],
      tag_filter: f.tag_filter ?? [],
    });
    setShowSegmentPresets(false);
  };

  const handleSend = async () => {
    let audience_filter: RealtorBroadcastAudienceFilter;

    if (form.excluded_ids.length > 0 && audiencePreview) {
      // User made a custom selection — derive the exact inclusion list from the
      // sample so the server sends to precisely these people, regardless of
      // how large the total audience is (avoids the "500-item sample cap" bug).
      const selectedIds = audiencePreview.sample
        .filter((s) => !s.skipped && !form.excluded_ids.includes(s.id))
        .map((s) => s.id);
      audience_filter = {
        segments: form.segments,
        selected_ids: selectedIds,
        stage_filter: form.stage_filter,
        tag_filter: form.tag_filter,
      };
    } else {
      audience_filter = {
        segments: form.segments,
        excluded_ids: form.excluded_ids,
        stage_filter: form.stage_filter,
        tag_filter: form.tag_filter,
      };
    }

    await dispatch(
      createBroadcast({
        title: form.title,
        channel: form.channel,
        subject: form.subject || undefined,
        body_email: form.body_email || undefined,
        body_sms: form.body_sms || undefined,
        audience_filter,
        // datetime-local gives a local-timezone string — convert to UTC ISO before submitting
        scheduled_at: form.scheduled_at
          ? new Date(form.scheduled_at).toISOString()
          : undefined,
        send_now: form.send_now,
      }),
    ).unwrap();
    setForm(WIZARD_DEFAULTS);
    setStep(1);
    setDraftId(null);
    setConfirmed(false);
    setRecipientSearch("");
    setSaveSegmentName("");
    setShowSaveSegment(false);
    setShowSegmentPresets(false);
    onSuccess();
  };

  return (
    <div className="mx-auto max-w-2xl">
      {/* ── No Twilio number notice ────────────────────────────────────────── */}
      {!hasTwilioNumber && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-800/50 dark:bg-amber-950/30 px-4 py-3.5">
          <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
          <div className="text-sm">
            <p className="font-semibold text-amber-800 dark:text-amber-300">
              SMS broadcasts are unavailable for your account
            </p>
            <p className="text-amber-700 dark:text-amber-400 mt-0.5 leading-relaxed">
              Your account doesn&apos;t have an assigned Twilio phone number.{" "}
              <strong>Email broadcasts work normally.</strong> To enable SMS, go
              to{" "}
              <a
                href="/admin/settings"
                className="underline underline-offset-2 font-medium hover:text-amber-900 dark:hover:text-amber-200 transition-colors"
              >
                Settings
              </a>{" "}
              and assign a Twilio number to your profile, or contact your system
              administrator.
            </p>
          </div>
        </div>
      )}

      {/* Step progress */}
      <div className="mb-8 flex items-center gap-0">
        {WIZARD_STEPS.map((s, i) => (
          <div key={s.id} className="flex flex-1 items-center">
            <button
              onClick={() => step > s.id && setStep(s.id)}
              disabled={step <= s.id}
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition-all",
                step === s.id
                  ? "bg-primary text-primary-foreground shadow-md"
                  : step > s.id
                    ? "bg-primary/15 text-primary border border-primary/30 cursor-pointer hover:bg-primary/25"
                    : "bg-muted text-muted-foreground border border-border",
              )}
            >
              {step > s.id ? <CheckCircle2 className="h-4 w-4" /> : s.id}
            </button>
            <span
              className={cn(
                "ml-2 text-sm font-medium hidden sm:block",
                step === s.id
                  ? "text-foreground"
                  : step > s.id
                    ? "text-primary/70"
                    : "text-muted-foreground",
              )}
            >
              {s.label}
            </span>
            {i < WIZARD_STEPS.length - 1 && (
              <div
                className={cn(
                  "mx-3 h-px flex-1 transition-all",
                  step > s.id ? "bg-primary/30" : "bg-border",
                )}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Compose */}
      {step === 1 && (
        <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2">
          <div className="space-y-1">
            <Label>Campaign name</Label>
            <Input
              placeholder="e.g. Spring market update — May 2026"
              value={form.title}
              onChange={(e) => updateForm({ title: e.target.value })}
            />
          </div>

          <div className="space-y-1">
            <Label>Channel</Label>
            <div className="grid grid-cols-3 gap-2">
              <TooltipProvider>
                {CHANNEL_OPTIONS.map(({ value, label, icon: Icon }) => {
                  const needsTwilio = value === "sms" || value === "both";
                  const isDisabled = needsTwilio && !hasTwilioNumber;
                  return (
                    <Tooltip key={value}>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() =>
                            !isDisabled && updateForm({ channel: value })
                          }
                          disabled={isDisabled}
                          className={cn(
                            "flex flex-col items-center gap-1.5 rounded-lg border p-3 text-sm font-medium transition-all",
                            form.channel === value
                              ? "border-primary bg-primary/5 text-primary"
                              : "border-border hover:border-primary/40",
                            isDisabled &&
                              "opacity-40 cursor-not-allowed hover:border-border",
                          )}
                        >
                          <Icon className="h-5 w-5" />
                          {label}
                        </button>
                      </TooltipTrigger>
                      {isDisabled && (
                        <TooltipContent side="bottom" className="max-w-xs">
                          Requires an assigned Twilio number. Ask your platform
                          admin to assign one.
                        </TooltipContent>
                      )}
                    </Tooltip>
                  );
                })}
              </TooltipProvider>
            </div>
          </div>

          {(form.channel === "email" || form.channel === "both") && (
            <>
              {/* Template picker */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label>Subject line</Label>
                  {emailTemplates.length > 0 && (
                    <button
                      type="button"
                      className="text-xs text-primary hover:underline flex items-center gap-1"
                      onClick={() => setShowTemplates((v) => !v)}
                    >
                      <RotateCcw className="h-3 w-3" />
                      {showTemplates ? "Hide templates" : "Load from template"}
                    </button>
                  )}
                </div>
                {showTemplates && emailTemplates.length > 0 && (
                  <div className="rounded-md border divide-y text-sm max-h-40 overflow-y-auto mb-1">
                    {emailTemplates.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        className="w-full text-left px-3 py-2 hover:bg-muted/50 transition-colors"
                        onClick={() => {
                          updateForm({
                            subject: t.subject ?? form.subject,
                            body_email: t.body_html ?? "",
                          });
                          setShowTemplates(false);
                        }}
                      >
                        <span className="font-medium">{t.name}</span>
                        {t.subject && (
                          <span className="ml-2 text-muted-foreground truncate">
                            — {t.subject}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
                <div className="relative">
                  <Input
                    ref={subjectInputRef}
                    placeholder="{{first_name}}, don't miss this — rates dropped!"
                    value={form.subject}
                    onChange={(e) => {
                      updateForm({ subject: e.target.value });
                      const cursor =
                        e.target.selectionStart ?? e.target.value.length;
                      setShowSubjectTags(
                        e.target.value.slice(0, cursor).endsWith("{{"),
                      );
                    }}
                    onBlur={() =>
                      setTimeout(() => setShowSubjectTags(false), 150)
                    }
                    onKeyDown={(e) =>
                      e.key === "Escape" && setShowSubjectTags(false)
                    }
                  />
                  {showSubjectTags && (
                    <MergeTagDropdown
                      onSelect={(tag) =>
                        subjectInputRef.current &&
                        insertTagInField(
                          tag,
                          subjectInputRef.current,
                          form.subject,
                          (v) => updateForm({ subject: v }),
                        )
                      }
                      onClose={() => setShowSubjectTags(false)}
                    />
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Use{" "}
                  <code className="rounded bg-muted px-1">
                    {"{{first_name}}"}
                  </code>
                  ,{" "}
                  <code className="rounded bg-muted px-1">
                    {"{{full_name}}"}
                  </code>
                  ,{" "}
                  <code className="rounded bg-muted px-1">
                    {"{{broker_name}}"}
                  </code>{" "}
                  as merge tags.
                </p>
              </div>
              <div className="space-y-1">
                <Label>Email body</Label>
                <div className="relative rounded-md border overflow-hidden [&_.ql-toolbar]:rounded-t-md [&_.ql-container]:rounded-b-md [&_.ql-container]:min-h-[180px] [&_.ql-editor]:min-h-[160px] [&_.ql-editor]:text-sm">
                  <ReactQuill
                    ref={quillRef}
                    theme="snow"
                    value={form.body_email}
                    onChange={(val) => {
                      updateForm({ body_email: val });
                      // Detect {{ typed at cursor
                      const editor = quillRef.current?.getEditor();
                      if (editor) {
                        const sel = editor.getSelection();
                        if (sel) {
                          const textBefore = editor.getText(0, sel.index);
                          setShowQuillTags(textBefore.endsWith("{{"));
                        }
                      }
                    }}
                    modules={QUILL_MODULES}
                    formats={QUILL_FORMATS}
                    placeholder="Hi {{first_name}}, rates have dropped to historic lows…"
                  />
                  {showQuillTags && (
                    <div className="absolute left-2 bottom-2 z-50">
                      <MergeTagDropdown
                        onSelect={(tag) => {
                          const editor = quillRef.current?.getEditor();
                          if (!editor) return;
                          const sel = editor.getSelection();
                          if (sel) {
                            editor.deleteText(sel.index - 2, 2);
                            editor.insertText(sel.index - 2, tag);
                            editor.setSelection(sel.index - 2 + tag.length, 0);
                          }
                        }}
                        onClose={() => setShowQuillTags(false)}
                      />
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Use{" "}
                  <code className="rounded bg-muted px-1">
                    {"{{first_name}}"}
                  </code>
                  ,{" "}
                  <code className="rounded bg-muted px-1">
                    {"{{full_name}}"}
                  </code>
                  ,{" "}
                  <code className="rounded bg-muted px-1">
                    {"{{broker_name}}"}
                  </code>{" "}
                  as merge tags. An unsubscribe link is automatically appended.
                </p>
              </div>
            </>
          )}

          {(form.channel === "sms" || form.channel === "both") && (
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label>SMS message</Label>
                <div className="flex items-center gap-2">
                  {smsTemplates.length > 0 && (
                    <button
                      type="button"
                      className="text-xs text-primary hover:underline flex items-center gap-1"
                      onClick={() => setShowTemplates((v) => !v)}
                    >
                      <RotateCcw className="h-3 w-3" />
                      {showTemplates ? "Hide" : "Template"}
                    </button>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {form.body_sms.length} chars · {smsSegments(form.body_sms)}{" "}
                    seg
                    {smsSegments(form.body_sms) !== 1 ? "s" : ""}
                    {audiencePreview && audiencePreview.sms_count > 0 && (
                      <span className="ml-1 text-amber-600">
                        ·{" "}
                        {smsCostEstimate(
                          form.body_sms,
                          audiencePreview.sms_count,
                        )}
                      </span>
                    )}
                  </span>
                </div>
              </div>
              {showTemplates && smsTemplates.length > 0 && (
                <div className="rounded-md border divide-y text-sm max-h-36 overflow-y-auto mb-1">
                  {smsTemplates.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      className="w-full text-left px-3 py-2 hover:bg-muted/50 transition-colors"
                      onClick={() => {
                        updateForm({ body_sms: t.body ?? "" });
                        setShowTemplates(false);
                      }}
                    >
                      <span className="font-medium">{t.name}</span>
                    </button>
                  ))}
                </div>
              )}
              <div className="relative">
                <Textarea
                  ref={smsTextareaRef}
                  rows={4}
                  placeholder="Hi {{first_name}}, rates dropped! Call us now. — {{broker_name}}"
                  value={form.body_sms}
                  onChange={(e) => {
                    updateForm({ body_sms: e.target.value });
                    const cursor =
                      e.target.selectionStart ?? e.target.value.length;
                    setShowSmsTags(
                      e.target.value.slice(0, cursor).endsWith("{{"),
                    );
                  }}
                  onBlur={() => setTimeout(() => setShowSmsTags(false), 150)}
                  onKeyDown={(e) => e.key === "Escape" && setShowSmsTags(false)}
                />
                {showSmsTags && (
                  <MergeTagDropdown
                    onSelect={(tag) =>
                      smsTextareaRef.current &&
                      insertTagInField(
                        tag,
                        smsTextareaRef.current,
                        form.body_sms,
                        (v) => updateForm({ body_sms: v }),
                      )
                    }
                    onClose={() => setShowSmsTags(false)}
                  />
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                "Reply STOP to unsubscribe." is automatically appended.
              </p>
            </div>
          )}

          <div className="flex justify-end pt-2">
            <Button onClick={() => goToStep(2)} disabled={!canAdvanceStep1}>
              Next: Audience <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: Audience */}
      {step === 2 && (
        <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Target segments</Label>
              <div className="flex items-center gap-2">
                {savedSegments.length > 0 && (
                  <button
                    type="button"
                    className="text-xs text-primary hover:underline flex items-center gap-1"
                    onClick={() => setShowSegmentPresets((v) => !v)}
                  >
                    <BookOpen className="h-3 w-3" />
                    {showSegmentPresets ? "Hide presets" : "Load preset"}
                  </button>
                )}
                <button
                  type="button"
                  className="text-xs text-muted-foreground hover:text-primary hover:underline flex items-center gap-1"
                  onClick={() => setShowSaveSegment((v) => !v)}
                >
                  <BookmarkPlus className="h-3 w-3" />
                  Save as preset
                </button>
              </div>
            </div>

            {/* Saved segment presets dropdown */}
            {showSegmentPresets && savedSegments.length > 0 && (
              <div className="rounded-md border text-sm divide-y max-h-36 overflow-y-auto mb-1 animate-in fade-in">
                {savedSegments.map((seg) => (
                  <div
                    key={seg.id}
                    className="flex items-center justify-between px-3 py-2 hover:bg-muted/50 group"
                  >
                    <button
                      type="button"
                      className="flex-1 text-left font-medium"
                      onClick={() => handleLoadSegment(seg)}
                    >
                      {seg.name}
                      <span className="ml-2 text-xs text-muted-foreground font-normal">
                        {new Date(seg.created_at).toLocaleDateString()}
                      </span>
                    </button>
                    <button
                      type="button"
                      className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-opacity ml-2"
                      onClick={() => {
                        dispatch(deleteSavedSegment(seg.id));
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Save segment name input */}
            {showSaveSegment && (
              <div className="flex items-center gap-2 animate-in fade-in">
                <Input
                  className="h-8 text-xs"
                  placeholder="Preset name (e.g. All Active + No Opted-out)"
                  value={saveSegmentName}
                  onChange={(e) => setSaveSegmentName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSaveSegment()}
                />
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 shrink-0"
                  disabled={!saveSegmentName.trim()}
                  onClick={handleSaveSegment}
                >
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 shrink-0"
                  onClick={() => {
                    setShowSaveSegment(false);
                    setSaveSegmentName("");
                  }}
                >
                  Cancel
                </Button>
              </div>
            )}

            <div className="space-y-2">
              {SEGMENT_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className={cn(
                    "flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-all hover:border-primary/40",
                    form.segments.includes(opt.value) &&
                      "border-primary bg-primary/5",
                  )}
                >
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-primary"
                    checked={form.segments.includes(opt.value)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        updateForm({
                          segments: [...form.segments, opt.value],
                        });
                      } else {
                        updateForm({
                          segments: form.segments.filter(
                            (s) => s !== opt.value,
                          ),
                        });
                      }
                    }}
                  />
                  <span className="text-sm font-medium">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Audience preview */}
          {previewRequested && (
            <Card>
              <CardHeader className="pb-2 pt-3">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Eye className="h-4 w-4 text-primary" />
                  Audience preview
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isPreviewing ? (
                  <div className="flex items-center gap-2 py-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Calculating…
                  </div>
                ) : audiencePreview ? (
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-4 text-sm">
                      <div className="flex items-center gap-1.5">
                        <Users className="h-4 w-4 text-primary" />
                        <span className="font-semibold">
                          {audiencePreview.count}
                        </span>{" "}
                        total recipients
                      </div>
                      {(form.channel === "email" ||
                        form.channel === "both") && (
                        <div className="flex items-center gap-1.5 text-blue-600">
                          <Mail className="h-4 w-4" />
                          {audiencePreview.email_count} have email
                        </div>
                      )}
                      {(form.channel === "sms" || form.channel === "both") && (
                        <div className="flex items-center gap-1.5 text-green-600">
                          <MessageSquare className="h-4 w-4" />
                          {audiencePreview.sms_count} have phone
                        </div>
                      )}
                      {audiencePreview.skipped_count > 0 && (
                        <div className="flex items-center gap-1.5 text-amber-600">
                          <AlertTriangle className="h-4 w-4" />
                          {audiencePreview.skipped_count} skipped
                        </div>
                      )}
                    </div>

                    {audiencePreview.sample.length > 0 && (
                      <div className="rounded-md border text-xs mt-1">
                        {/* Checklist header */}
                        <div className="px-3 py-2 bg-muted/40 rounded-t-md border-b space-y-1.5">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              className="h-3.5 w-3.5 accent-primary"
                              checked={
                                audiencePreview.sample.filter((s) => !s.skipped)
                                  .length > 0 &&
                                audiencePreview.sample
                                  .filter((s) => !s.skipped)
                                  .every(
                                    (s) => !form.excluded_ids.includes(s.id),
                                  )
                              }
                              onChange={(e) => {
                                const eligible = audiencePreview.sample
                                  .filter((s) => !s.skipped)
                                  .map((s) => s.id);
                                if (e.target.checked) {
                                  updateForm({ excluded_ids: [] });
                                } else {
                                  updateForm({ excluded_ids: eligible });
                                }
                              }}
                            />
                            <div className="relative flex-1">
                              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                              <input
                                type="text"
                                className="w-full pl-6 pr-2 py-0.5 rounded bg-background border text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                                placeholder="Search recipients…"
                                value={recipientSearch}
                                onChange={(e) =>
                                  setRecipientSearch(e.target.value)
                                }
                              />
                            </div>
                            <span className="text-muted-foreground whitespace-nowrap">
                              {
                                audiencePreview.sample.filter(
                                  (s) =>
                                    !s.skipped &&
                                    !form.excluded_ids.includes(s.id),
                                ).length
                              }{" "}
                              of{" "}
                              {
                                audiencePreview.sample.filter((s) => !s.skipped)
                                  .length
                              }{" "}
                              selected
                            </span>
                          </div>
                          {/* Type filter pills */}
                          {(() => {
                            const sources = Array.from(
                              new Set(
                                audiencePreview.sample.map((s) => s.source),
                              ),
                            );
                            if (sources.length < 2) return null;
                            const pills: {
                              key: "all" | "broker" | "prospect" | "client";
                              label: string;
                            }[] = [
                              { key: "all", label: "All" },
                              ...(sources.includes("broker")
                                ? [
                                    {
                                      key: "broker" as const,
                                      label: "Realtor Partners",
                                    },
                                  ]
                                : []),
                              ...(sources.includes("prospect")
                                ? [
                                    {
                                      key: "prospect" as const,
                                      label: "Prospects",
                                    },
                                  ]
                                : []),
                              ...(sources.includes("client")
                                ? [{ key: "client" as const, label: "Clients" }]
                                : []),
                            ];
                            return (
                              <div className="flex items-center gap-1 flex-wrap">
                                {pills.map((p) => (
                                  <button
                                    key={p.key}
                                    type="button"
                                    onClick={() =>
                                      setRecipientTypeFilter(p.key)
                                    }
                                    className={cn(
                                      "rounded-full px-2 py-0.5 text-[10px] font-medium transition-colors border",
                                      recipientTypeFilter === p.key
                                        ? "bg-primary text-primary-foreground border-primary"
                                        : "bg-background text-muted-foreground border-border hover:border-primary hover:text-primary",
                                    )}
                                  >
                                    {p.label}
                                    {p.key !== "all" && (
                                      <span className="ml-1 opacity-70">
                                        {
                                          audiencePreview.sample.filter(
                                            (s) => s.source === p.key,
                                          ).length
                                        }
                                      </span>
                                    )}
                                  </button>
                                ))}
                              </div>
                            );
                          })()}
                        </div>
                        {/* Recipient rows */}
                        <div className="max-h-56 overflow-y-auto">
                          {audiencePreview.sample
                            .filter((s) =>
                              recipientTypeFilter === "all"
                                ? true
                                : s.source === recipientTypeFilter,
                            )
                            .filter((s) =>
                              recipientSearch.trim()
                                ? s.name
                                    .toLowerCase()
                                    .includes(
                                      recipientSearch.toLowerCase().trim(),
                                    )
                                : true,
                            )
                            .map((s) => {
                              const isExcluded = form.excluded_ids.includes(
                                s.id,
                              );
                              const isSkipped = s.skipped;
                              return (
                                <div
                                  key={`${s.source}-${s.id}`}
                                  className={cn(
                                    "flex items-center justify-between px-3 py-2 border-t transition-colors",
                                    isSkipped
                                      ? "opacity-50"
                                      : isExcluded
                                        ? "bg-muted/30"
                                        : "hover:bg-muted/20",
                                  )}
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    <input
                                      type="checkbox"
                                      className="h-3.5 w-3.5 accent-primary shrink-0"
                                      disabled={isSkipped}
                                      checked={!isExcluded && !isSkipped}
                                      onChange={(e) => {
                                        if (e.target.checked) {
                                          updateForm({
                                            excluded_ids:
                                              form.excluded_ids.filter(
                                                (id) => id !== s.id,
                                              ),
                                          });
                                        } else {
                                          updateForm({
                                            excluded_ids: [
                                              ...form.excluded_ids,
                                              s.id,
                                            ],
                                          });
                                        }
                                      }}
                                    />
                                    <span
                                      className={cn(
                                        "font-medium truncate",
                                        isExcluded &&
                                          "line-through text-muted-foreground",
                                      )}
                                    >
                                      {s.name}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                                    {s.has_email && (
                                      <Mail className="h-3 w-3 text-blue-500" />
                                    )}
                                    {s.has_phone && (
                                      <MessageSquare className="h-3 w-3 text-green-500" />
                                    )}
                                    <span
                                      className={cn(
                                        "text-[9px] rounded px-1.5 py-0.5 font-medium",
                                        roleLabel(s).cls,
                                      )}
                                    >
                                      {roleLabel(s).text}
                                    </span>
                                    {isSkipped && (
                                      <span className="text-[9px] rounded bg-amber-100 text-amber-700 px-1 py-0.5">
                                        {s.skip_reason === "sms_opted_out"
                                          ? "STOP"
                                          : "no contact"}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    )}
                  </div>
                ) : null}
              </CardContent>
            </Card>
          )}

          <div className="flex justify-between pt-2">
            <Button variant="outline" onClick={() => setStep(1)}>
              <ChevronLeft className="mr-1 h-4 w-4" /> Back
            </Button>
            <Button
              onClick={() => goToStep(3)}
              disabled={!form.segments.length}
            >
              Next: Schedule <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Schedule */}
      {step === 3 && (
        <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2">
          <div className="space-y-4">
            <label
              className={cn(
                "flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition-all",
                form.send_now && "border-primary bg-primary/5",
              )}
            >
              <input
                type="radio"
                className="accent-primary"
                checked={form.send_now}
                onChange={() =>
                  updateForm({ send_now: true, scheduled_at: "" })
                }
              />
              <div>
                <p className="font-medium text-sm">Send immediately</p>
                <p className="text-xs text-muted-foreground">
                  Starts sending as soon as you confirm.
                </p>
              </div>
            </label>

            <label
              className={cn(
                "flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition-all",
                !form.send_now && "border-primary bg-primary/5",
              )}
            >
              <input
                type="radio"
                className="accent-primary"
                checked={!form.send_now}
                onChange={() => updateForm({ send_now: false })}
              />
              <div className="flex-1">
                <p className="font-medium text-sm">Schedule for later</p>
                <p className="text-xs text-muted-foreground mb-2">
                  Enter the date/time in your local timezone. Will be converted
                  to UTC.
                </p>
                {!form.send_now && (
                  <Input
                    type="datetime-local"
                    value={form.scheduled_at}
                    onChange={(e) =>
                      updateForm({ scheduled_at: e.target.value })
                    }
                    className="max-w-xs"
                  />
                )}
              </div>
            </label>
          </div>

          <div className="flex justify-between pt-2">
            <Button variant="outline" onClick={() => setStep(2)}>
              <ChevronLeft className="mr-1 h-4 w-4" /> Back
            </Button>
            <Button
              onClick={() => goToStep(4)}
              disabled={!form.send_now && !form.scheduled_at}
            >
              Review <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 4: Review & Send */}
      {step === 4 && (
        <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2">
          <Card>
            <CardContent className="pt-5 space-y-3 text-sm">
              <div className="grid grid-cols-[120px_1fr] gap-y-2">
                <span className="text-muted-foreground">Campaign</span>
                <span className="font-semibold">{form.title}</span>

                <span className="text-muted-foreground">Channel</span>
                <span className="font-medium capitalize">{form.channel}</span>

                {form.subject && (
                  <>
                    <span className="text-muted-foreground">Subject</span>
                    <span>{form.subject}</span>
                  </>
                )}

                <span className="text-muted-foreground">Audience</span>
                <span>
                  {audiencePreview
                    ? (() => {
                        const totalInSample = audiencePreview.sample.filter(
                          (s) => !s.skipped,
                        ).length;
                        const selectedItems = audiencePreview.sample.filter(
                          (s) =>
                            !s.skipped && !form.excluded_ids.includes(s.id),
                        );
                        const selectedCount = selectedItems.length;
                        const hasCustomSelection =
                          form.excluded_ids.length > 0 &&
                          selectedCount < totalInSample;

                        if (hasCustomSelection && selectedCount <= 10) {
                          // Show avatars/names for small custom selections
                          return (
                            <div className="space-y-1.5">
                              <span className="font-semibold text-primary">
                                {selectedCount} contact
                                {selectedCount !== 1 ? "s" : ""} selected
                              </span>
                              <div className="flex flex-col gap-1 mt-1">
                                {selectedItems.map((s) => {
                                  const rl = roleLabel(s);
                                  return (
                                    <div
                                      key={`${s.source}-${s.id}`}
                                      className="flex items-center gap-2"
                                    >
                                      <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                        <span className="text-[9px] font-bold text-primary">
                                          {s.name
                                            .split(" ")
                                            .map((w) => w[0])
                                            .slice(0, 2)
                                            .join("")
                                            .toUpperCase()}
                                        </span>
                                      </div>
                                      <span className="text-xs font-medium">
                                        {s.name}
                                      </span>
                                      <span
                                        className={cn(
                                          "text-[9px] rounded px-1.5 py-0.5 font-medium",
                                          rl.cls,
                                        )}
                                      >
                                        {rl.text}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        }

                        return (
                          <span className="font-semibold">
                            {selectedCount.toLocaleString()} contact
                            {selectedCount !== 1 ? "s" : ""}
                            {hasCustomSelection && (
                              <span className="ml-1.5 text-xs text-muted-foreground font-normal">
                                ({totalInSample - selectedCount} excluded)
                              </span>
                            )}
                          </span>
                        );
                      })()
                    : form.segments.join(", ")}
                </span>

                <span className="text-muted-foreground">Delivery</span>
                <span>
                  {form.send_now
                    ? "Immediate"
                    : `Scheduled for ${new Date(form.scheduled_at).toLocaleString()}`}
                </span>
              </div>
            </CardContent>
          </Card>

          {(form.channel === "email" || form.channel === "both") && (
            <div className="rounded-lg border p-3 bg-muted/30">
              <p className="text-xs font-medium text-muted-foreground mb-1">
                EMAIL PREVIEW
              </p>
              <div
                className="text-sm prose prose-sm max-w-none max-h-32 overflow-hidden"
                dangerouslySetInnerHTML={{
                  __html: form.body_email.slice(0, 500),
                }}
              />
              {form.body_email.length > 500 && (
                <p className="text-xs text-muted-foreground mt-1">
                  …{form.body_email.length - 500} more characters
                </p>
              )}
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
              <XCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          {/* Minimum recipient warning */}
          {audiencePreview &&
            (() => {
              const n = audiencePreview.sample.filter(
                (s) => !s.skipped && !form.excluded_ids.includes(s.id),
              ).length;
              if (n >= 2) return null;
              return (
                <div className="flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm text-amber-700">
                  <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>
                    Only {n} recipient{n !== 1 ? "s" : ""} selected. This looks
                    like a test — confirm you intend to send to a very small
                    audience.
                  </span>
                </div>
              );
            })()}

          {/* I confirm checkbox */}
          <label className="flex items-start gap-3 cursor-pointer select-none rounded-lg border p-3 hover:bg-muted/30 transition-colors">
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 accent-primary shrink-0"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
            />
            <span className="text-sm">
              I confirm I have reviewed the audience and content above and
              authorise this broadcast.
            </span>
          </label>

          <div className="flex justify-between pt-2">
            <Button variant="outline" onClick={() => setStep(3)}>
              <ChevronLeft className="mr-1 h-4 w-4" /> Back
            </Button>
            <Button
              onClick={handleSend}
              disabled={isSending || !confirmed}
              className="min-w-[140px]"
            >
              {isSending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Queuing…
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  {form.send_now ? "Send Broadcast" : "Schedule Broadcast"}
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Broadcast Detail Drawer ──────────────────────────────────────────────────

function BroadcastDetailDialog({
  broadcastId,
  onClose,
}: {
  broadcastId: number | null;
  onClose: () => void;
}) {
  const dispatch = useAppDispatch();
  const {
    activeBroadcast,
    recipients,
    recipientsTotal,
    isLoading,
    isResending,
    isExporting,
  } = useAppSelector((state) => state.realtorBroadcasts);
  const { sessionToken } = useAppSelector((s) => s.brokerAuth);

  useEffect(() => {
    if (!broadcastId) return;
    dispatch(fetchBroadcastDetail(broadcastId));
    dispatch(fetchBroadcastRecipients({ broadcastId, limit: 100 }));

    // Subscribe to Ably for live progress
    let ablyChannel: ReturnType<
      Awaited<ReturnType<typeof getSharedAblyClient>>["channels"]["get"]
    > | null = null;
    let cancelled = false;
    (async () => {
      const client = await getSharedAblyClient(sessionToken);
      if (cancelled || !client) return;
      ablyChannel = client.channels.get(`broadcast:${broadcastId}`);
      ablyChannel.subscribe("progress", (msg) => {
        dispatch(
          updateBroadcastProgress({
            broadcastId,
            sent: msg.data.sent,
            failed: msg.data.failed,
            total: msg.data.total,
          }),
        );
      });
    })();
    return () => {
      cancelled = true;
      ablyChannel?.unsubscribe?.();
    };
  }, [broadcastId, dispatch]);

  useEffect(() => {
    return () => {
      dispatch(clearActiveBroadcast());
    };
  }, [dispatch]);

  const b = activeBroadcast;
  const progress = b
    ? b.recipient_count > 0
      ? Math.round(((b.sent_count + b.failed_count) / b.recipient_count) * 100)
      : 0
    : 0;

  return (
    <Dialog open={!!broadcastId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {b ? (
              <>
                <Megaphone className="h-5 w-5 text-primary" />
                {b.title}
              </>
            ) : (
              <Skeleton className="h-6 w-48" />
            )}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-2">
          {isLoading && !b ? (
            <div className="space-y-3 py-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </div>
          ) : b ? (
            <div className="space-y-5 py-2">
              {/* Stats row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  {
                    label: "Total",
                    value: b.recipient_count,
                    color: "text-foreground",
                  },
                  {
                    label: "Sent",
                    value: b.sent_count,
                    color: "text-green-600",
                  },
                  {
                    label: "Failed",
                    value: b.failed_count,
                    color: "text-red-500",
                  },
                  {
                    label: "Status",
                    value: <StatusBadge status={b.status} />,
                    color: "",
                  },
                ].map((stat) => (
                  <Card key={stat.label}>
                    <CardContent className="pt-3 pb-3">
                      <p className="text-xs text-muted-foreground mb-1">
                        {stat.label}
                      </p>
                      <p className={cn("font-bold text-lg", stat.color)}>
                        {stat.value}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Opens count (email only) */}
              {(b.channel === "email" || b.channel === "both") && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Eye className="h-4 w-4 text-blue-500" />
                  <span>
                    <span className="font-semibold text-blue-600">
                      {
                        recipients.filter((r) => r.email_status === "opened")
                          .length
                      }
                    </span>{" "}
                    opens tracked (from loaded recipients)
                  </span>
                </div>
              )}

              {/* Resend failed button */}
              {b.failed_count > 0 &&
                ["sent", "failed", "cancelled"].includes(b.status) && (
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-amber-700 border-amber-300 hover:bg-amber-50"
                      disabled={isResending}
                      onClick={async () => {
                        await dispatch(retrySendFailed(b.id));
                        dispatch(
                          fetchBroadcastRecipients({
                            broadcastId: b.id,
                            limit: 100,
                          }),
                        );
                        dispatch(fetchBroadcastDetail(b.id));
                      }}
                    >
                      {isResending ? (
                        <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                      )}
                      Retry {b.failed_count} failed
                    </Button>
                  </div>
                )}

              {/* Live progress */}
              {b.status === "sending" && (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>
                      {b.sent_count + b.failed_count} / {b.recipient_count}
                    </span>
                    <span>{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              )}

              <Separator />

              {/* Recipients table */}
              <div>
                <p className="text-sm font-medium mb-2">
                  Recipients ({recipientsTotal})
                </p>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Phone</TableHead>
                        {(b.channel === "email" || b.channel === "both") && (
                          <TableHead>Email status</TableHead>
                        )}
                        {(b.channel === "sms" || b.channel === "both") && (
                          <TableHead>SMS status</TableHead>
                        )}
                        <TableHead>Sent at</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recipients.map((r) => (
                        <TableRow key={r.id}>
                          <TableCell className="font-medium text-sm">
                            {r.recipient_name || "—"}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {r.recipient_email || "—"}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {r.recipient_phone || "—"}
                          </TableCell>
                          {(b.channel === "email" || b.channel === "both") && (
                            <TableCell>
                              {r.email_status ? (
                                <StatusBadge status={r.email_status} />
                              ) : (
                                "—"
                              )}
                            </TableCell>
                          )}
                          {(b.channel === "sms" || b.channel === "both") && (
                            <TableCell>
                              {r.sms_status ? (
                                <StatusBadge status={r.sms_status} />
                              ) : (
                                "—"
                              )}
                            </TableCell>
                          )}
                          <TableCell className="text-xs text-muted-foreground">
                            {r.sent_at
                              ? new Date(r.sent_at).toLocaleString()
                              : "—"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          ) : null}
        </ScrollArea>

        <DialogFooter className="gap-2 pt-2">
          {b && (
            <Button
              variant="outline"
              size="sm"
              disabled={isExporting}
              onClick={() => dispatch(exportBroadcastRecipients(b.id))}
            >
              {isExporting ? (
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              ) : (
                <Download className="mr-1.5 h-3.5 w-3.5" />
              )}
              Export CSV
            </Button>
          )}
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── History Tab ──────────────────────────────────────────────────────────────

function BroadcastHistory() {
  const dispatch = useAppDispatch();
  const { broadcasts, broadcastsTotal, isLoading } = useAppSelector(
    (state) => state.realtorBroadcasts,
  );
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<RealtorBroadcast | null>(
    null,
  );

  useEffect(() => {
    dispatch(fetchBroadcasts());
  }, [dispatch]);

  const handleCancel = async (id: number) => {
    await dispatch(cancelBroadcast(id));
    dispatch(fetchBroadcasts());
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    await dispatch(deleteBroadcast(confirmDelete.id));
    setConfirmDelete(null);
  };

  return (
    <div className="space-y-4">
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-lg" />
          ))}
        </div>
      ) : broadcasts.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
          <Megaphone className="h-12 w-12 opacity-20" />
          <p className="text-sm">No broadcasts yet</p>
          <p className="text-xs">
            Create your first broadcast using the New Broadcast tab.
          </p>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Campaign</TableHead>
                <TableHead>Channel</TableHead>
                <TableHead>Recipients</TableHead>
                <TableHead>Delivered</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {broadcasts.map((b) => (
                <TableRow
                  key={b.id}
                  className="cursor-pointer hover:bg-muted/40 transition-colors"
                  onClick={() => setSelectedId(b.id)}
                >
                  <TableCell className="font-medium">{b.title}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize text-xs">
                      {b.channel}
                    </Badge>
                  </TableCell>
                  <TableCell>{b.recipient_count}</TableCell>
                  <TableCell>
                    {b.status === "sending" ? (
                      <span className="text-sm text-amber-600 font-medium">
                        {b.sent_count}/{b.recipient_count}
                      </span>
                    ) : (
                      <span className="text-sm">
                        {b.sent_count}
                        {b.failed_count > 0 && (
                          <span className="text-red-500 ml-1">
                            ({b.failed_count} failed)
                          </span>
                        )}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={b.status} />
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(b.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div
                      className="flex items-center justify-end gap-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {["sending", "scheduled", "draft"].includes(b.status) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-amber-600 hover:text-amber-700"
                          onClick={() => handleCancel(b.id)}
                        >
                          <Ban className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      {["draft", "scheduled"].includes(b.status) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-red-500 hover:text-red-600"
                          onClick={() => setConfirmDelete(b)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Detail dialog */}
      <BroadcastDetailDialog
        broadcastId={selectedId}
        onClose={() => setSelectedId(null)}
      />

      {/* Delete confirmation */}
      <Dialog
        open={!!confirmDelete}
        onOpenChange={(open) => !open && setConfirmDelete(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete broadcast?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This will permanently delete <strong>{confirmDelete?.title}</strong>
            . This cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function RealtorBroadcasts() {
  const dispatch = useAppDispatch();
  const [activeTab, setActiveTab] = useState("new");

  const handleBroadcastSuccess = () => {
    // Switch to history tab and refresh
    setActiveTab("history");
    dispatch(fetchBroadcasts());
  };

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 max-w-5xl mx-auto">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Megaphone className="h-6 w-6 text-primary" />
            Broadcast Center
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Send email and SMS blasts to your realtors and prospects.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/60 rounded-lg px-3 py-2">
          <Info className="h-3.5 w-3.5 shrink-0" />
          Unsubscribes and STOP replies are handled automatically.
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full max-w-xs grid-cols-2">
          <TabsTrigger value="new" className="flex items-center gap-1.5">
            <Send className="h-3.5 w-3.5" />
            New Broadcast
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-1.5">
            <RotateCcw className="h-3.5 w-3.5" />
            History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="new" className="mt-6">
          <BroadcastWizard onSuccess={handleBroadcastSuccess} />
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          <BroadcastHistory />
        </TabsContent>
      </Tabs>
    </div>
  );
}
