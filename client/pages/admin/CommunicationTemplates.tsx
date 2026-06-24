import React, { useEffect, useRef, useState } from "react";
import {
  Mail,
  MessageSquare,
  Plus,
  Pencil,
  Trash2,
  Eye,
  Save,
  X,
  Loader2,
} from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import { MetaHelmet } from "@/components/MetaHelmet";
import { PageHeader } from "@/components/layout/PageHeader";
import { adminPageMeta } from "@/lib/seo-helpers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import VariableTextarea from "@/components/ui/VariableTextarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchEmailTemplates,
  createEmailTemplate,
  updateEmailTemplate,
  deleteEmailTemplate,
  fetchSmsTemplates,
  createSmsTemplate,
  updateSmsTemplate,
  deleteSmsTemplate,
  fetchWhatsappTemplates,
  createWhatsappTemplate,
  updateWhatsappTemplate,
  deleteWhatsappTemplate,
} from "@/store/slices/communicationTemplatesSlice";
import type { CommunicationType } from "@shared/api";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import {
  bindQuillMergeTagListeners,
  insertMergeTagInQuill,
} from "@/lib/quillMergeTags";
import { cn } from "@/lib/utils";

// ─── Constants ────────────────────────────────────────────────────────────────

const EMAIL_VARIABLES = [
  "first_name",
  "client_name",
  "application_number",
  "application_id",
  "broker_name",
  "loan_amount",
  "interest_rate",
  "closing_date",
  "loan_type",
  "status",
];

const SMS_VARIABLES = [
  "first_name",
  "client_name",
  "application_number",
  "application_id",
  "broker_name",
  "status_message",
  "document_count",
  "loan_type",
];

const WA_VARIABLES = [
  "client_name",
  "first_name",
  "application_number",
  "broker_name",
  "status",
  "missing_documents",
  "portal_link",
  "due_date",
];

const VARIABLE_HINTS: Record<string, string> = {
  first_name: "Client's first name only",
  client_name: "Client's full name (first + last)",
  application_number: "Loan application reference number",
  application_id: "Internal application ID",
  broker_name: "Your full name (loan officer)",
  loan_amount: "Total requested loan amount",
  interest_rate: "Loan interest rate",
  closing_date: "Estimated or confirmed closing date",
  loan_type: "Type of loan (e.g. Conventional, FHA)",
  status: "Current application status",
  status_message: "Human-readable status update message",
  document_count: "Number of pending documents",
  missing_documents: "List of missing documents",
  portal_link: "Link to the client portal",
  due_date: "Document or task due date",
};

const CHANNELS: {
  value: CommunicationType;
  label: string;
  icon: React.ReactNode;
  color: string;
}[] = [
  {
    value: "email",
    label: "Email",
    icon: <Mail className="h-4 w-4" />,
    color: "text-blue-500",
  },
  {
    value: "sms",
    label: "SMS",
    icon: <MessageSquare className="h-4 w-4" />,
    color: "text-purple-500",
  },
  {
    value: "whatsapp",
    label: "WhatsApp",
    icon: <FaWhatsapp className="h-4 w-4" />,
    color: "text-green-500",
  },
];

// ─── Component ─────────────────────────────────────────────────────────────────

