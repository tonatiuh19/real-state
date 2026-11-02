import { useRef, useState } from "react";
import {
  Link2,
  Loader2,
  Paperclip,
  Sparkles,
  Upload,
  ImageIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAppDispatch } from "@/store/hooks";
import {
  createShortLink,
  uploadShortLinkAsset,
} from "@/store/slices/realtorBroadcastSlice";
import { logger } from "@/lib/logger";
import {
  BROADCAST_MMS_MAX_RECIPIENTS,
  buildEmailCtaButtonHtml,
  buildShortSmsInviteTemplate,
  estimateSmsSegments,
  smsSegmentWarningLevel,
} from "@shared/short-links";
import { cn } from "@/lib/utils";

export type BroadcastLinkAttachment = {
  shortUrl: string;
  code: string;
  targetUrl: string;
  title?: string | null;
};

export type BroadcastMmsAttachment = {
  url: string;
  contentType: string;
  filename: string;
};

type Props = {
  sessionToken: string | null;
  channel: "email" | "sms" | "both";
  bodySms: string;
  bodyEmail: string;
  smsRecipientEstimate: number;
  /** When false, hide MMS attach (compose before audience is sized). */
  allowMmsAttach?: boolean;
  onBodySmsChange: (next: string) => void;
  onBodyEmailChange: (next: string) => void;
  linkAttachment: BroadcastLinkAttachment | null;
  onLinkAttachmentChange: (next: BroadcastLinkAttachment | null) => void;
  mmsAttachment: BroadcastMmsAttachment | null;
  onMmsAttachmentChange: (next: BroadcastMmsAttachment | null) => void;
};

function insertAtEnd(body: string, chunk: string): string {
  const trimmed = body.trimEnd();
  if (!trimmed) return chunk;
  if (trimmed.includes(chunk)) return trimmed;
  return `${trimmed}${trimmed.endsWith(" ") ? "" : " "}${chunk}`;
}

