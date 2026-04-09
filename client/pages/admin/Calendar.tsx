import React, { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CalendarDays,
  Clock,
  Phone,
  Video,
  Plus,
  Settings2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  AlertCircle,
  User,
  UserPlus,
  Loader2,
  Edit2,
  Trash2,
  List,
  Copy,
  ExternalLink,
  Save,
  Cake,
  Home,
  Star,
  Bell,
  Heart,
  Sparkles,
  ListFilter,
  LayoutGrid,
  Search,
  ChevronsUpDown,
  Check,
  X,
} from "lucide-react";
import {
  format,
  parseISO,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  isToday,
  isSameDay,
  isSameMonth,
  addMonths,
  subMonths,
} from "date-fns";
import { MetaHelmet } from "@/components/MetaHelmet";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
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
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchSchedulerSettings,
  updateSchedulerSettings,
  fetchScheduledMeetings,
  updateScheduledMeeting,
  createScheduledMeeting,
  clearError as clearSchedulerError,
} from "@/store/slices/schedulerSlice";
import {
  fetchCalendarEvents,
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
} from "@/store/slices/calendarEventsSlice";
import { fetchBrokers } from "@/store/slices/brokersSlice";
import { fetchClients, createClient } from "@/store/slices/clientsSlice";
import type {
  ScheduledMeeting,
  SchedulerAvailability,
  MeetingStatus,
  MeetingType,
  CalendarEvent,
  CalendarEventType,
  CreateCalendarEventRequest,
} from "@shared/api";
import { useFormik } from "formik";
import * as Yup from "yup";

// ─── Constants ────────────────────────────────────────────────────────────────

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
const DAY_SHORT = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

const TIMEZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Phoenix",
  "America/Anchorage",
  "Pacific/Honolulu",
];

const STATUS_CONFIG: Record<
  MeetingStatus,
  { label: string; color: string; icon: React.FC<{ className?: string }> }
> = {
  pending: {
    label: "Pending",
    color: "bg-yellow-500/15 text-yellow-300 border-yellow-500/30",
    icon: Clock,
  },
  confirmed: {
    label: "Confirmed",
    color: "bg-green-500/15 text-green-300 border-green-500/30",
    icon: CheckCircle2,
  },
  cancelled: {
    label: "Cancelled",
    color: "bg-red-500/15 text-red-300 border-red-500/30",
    icon: XCircle,
  },
  completed: {
    label: "Completed",
    color: "bg-blue-500/15 text-blue-300 border-blue-500/30",
    icon: CheckCircle2,
  },
  no_show: {
    label: "No Show",
    color: "bg-slate-500/15 text-foreground/80 border-slate-500/30",
    icon: AlertCircle,
  },
};

export const EVENT_TYPE_CONFIG: Record<
  CalendarEventType,
  {
    label: string;
    color: string;
    dotColor: string;
    icon: React.FC<{ className?: string }>;
  }