const CommunicationTemplates = () => {
  const dispatch = useAppDispatch();
  const { emailTemplates, smsTemplates, whatsappTemplates, isLoading } =
    useAppSelector((state) => state.communicationTemplates);
  const { toast } = useToast();

  const [channelTab, setChannelTab] = useState<CommunicationType>("email");
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<{
    id: number;
    name: string;
    type: CommunicationType;
  } | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  const [previewContent, setPreviewContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Email form
  const [emailFormData, setEmailFormData] = useState({
    name: "",
    subject: "",
    body_html: "",
    body_text: "",
    template_type: "custom" as const,
    is_active: true,
  });

  // SMS form
  const [smsFormData, setSmsFormData] = useState({
    name: "",
    body: "",
    template_type: "custom" as string,
    is_active: true,
  });

  // WhatsApp form
  const [waFormData, setWaFormData] = useState({
    name: "",
    body: "",
    template_type: "custom" as string,
    is_active: true,
  });

  useEffect(() => {
    dispatch(fetchEmailTemplates());
    dispatch(fetchSmsTemplates());
    dispatch(fetchWhatsappTemplates());
  }, [dispatch]);

  // ── Helpers ─────────────────────────────────────────────────────────────────

  const formatLabel = (val: string) =>
    val
      .split("_")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");

  const quillRef = useRef<any>(null);
  const quillContainerRef = useRef<HTMLDivElement>(null);
  const [quillVarDropdown, setQuillVarDropdown] = useState<{
    open: boolean;
    filter: string;
    selectedIndex: number;
  }>({ open: false, filter: "", selectedIndex: 0 });

  useEffect(() => {
    if (!isEditorOpen || channelTab !== "email") {
      setQuillVarDropdown({ open: false, filter: "", selectedIndex: 0 });
      return;
    }

    let cleanup: (() => void) | undefined;
    const attach = () => {
      const editor = quillRef.current?.getEditor();
      if (!editor) return false;
      cleanup = bindQuillMergeTagListeners(editor, ({ active, filter }) => {
        setQuillVarDropdown((prev) => ({
          open: active,
          filter,
          selectedIndex: active ? 0 : prev.selectedIndex,
        }));
      });
      return true;
    };

    if (!attach()) {
      const timer = window.setTimeout(attach, 50);
      return () => {
        window.clearTimeout(timer);
        cleanup?.();
      };
    }

    return () => cleanup?.();
  }, [isEditorOpen, channelTab]);

  const insertQuillVariable = (varName: string) => {
    const editor = quillRef.current?.getEditor();
    if (!editor) return;
    insertMergeTagInQuill(editor, `{{${varName}}}`);
  };

  const insertQuillVariableFromDropdown = (varName: string) => {
    const editor = quillRef.current?.getEditor();
    if (!editor) return;
    insertMergeTagInQuill(editor, `{{${varName}}}`);
    setQuillVarDropdown({ open: false, filter: "", selectedIndex: 0 });
  };

  const handleQuillChange = (content: string) => {
    setEmailFormData((prev) => ({ ...prev, body_html: content }));
  };

  const handleQuillKeyDown = (e: React.KeyboardEvent) => {
    if (!quillVarDropdown.open) return;
    const filtered = EMAIL_VARIABLES.filter((v) =>
      v.startsWith(quillVarDropdown.filter),
    );
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setQuillVarDropdown((prev) => ({
        ...prev,
        selectedIndex: Math.min(prev.selectedIndex + 1, filtered.length - 1),
      }));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setQuillVarDropdown((prev) => ({
        ...prev,
        selectedIndex: Math.max(prev.selectedIndex - 1, 0),
      }));
    } else if ((e.key === "Enter" || e.key === "Tab") && filtered.length > 0) {
      e.preventDefault();
      insertQuillVariableFromDropdown(
        filtered[quillVarDropdown.selectedIndex] ?? filtered[0],
      );
    } else if (e.key === "Escape") {
      setQuillVarDropdown((prev) => ({ ...prev, open: false }));
    }
  };

  const quillModules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ["bold", "italic", "underline"],
      [{ color: [] }, { background: [] }],
      [{ list: "ordered" }, { list: "bullet" }],
      [{ align: [] }],
      ["link"],
    ],
  };

  // ── CRUD helpers ────────────────────────────────────────────────────────────

  const openEditor = (type: CommunicationType, template?: any) => {
    setChannelTab(type);
    setEditingTemplate(template ? { ...template, type } : null);
    if (type === "email") {
      setEmailFormData(
        template
          ? {
              name: template.name,
              subject: template.subject,
              body_html: template.body_html,
              body_text: template.body_text || "",
              template_type: template.template_type,
              is_active: template.is_active,
            }
          : {
              name: "",
              subject: "",
              body_html: "",
              body_text: "",
              template_type: "custom",
              is_active: true,
            },
      );
    } else if (type === "sms") {
      setSmsFormData(
        template
          ? {
              name: template.name,
              body: template.body,
              template_type: template.template_type,
              is_active: template.is_active,
            }
          : { name: "", body: "", template_type: "custom", is_active: true },
      );
    } else {
      setWaFormData(
        template
          ? {
              name: template.name,
              body: template.body,
              template_type: template.template_type,
              is_active: template.is_active,
            }
          : { name: "", body: "", template_type: "custom", is_active: true },
      );
    }
    setIsEditorOpen(true);
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const type = editingTemplate?.type || channelTab;
      if (type === "email") {
        if (editingTemplate) {
          await dispatch(
            updateEmailTemplate({ id: editingTemplate.id, ...emailFormData }),
          ).unwrap();
        } else {
          await dispatch(createEmailTemplate(emailFormData)).unwrap();
        }
      } else if (type === "sms") {
        if (smsFormData.body.length > 1600) {
          toast({
            title: "Error",
            description: "SMS body cannot exceed 1600 characters",
            variant: "destructive",
          });
          return;
        }
        if (editingTemplate) {
          await dispatch(
            updateSmsTemplate({ id: editingTemplate.id, ...smsFormData }),
          ).unwrap();
        } else {
          await dispatch(createSmsTemplate(smsFormData)).unwrap();
        }
      } else {
        if (editingTemplate) {
          await dispatch(
            updateWhatsappTemplate({ id: editingTemplate.id, ...waFormData }),
          ).unwrap();
        } else {
          await dispatch(createWhatsappTemplate(waFormData)).unwrap();
        }
      }
      setIsEditorOpen(false);
      toast({
        title: "Success",
        description: `${formatLabel(type)} template ${editingTemplate ? "updated" : "created"} successfully`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error || "Failed to save template",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = (id: number, name: string, type: CommunicationType) => {
    setTemplateToDelete({ id, name, type });
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!templateToDelete) return;
    try {
      if (templateToDelete.type === "email") {
        await dispatch(deleteEmailTemplate(templateToDelete.id)).unwrap();
      } else if (templateToDelete.type === "sms") {
        await dispatch(deleteSmsTemplate(templateToDelete.id)).unwrap();
      } else {
        await dispatch(deleteWhatsappTemplate(templateToDelete.id)).unwrap();
      }
      toast({ title: "Success", description: "Template deleted" });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error || "Failed to delete template",
        variant: "destructive",
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setTemplateToDelete(null);
    }
  };

  // ── Template card renderer ────────────────────────────────────────────────────

  const renderTemplateCards = (
    templates: any[],
    type: CommunicationType,
    bodyKey: string,
    subText?: (t: any) => string,
  ) =>
    templates.length === 0 ? (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4 text-muted-foreground">
            {CHANNELS.find((c) => c.value === type)?.icon}
          </div>
          <h3 className="text-lg font-semibold mb-2">
            No {formatLabel(type)} templates yet
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Create your first template to get started
          </p>
          <Button onClick={() => openEditor(type)} className="gap-2">
            <Plus className="h-4 w-4" />
            Create Template
          </Button>
        </CardContent>
      </Card>
    ) : (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {templates.map((template) => (
          <Card
            key={template.id}
            className="group hover:shadow-lg transition-all duration-200"
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-base truncate">
                    {template.name}
                  </CardTitle>
                  {subText && (
                    <CardDescription className="text-xs mt-1 truncate">
                      {subText(template)}
                    </CardDescription>
                  )}
                </div>
                <Badge
                  variant={template.is_active ? "default" : "secondary"}
                  className="ml-2 shrink-0"
                >
                  {template.is_active ? "Active" : "Inactive"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-xs text-muted-foreground">
                Type: {formatLabel(template.template_type || "")}
              </div>
              {type !== "email" && (
                <div className="text-sm line-clamp-3 p-2 bg-muted rounded-md">
                  {template[bodyKey]}
                </div>
              )}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => {
                    setPreviewContent(template[bodyKey]);
                    setIsPreviewOpen(true);
                  }}
                >
                  <Eye className="h-3 w-3 mr-1" />
                  Preview
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => openEditor(type, template)}
                >
                  <Pencil className="h-3 w-3 mr-1" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(template.id, template.name, type)}
                >
                  <Trash2 className="h-3 w-3 text-destructive" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <>
      <MetaHelmet
        {...adminPageMeta(
          "Communication Templates",
          "Manage email, SMS and WhatsApp templates",
        )}
      />
      <div className="p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <PageHeader
          icon={<MessageSquare className="h-7 w-7 text-primary" />}
          title="Communication Templates"
          description="Manage message templates and automate communications across the loan pipeline"
        />

        {/* ── Templates ────────────────────────────────────────────────────── */}
        <Tabs
          value={channelTab}
          onValueChange={(v) => setChannelTab(v as CommunicationType)}
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
            <TabsList>
              <TabsTrigger value="email" className="gap-2">
                <Mail className="h-4 w-4" />
                Email ({emailTemplates.length})
              </TabsTrigger>
              <TabsTrigger value="sms" className="gap-2">
                <MessageSquare className="h-4 w-4" />
                SMS ({smsTemplates.length})
              </TabsTrigger>
              {/* WhatsApp tab hidden — feature not enabled */}
            </TabsList>
            <Button onClick={() => openEditor(channelTab)} className="gap-2">
              <Plus className="h-4 w-4" />
              New {formatLabel(channelTab)} Template
            </Button>
          </div>

          <TabsContent value="email" className="mt-0">
            {isLoading ? (
              <div className="text-center py-12 text-muted-foreground">
                Loading email templates…
              </div>
            ) : (
              renderTemplateCards(
                emailTemplates,
                "email",
                "body_html",
                (t) => t.subject,
              )
            )}
          </TabsContent>

          <TabsContent value="sms" className="mt-0">
            {isLoading ? (
              <div className="text-center py-12 text-muted-foreground">
                Loading SMS templates…
              </div>
            ) : (
              renderTemplateCards(
                smsTemplates,
                "sms",
                "body",
                (t) => `${t.body.length} / 1600 chars`,
              )
            )}
          </TabsContent>

          {/* WhatsApp tab content hidden */}
          <TabsContent value="whatsapp" className="mt-0 hidden">
            {isLoading ? (
              <div className="text-center py-12 text-muted-foreground">
                Loading WhatsApp templates…
              </div>
            ) : (
              renderTemplateCards(whatsappTemplates, "whatsapp", "body")
            )}
          </TabsContent>
        </Tabs>

        {/* ── Editor Dialog ── */}
        <Dialog open={isEditorOpen} onOpenChange={setIsEditorOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {
                  CHANNELS.find(
                    (c) => c.value === (editingTemplate?.type || channelTab),
                  )?.icon
                }
                {editingTemplate ? "Edit" : "New"}{" "}
                {formatLabel(editingTemplate?.type || channelTab)} Template
              </DialogTitle>
              <DialogDescription>
                {(editingTemplate?.type || channelTab) === "email"
                  ? "Rich HTML email template with full formatting support"
                  : (editingTemplate?.type || channelTab) === "sms"
                    ? "Plain-text SMS template (max 1600 characters)"
                    : "WhatsApp message template (supports emoji and *bold* formatting)"}
              </DialogDescription>
            </DialogHeader>

            {/* Channel selector — only shown when creating a new template */}
            {!editingTemplate && (
              <div className="flex items-center gap-2 p-1 bg-muted rounded-lg w-fit">
                <button
                  type="button"
                  onClick={() => openEditor("email")}
                  className={cn(
                    "flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all",
                    channelTab === "email"
                      ? "bg-background shadow-sm text-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Mail className="h-3.5 w-3.5" />
                  Email
                </button>
                <button
                  type="button"
                  onClick={() => openEditor("sms")}
                  className={cn(
                    "flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all",
                    channelTab === "sms"
                      ? "bg-background shadow-sm text-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                  SMS
                </button>
              </div>
            )}

            {/* EMAIL FORM */}
            {(editingTemplate?.type || channelTab) === "email" && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Template Name</Label>
                    <Input
                      value={emailFormData.name}
                      onChange={(e) =>
                        setEmailFormData({
                          ...emailFormData,
                          name: e.target.value,
                        })
                      }
                      placeholder="e.g., Welcome Email"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Template Type</Label>
                    <Select
                      value={emailFormData.template_type}
                      onValueChange={(v: any) =>
                        setEmailFormData({ ...emailFormData, template_type: v })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="welcome">Welcome</SelectItem>
                        <SelectItem value="status_update">
                          Status Update
                        </SelectItem>
                        <SelectItem value="document_request">
                          Document Request
                        </SelectItem>
                        <SelectItem value="approval">Approval</SelectItem>
                        <SelectItem value="denial">Denial</SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Subject</Label>
                  <Input
                    value={emailFormData.subject}
                    onChange={(e) =>
                      setEmailFormData({
                        ...emailFormData,
                        subject: e.target.value,
                      })
                    }
                    placeholder="e.g., Your application has been received"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Body (HTML)</Label>
                  <div
                    className="relative border rounded-md"
                    ref={quillContainerRef}
                    onKeyDown={handleQuillKeyDown}
                  >
                    <ReactQuill
                      ref={quillRef}
                      theme="snow"
                      value={emailFormData.body_html}
                      onChange={handleQuillChange}
                      modules={quillModules}
                      className="h-64"
                    />
                    {quillVarDropdown.open &&
                      (() => {
                        const filtered = EMAIL_VARIABLES.filter((v) =>
                          v.startsWith(quillVarDropdown.filter),
                        );
                        if (filtered.length === 0) return null;
                        return (
                          <div className="absolute z-50 bottom-full mb-1 left-2 w-64 rounded-lg border border-border bg-popover shadow-xl overflow-hidden">
                            <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground border-b border-border bg-muted/50">
                              Insert variable
                            </div>
                            <div className="max-h-44 overflow-y-auto">
                              {filtered.map((v, i) => (
                                <button
                                  key={v}
                                  type="button"
                                  onMouseDown={(e) => {
                                    e.preventDefault();
                                    insertQuillVariableFromDropdown(v);
                                  }}
                                  className={cn(
                                    "w-full text-left px-3 py-2 text-sm font-mono flex items-center gap-1 transition-colors",
                                    i === quillVarDropdown.selectedIndex
                                      ? "bg-primary text-primary-foreground"
                                      : "hover:bg-muted",
                                  )}
                                >
                                  <span className="opacity-50 text-xs">
                                    {"{{"}
                                  </span>
                                  <span>{v}</span>
                                  <span className="opacity-50 text-xs">
                                    {"}}"[0]}
                                    {"}}"[1]}
                                  </span>
                                </button>
                              ))}
                            </div>
                            <div className="px-3 py-1 text-[10px] text-muted-foreground border-t border-border bg-muted/30">
                              ↑↓ navigate · Enter to insert · Esc to dismiss
                            </div>
                          </div>
                        );
                      })()}
                  </div>
                  <div className="pt-16 space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">
                      Click to insert variable:
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {EMAIL_VARIABLES.map((v) => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => insertQuillVariable(v)}
                          title={VARIABLE_HINTS[v]}
                          className="inline-flex items-center rounded px-2 py-0.5 text-xs font-mono bg-muted hover:bg-primary hover:text-primary-foreground transition-colors border border-border"
                        >
                          {`{{${v}}}`}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={emailFormData.is_active}
                    onCheckedChange={(v) =>
                      setEmailFormData({ ...emailFormData, is_active: v })
                    }
                  />
                  <Label>Active</Label>
                </div>
              </div>
            )}

            {/* SMS FORM */}
            {(editingTemplate?.type || channelTab) === "sms" && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Template Name</Label>
                    <Input
                      value={smsFormData.name}
                      onChange={(e) =>
                        setSmsFormData({ ...smsFormData, name: e.target.value })
                      }
                      placeholder="e.g., Document Reminder"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Template Type</Label>
                    <Select
                      value={smsFormData.template_type}
                      onValueChange={(v) =>
                        setSmsFormData({ ...smsFormData, template_type: v })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="reminder">Reminder</SelectItem>
                        <SelectItem value="status_update">
                          Status Update
                        </SelectItem>
                        <SelectItem value="document_request">
                          Document Request
                        </SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Message</Label>
                    <span
                      className={cn(
                        "text-xs",
                        smsFormData.body.length > 1600
                          ? "text-destructive font-semibold"
                          : "text-muted-foreground",
                      )}
                    >
                      {smsFormData.body.length} / 1600
                    </span>
                  </div>
                  <VariableTextarea
                    value={smsFormData.body}
                    onChange={(v) =>
                      setSmsFormData({ ...smsFormData, body: v })
                    }
                    variables={SMS_VARIABLES}
                    variableHints={VARIABLE_HINTS}
                    placeholder="Enter your SMS message… Type {{ to insert a variable"
                    className="h-48"
                    maxLength={1600}
                  />
                  <p className="text-xs text-muted-foreground">
                    Type{" "}
                    <code className="font-mono bg-muted px-1 rounded">
                      {"{{"}
                    </code>{" "}
                    to insert a variable
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={smsFormData.is_active}
                    onCheckedChange={(v) =>
                      setSmsFormData({ ...smsFormData, is_active: v })
                    }
                  />
                  <Label>Active</Label>
                </div>
              </div>
            )}

            {/* WHATSAPP FORM */}
            {(editingTemplate?.type || channelTab) === "whatsapp" && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Template Name</Label>
                    <Input
                      value={waFormData.name}
                      onChange={(e) =>
                        setWaFormData({ ...waFormData, name: e.target.value })
                      }
                      placeholder="e.g., Application Update"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Template Type</Label>
                    <Select
                      value={waFormData.template_type}
                      onValueChange={(v) =>
                        setWaFormData({ ...waFormData, template_type: v })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="reminder">Reminder</SelectItem>
                        <SelectItem value="update">Status Update</SelectItem>
                        <SelectItem value="follow_up">Follow Up</SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Message</Label>
                  <VariableTextarea
                    value={waFormData.body}
                    onChange={(v) => setWaFormData({ ...waFormData, body: v })}
                    variables={WA_VARIABLES}
                    variableHints={VARIABLE_HINTS}
                    placeholder={
                      "Hi {{client_name}} 👋\n\nYour application has been updated… Type {{ to insert a variable"
                    }
                    className="h-48"
                  />
                  <p className="text-xs text-muted-foreground">
                    Supports emoji and *bold* text. Type{" "}
                    <code className="font-mono bg-muted px-1 rounded">
                      {"{{"}
                    </code>{" "}
                    to insert a variable
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={waFormData.is_active}
                    onCheckedChange={(v) =>
                      setWaFormData({ ...waFormData, is_active: v })
                    }
                  />
                  <Label>Active</Label>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditorOpen(false)}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving…
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {editingTemplate ? "Update" : "Create"} Template
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ── Preview Dialog ── */}
        <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Template Preview</DialogTitle>
            </DialogHeader>
            <div className="border rounded-md p-4 bg-white">
              {previewContent.includes("<") ? (
                <div dangerouslySetInnerHTML={{ __html: previewContent }} />
              ) : (
                <pre className="whitespace-pre-wrap text-sm">
                  {previewContent}
                </pre>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* ── Delete Confirm ── */}
        <AlertDialog
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete template?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete "{templateToDelete?.name}".
                Pipeline step assignments using this template will also be
                removed. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDelete}
                className="bg-destructive"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </>
  );
};

export default CommunicationTemplates;