export function BroadcastSmsLinkTools({
  sessionToken,
  channel,
  bodySms,
  bodyEmail,
  smsRecipientEstimate,
  allowMmsAttach = true,
  onBodySmsChange,
  onBodyEmailChange,
  linkAttachment,
  onLinkAttachmentChange,
  mmsAttachment,
  onMmsAttachmentChange,
}: Props) {
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mmsInputRef = useRef<HTMLInputElement>(null);
  const [pasteUrl, setPasteUrl] = useState("");
  const [busy, setBusy] = useState<"link" | "upload" | "mms" | null>(null);

  const smsChannel = channel === "sms" || channel === "both";
  const emailChannel = channel === "email" || channel === "both";
  const seg = estimateSmsSegments(bodySms);
  const warn = smsSegmentWarningLevel(seg.segments);

  const applyShortLink = (short: BroadcastLinkAttachment, alsoTemplate: boolean) => {
    onLinkAttachmentChange(short);
    if (alsoTemplate) {
      onBodySmsChange(
        buildShortSmsInviteTemplate({ shortUrl: short.shortUrl }),
      );
    } else {
      onBodySmsChange(insertAtEnd(bodySms, short.shortUrl));
    }
    if (emailChannel) {
      const btn = buildEmailCtaButtonHtml({
        url: short.shortUrl,
        label: "View details",
      });
      if (btn && !bodyEmail.includes(short.shortUrl)) {
        onBodyEmailChange(
          bodyEmail.trim()
            ? `${bodyEmail.trim()}\n${btn}`
            : `<p>Hi {{first_name}},</p>${btn}`,
        );
      }
    }
  };

  const createFromUrl = async (rawUrl: string, useTemplate: boolean) => {
    if (!sessionToken) {
      toast({
        title: "Sign in required",
        description: "Refresh and try again.",
        variant: "destructive",
      });
      return;
    }
    const target_url = rawUrl.trim();
    if (!/^https?:\/\//i.test(target_url)) {
      toast({
        title: "Invalid URL",
        description: "Paste a full https:// link.",
        variant: "destructive",
      });
      return;
    }
    setBusy("link");
    try {
      const row = await dispatch(createShortLink({ target_url })).unwrap();
      const short: BroadcastLinkAttachment = {
        shortUrl: row.short_url,
        code: row.code,
        targetUrl: row.target_url,
        title: row.title,
      };
      applyShortLink(short, useTemplate);
      setPasteUrl("");
      toast({
        title: "Short link ready",
        description: short.shortUrl,
      });
    } catch (err) {
      logger.error("[BroadcastSmsLinkTools] create link failed", err);
      toast({
        title: "Short link failed",
        description: typeof err === "string" ? err : "Try again",
        variant: "destructive",
      });
    } finally {
      setBusy(null);
    }
  };

  const uploadForLink = async (file: File) => {
    if (!sessionToken) return;
    const okTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
    ];
    if (!okTypes.includes(file.type)) {
      toast({
        title: "Unsupported file",
        description: "Use PDF or an image (jpg/png/gif/webp).",
        variant: "destructive",
      });
      return;
    }
    setBusy("upload");
    try {
      const data = await dispatch(
        uploadShortLinkAsset({ file, createShortLink: true }),
      ).unwrap();
      if (!data.short_link) throw new Error("Upload failed");
      const short: BroadcastLinkAttachment = {
        shortUrl: data.short_link.short_url,
        code: data.short_link.code,
        targetUrl: data.short_link.target_url,
        title: data.short_link.title,
      };
      applyShortLink(short, false);
      toast({
        title: "File hosted + shortened",
        description: short.shortUrl,
      });
    } catch (err) {
      logger.error("[BroadcastSmsLinkTools] upload failed", err);
      toast({
        title: "Upload failed",
        description: typeof err === "string" ? err : "Try again",
        variant: "destructive",
      });
    } finally {
      setBusy(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const uploadMms = async (file: File) => {
    if (!sessionToken) return;
    if (!allowMmsAttach || smsRecipientEstimate <= 0) {
      toast({
        title: "Size the audience first",
        description: `Pick recipients on the Audience step so we can enforce the ${BROADCAST_MMS_MAX_RECIPIENTS}-person MMS cap.`,
        variant: "destructive",
      });
      return;
    }
    if (smsRecipientEstimate > BROADCAST_MMS_MAX_RECIPIENTS) {
      toast({
        title: "Audience too large for MMS",
        description: `MMS is capped at ${BROADCAST_MMS_MAX_RECIPIENTS} SMS recipients. Use a short link instead.`,
        variant: "destructive",
      });
      return;
    }
    const ok = window.confirm(
      `Attach this file as MMS to up to ${smsRecipientEstimate || "?"} recipients?\n\nMMS costs more than SMS. Prefer a short link for large lists.`,
    );
    if (!ok) return;
    setBusy("mms");
    try {
      const data = await dispatch(
        uploadShortLinkAsset({ file, createShortLink: false }),
      ).unwrap();
      if (!data.asset?.url) throw new Error("Durable MMS upload failed");
      onMmsAttachmentChange({
        url: data.asset.url,
        contentType: data.asset.content_type || file.type,
        filename: data.asset.filename || file.name,
      });
      toast({
        title: "MMS attachment ready",
        description: "Stored durably for scheduled sends.",
      });
    } catch (err) {
      logger.error("[BroadcastSmsLinkTools] MMS upload failed", err);
      toast({
        title: "MMS upload failed",
        description: typeof err === "string" ? err : "Try again",
        variant: "destructive",
      });
    } finally {
      setBusy(null);
      if (mmsInputRef.current) mmsInputRef.current.value = "";
    }
  };

  if (!smsChannel && !emailChannel) return null;

  return (
    <div className="rounded-lg border bg-muted/20 p-3 space-y-3 print:hidden">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Link &amp; attachments
        </p>
        {smsChannel && (
          <p
            className={cn(
              "text-xs font-medium tabular-nums",
              warn === "ok" && "text-muted-foreground",
              warn === "soft" && "text-amber-700",
              warn === "hard" && "text-red-700",
            )}
          >
            {seg.charCount} chars · {seg.encoding} · {seg.segments} seg
            {seg.segments !== 1 ? "s" : ""}
          </p>
        )}
      </div>

      {smsChannel && warn === "soft" && (
        <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-md px-2 py-1.5">
          This SMS is {seg.segments}+ segments — prefer a short plain message +
          link to control cost.
        </p>
      )}
      {smsChannel && warn === "hard" && (
        <p className="text-xs text-red-800 bg-red-50 border border-red-200 rounded-md px-2 py-1.5">
          High segment count ({seg.segments}). You will confirm before send.
          Emoji/Unicode switches to UCS-2 (~67 chars/seg).
        </p>
      )}

      {smsChannel && (
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={!!busy}
            onClick={() => {
              onBodySmsChange(buildShortSmsInviteTemplate({}));
              toast({
                title: "Short invite template",
                description: "Add a short link next to fill the Details URL.",
              });
            }}
          >
            <Sparkles className="h-3.5 w-3.5 mr-1.5" />
            Short invite template
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={!!busy}
            onClick={() => fileInputRef.current?.click()}
          >
            {busy === "upload" ? (
              <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
            ) : (
              <Upload className="h-3.5 w-3.5 mr-1.5" />
            )}
            Upload PDF / photo → short link
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf,image/jpeg,image/png,image/gif,image/webp"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void uploadForLink(f);
            }}
          />
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2">
        <div className="space-y-1">
          <Label className="text-[11px] uppercase tracking-wide text-muted-foreground">
            Paste URL → portal.encoremortgage.org/l/…
          </Label>
          <Input
            value={pasteUrl}
            onChange={(e) => setPasteUrl(e.target.value)}
            placeholder="https://…"
            className="h-9"
          />
        </div>
        <div className="flex items-end gap-2">
          <Button
            type="button"
            size="sm"
            className="h-9"
            disabled={!!busy || !pasteUrl.trim()}
            onClick={() => void createFromUrl(pasteUrl, false)}
          >
            {busy === "link" ? (
              <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
            ) : (
              <Link2 className="h-3.5 w-3.5 mr-1.5" />
            )}
            Insert short link
          </Button>
        </div>
      </div>

      {linkAttachment && (
        <div className="rounded-md border bg-background px-3 py-2 text-xs space-y-1">
          <p className="font-semibold text-foreground break-all">
            {linkAttachment.shortUrl}
          </p>
          <p className="text-muted-foreground break-all">
            → {linkAttachment.targetUrl}
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            {emailChannel && (
              <Button
                type="button"
                size="sm"
                variant="secondary"
                className="h-7 text-xs"
                onClick={() => {
                  const btn = buildEmailCtaButtonHtml({
                    url: linkAttachment.shortUrl,
                    label: "View details",
                  });
                  onBodyEmailChange(
                    bodyEmail.trim()
                      ? `${bodyEmail.trim()}\n${btn}`
                      : `<p>Hi {{first_name}},</p>${btn}`,
                  );
                  toast({ title: "Email CTA button added" });
                }}
              >
                Add email CTA button
              </Button>
            )}
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-7 text-xs"
              onClick={() => onLinkAttachmentChange(null)}
            >
              Clear link meta
            </Button>
          </div>
        </div>
      )}

      {smsChannel && (
        <div className="border-t pt-3 space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Optional MMS (max {BROADCAST_MMS_MAX_RECIPIENTS} recipients)
          </p>
          <p className="text-[11px] text-muted-foreground">
            Prefer short links for large lists. MMS attaches the file in the SMS
            thread and costs more (quota reserves at least 2 segments per
            recipient).
          </p>
          {(!allowMmsAttach || smsRecipientEstimate <= 0) && (
            <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-md px-2 py-1.5">
              Size your audience on the next step before attaching MMS so we can
              enforce the {BROADCAST_MMS_MAX_RECIPIENTS}-recipient cap.
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={
                !!busy ||
                !allowMmsAttach ||
                smsRecipientEstimate <= 0 ||
                smsRecipientEstimate > BROADCAST_MMS_MAX_RECIPIENTS
              }
              onClick={() => mmsInputRef.current?.click()}
            >
              {busy === "mms" ? (
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
              ) : (
                <Paperclip className="h-3.5 w-3.5 mr-1.5" />
              )}
              Attach MMS PDF / photo
            </Button>
            <input
              ref={mmsInputRef}
              type="file"
              accept="application/pdf,image/jpeg,image/png,image/gif,image/webp"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void uploadMms(f);
              }}
            />
            {mmsAttachment && (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => onMmsAttachmentChange(null)}
              >
                Remove MMS
              </Button>
            )}
          </div>
          {mmsAttachment && (
            <p className="text-xs flex items-center gap-1.5 text-foreground">
              <ImageIcon className="h-3.5 w-3.5" />
              {mmsAttachment.filename || "MMS file"} ready
            </p>
          )}
          {smsRecipientEstimate > BROADCAST_MMS_MAX_RECIPIENTS && (
            <p className="text-xs text-amber-800">
              Audience estimate {smsRecipientEstimate} exceeds MMS cap — short
              link only.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export function confirmHighSegmentSms(bodySms: string): boolean {
  const seg = estimateSmsSegments(bodySms);
  if (smsSegmentWarningLevel(seg.segments) !== "hard") return true;
  return window.confirm(
    `This SMS is ${seg.segments} segments (${seg.encoding}). Continue and accept higher SMS cost?`,
  );
}

export function confirmMmsAudience(count: number): boolean {
  if (count <= BROADCAST_MMS_MAX_RECIPIENTS) return true;
  window.alert(
    `MMS is limited to ${BROADCAST_MMS_MAX_RECIPIENTS} recipients. Remove the MMS attachment or shrink the audience.`,
  );
  return false;
}
