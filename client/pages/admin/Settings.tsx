import React, { useEffect, useState, useCallback } from "react";
import {
  Settings as SettingsIcon,
  Bell,
  FileCheck2,
  Save,
  RefreshCw,
  CheckCircle2,
  Mail,
  MessageSquare,
  AlertCircle,
  Phone,
  Tag,
  ShieldCheck,
  Eye,
  EyeOff,
  Lock,
} from "lucide-react";
import { motion } from "framer-motion";
import { MetaHelmet } from "@/components/MetaHelmet";
import { PageHeader } from "@/components/layout/PageHeader";
import { adminPageMeta } from "@/lib/seo-helpers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchSettings,
  updateSettings,
  selectSettingValue,
} from "@/store/slices/settingsSlice";
import {
  fetchRoleSectionPermissions,
  updateRoleSectionPermissions,
  setPermission,
} from "@/store/slices/roleSectionPermissionsSlice";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { logger } from "@/lib/logger";

// ─── Animation variants ───────────────────────────────────────────────────────

const FADE_UP = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.4, ease: "easeOut" as const },
  }),
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function SettingsSection({
  icon: Icon,
  title,
  description,
  accent,
  children,
  index,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  accent: string;
  children: React.ReactNode;
  index: number;
}) {
  return (
    <motion.div
      custom={index}
      initial="hidden"
      animate="visible"
      variants={FADE_UP}
    >
      <Card className="border border-border/60 shadow-sm overflow-hidden">
        <CardHeader
          className={cn(
            "flex flex-row items-center gap-4 px-6 py-5 border-b border-border/40",
            accent,
          )}
        >
          <div className="p-2.5 rounded-xl bg-white/70 shadow-sm border border-white/50">
            <Icon className="h-5 w-5 text-foreground/70" />
          </div>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base font-semibold text-foreground">
              {title}
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground mt-0.5">
              {description}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="px-6 py-6">{children}</CardContent>
      </Card>
    </motion.div>
  );
}

