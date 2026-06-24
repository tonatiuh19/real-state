import React, { useState } from "react";
import { Pencil, Users, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import type { ConversationThread, GroupParticipant } from "@shared/api";
import ParticipantAvatarStack from "@/components/conversations/ParticipantAvatarStack";
import GroupSourcePill from "@/components/conversations/GroupSourcePill";
import { cn } from "@/lib/utils";

interface GroupThreadHeaderProps {
  thread: ConversationThread;
  participants: GroupParticipant[];
  onRename: (title: string) => void;
  isRenaming?: boolean;
  className?: string;
}

export function GroupThreadHeader({
  thread,
  participants,
  onRename,
  isRenaming = false,
  className,
}: GroupThreadHeaderProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(
    thread.title || thread.display_title || "",
  );
  const [open, setOpen] = useState(false);

  const displayTitle =
    thread.display_title || thread.title || thread.client_name || "Group";

  const names =
    participants.length > 0
      ? participants.map((p) => p.display_name)
      : (thread.participants_preview?.map((p) => p.name) ?? []);

  const submitRename = () => {
    const t = draft.trim();
    if (t && t !== thread.title) onRename(t);
    setEditing(false);
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-start gap-3 min-w-0">
        <ParticipantAvatarStack names={names} />
        <div className="flex-1 min-w-0">
          {editing ? (
            <div className="flex items-center gap-2">
              <Input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                className="h-8 text-sm"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") submitRename();
                  if (e.key === "Escape") setEditing(false);
                }}
              />
              <Button size="sm" className="h-8" onClick={submitRename} disabled={isRenaming}>
                Save
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 min-w-0">
              <p className="font-semibold text-sm truncate">{displayTitle}</p>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0"
                onClick={() => {
                  setDraft(thread.title || displayTitle);
                  setEditing(true);
                }}
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <GroupSourcePill
              creationSource={thread.creation_source}
              channel={thread.channel}
            />
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Users className="h-3 w-3" />
              {thread.participant_count ?? participants.length} people
            </span>
            {thread.application_id ? (
              <Badge variant="secondary" className="text-[10px] py-0">
                Loan linked
              </Badge>
            ) : null}
          </div>
        </div>
      </div>

      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 px-2">
            {open ? (
              <ChevronUp className="h-3 w-3" />
            ) : (
              <ChevronDown className="h-3 w-3" />
            )}
            Participants
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="animate-in slide-in-from-top-1 duration-200">
          <div className="flex flex-wrap gap-1.5 pt-1">
            {participants.map((p) => (
              <Badge
                key={p.id}
                variant="outline"
                className="text-xs font-normal py-1 px-2"
              >
                {p.display_name}
                {p.phone_e164 ? (
                  <span className="text-muted-foreground ml-1">
                    · {p.phone_e164.replace(/^\+1/, "")}
                  </span>
                ) : null}
                <span className="text-muted-foreground ml-1 capitalize">
                  · {p.participant_type.replace("_", " ")}
                </span>
              </Badge>
            ))}
          </div>
          {thread.channel === "sms" ? (
            <p className="text-[11px] text-muted-foreground pt-2 leading-relaxed">
              SMS groups are unified here in Encore — everyone sees one thread.
              On each person&apos;s phone they still get a normal 1:1 text from
              your business line (not an iMessage/WhatsApp-style group). Replies
              to that number are merged into this thread automatically.
            </p>
          ) : null}
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

export default GroupThreadHeader;
