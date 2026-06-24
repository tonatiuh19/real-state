import React from "react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

interface ParticipantAvatarStackProps {
  names: string[];
  max?: number;
  size?: "sm" | "md";
  className?: string;
}

export function ParticipantAvatarStack({
  names,
  max = 3,
  size = "sm",
  className,
}: ParticipantAvatarStackProps) {
  const shown = names.slice(0, max);
  const overflow = names.length - shown.length;
  const dim = size === "sm" ? "h-9 w-9 text-[10px]" : "h-10 w-10 text-xs";

  if (!names.length) {
    return (
      <Avatar className={cn(dim, className)}>
        <AvatarFallback className="bg-secondary">?</AvatarFallback>
      </Avatar>
    );
  }

  return (
    <div className={cn("flex items-center -space-x-2", className)}>
      {shown.map((name, i) => (
        <Avatar
          key={`${name}-${i}`}
          className={cn(dim, "ring-2 ring-card")}
          style={{ zIndex: max - i }}
        >
          <AvatarFallback
            className={cn(
              "font-semibold",
              i === 0 ? "bg-primary/15 text-primary" : "bg-secondary",
            )}
          >
            {initials(name)}
          </AvatarFallback>
        </Avatar>
      ))}
      {overflow > 0 && (
        <div
          className={cn(
            dim,
            "rounded-full bg-muted flex items-center justify-center ring-2 ring-card font-semibold text-muted-foreground",
          )}
          style={{ zIndex: 0 }}
        >
          +{overflow}
        </div>
      )}
    </div>
  );
}

export default ParticipantAvatarStack;
