import React, { useEffect, useState, useRef } from "react";
import {
  MessageSquare,
  Send,
  Phone,
  Mail,
  Search,
  Filter,
  MoreVertical,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  FileText,
  Paperclip,
  Smile,
  Archive,
  Trash2,
  Star,
  User,
  Building,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchConversations,
  fetchConversationMessages,
  sendMessage,
  fetchConversationTemplates,
  setSelectedConversation,
  markConversationAsRead,
} from "@/store/slices/conversationsSlice";
import { fetchClients } from "@/store/slices/clientsSlice";

// Helper function to format time distance
const formatTimeAgo = (date: string | Date) => {
  const now = new Date();
  const past = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

  if (diffInSeconds < 60) return "just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800)
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  return past.toLocaleDateString();
};

const ConversationsPage = () => {
  const dispatch = useAppDispatch();
  const {
    conversations,
    currentConversationMessages,
    templates,
    loading,
    messagesLoading,
    sending,
    selectedConversationId,
  } = useAppSelector((state) => state.conversations);
  const { clients } = useAppSelector((state) => state.clients);

  const [searchTerm, setSearchTerm] = useState("");
  const [messageText, setMessageText] = useState("");
  const [showNewConversation, setShowNewConversation] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [messageType, setMessageType] = useState<"sms" | "whatsapp" | "email">(
    "sms",
  );
  const [selectedClient, setSelectedClient] = useState<number | null>(null);
  const [emailSubject, setEmailSubject] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    dispatch(fetchConversations(undefined));
    dispatch(fetchConversationTemplates(undefined));
    dispatch(fetchClients());

    // Poll for new conversations/updates every 30 seconds
    const interval = setInterval(() => {
      dispatch(fetchConversations(undefined));
    }, 30000);

    return () => clearInterval(interval);
  }, []); // Remove dispatch dependency to prevent re-running

  useEffect(() => {
    if (selectedConversationId) {
      dispatch(
        fetchConversationMessages({ conversationId: selectedConversationId }),
      );
      dispatch(markConversationAsRead(selectedConversationId));
    }
  }, [selectedConversationId, dispatch]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentConversationMessages]);

  const filteredConversations = conversations.filter(
    (conv) =>
      conv.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conv.last_message_preview
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()),
  );

  const selectedConversation = conversations.find(
    (conv) => conv.conversation_id === selectedConversationId,
  );

  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedConversationId) return;

    const conversation = selectedConversation;
    if (!conversation?.client_id) return;

    try {
      await dispatch(
        sendMessage({
          to_user_id: conversation.client_id,
          application_id: conversation.application_id,
          communication_type: messageType,
          body: messageText,
          subject: messageType === "email" ? emailSubject : undefined,
          conversation_id: selectedConversationId,
        }),
      );

      setMessageText("");
      setEmailSubject("");
      inputRef.current?.focus();
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  const handleNewConversation = async () => {
    if (!selectedClient || !messageText.trim()) return;

    try {
      await dispatch(
        sendMessage({
          to_user_id: selectedClient,
          communication_type: messageType,
          body: messageText,
          subject: messageType === "email" ? emailSubject : undefined,
        }),
      );

      setMessageText("");
      setEmailSubject("");
      setSelectedClient(null);
      setShowNewConversation(false);
    } catch (error) {
      console.error("Failed to start conversation:", error);
    }
  };

  const getMessageTypeIcon = (type: string) => {
    switch (type) {
      case "whatsapp":
        return <MessageSquare className="h-3 w-3 text-green-600" />;
      case "sms":
        return <Phone className="h-3 w-3 text-blue-600" />;
      case "email":
        return <Mail className="h-3 w-3 text-purple-600" />;
      default:
        return <MessageSquare className="h-3 w-3" />;
    }
  };

  const getMessageTypeColor = (type: string) => {
    switch (type) {
      case "whatsapp":
        return "border-l-green-500 bg-green-50";
      case "sms":
        return "border-l-blue-500 bg-blue-50";
      case "email":
        return "border-l-purple-500 bg-purple-50";
      default:
        return "border-l-gray-500 bg-gray-50";
    }
  };

  const getDeliveryStatusIcon = (status: string) => {
    switch (status) {
      case "delivered":
      case "read":
        return <CheckCircle2 className="h-3 w-3 text-green-600" />;
      case "sent":
        return <CheckCircle2 className="h-3 w-3 text-blue-600" />;
      case "failed":
        return <AlertCircle className="h-3 w-3 text-red-600" />;
      default:
        return <Clock className="h-3 w-3 text-yellow-600" />;
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-background">
      {/* Conversations List */}
      <div className="w-80 border-r bg-muted/30">
        <div className="p-4 border-b bg-background/95 backdrop-blur-sm sticky top-0 z-10">
          <div className="flex items-center gap-2 mb-3">
            <MessageSquare className="h-5 w-5 text-primary" />
            <h1 className="font-semibold">Conversations</h1>
            <Button
              size="sm"
              onClick={() => setShowNewConversation(true)}
              className="ml-auto h-7 px-2"
            >
              <Plus className="h-3 w-3 mr-1" />
              New
            </Button>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No conversations found</p>
              </div>
            ) : (
              filteredConversations.map((conversation) => (
                <Card
                  key={conversation.id}
                  className={cn(
                    "cursor-pointer transition-all duration-200 hover:shadow-sm border-0",
                    selectedConversationId === conversation.conversation_id
                      ? "bg-primary/10 ring-1 ring-primary/20"
                      : "hover:bg-muted/50",
                  )}
                  onClick={() =>
                    dispatch(
                      setSelectedConversation(conversation.conversation_id),
                    )
                  }
                >
                  <CardContent className="p-3">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-10 w-10 ring-1 ring-border">
                        <AvatarFallback className="bg-primary/10 text-primary text-sm">
                          {conversation.client_name?.charAt(0) || "?"}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-sm truncate">
                            {conversation.client_name || "Unknown Client"}
                          </h4>
                          {conversation.unread_count > 0 && (
                            <Badge
                              variant="destructive"
                              className="h-5 px-1.5 text-xs"
                            >
                              {conversation.unread_count}
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center gap-1 mb-1">
                          {getMessageTypeIcon(conversation.last_message_type)}
                          <span className="text-xs text-muted-foreground capitalize">
                            {conversation.last_message_type}
                          </span>
                          {conversation.application_number && (
                            <>
                              <span className="text-muted-foreground">•</span>
                              <span className="text-xs text-muted-foreground">
                                {conversation.application_number}
                              </span>
                            </>
                          )}
                        </div>

                        <p className="text-xs text-muted-foreground line-clamp-2 mb-1">
                          {conversation.last_message_preview}
                        </p>

                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">
                            {formatTimeAgo(conversation.last_message_at)}
                          </span>
                          {conversation.priority !== "normal" && (
                            <Badge
                              variant={
                                conversation.priority === "urgent"
                                  ? "destructive"
                                  : "secondary"
                              }
                              className="h-4 px-1 text-xs"
                            >
                              {conversation.priority}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Messages Area */}
      <div className="flex-1 flex flex-col">
        {selectedConversationId && selectedConversation ? (
          <>
            {/* Header */}
            <div className="p-4 border-b bg-background/95 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 ring-1 ring-border">
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {selectedConversation.client_name?.charAt(0) || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold">
                      {selectedConversation.client_name || "Unknown Client"}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      {selectedConversation.client_phone && (
                        <span>{selectedConversation.client_phone}</span>
                      )}
                      {selectedConversation.client_email && (
                        <>
                          {selectedConversation.client_phone && <span>•</span>}
                          <span>{selectedConversation.client_email}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {selectedConversation.application_number && (
                    <Badge variant="outline" className="gap-1">
                      <Building className="h-3 w-3" />
                      {selectedConversation.application_number}
                    </Badge>
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
                        Star Conversation
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Archive className="h-4 w-4 mr-2" />
                        Archive
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              {messagesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
              ) : (
                <div className="space-y-4">
                  {currentConversationMessages.map((message) => (
                    <div
                      key={message.id}
                      className={cn(
                        "flex gap-3",
                        message.direction === "outbound"
                          ? "flex-row-reverse"
                          : "",
                      )}
                    >
                      <Avatar className="h-8 w-8 ring-1 ring-border">
                        <AvatarFallback className="bg-primary/10 text-primary text-xs">
                          {message.direction === "outbound"
                            ? "B"
                            : message.sender_name?.charAt(0) || "C"}
                        </AvatarFallback>
                      </Avatar>

                      <div
                        className={cn(
                          "max-w-[70%] space-y-1",
                          message.direction === "outbound"
                            ? "items-end"
                            : "items-start",
                        )}
                      >
                        <div
                          className={cn(
                            "rounded-lg px-3 py-2 border-l-4",
                            message.direction === "outbound"
                              ? "bg-primary/10 border-l-primary"
                              : getMessageTypeColor(message.communication_type),
                          )}
                        >
                          {message.subject && (
                            <p className="font-medium text-sm mb-1">
                              {message.subject}
                            </p>
                          )}
                          <p className="text-sm whitespace-pre-wrap break-words">
                            {message.body}
                          </p>
                        </div>

                        <div
                          className={cn(
                            "flex items-center gap-2 text-xs text-muted-foreground",
                            message.direction === "outbound"
                              ? "flex-row-reverse"
                              : "",
                          )}
                        >
                          {getMessageTypeIcon(message.communication_type)}
                          <span>{formatTimeAgo(message.created_at)}</span>
                          {message.direction === "outbound" && (
                            <>
                              {getDeliveryStatusIcon(message.delivery_status)}
                              <span className="capitalize">
                                {message.delivery_status}
                              </span>
                            </>
                          )}
                          {message.cost && (
                            <span className="text-green-600">
                              ${message.cost.toFixed(4)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </ScrollArea>

            {/* Message Input */}
            <div className="p-4 border-t bg-background/95 backdrop-blur-sm">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Select
                    value={messageType}
                    onValueChange={(value: "sms" | "whatsapp" | "email") =>
                      setMessageType(value)
                    }
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sms">SMS</SelectItem>
                      <SelectItem value="whatsapp">WhatsApp</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowTemplates(true)}
                    className="gap-1"
                  >
                    <FileText className="h-3 w-3" />
                    Templates
                  </Button>
                </div>

                {messageType === "email" && (
                  <Input
                    placeholder="Email subject..."
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                  />
                )}

                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <Textarea
                      ref={inputRef}
                      placeholder={`Type your ${messageType} message...`}
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      rows={2}
                      className="resize-none"
                    />
                  </div>
                  <Button
                    onClick={handleSendMessage}
                    disabled={!messageText.trim() || sending}
                    className="gap-1"
                  >
                    {sending ? (
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current"></div>
                    ) : (
                      <Send className="h-3 w-3" />
                    )}
                    Send
                  </Button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-center">
            <div className="max-w-md">
              <MessageSquare className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="font-semibold text-lg mb-2">
                Select a conversation
              </h3>
              <p className="text-muted-foreground mb-4">
                Choose a conversation from the list to start messaging your
                clients
              </p>
              <Button
                onClick={() => setShowNewConversation(true)}
                className="gap-1"
              >
                <Plus className="h-4 w-4" />
                Start New Conversation
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* New Conversation Modal */}
      <Dialog open={showNewConversation} onOpenChange={setShowNewConversation}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Start New Conversation</DialogTitle>
            <DialogDescription>
              Send a message to start a new conversation with a client
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="client">Client</Label>
              <Select
                value={selectedClient?.toString() || ""}
                onValueChange={(value) => setSelectedClient(parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a client..." />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id.toString()}>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        {client.first_name} {client.last_name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="message-type">Message Type</Label>
              <Select
                value={messageType}
                onValueChange={(value: "sms" | "whatsapp" | "email") =>
                  setMessageType(value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sms">SMS</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {messageType === "email" && (
              <div>
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  placeholder="Email subject..."
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                />
              </div>
            )}

            <div>
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                placeholder={`Type your ${messageType} message...`}
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowNewConversation(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleNewConversation}
              disabled={!selectedClient || !messageText.trim() || sending}
            >
              {sending ? "Sending..." : "Send Message"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Templates Modal */}
      <Dialog open={showTemplates} onOpenChange={setShowTemplates}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Message Templates</DialogTitle>
            <DialogDescription>
              Choose a template to quickly send common messages
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-2">
              {templates
                .filter((t) => t.template_type === messageType)
                .map((template) => (
                  <Card
                    key={template.id}
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => {
                      setMessageText(template.body);
                      if (template.subject) setEmailSubject(template.subject);
                      setShowTemplates(false);
                    }}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">{template.name}</h4>
                        <Badge variant="outline">{template.category}</Badge>
                      </div>
                      {template.description && (
                        <p className="text-sm text-muted-foreground">
                          {template.description}
                        </p>
                      )}
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-sm line-clamp-3">{template.body}</p>
                      {template.variables.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {template.variables.map((variable) => (
                            <Badge
                              key={variable}
                              variant="secondary"
                              className="text-xs"
                            >
                              {variable}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ConversationsPage;