> = {
  birthday: {
    label: "Birthday",
    color: "bg-pink-500/15 text-pink-300 border-pink-500/30",
    dotColor: "bg-pink-400",
    icon: Cake,
  },
  home_anniversary: {
    label: "Home Anniversary",
    color: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    dotColor: "bg-amber-400",
    icon: Home,
  },
  realtor_anniversary: {
    label: "Realtor Anniversary",
    color: "bg-violet-500/15 text-violet-300 border-violet-500/30",
    dotColor: "bg-violet-400",
    icon: Star,
  },
  important_date: {
    label: "Important Date",
    color: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
    dotColor: "bg-cyan-400",
    icon: Sparkles,
  },
  reminder: {
    label: "Reminder",
    color: "bg-orange-500/15 text-orange-300 border-orange-500/30",
    dotColor: "bg-orange-400",
    icon: Bell,
  },
  other: {
    label: "Other",
    color: "bg-slate-500/15 text-slate-300 border-slate-500/30",
    dotColor: "bg-slate-400",
    icon: Heart,
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(t: string): string {
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${ampm}`;
}

function formatDate(dateStr: string): string {
  try {
    return format(parseISO(dateStr), "EEE, MMM d, yyyy");
  } catch {
    return dateStr;
  }
}

function defaultAvailability(): SchedulerAvailability[] {
  return [0, 1, 2, 3, 4, 5, 6].map((d) => ({
    id: d,
    broker_id: 0,
    day_of_week: d,
    start_time: "09:00:00",
    end_time: "17:00:00",
    is_active: d >= 1 && d <= 5,
  }));
}

// ─── Unified calendar day type ────────────────────────────────────────────────

type DayItem =
  | { kind: "meeting"; data: ScheduledMeeting }
  | { kind: "event"; data: CalendarEvent };

// ─── Client Picker ────────────────────────────────────────────────────────────

export type ClientPickerMode = "existing" | "new" | "none";

export interface NewClientFields {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
}

export interface ClientPickerValue {
  mode: ClientPickerMode;
  existingClientId?: number;
  newClient?: NewClientFields;
}

const EMPTY_NEW_CLIENT: NewClientFields = {
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
};

function ClientPicker({
  value,
  onChange,
  optional = false,
}: {
  value: ClientPickerValue;
  onChange: (v: ClientPickerValue) => void;
  optional?: boolean;
}) {
  const { clients, isLoading: clientsLoading } = useAppSelector(
    (s) => s.clients,
  );
  const [comboOpen, setComboOpen] = useState(false);
  const [search, setSearch] = useState("");

  const selectedClient =
    clients.find((c) => c.id === value.existingClientId) ?? null;

  const filteredClients = clients.filter((c) => {
    const q = search.toLowerCase();
    if (!q) return true;
    return (
      c.first_name.toLowerCase().includes(q) ||
      c.last_name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      (c.phone ?? "").includes(q)
    );
  });

  const cards = [
    {
      key: "existing" as const,
      label: "Existing Client",
      desc: "Pick from your list",
      icon: <User className="h-4 w-4" />,
    },
    {
      key: "new" as const,
      label: "New Client",
      desc: "Create a profile",
      icon: <UserPlus className="h-4 w-4" />,
    },
    ...(optional
      ? [
          {
            key: "none" as const,
            label: "No Client",
            desc: "Skip or use name only",
            icon: <X className="h-4 w-4" />,
          },
        ]
      : []),
  ];

  return (
    <div className="space-y-3">
      <div
        className={cn("grid gap-2", optional ? "grid-cols-3" : "grid-cols-2")}
      >
        {cards.map(({ key, label, desc, icon }) => (
          <button
            key={key}
            type="button"
            onClick={() =>
              onChange({ ...value, mode: key, existingClientId: undefined })
            }
            className={cn(
              "flex flex-col items-center gap-1.5 p-3 rounded-xl border text-center transition-all",
              value.mode === key
                ? "border-primary bg-primary/10 text-foreground"
                : "border-border bg-muted/40 text-muted-foreground hover:bg-muted/60",
            )}
          >
            <span
              className={cn(
                "p-1.5 rounded-lg",
                value.mode === key
                  ? "bg-primary/20 text-primary"
                  : "bg-muted text-muted-foreground",
              )}
            >
              {icon}
            </span>
            <span className="text-xs font-semibold">{label}</span>
            <span className="text-[10px] opacity-70 leading-tight">{desc}</span>
          </button>
        ))}
      </div>

      {value.mode === "existing" && (
        <Popover open={comboOpen} onOpenChange={setComboOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className={cn(
                "w-full flex items-center justify-between gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2.5 text-sm transition-colors hover:bg-muted/60 focus:outline-none focus:ring-2 focus:ring-primary/30",
                !selectedClient && "text-muted-foreground",
              )}
            >
              {selectedClient ? (
                <span className="flex items-center gap-2 min-w-0">
                  <span className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-bold shrink-0">
                    {selectedClient.first_name[0]}
                    {selectedClient.last_name[0]}
                  </span>
                  <span className="font-medium truncate">
                    {selectedClient.first_name} {selectedClient.last_name}
                  </span>
                  <span className="text-muted-foreground truncate text-xs">
                    &mdash; {selectedClient.email}
                  </span>
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Search className="h-4 w-4" />
                  Search by name, email or phone…
                </span>
              )}
              <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
            </button>
          </PopoverTrigger>
          <PopoverContent
            className="w-[--radix-popover-trigger-width] p-0"
            align="start"
            sideOffset={4}
          >
            <Command shouldFilter={false}>
              <CommandInput
                placeholder="Search client…"
                value={search}
                onValueChange={setSearch}
              />
              <CommandList className="max-h-60">
                {clientsLoading ? (
                  <div className="flex items-center justify-center py-6 gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" /> Loading…
                  </div>
                ) : (
                  <>
                    <CommandEmpty>No clients found.</CommandEmpty>
                    <CommandGroup>
                      {filteredClients.map((c) => (
                        <CommandItem
                          key={c.id}
                          value={String(c.id)}
                          onSelect={() => {
                            onChange({
                              ...value,
                              mode: "existing",
                              existingClientId: c.id,
                            });
                            setComboOpen(false);
                            setSearch("");
                          }}
                          className="flex items-center gap-3 cursor-pointer"
                        >
                          <span className="h-7 w-7 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[11px] font-bold shrink-0">
                            {c.first_name[0]}
                            {c.last_name[0]}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm">
                              {c.first_name} {c.last_name}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {c.email}
                            </p>
                          </div>
                          <Check
                            className={cn(
                              "h-4 w-4 text-primary shrink-0",
                              value.existingClientId === c.id
                                ? "opacity-100"
                                : "opacity-0",
                            )}
                          />
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      )}

      {value.mode === "new" && (
        <div className="rounded-xl border border-border/50 bg-muted/20 p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-foreground/70 text-xs mb-1 block">
                First Name *
              </Label>
              <Input
                value={value.newClient?.first_name ?? ""}
                onChange={(e) =>
                  onChange({
                    ...value,
                    newClient: {
                      ...EMPTY_NEW_CLIENT,
                      ...value.newClient,
                      first_name: e.target.value,
                    },
                  })
                }
                placeholder="Maria"
                className="bg-muted/40 border-border text-foreground placeholder:text-muted-foreground h-9 text-sm"
              />
            </div>
            <div>
              <Label className="text-foreground/70 text-xs mb-1 block">
                Last Name *
              </Label>
              <Input
                value={value.newClient?.last_name ?? ""}
                onChange={(e) =>
                  onChange({
                    ...value,
                    newClient: {
                      ...EMPTY_NEW_CLIENT,
                      ...value.newClient,
                      last_name: e.target.value,
                    },
                  })
                }
                placeholder="Lopez"
                className="bg-muted/40 border-border text-foreground placeholder:text-muted-foreground h-9 text-sm"
              />
            </div>
          </div>
          <div>
            <Label className="text-foreground/70 text-xs mb-1 block">
              Email *
            </Label>
            <Input
              value={value.newClient?.email ?? ""}
              onChange={(e) =>
                onChange({
                  ...value,
                  newClient: {
                    ...EMPTY_NEW_CLIENT,
                    ...value.newClient,
                    email: e.target.value,
                  },
                })
              }
              type="email"
              placeholder="maria@example.com"
              className="bg-muted/40 border-border text-foreground placeholder:text-muted-foreground h-9 text-sm"
            />
          </div>
          <div>
            <Label className="text-foreground/70 text-xs mb-1 block">
              Phone
            </Label>
            <Input
              value={value.newClient?.phone ?? ""}
              onChange={(e) =>
                onChange({
                  ...value,
                  newClient: {
                    ...EMPTY_NEW_CLIENT,
                    ...value.newClient,
                    phone: e.target.value,
                  },
                })
              }
              placeholder="(555) 000-0000"
              className="bg-muted/40 border-border text-foreground placeholder:text-muted-foreground h-9 text-sm"
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Meeting Card ─────────────────────────────────────────────────────────────

function MeetingCard({
  meeting,
  onEdit,
}: {
  meeting: ScheduledMeeting;
  onEdit: (m: ScheduledMeeting) => void;
}) {
  const cfg = STATUS_CONFIG[meeting.status];
  const Icon = cfg.icon;
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-border/50 bg-muted/30 p-4 hover:border-border transition-all group"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span
              className={cn(
                "inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border",
                cfg.color,
              )}
            >
              <Icon className="h-3 w-3" />
              {cfg.label}
            </span>
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted/40 rounded-full px-2 py-0.5 border border-border/50">
              {meeting.meeting_type === "phone" ? (
                <>
                  <Phone className="h-3 w-3" /> Phone
                </>
              ) : (
                <>
                  <Video className="h-3 w-3" /> Video
                </>
              )}
            </span>
          </div>
          <h4 className="font-semibold text-foreground truncate">
            {meeting.client_name}
          </h4>
          <p className="text-xs text-muted-foreground truncate">
            {meeting.client_email}
          </p>
          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <CalendarDays className="h-3 w-3 text-primary" />
              {formatDate(meeting.meeting_date)}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3 text-primary" />
              {formatTime(meeting.meeting_time)}
            </span>
          </div>
          {meeting.notes && (
            <p className="text-xs text-muted-foreground mt-2 line-clamp-1 italic">
              "{meeting.notes}"
            </p>
          )}
        </div>
        <button
          onClick={() => onEdit(meeting)}
          className="shrink-0 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all opacity-0 group-hover:opacity-100"
        >
          <Edit2 className="h-4 w-4" />
        </button>
      </div>
    </motion.div>
  );
}

// ─── Event Card ───────────────────────────────────────────────────────────────

function EventCard({
  event,
  onEdit,
  onDelete,
}: {
  event: CalendarEvent;
  onEdit: (e: CalendarEvent) => void;
  onDelete: (e: CalendarEvent) => void;
}) {
  const cfg = EVENT_TYPE_CONFIG[event.event_type];
  const Icon = cfg.icon;
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-border/50 bg-muted/30 p-4 hover:border-border transition-all group"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span
              className={cn(
                "inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border",
                cfg.color,
              )}
            >
              <Icon className="h-3 w-3" />
              {cfg.label}
            </span>
            {event.recurrence === "yearly" && (
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted/40 rounded-full px-2 py-0.5 border border-border/50">
                <RefreshCw className="h-3 w-3" /> Yearly
              </span>
            )}
          </div>
          <h4 className="font-semibold text-foreground truncate">
            {event.title}
          </h4>
          {(event.linked_client_name || event.linked_person_name) && (
            <p className="text-xs text-muted-foreground truncate flex items-center gap-1 mt-0.5">
              <User className="h-3 w-3" />
              {event.linked_client_name || event.linked_person_name}
            </p>
          )}
          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <CalendarDays className="h-3 w-3 text-primary" />
              {formatDate(event.event_date)}
            </span>
            {!event.all_day && event.event_time && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3 text-primary" />
                {formatTime(event.event_time)}
              </span>
            )}
          </div>
          {event.description && (
            <p className="text-xs text-muted-foreground mt-2 line-clamp-1 italic">
              "{event.description}"
            </p>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-all">
          <button
            onClick={() => onEdit(event)}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
          >
            <Edit2 className="h-4 w-4" />
          </button>
          <button
            onClick={() => onDelete(event)}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-all"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Unified Calendar View ────────────────────────────────────────────────────

function UnifiedCalendarView({
  meetings,
  events,
  onEditMeeting,
  onEditEvent,
}: {
  meetings: ScheduledMeeting[];
  events: CalendarEvent[];
  onEditMeeting: (m: ScheduledMeeting) => void;
  onEditEvent: (e: CalendarEvent) => void;
}) {
  const [viewDate, setViewDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  const monthStart = startOfMonth(viewDate);
  const monthEnd = endOfMonth(viewDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const firstDayOffset = getDay(monthStart);
  const emptyBefore = Array(firstDayOffset).fill(null);

  // Index meetings by date
  const meetingsByDate = meetings.reduce<Record<string, ScheduledMeeting[]>>(
    (acc, m) => {
      const key = m.meeting_date.split("T")[0];
      acc[key] = acc[key] || [];
      acc[key].push(m);
      return acc;
    },
    {},
  );

  // Index events by date — for yearly recurrence, also show them in the current year
  const eventsByDate = events.reduce<Record<string, CalendarEvent[]>>(
    (acc, e) => {
      let key = e.event_date.split("T")[0];
      if (e.recurrence === "yearly") {
        const base = parseISO(key);
        const thisYear = viewDate.getFullYear();
        key = `${thisYear}-${String(base.getMonth() + 1).padStart(2, "0")}-${String(base.getDate()).padStart(2, "0")}`;
      }
      acc[key] = acc[key] || [];
      acc[key].push(e);
      return acc;
    },
    {},
  );

  const selectedKey = selectedDay ? format(selectedDay, "yyyy-MM-dd") : null;
  const selectedMeetings = selectedKey
    ? (meetingsByDate[selectedKey] ?? [])
    : [];
  const selectedEvents = selectedKey ? (eventsByDate[selectedKey] ?? []) : [];

  return (
    <div className="space-y-4">
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-2">
        <button
          onClick={() => setViewDate((d) => subMonths(d, 1))}
          className="p-2 rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <h3 className="font-semibold text-foreground text-base">
          {format(viewDate, "MMMM yyyy")}
        </h3>
        <button
          onClick={() => setViewDate((d) => addMonths(d, 1))}
          className="p-2 rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Day-of-week headers */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {DAY_SHORT.map((d) => (
          <div
            key={d}
            className="text-center text-xs font-semibold text-muted-foreground py-1"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {emptyBefore.map((_, i) => (
          <div key={`empty-${i}`} />
        ))}
        {days.map((day) => {
          const key = format(day, "yyyy-MM-dd");
          const dayMeetings = meetingsByDate[key] ?? [];
          const dayEvents = eventsByDate[key] ?? [];
          const hasItems = dayMeetings.length > 0 || dayEvents.length > 0;
          const isSelected = selectedDay ? isSameDay(day, selectedDay) : false;
          const todayFlag = isToday(day);

          return (
            <button
              key={key}
              onClick={() =>
                setSelectedDay(
                  isSameDay(day, selectedDay ?? new Date(0)) ? null : day,
                )
              }
              className={cn(
                "min-h-[52px] rounded-lg p-1.5 flex flex-col items-center gap-0.5 transition-all border text-sm",
                isSelected
                  ? "border-primary bg-primary/10"
                  : todayFlag
                    ? "border-primary/40 bg-primary/5"
                    : "border-transparent hover:border-border hover:bg-muted/30",
                !isSameMonth(day, viewDate) && "opacity-40",
              )}
            >
              <span
                className={cn(
                  "w-6 h-6 flex items-center justify-center rounded-full text-xs font-medium",
                  todayFlag &&
                    !isSelected &&
                    "bg-primary text-primary-foreground",
                  isSelected && "bg-primary text-primary-foreground",
                )}
              >
                {format(day, "d")}
              </span>
              {hasItems && (
                <div className="flex flex-wrap gap-0.5 justify-center max-w-full">
                  {dayMeetings.slice(0, 2).map((m) => (
                    <span
                      key={`m-${m.id}`}
                      className="w-1.5 h-1.5 rounded-full bg-primary"
                    />
                  ))}
                  {dayEvents.slice(0, 3).map((e) => (
                    <span
                      key={`e-${e.id}`}
                      className={cn(
                        "w-1.5 h-1.5 rounded-full",
                        EVENT_TYPE_CONFIG[e.event_type].dotColor,
                      )}
                    />
                  ))}
                  {dayMeetings.length + dayEvents.length > 5 && (
                    <span className="text-[9px] text-muted-foreground leading-none ml-0.5">
                      +{dayMeetings.length + dayEvents.length - 5}
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-border/30">
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <span className="w-2 h-2 rounded-full bg-primary" /> Meeting
        </span>
        {(
          Object.entries(EVENT_TYPE_CONFIG) as [
            CalendarEventType,
            (typeof EVENT_TYPE_CONFIG)[CalendarEventType],
          ][]
        ).map(([type, cfg]) => (
          <span
            key={type}
            className="flex items-center gap-1 text-xs text-muted-foreground"
          >
            <span className={cn("w-2 h-2 rounded-full", cfg.dotColor)} />{" "}
            {cfg.label}
          </span>
        ))}
      </div>

      {/* Selected day detail */}
      <AnimatePresence>
        {selectedDay &&
          (selectedMeetings.length > 0 || selectedEvents.length > 0) && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="mt-4 rounded-xl border border-border/50 bg-muted/20 p-4 space-y-3"
            >
              <h4 className="font-semibold text-foreground text-sm">
                {format(selectedDay, "EEEE, MMMM d")}
              </h4>
              {selectedMeetings.map((m) => (
                <div
                  key={`m-${m.id}`}
                  onClick={() => onEditMeeting(m)}
                  className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 cursor-pointer border border-border/30 transition-all"
                >
                  <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {m.client_name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatTime(m.meeting_time)} ·{" "}
                      {m.meeting_type === "phone" ? "Phone" : "Video"}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "text-xs px-2 py-0.5 rounded-full border font-semibold",
                      STATUS_CONFIG[m.status].color,
                    )}
                  >
                    {STATUS_CONFIG[m.status].label}
                  </span>
                </div>
              ))}
              {selectedEvents.map((e) => {
                const cfg = EVENT_TYPE_CONFIG[e.event_type];
                const Icon = cfg.icon;
                return (
                  <div
                    key={`e-${e.id}`}
                    onClick={() => onEditEvent(e)}
                    className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 cursor-pointer border border-border/30 transition-all"
                  >
                    <span
                      className={cn(
                        "w-2 h-2 rounded-full shrink-0",
                        cfg.dotColor,
                      )}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {e.title}
                      </p>
                      {(e.linked_client_name || e.linked_person_name) && (
                        <p className="text-xs text-muted-foreground truncate">
                          {e.linked_client_name || e.linked_person_name}
                        </p>
                      )}
                    </div>
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-semibold",
                        cfg.color,
                      )}
                    >
                      <Icon className="h-3 w-3" />
                      {cfg.label}
                    </span>
                  </div>
                );
              })}
            </motion.div>
          )}
      </AnimatePresence>

      {selectedDay &&
        selectedMeetings.length === 0 &&
        selectedEvents.length === 0 && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center text-sm text-muted-foreground py-4"
          >
            No events on {format(selectedDay, "MMMM d")}
          </motion.p>
        )}
    </div>
  );
}

// ─── Edit Meeting Dialog ──────────────────────────────────────────────────────

function EditMeetingDialog({
  meeting,
  open,
  onClose,
  onSave,
  isUpdating,
}: {
  meeting: ScheduledMeeting | null;
  open: boolean;
  onClose: () => void;
  onSave: (id: number, updates: any) => void;
  isUpdating: boolean;
}) {
  const [status, setStatus] = useState<MeetingStatus>("confirmed");
  const [meetingType, setMeetingType] = useState<MeetingType>("phone");
  const [brokerNotes, setBrokerNotes] = useState("");
  const [cancelReason, setCancelReason] = useState("");

  useEffect(() => {
    if (meeting) {
      setStatus(meeting.status);
      setMeetingType(meeting.meeting_type);
      setBrokerNotes(meeting.broker_notes ?? "");
      setCancelReason(meeting.cancelled_reason ?? "");
    }
  }, [meeting]);

  const handleSave = () => {
    if (!meeting) return;
    onSave(meeting.id, {
      status,
      meeting_type: meetingType,
      broker_notes: brokerNotes || undefined,
      ...(status === "cancelled"
        ? { cancelled_reason: cancelReason, cancelled_by: "broker" }
        : {}),
    });
  };

  if (!meeting) return null;
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-popover border-border text-foreground max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-foreground">Edit Meeting</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="rounded-lg bg-muted/30 p-3 border border-border/50">
            <p className="font-semibold text-foreground">
              {meeting.client_name}
            </p>
            <p className="text-xs text-muted-foreground">
              {meeting.client_email}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {formatDate(meeting.meeting_date)} at{" "}
              {formatTime(meeting.meeting_time)}
            </p>
          </div>
          <div>
            <Label className="text-foreground/80 text-sm mb-1.5 block">
              Status
            </Label>
            <Select
              value={status}
              onValueChange={(v) => setStatus(v as MeetingStatus)}
            >
              <SelectTrigger className="bg-muted/40 border-border text-foreground">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                {(Object.keys(STATUS_CONFIG) as MeetingStatus[]).map((s) => (
                  <SelectItem
                    key={s}
                    value={s}
                    className="text-foreground focus:bg-muted/50"
                  >
                    {STATUS_CONFIG[s].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-foreground/80 text-sm mb-1.5 block">
              Meeting Type
            </Label>
            <div className="grid grid-cols-2 gap-2">
              {(["phone", "video"] as MeetingType[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setMeetingType(t)}
                  className={cn(
                    "flex items-center gap-2 p-3 rounded-xl border transition-all text-sm font-medium",
                    meetingType === t
                      ? "border-primary bg-primary/15 text-foreground"
                      : "border-border bg-muted/40 text-muted-foreground hover:border-border",
                  )}
                >
                  {t === "phone" ? (
                    <Phone className="h-4 w-4" />
                  ) : (
                    <Video className="h-4 w-4" />
                  )}
                  {t === "phone" ? "Phone" : "Video"}
                </button>
              ))}
            </div>
          </div>
          {status === "cancelled" && (
            <div>
              <Label className="text-foreground/80 text-sm mb-1.5 block">
                Cancellation Reason
              </Label>
              <Textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Optional reason…"
                className="bg-muted/40 border-border text-foreground resize-none"
                rows={2}
              />
            </div>
          )}
          <div>
            <Label className="text-foreground/80 text-sm mb-1.5 block">
              Private Notes
            </Label>
            <Textarea
              value={brokerNotes}
              onChange={(e) => setBrokerNotes(e.target.value)}
              placeholder="Internal notes (not shown to client)…"
              className="bg-muted/40 border-border text-foreground resize-none"
              rows={2}
            />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button
            variant="ghost"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isUpdating}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {isUpdating ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Event Form Dialog ────────────────────────────────────────────────────────

const eventSchema = Yup.object({
  event_type: Yup.string().required("Type required"),
  title: Yup.string().min(2, "Too short").required("Title required"),
  event_date: Yup.string().required("Date required"),
  description: Yup.string(),
  event_time: Yup.string(),
  all_day: Yup.boolean(),
  recurrence: Yup.string().oneOf(["none", "yearly"]),
  linked_person_name: Yup.string(),
});

function EventFormDialog({
  open,
  onClose,
  initial,
  onSubmit,
  isSaving,
}: {
  open: boolean;
  onClose: () => void;
  initial?: Partial<CalendarEvent>;
  onSubmit: (values: any) => void;
  isSaving: boolean;
}) {
  const dispatch = useAppDispatch();
  const isEdit = !!initial?.id;

  // Client picker state — derive initial mode from existing event
  const initialPickerMode: ClientPickerMode = initial?.linked_client_id
    ? "existing"
    : "none";
  const [clientPicker, setClientPicker] = useState<ClientPickerValue>({
    mode: initialPickerMode,
    existingClientId: initial?.linked_client_id ?? undefined,
  });
  const [isCreatingClient, setIsCreatingClient] = useState(false);
  const [createClientError, setCreateClientError] = useState<string | null>(
    null,
  );

  // Sync picker when dialog re-opens with a different event
  useEffect(() => {
    if (open) {
      setClientPicker({
        mode: (initial?.linked_client_id
          ? "existing"
          : "none") as ClientPickerMode,
        existingClientId: initial?.linked_client_id ?? undefined,
      });
      setCreateClientError(null);
    }
  }, [open, initial?.id]);

  // Fetch clients when dialog opens
  useEffect(() => {
    if (open) dispatch(fetchClients({}));
  }, [open, dispatch]);

  const formik = useFormik({
    initialValues: {
      event_type: initial?.event_type ?? ("birthday" as CalendarEventType),
      title: initial?.title ?? "",
      event_date: initial?.event_date?.split("T")[0] ?? "",
      description: initial?.description ?? "",
      event_time: initial?.event_time?.slice(0, 5) ?? "",
      all_day: initial?.all_day !== false,
      recurrence: initial?.recurrence ?? "none",
    },
    validationSchema: eventSchema,
    enableReinitialize: true,
    onSubmit: async (values) => {
      setCreateClientError(null);
      let linkedClientId: number | null = null;
      let linkedPersonName: string | undefined;

      if (clientPicker.mode === "existing" && clientPicker.existingClientId) {
        linkedClientId = clientPicker.existingClientId;
      } else if (clientPicker.mode === "new" && clientPicker.newClient) {
        const nc = clientPicker.newClient;
        if (!nc.first_name || !nc.last_name || !nc.email) {
          setCreateClientError("Please fill in the required client fields.");
          return;
        }
        setIsCreatingClient(true);
        try {
          const result = await dispatch(
            createClient({
              first_name: nc.first_name.trim(),
              last_name: nc.last_name.trim(),
              email: nc.email.trim(),
              phone: nc.phone.trim() || undefined,
            }),
          );
          if (createClient.rejected.match(result)) {
            setCreateClientError(
              (result.payload as string) || "Failed to create client",
            );
            return;
          }
          const created = result.payload as { id: number };
          linkedClientId = created.id;
          linkedPersonName = `${nc.first_name.trim()} ${nc.last_name.trim()}`;
        } finally {
          setIsCreatingClient(false);
        }
      }

      onSubmit({
        ...values,
        event_time: values.all_day ? undefined : values.event_time || undefined,
        linked_client_id: linkedClientId,
        linked_person_name: linkedPersonName || undefined,
        description: values.description || undefined,
      });
    },
  });

  const selectedTypeCfg =
    EVENT_TYPE_CONFIG[formik.values.event_type as CalendarEventType];
  const TypeIcon = selectedTypeCfg?.icon ?? Sparkles;

  // Auto-fill title for known types
  const autoFillTitle = (type: CalendarEventType) => {
    if (
      !formik.values.title ||
      formik.values.title ===
        autoTitleFor(formik.values.event_type as CalendarEventType)
    ) {
      formik.setFieldValue("title", autoTitleFor(type));
    }
    // set yearly recurrence for recurring types
    if (
      ["birthday", "home_anniversary", "realtor_anniversary"].includes(type)
    ) {
      formik.setFieldValue("recurrence", "yearly");
      formik.setFieldValue("all_day", true);
    } else {
      formik.setFieldValue("recurrence", "none");
    }
  };

  function autoTitleFor(type: CalendarEventType) {
    const map: Record<CalendarEventType, string> = {
      birthday: "Birthday",
      home_anniversary: "Home Purchase Anniversary",
      realtor_anniversary: "Realtor Anniversary",
      important_date: "Important Date",
      reminder: "Reminder",
      other: "",
    };
    return map[type];
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-popover border-border text-foreground max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-foreground flex items-center gap-2">
            <TypeIcon className="h-5 w-5 text-primary" />
            {isEdit ? "Edit Calendar Event" : "New Calendar Event"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={formik.handleSubmit} className="space-y-4">
          {/* Event type */}
          <div>
            <Label className="text-foreground/80 text-sm mb-2 block">
              Event Type *
            </Label>
            <div className="grid grid-cols-2 gap-2">
              {(
                Object.entries(EVENT_TYPE_CONFIG) as [
                  CalendarEventType,
                  (typeof EVENT_TYPE_CONFIG)[CalendarEventType],
                ][]
              ).map(([type, cfg]) => {
                const Icon = cfg.icon;
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => {
                      formik.setFieldValue("event_type", type);
                      autoFillTitle(type);
                    }}
                    className={cn(
                      "flex items-center gap-2 p-2.5 rounded-xl border transition-all text-sm font-medium text-left",
                      formik.values.event_type === type
                        ? cn("border-current", cfg.color)
                        : "border-border bg-muted/40 text-muted-foreground hover:border-border",
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {cfg.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Title */}
          <div>
            <Label className="text-foreground/80 text-sm mb-1 block">
              Title *
            </Label>
            <Input
              {...formik.getFieldProps("title")}
              placeholder="e.g. Maria's Birthday"
              className="bg-muted/40 border-border text-foreground placeholder:text-muted-foreground"
            />
            {formik.touched.title && formik.errors.title && (
              <p className="text-primary text-xs mt-1">{formik.errors.title}</p>
            )}
          </div>

          {/* Link to client */}
          <div>
            <Label className="text-foreground/80 text-sm mb-2 block">
              Linked Person (optional)
            </Label>
            <ClientPicker
              value={clientPicker}
              onChange={setClientPicker}
              optional
            />
          </div>

          {createClientError && (
            <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">
              {createClientError}
            </p>
          )}

          {/* Date */}
          <div>
            <Label className="text-foreground/80 text-sm mb-1 block">
              Date *
            </Label>
            <Input
              {...formik.getFieldProps("event_date")}
              type="date"
              className="bg-muted/40 border-border text-foreground"
            />
            {formik.touched.event_date && formik.errors.event_date && (
              <p className="text-primary text-xs mt-1">
                {formik.errors.event_date as string}
              </p>
            )}
          </div>

          {/* All-day toggle */}
          <div className="flex items-center gap-3">
            <Switch
              checked={formik.values.all_day}
              onCheckedChange={(v) => formik.setFieldValue("all_day", v)}
              className="data-[state=checked]:bg-primary"
            />
            <Label className="text-foreground/80 text-sm cursor-pointer">
              All day
            </Label>
          </div>

          {/* Time (only if not all-day) */}
          {!formik.values.all_day && (
            <div>
              <Label className="text-foreground/80 text-sm mb-1 block">
                Time
              </Label>
              <Input
                {...formik.getFieldProps("event_time")}
                type="time"
                className="bg-muted/40 border-border text-foreground"
              />
            </div>
          )}

          {/* Recurrence */}
          <div>
            <Label className="text-foreground/80 text-sm mb-1.5 block">
              Recurrence
            </Label>
            <div className="grid grid-cols-2 gap-2">
              {(["none", "yearly"] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => formik.setFieldValue("recurrence", r)}
                  className={cn(
                    "p-2.5 rounded-xl border transition-all text-sm font-medium",
                    formik.values.recurrence === r
                      ? "border-primary bg-primary/15 text-foreground"
                      : "border-border bg-muted/40 text-muted-foreground hover:border-border",
                  )}
                >
                  {r === "none" ? "One-time" : "Every Year"}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <Label className="text-foreground/80 text-sm mb-1 block">
              Notes (optional)
            </Label>
            <Textarea
              {...formik.getFieldProps("description")}
              placeholder="Any details…"
              className="bg-muted/40 border-border text-foreground placeholder:text-muted-foreground resize-none"
              rows={2}
            />
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSaving || isCreatingClient || !formik.isValid}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {isSaving || isCreatingClient ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {isCreatingClient
                ? "Creating client…"
                : isEdit
                  ? "Save Changes"
                  : "Create Event"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Create Meeting Dialog ────────────────────────────────────────────────────

const createMeetingSchema = Yup.object({
  meeting_date: Yup.string().required("Date required"),
  meeting_time: Yup.string().required("Time required"),
  meeting_type: Yup.string().oneOf(["phone", "video"]).required(),
  notes: Yup.string(),
});

function CreateMeetingDialog({
  open,
  onClose,
  onCreated,
  isCreating,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (values: any) => void;
  isCreating: boolean;
}) {
  const dispatch = useAppDispatch();
  const { clients } = useAppSelector((s) => s.clients);

  const [clientPicker, setClientPicker] = useState<ClientPickerValue>({
    mode: "existing",
  });
  const [isCreatingClient, setIsCreatingClient] = useState(false);
  const [createClientError, setCreateClientError] = useState<string | null>(
    null,
  );

  const formik = useFormik({
    initialValues: {
      meeting_date: "",
      meeting_time: "",
      meeting_type: "phone" as MeetingType,
      notes: "",
    },
    validationSchema: createMeetingSchema,
    onSubmit: async (values) => {
      setCreateClientError(null);
      let clientName = "";
      let clientEmail = "";
      let clientPhone: string | undefined;

      if (clientPicker.mode === "existing") {
        const c = clients.find((cl) => cl.id === clientPicker.existingClientId);
        if (!c) return;
        clientName = `${c.first_name} ${c.last_name}`;
        clientEmail = c.email;
        clientPhone = c.phone ?? undefined;
      } else if (clientPicker.mode === "new") {
        const nc = clientPicker.newClient;
        if (!nc?.first_name || !nc?.last_name || !nc?.email) return;
        setIsCreatingClient(true);
        try {
          const result = await dispatch(
            createClient({
              first_name: nc.first_name.trim(),
              last_name: nc.last_name.trim(),
              email: nc.email.trim(),
              phone: nc.phone.trim() || undefined,
            }),
          );
          if (createClient.rejected.match(result)) {
            setCreateClientError(
              (result.payload as string) || "Failed to create client",
            );
            return;
          }
          clientName = `${nc.first_name.trim()} ${nc.last_name.trim()}`;
          clientEmail = nc.email.trim();
          clientPhone = nc.phone.trim() || undefined;
        } finally {
          setIsCreatingClient(false);
        }
      }

      onCreated({
        ...values,
        client_name: clientName,
        client_email: clientEmail,
        client_phone: clientPhone,
        notes: values.notes || undefined,
      });
    },
    enableReinitialize: true,
  });

  useEffect(() => {
    if (!open) {
      formik.resetForm();
      setClientPicker({ mode: "existing" });
      setCreateClientError(null);
    }
  }, [open]);

  // Fetch clients when dialog opens
  useEffect(() => {
    if (open) dispatch(fetchClients({}));
  }, [open, dispatch]);

  const isClientReady =
    (clientPicker.mode === "existing" && !!clientPicker.existingClientId) ||
    (clientPicker.mode === "new" &&
      !!(
        clientPicker.newClient?.first_name &&
        clientPicker.newClient?.last_name &&
        clientPicker.newClient?.email
      ));

  const isBusy = isCreating || isCreatingClient;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-popover border-border text-foreground max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-foreground flex items-center gap-2">
            <Plus className="h-5 w-5 text-primary" /> New Meeting
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={formik.handleSubmit} className="space-y-5">
          {/* Client picker */}
          <div>
            <Label className="text-foreground/80 text-sm mb-2 block">
              Client *
            </Label>
            <ClientPicker value={clientPicker} onChange={setClientPicker} />
          </div>

          <Separator className="opacity-30" />

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-foreground/80 text-sm mb-1 block">
                Date *
              </Label>
              <Input
                {...formik.getFieldProps("meeting_date")}
                type="date"
                className="bg-muted/40 border-border text-foreground"
              />
              {formik.touched.meeting_date && formik.errors.meeting_date && (
                <p className="text-primary text-xs mt-1">
                  {formik.errors.meeting_date}
                </p>
              )}
            </div>
            <div>
              <Label className="text-foreground/80 text-sm mb-1 block">
                Time *
              </Label>
              <Input
                {...formik.getFieldProps("meeting_time")}
                type="time"
                className="bg-muted/40 border-border text-foreground"
              />
              {formik.touched.meeting_time && formik.errors.meeting_time && (
                <p className="text-primary text-xs mt-1">
                  {formik.errors.meeting_time}
                </p>
              )}
            </div>
          </div>

          {/* Meeting type */}
          <div>
            <Label className="text-foreground/80 text-sm mb-1.5 block">
              Method *
            </Label>
            <div className="grid grid-cols-2 gap-2">
              {(["phone", "video"] as MeetingType[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => formik.setFieldValue("meeting_type", t)}
                  className={cn(
                    "flex items-center gap-2 p-3 rounded-xl border transition-all text-sm font-medium",
                    formik.values.meeting_type === t
                      ? "border-primary bg-primary/15 text-foreground"
                      : "border-border bg-muted/40 text-muted-foreground hover:border-border",
                  )}
                >
                  {t === "phone" ? (
                    <Phone className="h-4 w-4" />
                  ) : (
                    <Video className="h-4 w-4" />
                  )}
                  {t === "phone" ? "Phone" : "Video"}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label className="text-foreground/80 text-sm mb-1 block">
              Notes
            </Label>
            <Textarea
              {...formik.getFieldProps("notes")}
              placeholder="Optional notes…"
              className="bg-muted/40 border-border text-foreground placeholder:text-muted-foreground resize-none"
              rows={2}
            />
          </div>

          {createClientError && (
            <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">
              {createClientError}
            </p>
          )}

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isBusy || !isClientReady || !formik.isValid}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {isBusy ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              {isCreatingClient ? "Creating client…" : "Create Meeting"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Settings Panel ───────────────────────────────────────────────────────────

function SettingsPanel() {
  const dispatch = useAppDispatch();
  const { settings, availability, isLoadingSettings, isSavingSettings } =
    useAppSelector((s) => s.scheduler);
  const { user: authUser } = useAppSelector((s) => s.brokerAuth);
  const { brokers } = useAppSelector((s) => s.brokers);
  const isAdmin = authUser?.role === "admin";
  const [localAvailability, setLocalAvailability] = useState<
    SchedulerAvailability[]
  >([]);
  const [saved, setSaved] = useState(false);
  const [copiedBrokerId, setCopiedBrokerId] = useState<number | null>(null);

  useEffect(() => {
    if (isAdmin && brokers.length === 0) dispatch(fetchBrokers({}));
  }, [isAdmin]); // eslint-disable-line

  useEffect(() => {
    setLocalAvailability(
      availability.length > 0 ? availability : defaultAvailability(),
    );
  }, [availability]);

  const formik = useFormik({
    initialValues: {
      is_enabled: settings?.is_enabled ?? true,
      meeting_title: settings?.meeting_title ?? "Mortgage Consultation",
      meeting_description: settings?.meeting_description ?? "",
      slot_duration_minutes: settings?.slot_duration_minutes ?? 30,
      buffer_time_minutes: settings?.buffer_time_minutes ?? 15,
      advance_booking_days: settings?.advance_booking_days ?? 30,
      min_booking_hours: settings?.min_booking_hours ?? 2,
      timezone: settings?.timezone ?? "America/Chicago",
      allow_phone: settings?.allow_phone ?? true,
      allow_video: settings?.allow_video ?? true,
    },
    enableReinitialize: true,
    onSubmit: async (values) => {
      await dispatch(
        updateSchedulerSettings({
          ...values,
          availability: localAvailability.map((a) => ({
            day_of_week: a.day_of_week,
            start_time: a.start_time,
            end_time: a.end_time,
            is_active: a.is_active,
          })),
        }),
      );
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      dispatch(fetchSchedulerSettings());
    },
  });

  const toggleDay = (d: number) =>
    setLocalAvailability((p) =>
      p.map((a) =>
        a.day_of_week === d ? { ...a, is_active: !a.is_active } : a,
      ),
    );
  const updateDayTime = (d: number, f: "start_time" | "end_time", v: string) =>
    setLocalAvailability((p) =>
      p.map((a) => (a.day_of_week === d ? { ...a, [f]: v + ":00" } : a)),
    );

  const handleCopyLink = (id: number, token: string | null | undefined) => {
    if (!token) return;
    navigator.clipboard.writeText(
      `${window.location.origin}/scheduler/${token}`,
    );
    setCopiedBrokerId(id);
    setTimeout(() => setCopiedBrokerId(null), 2000);
  };

  if (isLoadingSettings)
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );

  return (
    <form onSubmit={formik.handleSubmit} className="space-y-6 max-w-2xl">
      {/* Enable */}
      <div className="rounded-xl border border-border/50 bg-muted/30 p-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-foreground">Booking Status</h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              {formik.values.is_enabled
                ? "Clients can book via your scheduler link"
                : "Scheduler disabled — booking link shows an error"}
            </p>
          </div>
          <Switch
            checked={formik.values.is_enabled}
            onCheckedChange={(v) => formik.setFieldValue("is_enabled", v)}
            className="data-[state=checked]:bg-green-500"
          />
        </div>
      </div>

      {/* Meeting details */}
      <div className="rounded-xl border border-border/50 bg-muted/30 p-5 space-y-4">
        <h3 className="font-semibold text-foreground">Meeting Details</h3>
        <div>
          <Label className="text-foreground/80 text-sm mb-1.5 block">
            Meeting Title
          </Label>
          <Input
            {...formik.getFieldProps("meeting_title")}
            className="bg-muted/40 border-border text-foreground"
          />
        </div>
        <div>
          <Label className="text-foreground/80 text-sm mb-1.5 block">
            Description
          </Label>
          <Textarea
            {...formik.getFieldProps("meeting_description")}
            rows={3}
            className="bg-muted/40 border-border text-foreground resize-none"
            placeholder="Short description shown on the public booking page…"
          />
        </div>
      </div>

      {/* Scheduling rules */}
      <div className="rounded-xl border border-border/50 bg-muted/30 p-5 space-y-4">
        <h3 className="font-semibold text-foreground">Scheduling Rules</h3>
        <div className="grid grid-cols-2 gap-4">
          {[
            {
              label: "Slot Duration (min)",
              field: "slot_duration_minutes",
              min: 15,
              max: 120,
              step: 15,
            },
            {
              label: "Buffer Between (min)",
              field: "buffer_time_minutes",
              min: 0,
              max: 60,
              step: 5,
            },
            {
              label: "Advance Booking (days)",
              field: "advance_booking_days",
              min: 1,
              max: 90,
              step: 1,
            },
            {
              label: "Min Notice (hrs)",
              field: "min_booking_hours",
              min: 0,
              max: 72,
              step: 1,
            },
          ].map(({ label, field, min, max, step }) => (
            <div key={field}>
              <Label className="text-foreground/80 text-sm mb-1.5 block">
                {label}
              </Label>
              <Input
                type="number"
                min={min}
                max={max}
                step={step}
                {...formik.getFieldProps(field)}
                className="bg-muted/40 border-border text-foreground"
              />
            </div>
          ))}
        </div>
        <div>
          <Label className="text-foreground/80 text-sm mb-1.5 block">
            Timezone
          </Label>
          <Select
            value={formik.values.timezone}
            onValueChange={(v) => formik.setFieldValue("timezone", v)}
          >
            <SelectTrigger className="bg-muted/40 border-border text-foreground">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              {TIMEZONES.map((tz) => (
                <SelectItem
                  key={tz}
                  value={tz}
                  className="text-foreground focus:bg-muted/50"
                >
                  {tz}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Connection methods */}
      <div className="rounded-xl border border-border/50 bg-muted/30 p-5 space-y-3">
        <h3 className="font-semibold text-foreground mb-3">
          Connection Methods
        </h3>
        {[
          {
            key: "allow_phone",
            label: "Phone Call",
            sub: "Banker calls client at scheduled time",
            icon: <Phone className="h-4 w-4 text-sky-400" />,
          },
          {
            key: "allow_video",
            label: "Video Call (Zoom)",
            sub: "Creates a Zoom meeting automatically",
            icon: <Video className="h-4 w-4 text-blue-400" />,
          },
        ].map(({ key, label, sub, icon }, i) => (
          <div
            key={key}
            className={cn(
              "flex items-center justify-between py-2",
              i > 0 && "border-t border-border/30",
            )}
          >
            <div className="flex items-center gap-3">
              {icon}
              <div>
                <p className="text-foreground text-sm font-medium">{label}</p>
                <p className="text-xs text-muted-foreground">{sub}</p>
              </div>
            </div>
            <Switch
              checked={(formik.values as any)[key]}
              onCheckedChange={(v) => formik.setFieldValue(key, v)}
            />
          </div>
        ))}
      </div>

      {/* Availability */}
      <div className="rounded-xl border border-border/50 bg-muted/30 p-5">
        <h3 className="font-semibold text-foreground mb-4">
          Weekly Availability
        </h3>
        <div className="space-y-3">
          {localAvailability.map((av) => (
            <div key={av.day_of_week} className="flex items-center gap-3">
              <Switch
                checked={av.is_active}
                onCheckedChange={() => toggleDay(av.day_of_week)}
                className="data-[state=checked]:bg-primary shrink-0"
              />
              <span
                className={cn(
                  "w-24 text-sm font-medium",
                  av.is_active ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {DAY_NAMES[av.day_of_week]}
              </span>
              {av.is_active ? (
                <div className="flex items-center gap-2 flex-1">
                  <Input
                    type="time"
                    value={av.start_time.slice(0, 5)}
                    onChange={(e) =>
                      updateDayTime(
                        av.day_of_week,
                        "start_time",
                        e.target.value,
                      )
                    }
                    className="bg-muted/40 border-border text-foreground text-sm h-8 flex-1 max-w-[120px]"
                  />
                  <span className="text-muted-foreground text-sm">to</span>
                  <Input
                    type="time"
                    value={av.end_time.slice(0, 5)}
                    onChange={(e) =>
                      updateDayTime(av.day_of_week, "end_time", e.target.value)
                    }
                    className="bg-muted/40 border-border text-foreground text-sm h-8 flex-1 max-w-[120px]"
                  />
                </div>
              ) : (
                <span className="text-muted-foreground text-sm italic">
                  Unavailable
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      <Button
        type="submit"
        disabled={isSavingSettings}
        className="bg-primary hover:bg-primary/90 text-primary-foreground px-8"
      >
        {isSavingSettings ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin mr-2" /> Saving…
          </>
        ) : saved ? (
          <>
            <CheckCircle2 className="h-4 w-4 mr-2 text-green-400" /> Saved!
          </>
        ) : (
          <>
            <Save className="h-4 w-4 mr-2" /> Save Settings
          </>
        )}
      </Button>

      {/* Partner links — admin only */}
      {isAdmin && (
        <div className="mt-8 pt-6 border-t border-border/50">
          <h3 className="text-base font-semibold text-foreground mb-1 flex items-center gap-2">
            <User className="h-4 w-4 text-primary" /> Partner Booking Links
          </h3>
          <p className="text-muted-foreground text-sm mb-4">
            Copy personalised booking links for active brokers.
          </p>
          <div className="space-y-2">
            {brokers
              .filter((b) => b.status === "active")
              .map((b) => {
                const link = b.public_token
                  ? `${window.location.origin}/scheduler/${b.public_token}`
                  : null;
                const isCopied = copiedBrokerId === b.id;
                return (
                  <div
                    key={b.id}
                    className="flex items-center gap-3 rounded-lg border border-border/50 bg-muted/30 px-4 py-3"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">
                        {b.first_name} {b.last_name}{" "}
                        <span className="ml-2 text-xs text-muted-foreground capitalize">
                          {b.role}
                        </span>
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {link ?? "No public token"}
                      </p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      disabled={!link}
                      onClick={() => handleCopyLink(b.id, b.public_token)}
                      className={cn(
                        "shrink-0 text-xs",
                        isCopied
                          ? "text-green-400"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {isCopied ? (
                        <>
                          <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5 mr-1" /> Copy
                        </>
                      )}
                    </Button>
                    {link && (
                      <a href={link} target="_blank" rel="noopener noreferrer">
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="shrink-0 text-muted-foreground hover:text-foreground text-xs"
                        >
                          <ExternalLink className="h-3.5 w-3.5 mr-1" /> Preview
                        </Button>
                      </a>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </form>
  );
}

// ─── Main Admin Calendar Page ─────────────────────────────────────────────────

const AdminCalendar: React.FC = () => {
  const dispatch = useAppDispatch();

  const { meetings, isLoadingMeetings, isUpdatingMeeting, isCreatingMeeting } =
    useAppSelector((s) => s.scheduler);
  const {
    events,
    isLoading: isLoadingEvents,
    isCreating: isCreatingEvent,
    isUpdating: isUpdatingEvent,
    isDeleting: isDeletingEvent,
  } = useAppSelector((s) => s.calendarEvents);
  const { user } = useAppSelector((s) => s.brokerAuth);

  const [activeTab, setActiveTab] = useState("calendar");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [eventTypeFilter, setEventTypeFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [editingMeeting, setEditingMeeting] = useState<ScheduledMeeting | null>(
    null,
  );
  const [showCreateMeeting, setShowCreateMeeting] = useState(false);
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [deletingEvent, setDeletingEvent] = useState<CalendarEvent | null>(
    null,
  );
  const [search, setSearch] = useState("");
  const [urlCopied, setUrlCopied] = useState(false);

  useEffect(() => {
    dispatch(fetchSchedulerSettings());
    dispatch(fetchScheduledMeetings());
    dispatch(fetchCalendarEvents());
    dispatch(fetchClients({ page: 1, limit: 200 }));
  }, [dispatch]);

  const schedulerUrl = user?.public_token
    ? `${window.location.origin}/scheduler/${user.public_token}`
    : `${window.location.origin}/scheduler`;

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(schedulerUrl);
    setUrlCopied(true);
    setTimeout(() => setUrlCopied(false), 2000);
  };

  const handleUpdateMeeting = useCallback(
    async (id: number, updates: any) => {
      await dispatch(
        updateScheduledMeeting({ meetingId: id, payload: updates }),
      );
      setEditingMeeting(null);
      dispatch(fetchScheduledMeetings());
    },
    [dispatch],
  );

  const handleCreateMeeting = useCallback(
    async (values: any) => {
      await dispatch(createScheduledMeeting(values));
      setShowCreateMeeting(false);
      dispatch(fetchScheduledMeetings());
    },
    [dispatch],
  );

  const handleCreateEvent = useCallback(
    async (values: CreateCalendarEventRequest) => {
      await dispatch(createCalendarEvent(values));
      setShowCreateEvent(false);
    },
    [dispatch],
  );

  const handleUpdateEvent = useCallback(
    async (values: any) => {
      if (!editingEvent) return;
      await dispatch(
        updateCalendarEvent({ eventId: editingEvent.id, payload: values }),
      );
      setEditingEvent(null);
      dispatch(fetchCalendarEvents());
    },
    [dispatch, editingEvent],
  );

  const handleDeleteEvent = useCallback(async () => {
    if (!deletingEvent) return;
    await dispatch(deleteCalendarEvent(deletingEvent.id));
    setDeletingEvent(null);
  }, [dispatch, deletingEvent]);

  const filteredMeetings = meetings.filter((m) => {
    const matchStatus = statusFilter === "all" || m.status === statusFilter;
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      m.client_name.toLowerCase().includes(q) ||
      m.client_email.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  const filteredEvents = events.filter((e) => {
    const matchType =
      eventTypeFilter === "all" || e.event_type === eventTypeFilter;
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      e.title.toLowerCase().includes(q) ||
      (e.linked_client_name ?? "").toLowerCase().includes(q) ||
      (e.linked_person_name ?? "").toLowerCase().includes(q);
    return matchType && matchSearch;
  });

  // Stats
  const upcomingMeetings = meetings.filter(
    (m) => m.status === "confirmed",
  ).length;
  const upcomingEvents = events.filter(
    (e) => e.event_date >= format(new Date(), "yyyy-MM-dd"),
  ).length;
  const yearlyEvents = events.filter((e) => e.recurrence === "yearly").length;
  const thisMonthEvents = events.filter((e) => {
    const d = e.event_date.split("T")[0];
    const now = new Date();
    return d.startsWith(
      `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`,
    );
  }).length;

  return (
    <>
      <MetaHelmet
        title="Calendar — Encore Mortgage Admin"
        description="Manage your calendar, meetings, and important dates"
      />

      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Header */}
        <PageHeader
          icon={<CalendarDays className="h-7 w-7 text-primary" />}
          title="Calendar"
          description="Meetings, birthdays, anniversaries and important dates — all in one place"
          className="mb-0"
          actions={
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                onClick={() => {
                  dispatch(fetchScheduledMeetings());
                  dispatch(fetchCalendarEvents());
                }}
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground"
              >
                <RefreshCw className="h-4 w-4 mr-1" /> Refresh
              </Button>
              <Button
                onClick={() => setShowCreateEvent(true)}
                variant="outline"
                size="sm"
                className="border-border text-foreground hover:bg-muted/50"
              >
                <Sparkles className="h-4 w-4 mr-1" /> Add Event
              </Button>
              <Button
                onClick={() => setShowCreateMeeting(true)}
                size="sm"
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <Plus className="h-4 w-4 mr-1" /> New Meeting
              </Button>
            </div>
          }
        />

        {/* Booking link bar */}
        <div className="rounded-xl border border-border/50 bg-muted/30 p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground mb-1 font-semibold uppercase tracking-wider">
              Your Booking Link
            </p>
            <p className="text-sm text-foreground/80 truncate">
              {schedulerUrl}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              size="sm"
              variant="ghost"
              onClick={handleCopyUrl}
              className={cn(
                "text-sm",
                urlCopied
                  ? "text-green-400"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {urlCopied ? (
                <CheckCircle2 className="h-4 w-4 mr-1" />
              ) : (
                <Copy className="h-4 w-4 mr-1" />
              )}
              {urlCopied ? "Copied!" : "Copy"}
            </Button>
            <a href={schedulerUrl} target="_blank" rel="noopener noreferrer">
              <Button
                size="sm"
                variant="ghost"
                className="text-muted-foreground hover:text-foreground"
              >
                <ExternalLink className="h-4 w-4 mr-1" /> Preview
              </Button>
            </a>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            {
              label: "Confirmed Meetings",
              value: upcomingMeetings,
              color: "text-green-300",
              bg: "border-green-500/20 bg-green-500/5",
            },
            {
              label: "Upcoming Events",
              value: upcomingEvents,
              color: "text-cyan-300",
              bg: "border-cyan-500/20 bg-cyan-500/5",
            },
            {
              label: "Yearly Recurring",
              value: yearlyEvents,
              color: "text-violet-300",
              bg: "border-violet-500/20 bg-violet-500/5",
            },
            {
              label: "This Month",
              value: thisMonthEvents,
              color: "text-pink-300",
              bg: "border-pink-500/20 bg-pink-500/5",
            },
          ].map((s) => (
            <div key={s.label} className={cn("rounded-xl border p-4", s.bg)}>
              <p className="text-xs text-muted-foreground mb-1">{s.label}</p>
              <p className={cn("text-2xl font-bold", s.color)}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-muted/40 border border-border p-1">
            <TabsTrigger
              value="calendar"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-muted-foreground"
            >
              <CalendarDays className="h-4 w-4 mr-1.5" /> Calendar
            </TabsTrigger>
            <TabsTrigger
              value="meetings"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-muted-foreground"
            >
              <Phone className="h-4 w-4 mr-1.5" /> Meetings
            </TabsTrigger>
            <TabsTrigger
              value="events"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-muted-foreground"
            >
              <Sparkles className="h-4 w-4 mr-1.5" /> Events
            </TabsTrigger>
            <TabsTrigger
              value="settings"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-muted-foreground"
            >
              <Settings2 className="h-4 w-4 mr-1.5" /> Settings
            </TabsTrigger>
          </TabsList>

          {/* ── Calendar Tab ── */}
          <TabsContent value="calendar" className="mt-6">
            <div className="rounded-2xl border border-border/50 bg-muted/30 p-6">
              {isLoadingMeetings || isLoadingEvents ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <UnifiedCalendarView
                  meetings={meetings}
                  events={events}
                  onEditMeeting={setEditingMeeting}
                  onEditEvent={setEditingEvent}
                />
              )}
            </div>
          </TabsContent>

          {/* ── Meetings Tab ── */}
          <TabsContent value="meetings" className="mt-6 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <div className="relative flex-1 max-w-xs">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search client…"
                  className="pl-9 bg-muted/40 border-border text-foreground placeholder:text-muted-foreground"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="bg-muted/40 border-border text-foreground w-[160px]">
                  <ListFilter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  <SelectItem
                    value="all"
                    className="text-foreground focus:bg-muted/50"
                  >
                    All statuses
                  </SelectItem>
                  {(Object.keys(STATUS_CONFIG) as MeetingStatus[]).map((s) => (
                    <SelectItem
                      key={s}
                      value={s}
                      className="text-foreground focus:bg-muted/50"
                    >
                      {STATUS_CONFIG[s].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex rounded-lg border border-border overflow-hidden">
                {(["grid", "list"] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setViewMode(m)}
                    className={cn(
                      "p-2 transition-colors",
                      viewMode === m
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted/50",
                    )}
                  >
                    {m === "grid" ? (
                      <LayoutGrid className="h-4 w-4" />
                    ) : (
                      <List className="h-4 w-4" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {isLoadingMeetings ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredMeetings.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <CalendarDays className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">No meetings found</p>
                <p className="text-sm mt-1">
                  Try adjusting your filters or create a new meeting
                </p>
              </div>
            ) : viewMode === "grid" ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredMeetings.map((m) => (
                  <MeetingCard
                    key={m.id}
                    meeting={m}
                    onEdit={setEditingMeeting}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-border/50 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/50 bg-muted/20">
                      {["Client", "Date & Time", "Method", "Status", ""].map(
                        (h) => (
                          <th
                            key={h}
                            className={cn(
                              "text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase",
                              !h && "text-right",
                            )}
                          >
                            {h}
                          </th>
                        ),
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMeetings.map((m) => {
                      const cfg = STATUS_CONFIG[m.status];
                      return (
                        <tr
                          key={m.id}
                          className="border-b border-border/30 hover:bg-muted/20 transition-colors"
                        >
                          <td className="px-4 py-3">
                            <div className="font-medium text-foreground">
                              {m.client_name}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {m.client_email}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-foreground/80">
                            <div>{formatDate(m.meeting_date)}</div>
                            <div className="text-xs text-muted-foreground">
                              {formatTime(m.meeting_time)}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="flex items-center gap-1.5 text-foreground/80 text-xs">
                              {m.meeting_type === "phone" ? (
                                <Phone className="h-3.5 w-3.5 text-sky-400" />
                              ) : (
                                <Video className="h-3.5 w-3.5 text-green-400" />
                              )}
                              {m.meeting_type === "phone" ? "Phone" : "Video"}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={cn(
                                "inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border",
                                cfg.color,
                              )}
                            >
                              {cfg.label}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => setEditingMeeting(m)}
                              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </TabsContent>

          {/* ── Events Tab ── */}
          <TabsContent value="events" className="mt-6 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-wrap">
              <div className="relative flex-1 max-w-xs">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search events…"
                  className="pl-9 bg-muted/40 border-border text-foreground placeholder:text-muted-foreground"
                />
              </div>
              <Select
                value={eventTypeFilter}
                onValueChange={setEventTypeFilter}
              >
                <SelectTrigger className="bg-muted/40 border-border text-foreground w-[180px]">
                  <ListFilter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Event type" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  <SelectItem
                    value="all"
                    className="text-foreground focus:bg-muted/50"
                  >
                    All types
                  </SelectItem>
                  {(
                    Object.entries(EVENT_TYPE_CONFIG) as [
                      CalendarEventType,
                      (typeof EVENT_TYPE_CONFIG)[CalendarEventType],
                    ][]
                  ).map(([type, cfg]) => (
                    <SelectItem
                      key={type}
                      value={type}
                      className="text-foreground focus:bg-muted/50"
                    >
                      {cfg.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={() => setShowCreateEvent(true)}
                size="sm"
                className="bg-primary hover:bg-primary/90 text-primary-foreground ml-auto"
              >
                <Plus className="h-4 w-4 mr-1" /> Add Event
              </Button>
            </div>

            {/* Type chips legend */}
            <div className="flex flex-wrap gap-2">
              {(
                Object.entries(EVENT_TYPE_CONFIG) as [
                  CalendarEventType,
                  (typeof EVENT_TYPE_CONFIG)[CalendarEventType],
                ][]
              ).map(([type, cfg]) => {
                const Icon = cfg.icon;
                const count = events.filter(
                  (e) => e.event_type === type,
                ).length;
                return count > 0 ? (
                  <button
                    key={type}
                    onClick={() =>
                      setEventTypeFilter(
                        eventTypeFilter === type ? "all" : type,
                      )
                    }
                    className={cn(
                      "inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border transition-all",
                      eventTypeFilter === type
                        ? cfg.color
                        : "border-border/50 bg-muted/30 text-muted-foreground hover:border-border",
                    )}
                  >
                    <Icon className="h-3 w-3" /> {cfg.label}{" "}
                    <Badge className="ml-1 h-4 min-w-4 p-0 flex items-center justify-center text-[10px] bg-current/20">
                      {count}
                    </Badge>
                  </button>
                ) : null;
              })}
            </div>

            {isLoadingEvents ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredEvents.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <Sparkles className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">No events yet</p>
                <p className="text-sm mt-1 mb-4">
                  Add birthdays, anniversaries, and important dates
                </p>
                <Button
                  onClick={() => setShowCreateEvent(true)}
                  size="sm"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  <Plus className="h-4 w-4 mr-1" /> Add First Event
                </Button>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredEvents.map((e) => (
                  <EventCard
                    key={e.id}
                    event={e}
                    onEdit={setEditingEvent}
                    onDelete={setDeletingEvent}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* ── Settings Tab ── */}
          <TabsContent value="settings" className="mt-6">
            <SettingsPanel />
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialogs */}
      <EditMeetingDialog
        meeting={editingMeeting}
        open={!!editingMeeting}
        onClose={() => setEditingMeeting(null)}
        onSave={handleUpdateMeeting}
        isUpdating={isUpdatingMeeting}
      />

      <CreateMeetingDialog
        open={showCreateMeeting}
        onClose={() => setShowCreateMeeting(false)}
        onCreated={handleCreateMeeting}
        isCreating={isCreatingMeeting}
      />

      {/* Create event */}
      <EventFormDialog
        open={showCreateEvent}
        onClose={() => setShowCreateEvent(false)}
        onSubmit={handleCreateEvent}
        isSaving={isCreatingEvent}
      />

      {/* Edit event */}
      {editingEvent && (
        <EventFormDialog
          key={editingEvent.id}
          open={!!editingEvent}
          onClose={() => setEditingEvent(null)}
          initial={editingEvent}
          onSubmit={handleUpdateEvent}
          isSaving={isUpdatingEvent}
        />
      )}

      {/* Delete confirmation */}
      <AlertDialog
        open={!!deletingEvent}
        onOpenChange={(o) => !o && setDeletingEvent(null)}
      >
        <AlertDialogContent className="bg-popover border-border text-foreground">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Event</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Are you sure you want to delete "
              <strong>{deletingEvent?.title}</strong>"? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border text-foreground hover:bg-muted/50">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteEvent}
              disabled={isDeletingEvent}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              {isDeletingEvent ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default AdminCalendar;
