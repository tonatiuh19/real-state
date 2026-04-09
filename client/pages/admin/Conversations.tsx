import React, { useEffect, useState, useRef } from "react";
import * as AblyLib from "ably";
import {
  MessageCircle,
  Phone,
  PhoneOff,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
  Send,
  Mail,
  MessageSquare,
  Search,
  Filter,
  Plus,
  MoreVertical,
  Users,
  Clock,
  AlertCircle,
  CheckCircle,
  Archive,
  Star,
  Tag,
  ChevronLeft,
  Hash,
  Calendar,
  ExternalLink,
  Settings,
  RefreshCw,
  Wifi,
  WifiOff,
  Zap,
  Delete,
  PhoneCall,
} from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import { MetaHelmet } from "@/components/MetaHelmet";
import { PageHeader } from "@/components/layout/PageHeader";
import NewConversationWizard from "@/components/NewConversationWizard";
import VoiceCallPanel from "@/components/VoiceCallPanel";
import PhoneLink from "@/components/PhoneLink";
import EmailLink from "@/components/EmailLink";
import { adminPageMeta } from "@/lib/seo-helpers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchConversationThreads,
  fetchConversationMessages,
  sendMessage,
  fetchConversationTemplates,
  fetchConversationStats,
  fetchCallHistory,
  setCurrentThread,
  setThreadsFilters,
  markConversationAsRead,
  checkWhatsAppAvailability,
} from "@/store/slices/conversationsSlice";
import { setVoiceAvailable } from "@/store/slices/voiceSlice";
import type { DeviceStatus } from "@/store/slices/voiceSlice";
import { cn } from "@/lib/utils";
import type {
  ConversationThread,
  Communication,
  CallRecord,
} from "@shared/api";

type ChannelFilter = "all" | "sms" | "whatsapp" | "email" | "calls";

const CHANNEL_TABS: { key: ChannelFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "sms", label: "SMS" },
  { key: "whatsapp", label: "WhatsApp" },
  { key: "email", label: "Email" },
  { key: "calls", label: "Calls" },
];

