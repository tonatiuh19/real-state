import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
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
import {
  FileText,
  Edit3,
  Eye,
  Save,
  Printer,
  Download,
  Trash2,
  Plus,
  Lock,
  Unlock,
  DollarSign,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Building2,
  User,
  RefreshCw,
  Shield,
  Mail,
  Send,
} from "lucide-react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchPreApprovalLetter,
  createPreApprovalLetter,
  updatePreApprovalLetter,
  deletePreApprovalLetter,
} from "@/store/slices/preApprovalSlice";
import { fetchEmailTemplates } from "@/store/slices/communicationTemplatesSlice";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { logger } from "@/lib/logger";
import type { PreApprovalLetter } from "@shared/api";

// ─────────────────────────────────────────────────────────────────────────────
// Placeholder rendering logic
// ─────────────────────────────────────────────────────────────────────────────

function formatCurrencyFull(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

const DEFAULT_COMPANY_LOGO =
  "https://disruptinglabs.com/data/encore/assets/images/logo.png";

/** Safely extract YYYY-MM-DD from either a plain date string or an ISO datetime */
function safeDate(d: string | null | undefined): string | null {
  if (!d) return null;
  const s = typeof d === "string" ? d : String(d);
  return s.split("T")[0];
}

function renderLetterHtml(
  html: string,
  letter: PreApprovalLetter,
  overrideAmount?: number,
): string {
  const amount = overrideAmount ?? letter.approved_amount;
  const clientName =
    `${letter.client_first_name ?? ""} ${letter.client_last_name ?? ""}`.trim();
  const propertyAddr = [
    letter.property_address,
    letter.property_city,
    letter.property_state,
    letter.property_zip,
  ]
    .filter(Boolean)
    .join(", ");

  const letterDateStr = safeDate(letter.letter_date);
  const letterDateFormatted = letterDateStr
    ? new Date(letterDateStr + "T00:00:00").toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

  const expiresDateStr = safeDate(letter.expires_at);

  const expiryNote = expiresDateStr
    ? `This pre-approval is valid through <strong>${new Date(expiresDateStr + "T00:00:00").toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</strong>. After this date a new pre-qualification review will be required.`
    : `This pre-approval letter does not have a set expiration date; however, your financial circumstances, creditworthiness, and market conditions are subject to change.`;

  const expiresShort = expiresDateStr
    ? new Date(expiresDateStr + "T00:00:00").toLocaleDateString("en-US", {
        month: "2-digit",
        day: "2-digit",
        year: "numeric",
      })
    : "";

  const effectiveLogoUrl = letter.company_logo_url || DEFAULT_COMPANY_LOGO;
  const logoHtml = `<img src="${effectiveLogoUrl}" alt="${letter.company_name ?? "Company"} Logo" style="max-height:64px; max-width:200px; object-fit:contain;" />`;

  const brokerPhotoHtml = letter.broker_photo_url
    ? `<img src="${letter.broker_photo_url}" alt="${letter.broker_first_name} ${letter.broker_last_name}" style="width:72px; height:72px; border-radius:50%; object-fit:cover; border:3px solid #1a3a5c;" />`
    : `<div style="width:72px; height:72px; border-radius:50%; background:#e8edf5; border:3px solid #1a3a5c; display:flex; align-items:center; justify-content:center; font-size:24px; font-weight:bold; color:#1a3a5c;">${(letter.broker_first_name?.[0] ?? "") + (letter.broker_last_name?.[0] ?? "")}</div>`;

  const brokerLicenseHtml = letter.broker_license_number
    ? `<p style="margin:4px 0 0; font-size:13px; color:#555;">NMLS# ${letter.broker_license_number}</p>`
    : "";

  const replacements: Record<string, string> = {
    "{{COMPANY_LOGO}}": logoHtml,
    "{{COMPANY_ADDRESS}}": letter.company_address ?? "",
    "{{COMPANY_PHONE}}": letter.company_phone ?? "",
    "{{COMPANY_NMLS}}": letter.company_nmls ?? "",
    "{{LETTER_DATE}}": letterDateFormatted,
    "{{CLIENT_FULL_NAME}}": clientName || "Applicant",
    "{{PROPERTY_ADDRESS}}": propertyAddr || "Property Address TBD",
    "{{APPROVED_AMOUNT}}": formatCurrencyFull(amount),
    "{{EXPIRY_NOTE}}": expiryNote,
    "{{EXPIRES_SHORT}}": expiresShort,
    "{{BROKER_PHOTO}}": brokerPhotoHtml,
    "{{BROKER_FULL_NAME}}":
      `${letter.broker_first_name ?? ""} ${letter.broker_last_name ?? ""}`.trim(),
    "{{COMPANY_NAME}}": letter.company_name ?? "Encore Mortgage",
    "{{BROKER_LICENSE}}": brokerLicenseHtml,
    "{{BROKER_PHONE}}": letter.broker_phone ?? "",
    "{{BROKER_EMAIL}}": letter.broker_email ?? "",
  };

  let rendered = html;
  for (const [placeholder, value] of Object.entries(replacements)) {
    // Use regex with global flag for TS compatibility (replaceAll requires ES2021+)
    rendered = rendered.replace(
      new RegExp(placeholder.replace(/[{}]/g, "\\$&"), "g"),
      value,
    );
  }
  return rendered;
}

// ─────────────────────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────────────────────

interface PreApprovalLetterModalProps {
  isOpen: boolean;
  onClose: () => void;
  loanId: number;
  loanAmount: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export function PreApprovalLetterModal({
  isOpen,
  onClose,
  loanId,
  loanAmount,
}: PreApprovalLetterModalProps) {
  const dispatch = useAppDispatch();
  const { user, sessionToken } = useAppSelector((state) => state.brokerAuth);
  const { letters, loadingLoanIds, savingLoanIds } = useAppSelector(
    (state) => state.preApproval,
  );
  const { emailTemplates } = useAppSelector(
    (state) => state.communicationTemplates,
  );

  const isAdmin = user?.role === "admin" || user?.role === "superadmin";
  const isLoading = loadingLoanIds.includes(loanId);
  const isSaving = savingLoanIds.includes(loanId);

  const letter = letters[loanId] ?? null;

  // Edit state
  const [activeTab, setActiveTab] = useState<"preview" | "edit">("preview");
  const [editedAmount, setEditedAmount] = useState<string>("");
  const [editedMaxAmount, setEditedMaxAmount] = useState<string>("");
  const [editedHtml, setEditedHtml] = useState<string>("");
  const [editedDate, setEditedDate] = useState<string>("");
  const [editedExpiry, setEditedExpiry] = useState<string>("");

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Email send dialog state
  const [sendEmailOpen, setSendEmailOpen] = useState(false);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailTemplateId, setEmailTemplateId] = useState<string>("default");
  const [emailCustomMessage, setEmailCustomMessage] = useState("");
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Fetch letter when modal opens
  useEffect(() => {
    if (isOpen && loanId) {
      dispatch(fetchPreApprovalLetter(loanId));
    }
  }, [isOpen, loanId, dispatch]);

  // Sync edit state when letter changes
  useEffect(() => {
    if (letter) {
      setEditedAmount(String(letter.approved_amount));
      setEditedMaxAmount(String(letter.max_approved_amount));
      setEditedHtml(letter.html_content);
      setEditedDate(letter.letter_date?.split("T")[0] ?? "");
      setEditedExpiry(letter.expires_at?.split("T")[0] ?? "");
      setHasUnsavedChanges(false);
    }
  }, [letter]);

  // Fetch email templates and pre-fill subject when send dialog opens
  useEffect(() => {
    if (sendEmailOpen) {
      dispatch(fetchEmailTemplates());
      if (letter) {
        setEmailSubject(
          `Your Pre-Approval Letter — ${letter.application_number ?? `Loan #${loanId}`}`,
        );
      }
    }
  }, [sendEmailOpen, dispatch, letter, loanId]);

  const handleSendEmail = async () => {
    if (!letter) return;
    setIsSendingEmail(true);
    try {
      // Generate PDF attachment before sending
      let pdfBase64: string | undefined;
      try {
        pdfBase64 = await generatePdfBase64();
      } catch (pdfErr) {
        logger.error("PDF generation for email failed:", pdfErr);
        // continue without attachment rather than blocking the send
      }
      await axios.post(
        `/api/loans/${loanId}/pre-approval-letter/send-email`,
        {
          subject: emailSubject || undefined,
          custom_message: emailCustomMessage || undefined,
          template_id:
            emailTemplateId !== "none" && emailTemplateId !== "default"
              ? Number(emailTemplateId)
              : undefined,
          pdf_base64: pdfBase64,
        },
        { headers: { Authorization: `Bearer ${sessionToken}` } },
      );
      toast({
        title: "Email Sent",
        description: `Pre-approval letter sent to ${letter.client_email ?? "the client"}.`,
      });
      setSendEmailOpen(false);
      setEmailCustomMessage("");
      setEmailTemplateId("default");
    } catch (error: any) {
      logger.error("Error sending pre-approval email:", error);
      toast({
        title: "Send Failed",
        description: error.response?.data?.error ?? "Failed to send the email.",
        variant: "destructive",
      });
    } finally {
      setIsSendingEmail(false);
    }
  };

  const renderedHtml = letter
    ? renderLetterHtml(
        activeTab === "edit" ? editedHtml : letter.html_content,
        letter,
        activeTab === "edit"
          ? Number(editedAmount) || letter.approved_amount
          : undefined,
      )
    : "";

  const createSchema = Yup.object({
    max_approved_amount: Yup.number()
      .typeError("Enter a valid amount")
      .positive("Must be greater than 0")
      .required("Required"),
    approved_amount: Yup.number()
      .typeError("Enter a valid amount")
      .positive("Must be greater than 0")
      .required("Required")
      .max(
        Yup.ref("max_approved_amount"),
        "Cannot exceed the maximum allowed amount",
      ),
    letter_date: Yup.string().required("Letter date is required"),
    expires_at: Yup.string().required("Expiry date is required"),
  });

  const createFormik = useFormik({
    enableReinitialize: true,
    initialValues: {
      max_approved_amount:
        isOpen && !letter ? String(Math.round(loanAmount)) : "",
      approved_amount: isOpen && !letter ? String(Math.round(loanAmount)) : "",
      letter_date: "",
      expires_at: "",
    },
    validationSchema: createSchema,
    validateOnMount: true,
    validateOnChange: true,
    validateOnBlur: true,
    onSubmit: async (values) => {
      try {
        await dispatch(
          createPreApprovalLetter({
            loanId,
            payload: {
              approved_amount: Number(values.approved_amount),
              max_approved_amount: Number(values.max_approved_amount),
              html_content: "",
              letter_date: values.letter_date,
              expires_at: values.expires_at || null,
            },
          }),
        ).unwrap();
        toast({
          title: "Letter Created",
          description: "Pre-approval letter has been created successfully.",
        });
        setActiveTab("preview");
      } catch (error: any) {
        logger.error("Error creating letter:", error);
        toast({ title: "Error", description: error, variant: "destructive" });
      }
    },
  });

  const handleSave = async () => {
    if (!letter) return;
    if (Number(editedAmount) > Number(editedMaxAmount)) {
      toast({
        title: "Amount Exceeds Limit",
        description: `Approved amount cannot exceed $${Number(editedMaxAmount).toLocaleString()}`,
        variant: "destructive",
      });
      return;
    }
    try {
      const payload: any = {
        approved_amount: Number(editedAmount),
        html_content: editedHtml,
        letter_date: editedDate,
        expires_at: editedExpiry || null,
      };
      if (isAdmin) {
        payload.max_approved_amount = Number(editedMaxAmount);
      }
      await dispatch(updatePreApprovalLetter({ loanId, payload })).unwrap();
      toast({
        title: "Letter Saved",
        description: "Pre-approval letter updated successfully.",
      });
      setHasUnsavedChanges(false);
      setActiveTab("preview");
    } catch (error: any) {
      logger.error("Error saving letter:", error);
      toast({ title: "Error", description: error, variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    try {
      await dispatch(deletePreApprovalLetter(loanId)).unwrap();
      toast({
        title: "Letter Deleted",
        description: "Pre-approval letter has been deleted.",
      });
      setDeleteConfirmOpen(false);
    } catch (error: any) {
      toast({ title: "Error", description: error, variant: "destructive" });
    }
  };

  const handlePrint = useCallback(() => {
    if (!letter) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`<!DOCTYPE html>
<html>
<head>
  <title>Pre-Approval Letter - ${letter.application_number ?? loanId}</title>
  <style>
    @media print { body { margin: 0; } }
    body { font-family: Georgia, serif; }
  </style>
</head>
<body>${renderedHtml}</body>
</html>`);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  }, [letter, renderedHtml, loanId]);

  /**
   * Replaces all external src="https?://..." in HTML with same-origin
   * /api/image-proxy?url=... so html2canvas can load them without CORS errors.
   */
  function proxyImages(html: string): string {
    return html.replace(
      /src="(https?:\/\/[^"]+)"/g,
      (_match, url) => `src="/api/image-proxy?url=${encodeURIComponent(url)}"`,
    );
  }

  /** Shared html2pdf options */
  function pdfOptions(filename?: string) {
    return {
      margin: 0,
      ...(filename ? { filename } : {}),
      image: { type: "jpeg", quality: 0.97 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        letterRendering: true,
        windowWidth: 816,
      },
      jsPDF: { unit: "mm", format: "letter", orientation: "portrait" },
    };
  }

  /** Returns PDF as pure base64 (no data-URI prefix). */
  const generatePdfBase64 = useCallback(async (): Promise<string> => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const html2pdf = ((await import("html2pdf.js")) as any).default;
    const savedHtml = renderLetterHtml(letter!.html_content, letter!);
    const proxied = `<div style="font-family:Arial,sans-serif;width:816px;">${proxyImages(savedHtml)}</div>`;
    const dataUri: string = await html2pdf()
      .set(pdfOptions())
      .from(proxied, "string")
      .outputPdf("datauristring");
    return dataUri.split(",")[1];
  }, [letter]);

  const handleDownloadPdf = useCallback(async () => {
    if (!letter) return;
    setIsGeneratingPdf(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const html2pdf = ((await import("html2pdf.js")) as any).default;
      const savedHtml = renderLetterHtml(letter.html_content, letter);
      const proxied = `<div style="font-family:Arial,sans-serif;width:816px;">${proxyImages(savedHtml)}</div>`;
      await html2pdf()
        .set(
          pdfOptions(`Pre-Approval-${letter.application_number ?? loanId}.pdf`),
        )
        .from(proxied, "string")
        .save();
    } catch (err) {
      logger.error("PDF generation failed:", err);
      toast({
        title: "Download Failed",
        description: "Could not generate PDF.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingPdf(false);
    }
  }, [letter, loanId]);

  const handleResetHtml = () => {
    if (!letter) return;
    setEditedHtml(letter.html_content);
    setHasUnsavedChanges(false);
  };

  const amountExceedsMax = Number(editedAmount) > Number(editedMaxAmount);
  const maxAllowed = letter?.max_approved_amount ?? 0;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-5xl w-full max-h-[95vh] flex flex-col p-0 gap-0 overflow-hidden rounded-2xl">
          {/* Gradient Header */}
          <DialogHeader className="relative overflow-hidden flex-shrink-0">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-primary/5 to-transparent pointer-events-none" />
            <div className="relative px-6 pt-5 pb-5 border-b border-primary/10">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-primary/10 rounded-xl border border-primary/20">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <DialogTitle className="text-lg font-semibold text-foreground">
                      Pre-Approval Letter
                    </DialogTitle>
                    <DialogDescription className="text-sm text-muted-foreground mt-0.5">
                      {letter
                        ? `Loan #${letter.application_number ?? loanId} · ${letter.client_first_name} ${letter.client_last_name ?? ""}`
                        : "Generate and send a pre-approval letter to the client"}
                    </DialogDescription>
                  </div>
                </div>
                {letter && (
                  <div className="flex items-center gap-2 flex-wrap justify-end">
                    {/* Amount pill */}
                    <div className="px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 flex items-center gap-1.5">
                      <DollarSign className="h-3.5 w-3.5 text-primary" />
                      <span className="text-sm font-semibold text-primary">
                        {formatCurrencyFull(letter.approved_amount)}
                      </span>
                    </div>
                    <Badge
                      className={cn(
                        "text-xs px-2.5 py-1",
                        letter.is_active
                          ? "bg-green-100 text-green-700 border-green-200"
                          : "bg-muted text-muted-foreground border-border",
                      )}
                    >
                      {letter.is_active ? (
                        <>
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Active
                        </>
                      ) : (
                        "Inactive"
                      )}
                    </Badge>
                    {letter.expires_at && safeDate(letter.expires_at) && (
                      <Badge className="text-xs px-2.5 py-1 bg-amber-50 text-amber-700 border-amber-200">
                        <Calendar className="h-3 w-3 mr-1" />
                        Expires{" "}
                        {new Date(
                          safeDate(letter.expires_at)! + "T00:00:00",
                        ).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            </div>
          </DialogHeader>

          {/* Body */}
          <div className="flex-1 overflow-hidden flex flex-col min-h-0">
            {isLoading ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <RefreshCw className="h-8 w-8 mx-auto mb-3 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">
                    Loading letter...
                  </p>
                </div>
              </div>
            ) : !letter ? (
              /* ──── CREATE FORM ──── */
              <div className="flex-1 overflow-y-auto px-6 py-6">
                <div className="max-w-lg mx-auto space-y-6">
                  <div className="text-center py-6">
                    <div className="relative mx-auto mb-5 w-20 h-20">
                      <div className="absolute inset-0 bg-primary/20 rounded-full blur-md" />
                      <div className="relative p-5 bg-primary/10 rounded-full border border-primary/20 w-20 h-20 flex items-center justify-center">
                        <FileText className="h-9 w-9 text-primary" />
                      </div>
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      Issue Pre-Approval Letter
                    </h3>
                    <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                      Generate a fully customizable pre-approval letter with
                      your company logo, broker signature, and approved amount.
                    </p>
                  </div>

                  {!isAdmin && (
                    <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                      <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-amber-700">
                        Only admin brokers can create pre-approval letters and
                        set approval limits.
                      </p>
                    </div>
                  )}

                  <form
                    onSubmit={createFormik.handleSubmit}
                    className="space-y-4"
                  >
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-sm font-medium text-foreground/80 flex items-center gap-1.5">
                          <Shield className="h-3.5 w-3.5 text-primary" />
                          Maximum Allowed Amount
                          <span className="text-destructive">*</span>
                        </Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                            $
                          </span>
                          <Input
                            type="number"
                            id="max_approved_amount"
                            {...createFormik.getFieldProps(
                              "max_approved_amount",
                            )}
                            className={cn(
                              "pl-7",
                              createFormik.touched.max_approved_amount &&
                                createFormik.errors.max_approved_amount &&
                                "border-destructive focus:ring-destructive/20",
                            )}
                            disabled={!isAdmin}
                            placeholder="650000"
                          />
                        </div>
                        {createFormik.touched.max_approved_amount &&
                          createFormik.errors.max_approved_amount && (
                            <p className="text-xs text-destructive flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" />
                              {createFormik.errors.max_approved_amount}
                            </p>
                          )}
                        {!(
                          createFormik.touched.max_approved_amount &&
                          createFormik.errors.max_approved_amount
                        ) && (
                          <p className="text-xs text-muted-foreground">
                            Ceiling — brokers cannot exceed this when editing
                          </p>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-sm font-medium text-foreground/80 flex items-center gap-1.5">
                          <DollarSign className="h-3.5 w-3.5 text-primary" />
                          Pre-Approved Amount
                          <span className="text-destructive">*</span>
                        </Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                            $
                          </span>
                          <Input
                            type="number"
                            id="approved_amount"
                            {...createFormik.getFieldProps("approved_amount")}
                            className={cn(
                              "pl-7",
                              createFormik.touched.approved_amount &&
                                createFormik.errors.approved_amount &&
                                "border-destructive focus:ring-destructive/20",
                            )}
                            placeholder="640000"
                          />
                        </div>
                        {createFormik.touched.approved_amount &&
                        createFormik.errors.approved_amount ? (
                          <p className="text-xs text-destructive flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {createFormik.errors.approved_amount}
                          </p>
                        ) : (
                          <p className="text-xs text-muted-foreground">
                            Amount shown on the letter (≤ max)
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-sm font-medium text-foreground/80">
                          Letter Date{" "}
                          <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          type="date"
                          id="letter_date"
                          {...createFormik.getFieldProps("letter_date")}
                          className={cn(
                            createFormik.touched.letter_date &&
                              createFormik.errors.letter_date &&
                              "border-destructive",
                          )}
                        />
                        {createFormik.touched.letter_date &&
                          createFormik.errors.letter_date && (
                            <p className="text-xs text-destructive flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" />
                              {createFormik.errors.letter_date}
                            </p>
                          )}
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-sm font-medium text-foreground/80">
                          Expiry Date{" "}
                          <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          type="date"
                          id="expires_at"
                          {...createFormik.getFieldProps("expires_at")}
                          className={cn(
                            createFormik.touched.expires_at &&
                              createFormik.errors.expires_at &&
                              "border-destructive",
                          )}
                        />
                        {createFormik.touched.expires_at &&
                          createFormik.errors.expires_at && (
                            <p className="text-xs text-destructive flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" />
                              {createFormik.errors.expires_at}
                            </p>
                          )}
                      </div>
                    </div>
                  </form>

                  <Button
                    type="button"
                    onClick={() => createFormik.handleSubmit()}
                    disabled={isSaving || !isAdmin || !createFormik.isValid}
                    className="w-full gap-2 bg-primary hover:bg-primary/90 text-primary-foreground h-11 shadow-sm"
                  >
                    {isSaving ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Creating Letter...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4" />
                        Create Pre-Approval Letter
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              /* ──── LETTER VIEW / EDIT ──── */
              <Tabs
                value={activeTab}
                onValueChange={(v) => setActiveTab(v as "preview" | "edit")}
                className="flex-1 flex flex-col min-h-0"
              >
                <div className="flex items-center justify-between px-6 py-3 border-b border-border/50 bg-muted/30 flex-shrink-0">
                  <TabsList className="h-9 bg-background border border-border/60 shadow-sm">
                    <TabsTrigger
                      value="preview"
                      className="gap-1.5 text-xs h-7 px-3"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      Preview
                    </TabsTrigger>
                    <TabsTrigger
                      value="edit"
                      className="gap-1.5 text-xs h-7 px-3"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                      Edit
                      {hasUnsavedChanges && (
                        <span className="ml-1 h-1.5 w-1.5 rounded-full bg-amber-500 inline-block" />
                      )}
                    </TabsTrigger>
                  </TabsList>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePrint}
                      className="gap-1.5 h-8 px-3 text-xs hover:border-primary/30 hover:text-primary"
                    >
                      <Printer className="h-3.5 w-3.5" />
                      Print
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDownloadPdf}
                      disabled={isGeneratingPdf}
                      className="gap-1.5 h-8 px-3 text-xs hover:border-primary/30 hover:text-primary"
                    >
                      {isGeneratingPdf ? (
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Download className="h-3.5 w-3.5" />
                      )}
                      {isGeneratingPdf ? "Generating…" : "Download PDF"}
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => setSendEmailOpen(true)}
                      className="gap-1.5 h-8 px-4 text-xs bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
                    >
                      <Mail className="h-3.5 w-3.5" />
                      Send to Client
                    </Button>
                    {isAdmin && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDeleteConfirmOpen(true)}
                        className="gap-1.5 h-8 px-3 text-xs border-destructive/30 text-destructive hover:bg-destructive/5"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </Button>
                    )}
                  </div>
                </div>

                {/* PREVIEW TAB */}
                <TabsContent
                  value="preview"
                  className="flex-1 overflow-y-auto m-0 p-0 min-h-0"
                >
                  <div className="min-h-full bg-muted/50 p-6">
                    <div
                      className="max-w-3xl mx-auto bg-white shadow-xl rounded-2xl overflow-hidden border border-border/40"
                      dangerouslySetInnerHTML={{ __html: renderedHtml }}
                    />
                  </div>
                </TabsContent>

                {/* EDIT TAB */}
                <TabsContent
                  value="edit"
                  className="flex-1 overflow-y-auto m-0 min-h-0"
                >
                  <div className="p-6 space-y-6 max-w-5xl mx-auto">
                    {/* Amount Controls */}
                    <div className="bg-white border border-border/50 rounded-xl p-5 shadow-sm space-y-4">
                      <h4 className="font-medium text-foreground flex items-center gap-2 text-sm">
                        <DollarSign className="h-4 w-4 text-primary" />
                        Approval Amounts
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label className="text-sm text-foreground/80 flex items-center gap-1.5">
                            {isAdmin ? (
                              <Unlock className="h-3.5 w-3.5 text-muted-foreground" />
                            ) : (
                              <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                            )}
                            Maximum Allowed Amount
                            {!isAdmin && (
                              <span className="text-xs text-muted-foreground font-normal">
                                (admin only)
                              </span>
                            )}
                          </Label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                              $
                            </span>
                            <Input
                              type="number"
                              value={editedMaxAmount}
                              onChange={(e) => {
                                setEditedMaxAmount(e.target.value);
                                setHasUnsavedChanges(true);
                              }}
                              className="pl-7"
                              disabled={!isAdmin}
                            />
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Hard ceiling — cannot be exceeded
                          </p>
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-sm text-foreground/80">
                            Pre-Approved Amount{" "}
                            <span className="text-xs text-muted-foreground font-normal">
                              (max:{" "}
                              {formatCurrencyFull(
                                Number(editedMaxAmount) || maxAllowed,
                              )}
                              )
                            </span>
                          </Label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                              $
                            </span>
                            <Input
                              type="number"
                              value={editedAmount}
                              onChange={(e) => {
                                setEditedAmount(e.target.value);
                                setHasUnsavedChanges(true);
                              }}
                              className={cn(
                                "pl-7",
                                amountExceedsMax &&
                                  "border-red-400 focus:ring-red-200",
                              )}
                            />
                          </div>
                          {amountExceedsMax && (
                            <p className="text-xs text-destructive flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" />
                              Exceeds maximum allowed amount
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label className="text-sm text-foreground/80">
                            Letter Date
                          </Label>
                          <Input
                            type="date"
                            value={editedDate}
                            onChange={(e) => {
                              setEditedDate(e.target.value);
                              setHasUnsavedChanges(true);
                            }}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-sm text-foreground/80">
                            Expiry Date{" "}
                            <span className="text-muted-foreground font-normal">
                              (optional)
                            </span>
                          </Label>
                          <Input
                            type="date"
                            value={editedExpiry}
                            onChange={(e) => {
                              setEditedExpiry(e.target.value);
                              setHasUnsavedChanges(true);
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* HTML Editor */}
                    <div className="bg-white border border-border/50 rounded-xl p-5 shadow-sm space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-foreground flex items-center gap-2 text-sm">
                          <Building2 className="h-4 w-4 text-primary" />
                          Letter HTML Content
                        </h4>
                        <div className="flex items-center gap-2">
                          <p className="text-xs text-muted-foreground">
                            Use placeholders:{" "}
                            <code className="bg-muted px-1 rounded text-primary">
                              {"{{APPROVED_AMOUNT}}"}
                            </code>
                            ,{" "}
                            <code className="bg-muted px-1 rounded text-primary">
                              {"{{CLIENT_FULL_NAME}}"}
                            </code>
                            , etc.
                          </p>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleResetHtml}
                            className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground/80 gap-1"
                          >
                            <RefreshCw className="h-3 w-3" />
                            Reset
                          </Button>
                        </div>
                      </div>

                      {/* Placeholder legend */}
                      <div className="flex flex-wrap gap-1.5 p-3 bg-muted/30 rounded-lg border border-border/50">
                        {[
                          "{{COMPANY_LOGO}}",
                          "{{COMPANY_NAME}}",
                          "{{COMPANY_ADDRESS}}",
                          "{{COMPANY_PHONE}}",
                          "{{COMPANY_NMLS}}",
                          "{{LETTER_DATE}}",
                          "{{EXPIRES_SHORT}}",
                          "{{CLIENT_FULL_NAME}}",
                          "{{PROPERTY_ADDRESS}}",
                          "{{APPROVED_AMOUNT}}",
                          "{{EXPIRY_NOTE}}",
                          "{{BROKER_PHOTO}}",
                          "{{BROKER_FULL_NAME}}",
                          "{{BROKER_LICENSE}}",
                          "{{BROKER_PHONE}}",
                          "{{BROKER_EMAIL}}",
                        ].map((placeholder) => (
                          <button
                            key={placeholder}
                            type="button"
                            onClick={() => {
                              setEditedHtml((prev) => prev + placeholder);
                              setHasUnsavedChanges(true);
                            }}
                            className="text-xs px-2 py-0.5 rounded bg-primary/8 text-primary border border-primary/20 hover:bg-primary/15 transition-colors font-mono"
                          >
                            {placeholder}
                          </button>
                        ))}
                      </div>

                      <Textarea
                        value={editedHtml}
                        onChange={(e) => {
                          setEditedHtml(e.target.value);
                          setHasUnsavedChanges(true);
                        }}
                        className="font-mono text-xs min-h-[320px] resize-y border-gray-300"
                        placeholder="Enter the full HTML content of the letter..."
                        spellCheck={false}
                      />
                    </div>

                    {/* Live Preview inside Edit tab */}
                    <div className="bg-white border border-border/50 rounded-xl shadow-sm overflow-hidden">
                      <div className="px-5 py-3 border-b border-border/40 bg-muted/30">
                        <h4 className="font-medium text-foreground flex items-center gap-2 text-sm">
                          <Eye className="h-4 w-4 text-muted-foreground" />
                          Live Preview
                        </h4>
                      </div>
                      <div className="p-4 bg-muted/50">
                        <div
                          className="max-w-3xl mx-auto bg-white shadow-md rounded-xl overflow-hidden"
                          dangerouslySetInnerHTML={{
                            __html: renderLetterHtml(editedHtml, {
                              ...letter,
                              approved_amount:
                                Number(editedAmount) || letter.approved_amount,
                            }),
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            )}
          </div>

          {/* Footer actions (only when editing an existing letter) */}
          {letter && activeTab === "edit" && (
            <div className="px-6 py-4 border-t border-border/40 bg-white flex-shrink-0 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {hasUnsavedChanges && (
                  <p className="text-xs text-amber-600 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    You have unsaved changes
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    handleResetHtml();
                    setActiveTab("preview");
                  }}
                  disabled={isSaving}
                  className="h-9 px-4 text-sm"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={isSaving || amountExceedsMax}
                  className="h-9 px-4 text-sm gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  {isSaving ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirm dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Pre-Approval Letter?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the pre-approval letter for this loan
              application. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSaving}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isSaving}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isSaving ? "Deleting..." : "Delete Letter"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Send to Client email dialog */}
      <Dialog open={sendEmailOpen} onOpenChange={setSendEmailOpen}>
        <DialogContent className="max-w-md w-full">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-1">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Mail className="h-5 w-5 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-base font-semibold text-foreground">
                  Send Pre-Approval Letter
                </DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground mt-0.5">
                  Send the letter to the client via email
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 py-1">
            {/* Recipient */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-foreground/80 flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-muted-foreground" />
                To (Recipient)
              </Label>
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border/50 bg-muted/30">
                <span className="text-sm text-foreground/80">
                  {letter?.client_email ? (
                    <>
                      {letter.client_first_name} {letter.client_last_name}{" "}
                      <span className="text-muted-foreground">
                        &lt;{letter.client_email}&gt;
                      </span>
                    </>
                  ) : (
                    <span className="text-amber-600 text-xs flex items-center gap-1">
                      <AlertCircle className="h-3.5 w-3.5" />
                      No email address on file for this client
                    </span>
                  )}
                </span>
              </div>
            </div>

            {/* Subject */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-foreground/80">
                Subject
              </Label>
              <Input
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                placeholder="Your Pre-Approval Letter"
              />
            </div>

            {/* Template selector */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-foreground/80">
                Email Template{" "}
                <span className="text-muted-foreground font-normal text-xs">
                  (optional)
                </span>
              </Label>
              <Select
                value={emailTemplateId}
                onValueChange={setEmailTemplateId}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Default template (recommended)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">
                    Default template (recommended)
                  </SelectItem>
                  <SelectItem value="none">
                    No template — attach PDF only
                  </SelectItem>
                  {emailTemplates
                    .filter((t) => t.is_active)
                    .map((t) => (
                      <SelectItem key={t.id} value={String(t.id)}>
                        {t.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              {emailTemplateId !== "none" && emailTemplateId !== "default" && (
                <p className="text-xs text-muted-foreground">
                  The letter will be embedded inside the selected template using
                  the{" "}
                  <code className="bg-muted px-1 rounded text-primary">
                    {"{{pre_approval_letter}}"}
                  </code>{" "}
                  placeholder.
                </p>
              )}
            </div>

            {/* Custom message (only when no template or default template) */}
            {(emailTemplateId === "none" || emailTemplateId === "default") && (
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-foreground/80">
                  Custom Message{" "}
                  <span className="text-muted-foreground font-normal text-xs">
                    (optional intro)
                  </span>
                </Label>
                <Textarea
                  value={emailCustomMessage}
                  onChange={(e) => setEmailCustomMessage(e.target.value)}
                  placeholder="Add a personal message to accompany the letter..."
                  className="min-h-[80px] resize-none text-sm"
                />
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSendEmailOpen(false)}
              disabled={isSendingEmail}
              className="h-9 px-4"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSendEmail}
              disabled={isSendingEmail || !letter?.client_email}
              className="h-9 px-4 gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {isSendingEmail ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Send Email
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
