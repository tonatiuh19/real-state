import React from "react";
import { Smartphone, Users, Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface GroupSourcePillProps {
  creationSource?: "encore" | "phone_synced";
  channel?: "sms" | "whatsapp" | "internal";
  className?: string;
}

export function GroupSourcePill({
  creationSource,
  channel,
  className,
}: GroupSourcePillProps) {
  if (channel === "internal") {
    return (
      <Badge
        variant="outline"
        className={cn(
          "text-[10px] py-0 px-1.5 gap-1 font-normal border-amber-200 bg-amber-50 text-amber-800",
          className,
        )}
      >
        <Lock className="h-2.5 w-2.5" />
        Internal
      </Badge>
    );
  }

  if (creationSource === "phone_synced") {
    return (
      <Badge
        variant="outline"
        className={cn(
          "text-[10px] py-0 px-1.5 gap-1 font-normal border-blue-200 bg-blue-50 text-blue-800",
          className,
        )}
      >
        <Smartphone className="h-2.5 w-2.5" />
        Synced from phone
      </Badge>
    );
  }

  return (
    <Badge
      variant="outline"
      className={cn(
        "text-[10px] py-0 px-1.5 gap-1 font-normal",
        className,
      )}
    >
      <Users className="h-2.5 w-2.5" />
      Group
    </Badge>
  );
}

export default GroupSourcePill;