const Conversations = () => {
  const dispatch = useAppDispatch();
  const {
    threads,
    currentThread,
    messages,
    templates,
    stats,
    isLoadingThreads,
    isLoadingMessages,
    isSendingMessage,
    isCheckingWhatsApp,
    whatsappAvailability,
    threadsFilters,
    callHistory,
    isLoadingCallHistory,
  } = useAppSelector((state) => state.conversations);

  const currentPhone = currentThread?.client_phone ?? null;
  const whatsappStatus: boolean | null = currentPhone
    ? (whatsappAvailability[currentPhone] ?? null)
    : null;
  const whatsappAvailable =
    whatsappStatus === null ? false : whatsappStatus === true;

  const { toast } = useToast();
  const isMobile = useIsMobile();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPriority, setSelectedPriority] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [channelFilter, setChannelFilter] = useState<ChannelFilter>("all");
  const [isNewConversationOpen, setIsNewConversationOpen] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [messageType, setMessageType] = useState<"email" | "sms" | "whatsapp">(
    "sms",
  );
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [messageSubject, setMessageSubject] = useState("");
  const [mobilePanel, setMobilePanel] = useState<"list" | "chat">("list");
  const [isCallActive, setIsCallActive] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Dialpad state
  const [isDialerOpen, setIsDialerOpen] = useState(false);
  const [dialerNumber, setDialerNumber] = useState("");
  const [isDialerCallActive, setIsDialerCallActive] = useState(false);

  // Selected call record for detail view
  const [selectedCall, setSelectedCall] = useState<CallRecord | null>(null);
  const [isCallDetailDialing, setIsCallDetailDialing] = useState(false);

  // Resizable left panel
  const [leftPanelWidth, setLeftPanelWidth] = useState(320);
  const isResizingRef = useRef(false);
  const startXRef = useRef(0);
  const startWidthRef = useRef(320);

  const handleResizeStart = (e: React.MouseEvent) => {
    isResizingRef.current = true;
    startXRef.current = e.clientX;
    startWidthRef.current = leftPanelWidth;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    const onMove = (ev: MouseEvent) => {
      if (!isResizingRef.current) return;
      const delta = ev.clientX - startXRef.current;
      const next = Math.min(560, Math.max(240, startWidthRef.current + delta));
      setLeftPanelWidth(next);
    };
    const onUp = () => {
      isResizingRef.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const { sessionToken } = useAppSelector((s) => s.brokerAuth);
  const isAvailable = useAppSelector((s) => s.voice.isAvailable);
  const deviceStatus = useAppSelector((s) => s.voice.deviceStatus);

  // Phone numbers management
  const [isPhoneNumbersOpen, setIsPhoneNumbersOpen] = useState(false);
  type PhoneNumberEntry = {
    sid: string;
    phoneNumber: string;
    friendlyName: string;
    voiceUrl: string;
    configured: boolean;
    capabilities: { voice: boolean; sms: boolean; mms: boolean };
    assignedBrokerId: number | null;
    assignedBrokerName: string | null;
  };
  type BrokerOption = { id: number; name: string };
  const [phoneNumbers, setPhoneNumbers] = useState<PhoneNumberEntry[]>([]);
  const [brokerOptions, setBrokerOptions] = useState<BrokerOption[]>([]);
  const [isLoadingNumbers, setIsLoadingNumbers] = useState(false);
  const [isConfiguringAll, setIsConfiguringAll] = useState(false);
  const [configuringSid, setConfiguringSid] = useState<string | null>(null);
  const [assigningSid, setAssigningSid] = useState<string | null>(null);
  const [isSyncingCallSetup, setIsSyncingCallSetup] = useState(false);
  const [callSetupStatus, setCallSetupStatus] = useState<{
    twimlAppSid?: string;
    voiceUrl?: string;
  } | null>(null);

  const assignNumber = async (sid: string, brokerId: number | null) => {
    setAssigningSid(sid);
    try {
      const res = await fetch(`/api/voice/phone-numbers/${sid}/assign`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({ brokerId }),
      });
      const data = await res.json();
      if (data.success) {
        toast({
          title: "Assigned",
          description: brokerId
            ? `Number assigned successfully`
            : "Number unassigned",
        });
        await fetchPhoneNumbers();
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to assign",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to assign number",
        variant: "destructive",
      });
    } finally {
      setAssigningSid(null);
    }
  };

  const fetchPhoneNumbers = async () => {
    setIsLoadingNumbers(true);
    try {
      const res = await fetch("/api/voice/phone-numbers", {
        headers: { Authorization: `Bearer ${sessionToken}` },
      });
      const data = await res.json();
      if (data.success) {
        setPhoneNumbers(data.numbers);
        if (data.brokers) setBrokerOptions(data.brokers);
      }
    } catch {
      // ignore
    } finally {
      setIsLoadingNumbers(false);
    }
  };

  const configureNumber = async (sid: string) => {
    const key = sid === "all" ? "all" : sid;
    if (sid === "all") setIsConfiguringAll(true);
    else setConfiguringSid(sid);
    try {
      const res = await fetch(`/api/voice/phone-numbers/${sid}/configure`, {
        method: "POST",
        headers: { Authorization: `Bearer ${sessionToken}` },
      });
      const data = await res.json();
      if (data.success) {
        toast({
          title: "Configured",
          description:
            sid === "all"
              ? `All ${data.updated} numbers configured`
              : "Number configured for incoming calls",
        });
        await fetchPhoneNumbers();
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to configure number",
        variant: "destructive",
      });
    } finally {
      setIsConfiguringAll(false);
      setConfiguringSid(null);
    }
  };

  useEffect(() => {
    if (isPhoneNumbersOpen) fetchPhoneNumbers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPhoneNumbersOpen]);

  const syncCallSetup = async () => {
    setIsSyncingCallSetup(true);
    setCallSetupStatus(null);
    try {
      const res = await fetch("/api/voice/fix-call-setup", {
        method: "POST",
        headers: { Authorization: `Bearer ${sessionToken}` },
      });
      const data = await res.json();
      if (data.success) {
        setCallSetupStatus({
          twimlAppSid: data.twimlAppSid,
          voiceUrl: data.voiceUrl,
        });
        toast({
          title: "Outbound calls ready",
          description: "Voice configuration synced — outbound calls are ready.",
        });
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to sync voice configuration",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to sync voice configuration",
        variant: "destructive",
      });
    } finally {
      setIsSyncingCallSetup(false);
    }
  };

  // Client-side channel filtering
  const filteredThreads =
    channelFilter === "all"
      ? threads
      : threads.filter((t) => t.last_message_type === channelFilter);

  // Show all messages regardless of channel — channel tabs only filter the thread list
  const filteredMessages = messages;

  // Auto-scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [filteredMessages]);

  // Auto-populate message when template is selected
  useEffect(() => {
    if (selectedTemplate && selectedTemplate !== "none" && templates?.length) {
      const template = templates.find(
        (t) => t.id.toString() === selectedTemplate,
      );
      if (template) {
        setMessageText(template.body || "");
        if (template.subject && messageType === "email") {
          setMessageSubject(template.subject);
        }
      }
    }
  }, [selectedTemplate, templates, messageType]);

  // Clear template when channel changes
  useEffect(() => {
    setSelectedTemplate("");
    setMessageText("");
    setMessageSubject("");
  }, [messageType]);

  // Load initial data
  useEffect(() => {
    dispatch(fetchConversationThreads(threadsFilters));
    dispatch(fetchConversationTemplates(undefined));
    dispatch(fetchConversationStats());
  }, [dispatch]);

  // Load call history when "calls" tab is selected
  useEffect(() => {
    if (channelFilter === "calls") {
      dispatch(fetchCallHistory({}));
    }
  }, [channelFilter, dispatch]);

  // Real-time updates via Ably
  useEffect(() => {
    let realtimeClient: AblyLib.Realtime | null = null;

    const connect = async () => {
      try {
        const token = localStorage.getItem("broker_session");
        const res = await fetch("/api/conversations/ably-token", {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        if (!res.ok) return;
        const tokenRequest = await res.json();

        realtimeClient = new AblyLib.Realtime({
          authCallback: (_tokenParams, callback) =>
            callback(null, tokenRequest),
        });

        // Subscribe to thread-list changes so the sidebar stays fresh
        const allChannel = realtimeClient.channels.get("conversations:all");
        allChannel.subscribe("thread-updated", () => {
          dispatch(fetchConversationThreads(threadsFilters));
        });
      } catch {
        // Real-time unavailable — graceful degradation
      }
    };

    connect();

    return () => {
      realtimeClient?.close();
    };
  }, [dispatch]);

  // Re-subscribe to per-conversation channel when the active thread changes
  useEffect(() => {
    if (!currentThread?.conversation_id) return;

    let realtimeClient: AblyLib.Realtime | null = null;
    const convId = currentThread.conversation_id;

    const subscribe = async () => {
      try {
        const token = localStorage.getItem("broker_session");
        const res = await fetch("/api/conversations/ably-token", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const tokenRequest = await res.json();

        realtimeClient = new AblyLib.Realtime({
          authCallback: (_tokenParams, callback) =>
            callback(null, tokenRequest),
        });

        const channel = realtimeClient.channels.get(`conversation:${convId}`);
        channel.subscribe("new-message", () => {
          dispatch(fetchConversationMessages({ conversationId: convId }));
        });
      } catch {
        // Graceful degradation
      }
    };

    subscribe();

    return () => {
      realtimeClient?.close();
    };
  }, [currentThread?.conversation_id, dispatch]);

  const handleSelectThread = (thread: ConversationThread) => {
    dispatch(setCurrentThread(thread));
    dispatch(
      fetchConversationMessages({ conversationId: thread.conversation_id }),
    );
    setMobilePanel("chat");
    setIsCallActive(false);

    if (thread.unread_count > 0) {
      dispatch(markConversationAsRead(thread.conversation_id));
    }

    if (
      thread.client_phone &&
      whatsappAvailability[thread.client_phone] === undefined
    ) {
      dispatch(checkWhatsAppAvailability(thread.client_phone));
    }

    if (messageType === "whatsapp") {
      setMessageType("sms");
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    dispatch(setThreadsFilters({ search: query }));
    dispatch(fetchConversationThreads({ ...threadsFilters, search: query }));
  };

  const handleStatusFilter = (status: string) => {
    setSelectedStatus(status);
    const filters = status === "all" ? {} : { status };
    dispatch(setThreadsFilters(filters));
    dispatch(fetchConversationThreads({ ...threadsFilters, ...filters }));
  };

  const handlePriorityFilter = (priority: string) => {
    setSelectedPriority(priority);
    const filters = priority === "" ? {} : { priority };
    dispatch(setThreadsFilters(filters));
    dispatch(fetchConversationThreads({ ...threadsFilters, ...filters }));
  };

  const handleSendMessage = async () => {
    if (!messageText.trim()) {
      toast({
        title: "Error",
        description: "Please enter a message",
        variant: "destructive",
      });
      return;
    }

    try {
      await dispatch(
        sendMessage({
          conversation_id: currentThread?.conversation_id,
          application_id: currentThread?.application_id || undefined,
          client_id: currentThread?.client_id || undefined,
          communication_type: messageType,
          recipient_phone: currentThread?.client_phone || undefined,
          recipient_email: currentThread?.client_email || undefined,
          subject: messageType === "email" ? messageSubject : undefined,
          body: messageText,
          message_type:
            selectedTemplate && selectedTemplate !== "none"
              ? "template"
              : "text",
          template_id:
            selectedTemplate && selectedTemplate !== "none"
              ? parseInt(selectedTemplate)
              : undefined,
        }),
      ).unwrap();

      setMessageText("");
      setMessageSubject("");
      setSelectedTemplate("");

      if (currentThread) {
        dispatch(
          fetchConversationMessages({
            conversationId: currentThread.conversation_id,
          }),
        );
      }
      dispatch(fetchConversationThreads(threadsFilters));
      toast({ title: "Success", description: "Message sent successfully" });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error || "Failed to send message",
        variant: "destructive",
      });
    }
  };

  const handleNewConversation = async (data: {
    communication_type: "email" | "sms" | "whatsapp";
    recipient_phone?: string;
    recipient_email?: string;
    subject?: string;
    body: string;
    message_type: "text" | "template";
    template_id?: number;
  }) => {
    try {
      await dispatch(sendMessage(data)).unwrap();
      dispatch(fetchConversationThreads(threadsFilters));
      toast({ title: "Success", description: "New conversation started" });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error || "Failed to start conversation",
        variant: "destructive",
      });
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-100 text-red-700 border-red-200";
      case "high":
        return "bg-orange-100 text-orange-700 border-orange-200";
      case "normal":
        return "bg-primary/10 text-primary border-primary/20";
      case "low":
        return "bg-muted text-muted-foreground border-border";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  const getChannelIcon = (type: string, className = "h-4 w-4") => {
    switch (type) {
      case "email":
        return <Mail className={className} />;
      case "sms":
        return <MessageSquare className={className} />;
      case "whatsapp":
        return <FaWhatsapp className={className} />;
      case "call":
        return <Phone className={className} />;
      default:
        return <MessageCircle className={className} />;
    }
  };

  const getChannelColor = (type: string) => {
    switch (type) {
      case "email":
        return "text-blue-500";
      case "sms":
        return "text-primary";
      case "whatsapp":
        return "text-[#25D366]";
      default:
        return "text-muted-foreground";
    }
  };

  const formatTime = (date: string) => {
    // MySQL returns UTC timestamps without timezone indicator — force UTC parsing
    const normalized =
      /[Zz+\-]\d{2}:?\d{2}$/.test(date) || date.endsWith("Z")
        ? date
        : date.replace(" ", "T") + "Z";
    const d = new Date(normalized);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    if (isToday) {
      return d.toLocaleString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    }
    return d.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const getInitials = (name?: string | null) =>
    name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "?";

  const parseCallDuration = (body: string): string => {
    const match = body.match(/(\d+)s/);
    if (!match) return "";
    const secs = parseInt(match[1], 10);
    if (secs < 60) return `${secs}s`;
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}m ${s}s`;
  };

  const parseCallStatus = (body: string): string => {
    const match = body.match(/\(([^)]+)\)/);
    return match ? match[1] : "completed";
  };

  const getDateLabel = (date: string) => {
    const normalized =
      /[Zz+\-]\d{2}:?\d{2}$/.test(date) || date.endsWith("Z")
        ? date
        : date.replace(" ", "T") + "Z";
    const d = new Date(normalized);
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (d.toDateString() === now.toDateString()) return "Today";
    if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
    return d.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <MetaHelmet
        {...adminPageMeta(
          "Conversations",
          "Manage client communications via SMS, WhatsApp, and Email",
        )}
      />

      {/* Header */}
      <PageHeader
        variant="toolbar"
        icon={
          <MessageCircle className="h-5 w-5 md:h-6 md:w-6 text-primary flex-shrink-0" />
        }
        title="Conversations"
        description="Manage client communications via SMS, WhatsApp & Email"
        mobileBack={
          mobilePanel === "chat" ? () => setMobilePanel("list") : undefined
        }
        actions={
          <>
            {/* Availability toggle */}
            <button
              onClick={() => dispatch(setVoiceAvailable(!isAvailable))}
              className={cn(
                "flex items-center gap-1.5 px-2 md:px-3 py-1.5 rounded-full border text-xs font-medium transition-all duration-200",
                isAvailable && deviceStatus === "registered"
                  ? "bg-green-50 border-green-300 text-green-700 hover:bg-green-100"
                  : isAvailable && deviceStatus === "connecting"
                    ? "bg-yellow-50 border-yellow-300 text-yellow-700 hover:bg-yellow-100"
                    : isAvailable && deviceStatus === "error"
                      ? "bg-red-50 border-red-300 text-red-700 hover:bg-red-100"
                      : "bg-muted border-border text-muted-foreground hover:bg-muted/80",
              )}
              title={
                !isAvailable
                  ? "Click to go available"
                  : deviceStatus === "registered"
                    ? "Reachable — click to go offline"
                    : deviceStatus === "connecting"
                      ? "Connecting VoIP…"
                      : deviceStatus === "error"
                        ? "VoIP connection failed — click to retry"
                        : "Click to go offline"
              }
            >
              <span
                className={cn(
                  "h-2 w-2 rounded-full flex-shrink-0",
                  isAvailable && deviceStatus === "registered"
                    ? "bg-green-500 animate-pulse"
                    : isAvailable && deviceStatus === "connecting"
                      ? "bg-yellow-400 animate-pulse"
                      : isAvailable && deviceStatus === "error"
                        ? "bg-red-500"
                        : "bg-muted-foreground",
                )}
              />
              <span className="hidden sm:inline">
                {!isAvailable
                  ? "Unavailable"
                  : deviceStatus === "registered"
                    ? "Available"
                    : deviceStatus === "connecting"
                      ? "Connecting…"
                      : deviceStatus === "error"
                        ? "VoIP Error"
                        : "Available"}
              </span>
            </button>

            {/* Phone numbers settings — icon only on mobile */}
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 text-xs px-2 md:px-3"
              onClick={() => setIsPhoneNumbersOpen(true)}
              title="Manage phone numbers"
            >
              <Settings className="h-3.5 w-3.5" />
              <span className="hidden md:inline">Phone Numbers</span>
            </Button>

            {/* Dialpad toggle */}
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "h-8 gap-1.5 text-xs px-2 md:px-3",
                isDialerOpen
                  ? "bg-primary/10 border-primary/40 text-primary"
                  : "",
              )}
              onClick={() => {
                setIsDialerOpen((v) => !v);
                setIsDialerCallActive(false);
                setDialerNumber("");
              }}
              title="Open dialpad"
            >
              <PhoneCall className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Dial</span>
            </Button>

            {/* New conversation — icon only on mobile */}
            <Button
              onClick={() => setIsNewConversationOpen(true)}
              size="sm"
              className="bg-primary hover:bg-primary/90 h-8 px-2 md:px-3 gap-1.5 text-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">New</span>
            </Button>
          </>
        }
      />

      {/* Main 3-column layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Thread list / Call history */}
        <div
          className={cn(
            "flex-shrink-0 border-r border-border flex flex-col bg-card relative",
            mobilePanel === "chat" ? "hidden md:flex" : "flex w-full",
          )}
          style={isMobile ? undefined : { width: leftPanelWidth }}
        >
          <div className="flex flex-col h-full overflow-hidden">
            {/* Search + filter */}
            <div className="p-3 border-b border-border space-y-2 flex-shrink-0">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Search…"
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="pl-9 h-8 text-sm"
                  />
                </div>
                {channelFilter !== "calls" ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0"
                      >
                        <Filter className="h-3.5 w-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {["all", "active", "archived", "closed"].map((s) => (
                        <DropdownMenuItem
                          key={s}
                          onClick={() => handleStatusFilter(s)}
                          className={cn(
                            selectedStatus === s &&
                              "bg-primary/10 text-primary",
                          )}
                        >
                          {s.charAt(0).toUpperCase() + s.slice(1)}
                        </DropdownMenuItem>
                      ))}
                      <DropdownMenuSeparator />
                      <DropdownMenuLabel>Filter by Priority</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {["", "low", "normal", "high", "urgent"].map((p) => (
                        <DropdownMenuItem
                          key={p}
                          onClick={() => handlePriorityFilter(p)}
                          className={cn(
                            selectedPriority === p &&
                              "bg-primary/10 text-primary",
                          )}
                        >
                          {p
                            ? p.charAt(0).toUpperCase() + p.slice(1)
                            : "All Priorities"}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => dispatch(fetchCallHistory({}))}
                    title="Refresh call history"
                  >
                    <RefreshCw
                      className={cn(
                        "h-3.5 w-3.5",
                        isLoadingCallHistory && "animate-spin",
                      )}
                    />
                  </Button>
                )}
              </div>

              {/* Channel tabs — scrollable on mobile */}
              <div className="flex rounded-lg bg-muted p-0.5 gap-0.5 overflow-x-auto scrollbar-hide">
                {CHANNEL_TABS.map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => {
                      setChannelFilter(key);
                      if (key !== "calls") setSelectedCall(null);
                    }}
                    className={cn(
                      "flex-1 min-w-[2.5rem] text-xs font-medium py-1 px-1 rounded-md transition-all whitespace-nowrap",
                      channelFilter === key
                        ? "bg-card text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {/* Abbreviated on mobile if long label */}
                    <span className="sm:hidden">
                      {key === "whatsapp" ? "WA" : label}
                    </span>
                    <span className="hidden sm:inline">{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Thread list / Call history */}
            <ScrollArea className="flex-1">
              <div className="p-2 space-y-1">
                {channelFilter === "calls" ? (
                  /* ── Call History ── */
                  isLoadingCallHistory ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
                    </div>
                  ) : callHistory.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Phone className="h-10 w-10 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">No call history yet</p>
                    </div>
                  ) : (
                    callHistory.map((call) => {
                      const isInbound = call.direction === "inbound";
                      const callStatus = parseCallStatus(call.body);
                      const duration = parseCallDuration(call.body);
                      const isMissed =
                        callStatus === "no-answer" || callStatus === "failed";
                      const isSelected = selectedCall?.id === call.id;
                      return (
                        <div
                          key={call.id}
                          onClick={() => {
                            setSelectedCall(isSelected ? null : call);
                            setIsCallDetailDialing(false);
                            setMobilePanel("chat");
                          }}
                          className={cn(
                            "p-3 rounded-lg border cursor-pointer transition-all duration-150",
                            isSelected
                              ? "bg-primary/10 border-primary/30"
                              : "border-transparent hover:bg-muted hover:border-border",
                          )}
                        >
                          <div className="flex items-start gap-2.5">
                            <div
                              className={cn(
                                "p-2 rounded-full flex-shrink-0 mt-0.5",
                                isMissed
                                  ? "bg-red-100"
                                  : isInbound
                                    ? "bg-green-100"
                                    : "bg-primary/10",
                              )}
                            >
                              {isMissed ? (
                                <PhoneMissed className="h-3.5 w-3.5 text-red-500" />
                              ) : isInbound ? (
                                <PhoneIncoming className="h-3.5 w-3.5 text-green-600" />
                              ) : (
                                <PhoneOutgoing className="h-3.5 w-3.5 text-primary" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-1">
                                <p className="text-sm font-semibold text-foreground truncate">
                                  {call.client_name ||
                                    call.client_phone ||
                                    "Unknown"}
                                </p>
                                <p className="text-xs text-muted-foreground flex-shrink-0">
                                  {formatTime(call.created_at)}
                                </p>
                              </div>
                              {call.client_phone && call.client_name && (
                                <p className="text-xs text-muted-foreground truncate">
                                  {call.client_phone}
                                </p>
                              )}
                              <div className="flex items-center gap-2 mt-1">
                                <span
                                  className={cn(
                                    "text-xs font-medium",
                                    isMissed
                                      ? "text-red-600"
                                      : "text-muted-foreground",
                                  )}
                                >
                                  {isInbound ? "Inbound" : "Outbound"}
                                </span>
                                {duration && (
                                  <>
                                    <span className="text-xs text-muted-foreground">
                                      ·
                                    </span>
                                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      {duration}
                                    </span>
                                  </>
                                )}
                                {isMissed && (
                                  <span className="text-xs text-red-500 font-medium">
                                    Missed
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )
                ) : /* ── Thread list ── */
                isLoadingThreads ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
                  </div>
                ) : filteredThreads.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <MessageCircle className="h-10 w-10 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">
                      No{" "}
                      {channelFilter !== "all"
                        ? channelFilter.toUpperCase()
                        : ""}{" "}
                      conversations
                    </p>
                  </div>
                ) : (
                  filteredThreads.map((thread) => (
                    <div
                      key={thread.id}
                      onClick={() => handleSelectThread(thread)}
                      className={cn(
                        "p-3 rounded-lg cursor-pointer transition-all duration-150 group",
                        currentThread?.conversation_id ===
                          thread.conversation_id
                          ? "bg-primary/10 border border-primary/30"
                          : "hover:bg-muted border border-transparent hover:border-border",
                      )}
                    >
                      <div className="flex items-start gap-2.5">
                        <Avatar className="h-9 w-9 flex-shrink-0">
                          <AvatarFallback
                            className={cn(
                              "text-xs font-semibold",
                              currentThread?.conversation_id ===
                                thread.conversation_id
                                ? "bg-primary text-primary-foreground"
                                : "bg-secondary text-secondary-foreground",
                            )}
                          >
                            {getInitials(thread.client_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <p className="text-sm font-semibold text-foreground truncate">
                              {thread.client_name || "Unknown Client"}
                            </p>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              {thread.unread_count > 0 && (
                                <span className="bg-primary text-primary-foreground text-xs rounded-full px-1.5 py-0.5 font-bold leading-none">
                                  {thread.unread_count}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span
                              className={cn(
                                "flex-shrink-0",
                                getChannelColor(thread.last_message_type),
                              )}
                            >
                              {getChannelIcon(
                                thread.last_message_type,
                                "h-3 w-3",
                              )}
                            </span>
                            <p className="text-xs text-muted-foreground truncate flex-1">
                              {thread.last_message_preview || "No messages yet"}
                            </p>
                          </div>
                          <div className="flex items-center justify-between mt-1">
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-xs py-0 px-1.5",
                                getPriorityColor(thread.priority),
                              )}
                            >
                              {thread.priority}
                            </Badge>
                            <p className="text-xs text-muted-foreground">
                              {thread.last_message_at
                                ? formatTime(thread.last_message_at)
                                : ""}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
          {/* end flex flex-col h-full */}

          {/* Drag-to-resize handle — desktop only */}
          <div
            onMouseDown={handleResizeStart}
            className="hidden md:flex absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize items-center justify-center group z-10 hover:bg-primary/20 transition-colors"
            title="Drag to resize"
          >
            <div className="w-0.5 h-8 rounded-full bg-border group-hover:bg-primary/50 transition-colors" />
          </div>
        </div>

        {/* Center: Messages */}
        <div
          className={cn(
            "flex-1 flex flex-col bg-background overflow-hidden",
            mobilePanel === "list" ? "hidden md:flex" : "flex",
          )}
        >
          {currentThread ? (
            <>
              {/* Chat header */}
              <div className="px-4 py-3 border-b border-border bg-card flex-shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="md:hidden h-7 w-7"
                      onClick={() => setMobilePanel("list")}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                        {getInitials(currentThread.client_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-foreground text-sm">
                        {currentThread.client_name || "Unknown Client"}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        {currentThread.client_phone && (
                          <PhoneLink
                            phone={currentThread.client_phone}
                            clientName={currentThread.client_name}
                            clientId={currentThread.client_id}
                            className="text-xs text-muted-foreground"
                          />
                        )}
                        {currentThread.client_email && (
                          <EmailLink
                            email={currentThread.client_email}
                            className="text-xs text-muted-foreground"
                          />
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {currentThread.client_phone && (
                      <Button
                        variant="outline"
                        size="sm"
                        className={cn(
                          "h-8 gap-1.5 text-xs",
                          isCallActive
                            ? "bg-green-50 border-green-300 text-green-700 hover:bg-green-100"
                            : "hover:bg-primary/10 hover:text-primary hover:border-primary/30",
                        )}
                        onClick={() => setIsCallActive((v) => !v)}
                        title={isCallActive ? "Hide call panel" : "Call client"}
                      >
                        <Phone className="h-3.5 w-3.5" />
                        {isCallActive ? "In call" : "Call"}
                      </Button>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Star className="h-4 w-4 mr-2" />
                          Mark as Important
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Archive className="h-4 w-4 mr-2" />
                          Archive Thread
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Tag className="h-4 w-4 mr-2" />
                          Add Tags
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>

              {/* Active call panel */}
              {isCallActive && currentThread.client_phone && (
                <div className="px-4 py-2 border-b border-border bg-card flex-shrink-0">
                  <VoiceCallPanel
                    phone={currentThread.client_phone}
                    clientName={currentThread.client_name}
                    clientId={currentThread.client_id ?? undefined}
                    applicationId={currentThread.application_id ?? undefined}
                    onClose={() => setIsCallActive(false)}
                  />
                </div>
              )}

              {/* Messages */}
              <ScrollArea className="flex-1 px-4 py-4">
                {isLoadingMessages ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
                  </div>
                ) : filteredMessages.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <MessageCircle className="h-10 w-10 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">
                      No{" "}
                      {channelFilter !== "all"
                        ? channelFilter.toUpperCase()
                        : ""}{" "}
                      messages yet
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {[...filteredMessages]
                      .reverse()
                      .map((message, index, arr) => {
                        const msgDate = message.sent_at || message.created_at;
                        const prevMsg = arr[index - 1];
                        const prevDate = prevMsg
                          ? prevMsg.sent_at || prevMsg.created_at
                          : null;
                        const showDateSep =
                          msgDate &&
                          (!prevDate ||
                            new Date(msgDate).toDateString() !==
                              new Date(prevDate).toDateString());
                        const isOutbound = message.direction === "outbound";
                        return (
                          <React.Fragment key={message.id}>
                            {showDateSep && msgDate && (
                              <div className="flex items-center gap-3 py-3">
                                <div className="flex-1 h-px bg-border" />
                                <span className="text-xs text-muted-foreground font-medium px-2 bg-background">
                                  {getDateLabel(msgDate)}
                                </span>
                                <div className="flex-1 h-px bg-border" />
                              </div>
                            )}
                            <div
                              className={cn(
                                "flex mb-2",
                                isOutbound ? "justify-end" : "justify-start",
                              )}
                            >
                              <div
                                className={cn(
                                  "max-w-[72%] px-3.5 py-2.5 rounded-2xl text-sm shadow-sm",
                                  isOutbound
                                    ? "bg-slate-800 text-white rounded-br-sm"
                                    : "bg-muted text-foreground rounded-bl-sm border border-border",
                                )}
                              >
                                <div
                                  className={cn(
                                    "flex items-center gap-1.5 mb-1",
                                    isOutbound
                                      ? "text-white/60"
                                      : "text-muted-foreground",
                                  )}
                                >
                                  <span
                                    className={cn(
                                      isOutbound
                                        ? "text-white/70"
                                        : getChannelColor(
                                            message.communication_type,
                                          ),
                                    )}
                                  >
                                    {getChannelIcon(
                                      message.communication_type,
                                      "h-3 w-3",
                                    )}
                                  </span>
                                  <span className="text-xs">
                                    {msgDate ? formatTime(msgDate) : ""}
                                  </span>
                                </div>
                                {message.subject && (
                                  <p className="font-semibold text-xs mb-1 opacity-90">
                                    {message.subject}
                                  </p>
                                )}
                                <p className="leading-relaxed">
                                  {message.body}
                                </p>
                                {message.status && (
                                  <div
                                    className={cn(
                                      "flex items-center gap-1 mt-1",
                                      isOutbound
                                        ? "text-white/50"
                                        : "text-muted-foreground",
                                    )}
                                  >
                                    <CheckCircle className="h-3 w-3" />
                                    <span className="text-xs capitalize">
                                      {message.status}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </React.Fragment>
                        );
                      })}
                  </div>
                )}
                <div ref={messagesEndRef} />
              </ScrollArea>

              {/* Composer */}
              <div className="p-3 border-t border-border bg-card flex-shrink-0">
                <div className="flex items-center gap-2 mb-2">
                  <Select
                    value={messageType}
                    onValueChange={(v: any) => setMessageType(v)}
                  >
                    <SelectTrigger className="w-36 h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sms">
                        <div className="flex items-center gap-2">
                          <MessageSquare className="h-3.5 w-3.5 text-primary" />
                          SMS
                        </div>
                      </SelectItem>
                      <SelectItem
                        value="whatsapp"
                        disabled={!whatsappAvailable}
                      >
                        <div className="flex items-center gap-2">
                          <FaWhatsapp
                            className={cn(
                              "h-3.5 w-3.5",
                              whatsappAvailable
                                ? "text-[#25D366]"
                                : "opacity-40",
                            )}
                          />
                          <span
                            className={cn(!whatsappAvailable && "opacity-40")}
                          >
                            WhatsApp
                          </span>
                          {isCheckingWhatsApp && currentPhone && (
                            <span className="text-xs text-muted-foreground ml-1">
                              checking…
                            </span>
                          )}
                          {!isCheckingWhatsApp && whatsappStatus === false && (
                            <span className="text-xs text-muted-foreground ml-1">
                              unavailable
                            </span>
                          )}
                        </div>
                      </SelectItem>
                      <SelectItem value="email">
                        <div className="flex items-center gap-2">
                          <Mail className="h-3.5 w-3.5 text-blue-500" />
                          Email
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>

                  {templates && templates.length > 0 && (
                    <Select
                      value={selectedTemplate}
                      onValueChange={(value) => {
                        setSelectedTemplate(value);
                        if (value && value !== "none") {
                          const t = templates.find(
                            (tmpl) => tmpl.id.toString() === value,
                          );
                          if (t) {
                            setMessageText(t.body || "");
                            if (t.subject && messageType === "email")
                              setMessageSubject(t.subject);
                          }
                        } else {
                          setMessageText("");
                          setMessageSubject("");
                        }
                      }}
                    >
                      <SelectTrigger className="h-8 text-sm flex-1">
                        <SelectValue placeholder="Use template…" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">
                          <span className="text-muted-foreground">
                            No template
                          </span>
                        </SelectItem>
                        {templates
                          .filter((t) => t.template_type === messageType)
                          .map((t) => (
                            <SelectItem key={t.id} value={t.id.toString()}>
                              {t.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                {messageType === "email" && (
                  <Input
                    placeholder="Subject"
                    value={messageSubject}
                    onChange={(e) => setMessageSubject(e.target.value)}
                    className="mb-2 h-8 text-sm"
                  />
                )}

                <div className="flex items-end gap-2">
                  <Textarea
                    placeholder="Type your message…"
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    className="flex-1 min-h-[72px] resize-none text-sm"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={isSendingMessage || !messageText.trim()}
                    className="bg-primary hover:bg-primary/90 h-10 w-10 p-0"
                  >
                    {isSendingMessage ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </>
          ) : channelFilter === "calls" && selectedCall ? (
            /* ── Call Detail View ── */
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Header */}
              <div className="px-4 py-3 border-b border-border bg-card flex-shrink-0">
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden h-7 w-7"
                    onClick={() => setMobilePanel("list")}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <div className="flex-1">
                    <p className="font-semibold text-foreground text-sm">
                      {selectedCall.client_name ||
                        selectedCall.client_phone ||
                        "Unknown"}
                    </p>
                    {selectedCall.client_name && selectedCall.client_phone && (
                      <p className="text-xs text-muted-foreground">
                        {selectedCall.client_phone}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Call detail card */}
              <div className="flex-1 flex items-start justify-center p-6 overflow-y-auto">
                <div className="w-full max-w-md space-y-4">
                  {/* Direction badge */}
                  <div className="bg-card border border-border rounded-xl p-5 space-y-4">
                    <div className="flex items-center gap-3">
                      {(() => {
                        const isInbound = selectedCall.direction === "inbound";
                        const callStatus = parseCallStatus(selectedCall.body);
                        const isMissed =
                          callStatus === "no-answer" || callStatus === "failed";
                        return (
                          <div
                            className={cn(
                              "p-3 rounded-full",
                              isMissed
                                ? "bg-red-100"
                                : isInbound
                                  ? "bg-green-100"
                                  : "bg-primary/10",
                            )}
                          >
                            {isMissed ? (
                              <PhoneMissed
                                className={cn("h-5 w-5 text-red-500")}
                              />
                            ) : isInbound ? (
                              <PhoneIncoming className="h-5 w-5 text-green-600" />
                            ) : (
                              <PhoneOutgoing className="h-5 w-5 text-primary" />
                            )}
                          </div>
                        );
                      })()}
                      <div>
                        <p className="font-semibold text-foreground">
                          {selectedCall.direction === "inbound"
                            ? "Incoming Call"
                            : "Outgoing Call"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatTime(selectedCall.created_at)}
                        </p>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Contact</span>
                        <span className="font-medium text-foreground">
                          {selectedCall.client_name || "Unknown"}
                        </span>
                      </div>
                      {selectedCall.client_phone && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Phone</span>
                          <span className="font-medium text-foreground">
                            {selectedCall.client_phone}
                          </span>
                        </div>
                      )}
                      {(() => {
                        const duration = parseCallDuration(selectedCall.body);
                        const callStatus = parseCallStatus(selectedCall.body);
                        return (
                          <>
                            {duration && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">
                                  Duration
                                </span>
                                <span className="font-medium text-foreground flex items-center gap-1">
                                  <Clock className="h-3.5 w-3.5" />
                                  {duration}
                                </span>
                              </div>
                            )}
                            {callStatus && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">
                                  Status
                                </span>
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    "text-xs capitalize",
                                    callStatus === "no-answer" ||
                                      callStatus === "failed"
                                      ? "text-red-600 border-red-300"
                                      : "text-green-600 border-green-300",
                                  )}
                                >
                                  {callStatus === "no-answer"
                                    ? "Missed"
                                    : callStatus}
                                </Badge>
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Call back button */}
                  {selectedCall.client_phone &&
                    (isCallDetailDialing ? (
                      <VoiceCallPanel
                        phone={selectedCall.client_phone}
                        clientName={selectedCall.client_name || undefined}
                        clientId={selectedCall.client_id ?? undefined}
                        onClose={() => setIsCallDetailDialing(false)}
                      />
                    ) : (
                      <Button
                        className="w-full gap-2"
                        onClick={() => setIsCallDetailDialing(true)}
                      >
                        <PhoneCall className="h-4 w-4" />
                        Call Back
                      </Button>
                    ))}
                </div>
              </div>
            </div>
          ) : channelFilter === "calls" ? (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <Phone className="h-14 w-14 mx-auto mb-3 opacity-20" />
                <p className="font-medium">Select a call</p>
                <p className="text-sm mt-1">
                  Choose from the list to view details
                </p>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <MessageCircle className="h-14 w-14 mx-auto mb-3 opacity-20" />
                <p className="font-medium">Select a conversation</p>
                <p className="text-sm mt-1">
                  Choose from the list to start messaging
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Right: Contact info panel */}
        {currentThread && (
          <div className="hidden lg:flex w-72 flex-shrink-0 border-l border-border bg-card flex-col">
            <div className="p-4 border-b border-border">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Contact
              </p>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-4 space-y-5">
                {/* Avatar + name */}
                <div className="flex flex-col items-center text-center gap-2">
                  <Avatar className="h-16 w-16">
                    <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
                      {getInitials(currentThread.client_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-foreground">
                      {currentThread.client_name || "Unknown"}
                    </p>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-xs mt-0.5",
                        getPriorityColor(currentThread.priority),
                      )}
                    >
                      {currentThread.priority}
                    </Badge>
                  </div>
                </div>

                <Separator />

                {/* Contact details */}
                <div className="space-y-3">
                  {currentThread.client_phone && (
                    <div className="flex items-start gap-3">
                      <div className="p-1.5 bg-primary/10 rounded-md flex-shrink-0">
                        <Phone className="h-3.5 w-3.5 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-muted-foreground font-medium">
                          Phone
                        </p>
                        <PhoneLink
                          phone={currentThread.client_phone}
                          clientName={currentThread.client_name}
                          clientId={currentThread.client_id}
                          noIcon
                          className="text-sm text-foreground"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          className={cn(
                            "mt-1.5 h-7 text-xs w-full gap-1.5",
                            isCallActive
                              ? "bg-green-50 border-green-300 text-green-700 hover:bg-green-100"
                              : "hover:bg-primary/10 hover:text-primary hover:border-primary/30",
                          )}
                          onClick={() => setIsCallActive((v) => !v)}
                        >
                          <Phone className="h-3 w-3" />
                          {isCallActive ? "In call" : "Start Call"}
                        </Button>
                      </div>
                    </div>
                  )}

                  {currentThread.client_email && (
                    <div className="flex items-start gap-3">
                      <div className="p-1.5 bg-blue-50 rounded-md flex-shrink-0">
                        <Mail className="h-3.5 w-3.5 text-blue-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground font-medium">
                          Email
                        </p>
                        <EmailLink
                          email={currentThread.client_email}
                          noIcon
                          className="text-sm text-foreground"
                        />
                      </div>
                    </div>
                  )}

                  {currentThread.application_id && (
                    <div className="flex items-start gap-3">
                      <div className="p-1.5 bg-muted rounded-md flex-shrink-0">
                        <Hash className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground font-medium">
                          Application
                        </p>
                        <p className="text-sm text-foreground font-mono">
                          {currentThread.application_id}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Conversation stats */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Conversation
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-muted rounded-lg p-2.5 text-center">
                      <p className="text-lg font-bold text-foreground">
                        {currentThread.message_count}
                      </p>
                      <p className="text-xs text-muted-foreground">Messages</p>
                    </div>
                    <div className="bg-muted rounded-lg p-2.5 text-center">
                      <p className="text-lg font-bold text-foreground">
                        {currentThread.unread_count}
                      </p>
                      <p className="text-xs text-muted-foreground">Unread</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-1.5 bg-muted rounded-md flex-shrink-0">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">
                      Last message
                    </p>
                    <p className="text-sm text-foreground">
                      {currentThread.last_message_at
                        ? formatTime(currentThread.last_message_at)
                        : "—"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      "p-1.5 rounded-md flex-shrink-0",
                      currentThread.last_message_type === "whatsapp"
                        ? "bg-[#25D366]/10"
                        : currentThread.last_message_type === "email"
                          ? "bg-blue-50"
                          : "bg-primary/10",
                    )}
                  >
                    <span
                      className={getChannelColor(
                        currentThread.last_message_type,
                      )}
                    >
                      {getChannelIcon(
                        currentThread.last_message_type,
                        "h-3.5 w-3.5",
                      )}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">
                      Channel
                    </p>
                    <p className="text-sm text-foreground capitalize">
                      {currentThread.last_message_type}
                    </p>
                  </div>
                </div>

                <Separator />

                {/* Status */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Status
                  </p>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-sm",
                      currentThread.status === "active"
                        ? "bg-green-50 text-green-700 border-green-200"
                        : currentThread.status === "archived"
                          ? "bg-muted text-muted-foreground"
                          : "bg-red-50 text-red-700 border-red-200",
                    )}
                  >
                    {currentThread.status}
                  </Badge>
                </div>
              </div>
            </ScrollArea>
          </div>
        )}
      </div>

      <NewConversationWizard
        isOpen={isNewConversationOpen}
        onClose={() => setIsNewConversationOpen(false)}
        templates={templates}
        onSendMessage={handleNewConversation}
        isSending={isSendingMessage}
      />

      {/* ── Dialpad overlay ── */}
      {isDialerOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-80 animate-in slide-in-from-bottom-4 duration-300">
          {isDialerCallActive && dialerNumber ? (
            <VoiceCallPanel
              phone={dialerNumber}
              clientName={null}
              onClose={() => {
                setIsDialerCallActive(false);
                setIsDialerOpen(false);
                setDialerNumber("");
              }}
            />
          ) : (
            <div className="bg-card border border-border shadow-2xl rounded-2xl overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-primary/10 rounded-lg">
                    <PhoneCall className="h-4 w-4 text-primary" />
                  </div>
                  <p className="text-sm font-semibold text-foreground">
                    Dialpad
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => {
                    setIsDialerOpen(false);
                    setDialerNumber("");
                  }}
                >
                  <PhoneOff className="h-3.5 w-3.5" />
                </Button>
              </div>

              {/* Number display */}
              <div className="px-4 pt-4 pb-2">
                <div className="flex items-center gap-2 bg-muted rounded-xl px-4 py-3">
                  <input
                    type="tel"
                    value={dialerNumber}
                    onChange={(e) => setDialerNumber(e.target.value)}
                    placeholder="Enter number…"
                    className="flex-1 bg-transparent text-lg font-mono tracking-wider text-foreground outline-none placeholder:text-muted-foreground/50"
                  />
                  {dialerNumber && (
                    <button
                      onClick={() => setDialerNumber((n) => n.slice(0, -1))}
                      className="p-1 rounded hover:bg-muted-foreground/10 transition-colors"
                    >
                      <Delete className="h-4 w-4 text-muted-foreground" />
                    </button>
                  )}
                </div>
              </div>

              {/* Keypad grid */}
              <div className="px-4 pb-2">
                {[
                  ["1", "2", "3"],
                  ["4", "5", "6"],
                  ["7", "8", "9"],
                  ["*", "0", "#"],
                ].map((row, rowIdx) => (
                  <div key={rowIdx} className="grid grid-cols-3 gap-2 mb-2">
                    {row.map((key) => (
                      <button
                        key={key}
                        onClick={() => setDialerNumber((n) => n + key)}
                        className="flex flex-col items-center justify-center h-14 rounded-xl bg-muted hover:bg-muted/70 active:scale-95 transition-all duration-100 select-none"
                      >
                        <span className="text-lg font-semibold text-foreground leading-none">
                          {key}
                        </span>
                        {key === "2" && (
                          <span className="text-[9px] text-muted-foreground tracking-widest mt-0.5">
                            ABC
                          </span>
                        )}
                        {key === "3" && (
                          <span className="text-[9px] text-muted-foreground tracking-widest mt-0.5">
                            DEF
                          </span>
                        )}
                        {key === "4" && (
                          <span className="text-[9px] text-muted-foreground tracking-widest mt-0.5">
                            GHI
                          </span>
                        )}
                        {key === "5" && (
                          <span className="text-[9px] text-muted-foreground tracking-widest mt-0.5">
                            JKL
                          </span>
                        )}
                        {key === "6" && (
                          <span className="text-[9px] text-muted-foreground tracking-widest mt-0.5">
                            MNO
                          </span>
                        )}
                        {key === "7" && (
                          <span className="text-[9px] text-muted-foreground tracking-widest mt-0.5">
                            PQRS
                          </span>
                        )}
                        {key === "8" && (
                          <span className="text-[9px] text-muted-foreground tracking-widest mt-0.5">
                            TUV
                          </span>
                        )}
                        {key === "9" && (
                          <span className="text-[9px] text-muted-foreground tracking-widest mt-0.5">
                            WXYZ
                          </span>
                        )}
                        {key === "0" && (
                          <span className="text-[9px] text-muted-foreground tracking-widest mt-0.5">
                            +
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                ))}
              </div>

              {/* Call button */}
              <div className="px-4 pb-4">
                <Button
                  className="w-full h-12 rounded-xl bg-green-600 hover:bg-green-700 text-white gap-2 text-base font-semibold shadow-md"
                  disabled={!dialerNumber.trim()}
                  onClick={() => {
                    if (dialerNumber.trim()) setIsDialerCallActive(true);
                  }}
                >
                  <Phone className="h-5 w-5" />
                  Call
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Phone Numbers Management Modal ── */}
      <Dialog open={isPhoneNumbersOpen} onOpenChange={setIsPhoneNumbersOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5 text-primary" />
              Phone Numbers
            </DialogTitle>
          </DialogHeader>

          {/* Outbound call sync section */}
          <div className="rounded-lg border border-border p-3 space-y-2">
            <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5 text-primary" />
              Outbound Call Configuration
            </p>
            <p className="text-xs text-muted-foreground">
              Sync the voice configuration to ensure outbound calls from the CRM
              are routed correctly through your Twilio application.
            </p>
            {callSetupStatus && (
              <div className="bg-green-50 border border-green-200 rounded p-2 text-xs text-green-700 font-mono break-all space-y-0.5">
                <p>
                  <span className="font-sans font-semibold">App SID:</span>{" "}
                  {callSetupStatus.twimlAppSid}
                </p>
                <p>
                  <span className="font-sans font-semibold">Voice URL:</span>{" "}
                  {callSetupStatus.voiceUrl}
                </p>
              </div>
            )}
            <Button
              size="sm"
              variant="outline"
              className="h-8 gap-1.5 text-xs w-full"
              onClick={syncCallSetup}
              disabled={isSyncingCallSetup}
            >
              {isSyncingCallSetup ? (
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Zap className="h-3.5 w-3.5 text-primary" />
              )}
              {isSyncingCallSetup ? "Syncing…" : "Sync Voice Configuration"}
            </Button>
          </div>

          {/* Actions row */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 text-xs"
              onClick={fetchPhoneNumbers}
              disabled={isLoadingNumbers}
            >
              <RefreshCw
                className={cn(
                  "h-3.5 w-3.5",
                  isLoadingNumbers && "animate-spin",
                )}
              />
              Refresh
            </Button>
            <Button
              size="sm"
              className="h-8 gap-1.5 text-xs bg-primary hover:bg-primary/90"
              onClick={() => configureNumber("all")}
              disabled={isConfiguringAll || isLoadingNumbers}
            >
              {isConfiguringAll ? (
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Zap className="h-3.5 w-3.5" />
              )}
              Configure All
            </Button>
          </div>

          {/* Numbers list */}
          <ScrollArea className="max-h-[420px]">
            {isLoadingNumbers ? (
              <div className="flex items-center justify-center py-10">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
              </div>
            ) : phoneNumbers.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground text-sm">
                No phone numbers found on your Twilio account.
              </div>
            ) : (
              <div className="space-y-2 pr-1">
                {phoneNumbers.map((num) => (
                  <div
                    key={num.sid}
                    className="rounded-lg border border-border bg-card overflow-hidden"
                  >
                    {/* Top row: icon + number info + webhook status */}
                    <div className="flex items-center gap-3 p-3">
                      <div
                        className={cn(
                          "p-2 rounded-full flex-shrink-0",
                          num.configured ? "bg-green-100" : "bg-amber-100",
                        )}
                      >
                        {num.configured ? (
                          <Wifi className="h-4 w-4 text-green-600" />
                        ) : (
                          <WifiOff className="h-4 w-4 text-amber-600" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-foreground">
                          {num.phoneNumber}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {num.friendlyName}
                        </p>
                        <div className="flex gap-1.5 mt-1">
                          {num.capabilities.voice && (
                            <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-medium">
                              Voice
                            </span>
                          )}
                          {num.capabilities.sms && (
                            <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-medium">
                              SMS
                            </span>
                          )}
                          {num.capabilities.mms && (
                            <span className="text-[10px] bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded font-medium">
                              MMS
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        {num.configured ? (
                          <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                            <CheckCircle className="h-3.5 w-3.5" />
                            Ready
                          </span>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs gap-1"
                            onClick={() => configureNumber(num.sid)}
                            disabled={configuringSid === num.sid}
                          >
                            {configuringSid === num.sid ? (
                              <RefreshCw className="h-3 w-3 animate-spin" />
                            ) : (
                              <Zap className="h-3 w-3" />
                            )}
                            Configure
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Bottom row: banker assignment */}
                    <div className="px-3 pb-3 flex items-center gap-2 border-t border-border/50 pt-2.5">
                      <Users className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                      <span className="text-xs text-muted-foreground flex-shrink-0">
                        Assigned to
                      </span>
                      <Select
                        value={num.assignedBrokerId?.toString() ?? "unassigned"}
                        onValueChange={(val) =>
                          assignNumber(
                            num.sid,
                            val === "unassigned" ? null : parseInt(val, 10),
                          )
                        }
                        disabled={assigningSid === num.sid}
                      >
                        <SelectTrigger className="h-7 text-xs flex-1 max-w-[200px]">
                          <SelectValue placeholder="Unassigned (shared)">
                            {assigningSid === num.sid ? (
                              <span className="flex items-center gap-1.5">
                                <RefreshCw className="h-3 w-3 animate-spin" />
                                Saving…
                              </span>
                            ) : num.assignedBrokerName ? (
                              num.assignedBrokerName
                            ) : (
                              <span className="text-muted-foreground">
                                Unassigned (shared)
                              </span>
                            )}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unassigned">
                            <span className="text-muted-foreground">
                              Unassigned (shared)
                            </span>
                          </SelectItem>
                          {brokerOptions.map((b) => (
                            <SelectItem key={b.id} value={b.id.toString()}>
                              {b.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {num.assignedBrokerName && (
                        <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-medium flex-shrink-0">
                          rings first on inbound
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Conversations;