function SettingRow({
  icon: Icon,
  label,
  hint,
  value,
  onChange,
  placeholder,
  type = "text",
  disabled,
}: {
  icon?: React.ElementType;
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium text-foreground/80 flex items-center gap-1.5">
        {Icon && <Icon className="h-3.5 w-3.5 text-muted-foreground" />}
        {label}
      </Label>
      <Input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-9 text-sm"
        disabled={disabled}
      />
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function ToggleRow({
  icon: Icon,
  label,
  hint,
  checked,
  onCheckedChange,
  disabled,
}: {
  icon?: React.ElementType;
  label: string;
  hint?: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-3 px-4 rounded-xl border border-border/50 bg-background hover:bg-muted/30 transition-colors">
      <div className="flex items-center gap-3 min-w-0">
        {Icon && (
          <div className="p-1.5 rounded-lg bg-muted/60">
            <Icon className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
        )}
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground">{label}</p>
          {hint && (
            <p className="text-xs text-muted-foreground mt-0.5">{hint}</p>
          )}
        </div>
      </div>
      <Switch
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
      />
    </div>
  );
}

function SaveButton({
  isSaving,
  saved,
  disabled,
  onClick,
}: {
  isSaving: boolean;
  saved: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      size="sm"
      onClick={onClick}
      disabled={isSaving || disabled}
      className={cn(
        "h-9 px-5 text-sm gap-2 transition-all duration-200",
        saved
          ? "bg-green-600 hover:bg-green-700 text-white"
          : "bg-primary hover:bg-primary/90 text-primary-foreground",
      )}
    >
      {isSaving ? (
        <>
          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
          Saving…
        </>
      ) : saved ? (
        <>
          <CheckCircle2 className="h-3.5 w-3.5" />
          Saved
        </>
      ) : (
        <>
          <Save className="h-3.5 w-3.5" />
          Save Changes
        </>
      )}
    </Button>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

const Settings = () => {
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const { settings, isLoading, isSaving } = useAppSelector(
    (state) => state.settings,
  );
  const { user } = useAppSelector((state) => state.brokerAuth);
  const isAdmin =
    user?.role === "admin" ||
    user?.role === "superadmin" ||
    user?.role === "platform_owner";
  const isPlatformOwner = user?.role === "platform_owner";

  // Role section permissions
  const { permissions: rolePerms, isSaving: isSavingPerms } = useAppSelector(
    (s) => s.roleSectionPermissions,
  );

  /** Locked sections — always hidden for admin/broker regardless of DB */
  const LOCKED_SECTIONS = [
    "reminder-flows",
    "communication-templates",
    "brokers",
  ];

  // Pre-Approval Letter
  const [preApprovalRequireAllTasks, setPreApprovalRequireAllTasks] =
    useState(true);

  // Notifications
  const [enableEmail, setEnableEmail] = useState(true);
  const [enableSms, setEnableSms] = useState(false);

  // Phone Configuration
  const [otpFromNumber, setOtpFromNumber] = useState("");

  // Saved flash state
  const [savedSections, setSavedSections] = useState<Set<string>>(new Set());

  // Sync state from fetched settings
  useEffect(() => {
    if (settings.length > 0) {
      setPreApprovalRequireAllTasks(
        selectSettingValue(settings, "pre_approval_require_all_tasks") !==
          "false",
      );
      setEnableEmail(selectSettingValue(settings, "enable_email") !== "false");
      setEnableSms(selectSettingValue(settings, "enable_sms") === "true");
      setOtpFromNumber(selectSettingValue(settings, "otp_from_number") ?? "");
    }
  }, [settings]);

  useEffect(() => {
    dispatch(fetchSettings());
    if (isPlatformOwner) dispatch(fetchRoleSectionPermissions());
  }, [dispatch, isPlatformOwner]);

  const flashSaved = (section: string) => {
    setSavedSections((s) => new Set(s).add(section));
    setTimeout(
      () =>
        setSavedSections((s) => {
          const n = new Set(s);
          n.delete(section);
          return n;
        }),
      2500,
    );
  };

  const handleSave = useCallback(
    async (
      section: string,
      updates: { setting_key: string; setting_value: string }[],
    ) => {
      try {
        await dispatch(updateSettings({ updates })).unwrap();
        await dispatch(fetchSettings());
        flashSaved(section);
        toast({
          title: "Saved",
          description: "Settings updated successfully.",
        });
      } catch (err: any) {
        logger.error("Settings save error:", err);
        toast({
          title: "Error",
          description: String(err),
          variant: "destructive",
        });
      }
    },
    [dispatch, toast],
  );

  const getPermValue = useCallback(
    (role: "admin" | "broker", sectionId: string): boolean => {
      const p = rolePerms.find(
        (x) => x.broker_role === role && x.section_id === sectionId,
      );
      return p?.is_visible ?? true;
    },
    [rolePerms],
  );

  const togglePerm = useCallback(
    (role: "admin" | "broker", sectionId: string, value: boolean) => {
      dispatch(
        setPermission({
          broker_role: role,
          section_id: sectionId,
          is_visible: value,
        }),
      );
    },
    [dispatch],
  );

  const handleSavePerms = useCallback(async () => {
    try {
      await dispatch(
        updateRoleSectionPermissions({
          permissions: rolePerms.map((p) => ({
            broker_role: p.broker_role,
            section_id: p.section_id,
            is_visible: p.is_visible,
          })),
        }),
      ).unwrap();
      await dispatch(fetchRoleSectionPermissions());
      flashSaved("roleperms");
      toast({ title: "Saved", description: "Role visibility updated." });
    } catch (err: any) {
      logger.error("Role perms save error:", err);
      toast({
        title: "Error",
        description: String(err),
        variant: "destructive",
      });
    }
  }, [dispatch, rolePerms, toast]);

  return (
    <>
      <MetaHelmet
        {...adminPageMeta(
          "Settings",
          "Configure your workspace and system preferences",
        )}
      />
      <div className="p-4 sm:p-6 lg:p-8">
        <PageHeader
          icon={<SettingsIcon className="h-7 w-7 text-primary" />}
          title="Settings"
          description="Manage letter configuration, notifications, and system preferences"
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="border-sky-200 bg-sky-50 text-sky-700 self-start md:self-auto">
                <Tag className="mr-1 h-3 w-3" />
                Version{" "}
                {selectSettingValue(settings, "app_version") || "Not set"}
              </Badge>
              {!isAdmin ? (
                <Badge className="bg-amber-50 text-amber-700 border-amber-200 self-start md:self-auto">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  View only — admin required to edit
                </Badge>
              ) : null}
            </div>
          }
        />

        <div className="max-w-3xl space-y-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-24">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {/* Pre-Approval Letter */}
              <SettingsSection
                index={0}
                icon={FileCheck2}
                title="Pre-Approval Letter"
                description="Control how pre-approval letters are generated and issued to clients"
                accent="bg-primary/5"
              >
                <div className="space-y-4">
                  <ToggleRow
                    icon={FileCheck2}
                    label="Require all tasks completed before issuing"
                    hint="Brokers can only generate a letter once every task in the loan pipeline is approved"
                    checked={preApprovalRequireAllTasks}
                    onCheckedChange={setPreApprovalRequireAllTasks}
                    disabled={!isAdmin}
                  />

                  <div className="flex items-start gap-3 p-4 rounded-xl border border-primary/10 bg-primary/5">
                    <FileCheck2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-foreground/70 leading-relaxed">
                      Letters include the company logo, broker photo and
                      signature, approved amount with admin-controlled caps, and
                      are fully HTML-customizable per loan. Clients can receive
                      them as a formatted email that renders like a PDF.
                    </p>
                  </div>
                </div>

                <div className="flex justify-end pt-5 mt-5 border-t border-border/40">
                  <SaveButton
                    isSaving={isSaving}
                    saved={savedSections.has("preapproval")}
                    disabled={!isAdmin}
                    onClick={() =>
                      handleSave("preapproval", [
                        {
                          setting_key: "pre_approval_require_all_tasks",
                          setting_value: preApprovalRequireAllTasks
                            ? "true"
                            : "false",
                        },
                      ])
                    }
                  />
                </div>
              </SettingsSection>

              {/* Notifications */}
              <SettingsSection
                index={1}
                icon={Bell}
                title="Notifications"
                description="Control which communication channels are active for your workspace"
                accent="bg-violet-50/60"
              >
                <div className="space-y-3">
                  <ToggleRow
                    icon={Mail}
                    label="Email notifications"
                    hint="Send transactional emails to clients and brokers"
                    checked={enableEmail}
                    onCheckedChange={setEnableEmail}
                    disabled={!isAdmin}
                  />
                  <ToggleRow
                    icon={MessageSquare}
                    label="SMS notifications"
                    hint="Send SMS alerts via configured provider"
                    checked={enableSms}
                    onCheckedChange={setEnableSms}
                    disabled={!isAdmin}
                  />
                </div>

                <div className="flex justify-end pt-5 mt-5 border-t border-border/40">
                  <SaveButton
                    isSaving={isSaving}
                    saved={savedSections.has("notifications")}
                    disabled={!isAdmin}
                    onClick={() =>
                      handleSave("notifications", [
                        {
                          setting_key: "enable_email",
                          setting_value: enableEmail ? "true" : "false",
                        },
                        {
                          setting_key: "enable_sms",
                          setting_value: enableSms ? "true" : "false",
                        },
                      ])
                    }
                  />
                </div>
              </SettingsSection>

              {/* Phone Configuration */}
              <SettingsSection
                index={2}
                icon={Phone}
                title="Phone Configuration"
                description="Twilio numbers used for outbound SMS. Changes apply immediately."
                accent="bg-emerald-50/60"
              >
                <div className="space-y-4">
                  <SettingRow
                    icon={Phone}
                    label="OTP / Verification From Number"
                    hint="Twilio number (E.164 format, e.g. +15623370000) used when sending login verification codes to brokers and clients via SMS."
                    value={otpFromNumber}
                    onChange={setOtpFromNumber}
                    placeholder="+15623370000"
                    disabled={!isAdmin}
                  />

                  <div className="flex items-start gap-3 p-4 rounded-xl border border-emerald-500/15 bg-emerald-50/40">
                    <Phone className="h-4 w-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-foreground/70 leading-relaxed">
                      This number must belong to your Twilio account. It is used
                      as the &ldquo;From&rdquo; address for all OTP verification
                      messages. For conversation replies, each broker uses their
                      assigned personal line or the shared inbox number.
                    </p>
                  </div>
                </div>

                <div className="flex justify-end pt-5 mt-5 border-t border-border/40">
                  <SaveButton
                    isSaving={isSaving}
                    saved={savedSections.has("phone")}
                    disabled={!isAdmin}
                    onClick={() =>
                      handleSave("phone", [
                        {
                          setting_key: "otp_from_number",
                          setting_value: otpFromNumber.trim(),
                        },
                      ])
                    }
                  />
                </div>
              </SettingsSection>

              {/* Role Section Permissions — platform_owner only */}
              {isPlatformOwner && (
                <SettingsSection
                  index={3}
                  icon={ShieldCheck}
                  title="Role Visibility"
                  description="Control which sidebar sections are visible for Mortgage Bankers and Partners"
                  accent="bg-amber-50/60"
                >
                  {rolePerms.length === 0 ? (
                    <div className="flex items-center justify-center py-10">
                      <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <>
                      {(
                        [
                          {
                            role: "admin" as const,
                            label: "Mortgage Bankers",
                            color: "text-sky-700",
                            bg: "bg-sky-50 border-sky-200",
                          },
                          {
                            role: "broker" as const,
                            label: "Partners (Realtors)",
                            color: "text-violet-700",
                            bg: "bg-violet-50 border-violet-200",
                          },
                        ] as const
                      ).map(({ role, label, color, bg }) => {
                        const sections: {
                          id: string;
                          label: string;
                          locked?: boolean;
                        }[] = [
                          { id: "dashboard", label: "Home / Dashboard" },
                          { id: "pipeline", label: "Pipeline" },
                          { id: "clients", label: "Clients & Leads" },
                          { id: "tasks", label: "Tasks" },
                          { id: "documents", label: "Documents" },
                          { id: "scheduler", label: "Calendar" },
                          { id: "conversations", label: "Conversations" },
                          { id: "email", label: "Email" },
                          { id: "reports", label: "Reports & Analytics" },
                          { id: "settings", label: "Settings" },
                          {
                            id: "income-calculator",
                            label: "Income Calculator",
                          },
                          { id: "mortgi", label: "Mortgi AI" },
                          {
                            id: "reminder-flows",
                            label: "Reminder Flows",
                            locked: true,
                          },
                          {
                            id: "communication-templates",
                            label: "Message Templates",
                            locked: true,
                          },
                          {
                            id: "brokers",
                            label: "People Management",
                            locked: true,
                          },
                        ];
                        return (
                          <div key={role} className="mb-6 last:mb-0">
                            <div
                              className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-xl border mb-3",
                                bg,
                              )}
                            >
                              <ShieldCheck className={cn("h-4 w-4", color)} />
                              <span
                                className={cn("text-sm font-semibold", color)}
                              >
                                {label}
                              </span>
                            </div>
                            <div className="space-y-2">
                              {sections.map((sec) => (
                                <div
                                  key={sec.id}
                                  className={cn(
                                    "flex items-center justify-between py-2.5 px-4 rounded-xl border border-border/50 bg-background transition-colors",
                                    sec.locked
                                      ? "opacity-50 cursor-not-allowed"
                                      : "hover:bg-muted/30",
                                  )}
                                >
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    {sec.locked ? (
                                      <Lock className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                                    ) : getPermValue(role, sec.id) ? (
                                      <Eye className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
                                    ) : (
                                      <EyeOff className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                                    )}
                                    <div>
                                      <p className="text-sm font-medium text-foreground">
                                        {sec.label}
                                      </p>
                                      {sec.locked && (
                                        <p className="text-xs text-muted-foreground">
                                          Platform owner only — cannot be
                                          enabled for this role
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                  <Switch
                                    checked={
                                      sec.locked
                                        ? false
                                        : getPermValue(role, sec.id)
                                    }
                                    onCheckedChange={(v) =>
                                      !sec.locked && togglePerm(role, sec.id, v)
                                    }
                                    disabled={sec.locked}
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}

                      <div className="flex items-center justify-between pt-5 mt-5 border-t border-border/40">
                        <p className="text-xs text-muted-foreground">
                          Changes apply after the next login or page refresh for
                          affected users.
                        </p>
                        <SaveButton
                          isSaving={isSavingPerms}
                          saved={savedSections.has("roleperms")}
                          disabled={false}
                          onClick={handleSavePerms}
                        />
                      </div>
                    </>
                  )}
                </SettingsSection>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default Settings;
