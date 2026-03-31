import React, { useEffect, useState, useRef } from "react";
import * as AblyLib from "ably";
import {
  MessageCircle,
  Send,
  Phone,
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
} from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import { MetaHelmet } from "@/components/MetaHelmet";
import NewConversationWizard from "@/components/NewConversationWizard";
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
import { useToast } from "@/hooks/use-toast";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchConversationThreads,
  fetchConversationMessages,
  sendMessage,
  fetchConversationTemplates,
  fetchConversationStats,
  setCurrentThread,
  setThreadsFilters,
  markConversationAsRead,
  checkWhatsAppAvailability,
} from "@/store/slices/conversationsSlice";
import { cn } from "@/lib/utils";
import type { ConversationThread, Communication } from "@shared/api";

type ChannelFilter = "all" | "sms" | "whatsapp" | "email";

const CHANNEL_TABS: { key: ChannelFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "sms", label: "SMS" },
  { key: "whatsapp", label: "WhatsApp" },
  { key: "email", label: "Email" },
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
  } = useAppSelector((state) => state.conversations);

  const currentPhone = currentThread?.client_phone ?? null;
  const whatsappStatus: boolean | null = currentPhone
    ? (whatsappAvailability[currentPhone] ?? null)
    : null;
  const whatsappAvailable =
    whatsappStatus === null ? false : whatsappStatus === true;

  const { toast } = useToast();

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
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
    const d = new Date(date);
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

  const getDateLabel = (date: string) => {
    const d = new Date(date);
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
      <div className="bg-card border-b border-border px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2 text-foreground">
              <MessageCircle className="h-6 w-6 text-primary" />
              Conversations
            </h1>
            <p className="text-sm text-muted-foreground">
              Manage client communications
            </p>
          </div>
          <Button
            onClick={() => setIsNewConversationOpen(true)}
            className="bg-primary hover:bg-primary/90"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Conversation
          </Button>
        </div>
      </div>

      {/* Main 3-column layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Thread list */}
        <div
          className={cn(
            "w-80 flex-shrink-0 border-r border-border flex flex-col bg-card",
            mobilePanel === "chat" ? "hidden md:flex" : "flex",
          )}
        >
          {/* Search + filter */}
          <div className="p-3 border-b border-border space-y-2">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-9 h-8 text-sm"
                />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 w-8 p-0">
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
                        selectedStatus === s && "bg-primary/10 text-primary",
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
                        selectedPriority === p && "bg-primary/10 text-primary",
                      )}
                    >
                      {p
                        ? p.charAt(0).toUpperCase() + p.slice(1)
                        : "All Priorities"}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Channel tabs */}
            <div className="flex rounded-lg bg-muted p-0.5 gap-0.5">
              {CHANNEL_TABS.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setChannelFilter(key)}
                  className={cn(
                    "flex-1 text-xs font-medium py-1 rounded-md transition-all",
                    channelFilter === key
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Thread list */}
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {isLoadingThreads ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
                </div>
              ) : filteredThreads.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <MessageCircle className="h-10 w-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">
                    No{" "}
                    {channelFilter !== "all" ? channelFilter.toUpperCase() : ""}{" "}
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
                      currentThread?.conversation_id === thread.conversation_id
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
                          <a
                            href={`tel:${currentThread.client_phone}`}
                            className="flex items-center gap-1 hover:text-primary transition-colors"
                          >
                            <Phone className="h-3 w-3" />
                            {currentThread.client_phone}
                          </a>
                        )}
                        {currentThread.client_email && (
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {currentThread.client_email}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
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
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground font-medium">
                          Phone
                        </p>
                        <a
                          href={`tel:${currentThread.client_phone}`}
                          className="text-sm text-foreground hover:text-primary transition-colors flex items-center gap-1 group"
                        >
                          {currentThread.client_phone}
                          <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </a>
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
                        <a
                          href={`mailto:${currentThread.client_email}`}
                          className="text-sm text-foreground hover:text-primary transition-colors truncate block"
                        >
                          {currentThread.client_email}
                        </a>
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
    </div>
  );
};

export default Conversations;
