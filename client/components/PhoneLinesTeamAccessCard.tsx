import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useFormik } from "formik";
import * as Yup from "yup";
import {
  Building2,
  Check,
  Loader2,
  MessageSquare,
  PhoneOutgoing,
  Plus,
  Save,
  ShieldCheck,
  Trash2,
  UserRound,
  Users,
} from "lucide-react";
import type { Broker, BrokerDelegation } from "@shared/api";
import { formatPhoneLabel } from "@shared/group-conversations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchMortgageBankers } from "@/store/slices/brokersSlice";
import {
  fetchDelegations,
  fetchMainLine,
  fetchSendableLines,
  revokeDelegation,
  updateMainLine,
  upsertDelegation,
} from "@/store/slices/phoneLinesSlice";
import { useToast } from "@/hooks/use-toast";
import { logger } from "@/lib/logger";
import { cn } from "@/lib/utils";

// ─── Scope definitions ───────────────────────────────────────────────────────

type ScopeKey =
  | "can_view_clients"
  | "can_view_realtors"
  | "can_view_conversations"
  | "can_send_from_line";

const SCOPES: { key: ScopeKey; label: string; icon: React.ElementType }[] = [
  { key: "can_view_clients", label: "Clients", icon: UserRound },
  { key: "can_view_realtors", label: "Realtors", icon: Users },
  {
    key: "can_view_conversations",
    label: "Conversations",
    icon: MessageSquare,
  },
  { key: "can_send_from_line", label: "Send from line", icon: PhoneOutgoing },
];

const brokerName = (b: Pick<Broker, "first_name" | "last_name" | "email">) =>
  `${b.first_name ?? ""} ${b.last_name ?? ""}`.trim() || b.email;

const isTeamMember = (b: Broker) =>
  b.role === "admin" || b.role === "platform_owner";

// ─── Validation schemas ──────────────────────────────────────────────────────

export const delegationSchema = Yup.object({
  owner_broker_id: Yup.number().nullable(),
  delegate_broker_id: Yup.number()
    .typeError("Choose a team member")
    .required("Choose a team member")
    .test("not-owner", "A broker cannot delegate to themselves", function (v) {
      const owner = this.parent.owner_broker_id;
      return owner == null || v !== owner;
    }),
  can_view_clients: Yup.boolean(),
  can_view_realtors: Yup.boolean(),
  can_view_conversations: Yup.boolean(),
  can_send_from_line: Yup.boolean(),
}).test("one-scope", "Select at least one access scope", (v) =>
  SCOPES.some((s) => Boolean((v as Record<string, unknown>)?.[s.key])),
);

export const mainLineSchema = Yup.object({
  number: Yup.string()
    .trim()
    .matches(/^\+[1-9]\d{7,14}$/, {
      message: "Use E.164 format, e.g. +15623370000",
      excludeEmptyString: true,
    }),
  ring_broker_ids: Yup.array().of(Yup.number().required()),
});

// ─── Main line ───────────────────────────────────────────────────────────────

function MainLineCard({ canEdit, team }: { canEdit: boolean; team: Broker[] }) {
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const { mainLine, mainLineLoading, savingMainLine } = useAppSelector(
    (s) => s.phoneLines,
  );

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      number: mainLine?.number ?? "",
      ring_broker_ids: mainLine?.ring_broker_ids ?? [],
    },
    validationSchema: mainLineSchema,
    onSubmit: async (values) => {
      try {
        await dispatch(
          updateMainLine({
            number: values.number.trim() || null,
            ring_broker_ids: values.ring_broker_ids,
          }),
        ).unwrap();
        dispatch(fetchSendableLines());
        toast({ title: "Main line saved" });
      } catch (err) {
        logger.error("[PhoneLines] save main line failed", err);
        toast({
          title: "Could not save main line",
          description: String(err),
          variant: "destructive",
        });
      }
    },
  });

  const toggleRing = (id: number) => {
    const cur = formik.values.ring_broker_ids;
    formik.setFieldValue(
      "ring_broker_ids",
      cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id],
    );
  };

  if (mainLineLoading && !mainLine) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <form onSubmit={formik.handleSubmit} className="space-y-4">
      <div className="flex items-center gap-2">
        <Building2 className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">Main line</h3>
        {!canEdit && (
          <Badge variant="outline" className="ml-auto text-[10px]">
            Read only
          </Badge>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="main-line-number" className="text-xs">
          Number
        </Label>
        {canEdit ? (
          <Input
            id="main-line-number"
            name="number"
            placeholder="+15623370000"
            value={formik.values.number}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
          />
        ) : (
          <p className="text-sm font-medium">
            {mainLine?.number ? formatPhoneLabel(mainLine.number) : "Not set"}
          </p>
        )}
        {formik.touched.number && formik.errors.number && (
          <p className="text-xs text-destructive">{formik.errors.number}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Ring group</Label>
        <p className="text-xs text-muted-foreground">
          Team members whose browsers ring when the main line is called.
        </p>
        <div className="flex flex-wrap gap-2 pt-1">
          {(canEdit
            ? team
            : team.filter((b) => formik.values.ring_broker_ids.includes(b.id))
          ).map((b) => {
            const active = formik.values.ring_broker_ids.includes(b.id);
            return (
              <button
                key={b.id}
                type="button"
                disabled={!canEdit}
                onClick={() => toggleRing(b.id)}
                aria-pressed={active}
                className={cn(
                  "flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-all duration-200 active:scale-95",
                  active
                    ? "border-primary bg-primary text-primary-foreground shadow-sm"
                    : "border-border bg-background text-foreground hover:bg-muted",
                  !canEdit && "cursor-default active:scale-100",
                )}
              >
                {active && <Check className="h-3 w-3" />}
                {brokerName(b)}
              </button>
            );
          })}
          {!canEdit && formik.values.ring_broker_ids.length === 0 && (
            <span className="text-xs text-muted-foreground">Nobody yet</span>
          )}
        </div>
      </div>

      {canEdit && (
        <div className="flex justify-end">
          <Button
            type="submit"
            size="sm"
            disabled={savingMainLine || !formik.dirty}
          >
            {savingMainLine ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Save main line
          </Button>
        </div>
      )}
    </form>
  );
}

// ─── Add delegation dialog ───────────────────────────────────────────────────

function AddDelegationDialog({
  open,
  onOpenChange,
  team,
  selfId,
  isPlatformOwner,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  team: Broker[];
  selfId: number | null;
  isPlatformOwner: boolean;
}) {
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const saving = useAppSelector((s) => s.phoneLines.savingDelegation);

  const formik = useFormik<{
    owner_broker_id: number | null;
    delegate_broker_id: number | null;
    can_view_clients: boolean;
    can_view_realtors: boolean;
    can_view_conversations: boolean;
    can_send_from_line: boolean;
  }>({
    initialValues: {
      owner_broker_id: selfId,
      delegate_broker_id: null,
      can_view_clients: true,
      can_view_realtors: true,
      can_view_conversations: true,
      can_send_from_line: false,
    },
    validationSchema: delegationSchema,
    onSubmit: async (values, helpers) => {
      try {
        await dispatch(
          upsertDelegation({
            ...(isPlatformOwner && values.owner_broker_id
              ? { owner_broker_id: values.owner_broker_id }
              : {}),
            delegate_broker_id: values.delegate_broker_id as number,
            can_view_clients: values.can_view_clients,
            can_view_realtors: values.can_view_realtors,
            can_view_conversations: values.can_view_conversations,
            can_send_from_line: values.can_send_from_line,
          }),
        ).unwrap();
        toast({ title: "Access granted" });
        helpers.resetForm();
        onOpenChange(false);
      } catch (err) {
        logger.error("[PhoneLines] add delegation failed", err);
        toast({
          title: "Could not grant access",
          description: String(err),
          variant: "destructive",
        });
      }
    },
  });

  const formError =
    typeof formik.errors === "object" && formik.submitCount > 0
      ? ((formik.errors as Record<string, string | undefined>)[""] ?? null)
      : null;
  const noScope = !SCOPES.some((s) => formik.values[s.key]);

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) formik.resetForm();
        onOpenChange(v);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <form onSubmit={formik.handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Give a team member access</DialogTitle>
            <DialogDescription>
              They will see the selected parts of the owner's book.
            </DialogDescription>
          </DialogHeader>

          {isPlatformOwner && (
            <div className="space-y-1.5">
              <Label className="text-xs">Owner (whose book)</Label>
              <Select
                value={formik.values.owner_broker_id?.toString() ?? ""}
                onValueChange={(v) =>
                  formik.setFieldValue("owner_broker_id", Number(v))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose owner" />
                </SelectTrigger>
                <SelectContent>
                  {team.map((b) => (
                    <SelectItem key={b.id} value={String(b.id)}>
                      {brokerName(b)}
                      {b.id === selfId ? " (you)" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-1.5">
            <Label className="text-xs">Team member</Label>
            <Select
              value={formik.values.delegate_broker_id?.toString() ?? ""}
              onValueChange={(v) => {
                formik.setFieldTouched("delegate_broker_id", true, false);
                formik.setFieldValue("delegate_broker_id", Number(v));
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose a team member" />
              </SelectTrigger>
              <SelectContent>
                {team
                  .filter((b) => b.id !== formik.values.owner_broker_id)
                  .map((b) => (
                    <SelectItem key={b.id} value={String(b.id)}>
                      {brokerName(b)}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            {(formik.touched.delegate_broker_id || formik.submitCount > 0) &&
              formik.errors.delegate_broker_id && (
                <p className="text-xs text-destructive">
                  {formik.errors.delegate_broker_id}
                </p>
              )}
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Access</Label>
            {SCOPES.map(({ key, label, icon: Icon }) => (
              <div
                key={key}
                className="flex items-center justify-between rounded-xl border border-border/50 px-3 py-2"
              >
                <span className="flex items-center gap-2 text-sm">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  {label}
                </span>
                <Switch
                  checked={formik.values[key]}
                  onCheckedChange={(v) => formik.setFieldValue(key, v)}
                />
              </div>
            ))}
            {(formError || (formik.submitCount > 0 && noScope)) && (
              <p className="text-xs text-destructive">
                {formError ?? "Select at least one access scope"}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Grant access
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Delegation row ──────────────────────────────────────────────────────────

function DelegationRow({
  d,
  canEdit,
  onRevoke,
}: {
  d: BrokerDelegation;
  canEdit: boolean;
  onRevoke: (d: BrokerDelegation) => void;
}) {
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const revokingId = useAppSelector((s) => s.phoneLines.revokingId);

  const toggle = async (key: ScopeKey, value: boolean) => {
    const next = {
      can_view_clients: d.can_view_clients,
      can_view_realtors: d.can_view_realtors,
      can_view_conversations: d.can_view_conversations,
      can_send_from_line: d.can_send_from_line,
      [key]: value,
    };
    if (!SCOPES.some((s) => next[s.key])) {
      toast({
        title: "At least one scope is required",
        description: "Revoke access instead to remove every scope.",
      });
      return;
    }
    try {
      await dispatch(
        upsertDelegation({
          owner_broker_id: d.owner_broker_id,
          delegate_broker_id: d.delegate_broker_id,
          ...next,
        }),
      ).unwrap();
    } catch (err) {
      logger.error("[PhoneLines] toggle scope failed", err);
      toast({
        title: "Could not update access",
        description: String(err),
        variant: "destructive",
      });
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -12 }}
      className="rounded-xl border border-border/60 bg-background p-3 space-y-3"
    >
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground truncate">
            {d.delegate_name}
            <span className="font-normal text-muted-foreground">
              {" "}
              → {d.owner_name}'s book
            </span>
          </p>
          {d.owner_line && (
            <p className="text-xs text-muted-foreground">
              Line {formatPhoneLabel(d.owner_line)}
            </p>
          )}
        </div>
        {canEdit && (
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 shrink-0 text-destructive hover:bg-destructive/10"
            disabled={revokingId === d.id}
            onClick={() => onRevoke(d)}
            aria-label={`Revoke ${d.delegate_name}'s access`}
          >
            {revokingId === d.id ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
          </Button>
        )}
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {SCOPES.map(({ key, label, icon: Icon }) => (
          <label
            key={key}
            className="flex items-center justify-between gap-2 rounded-lg bg-muted/30 px-3 py-1.5 text-xs"
          >
            <span className="flex items-center gap-1.5">
              <Icon className="h-3.5 w-3.5 text-muted-foreground" />
              {label}
            </span>
            <Switch
              checked={d[key]}
              disabled={!canEdit}
              onCheckedChange={(v) => toggle(key, v)}
            />
          </label>
        ))}
      </div>
    </motion.div>
  );
}

// ─── Card ────────────────────────────────────────────────────────────────────

/** Settings card: shared main line + ring group, and team access delegations. */
export function PhoneLinesTeamAccessCard() {
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const user = useAppSelector((s) => s.brokerAuth.user);
  const { mortgageBankers } = useAppSelector((s) => s.brokers);
  const { delegations, delegationsLoading, delegationsLoaded } = useAppSelector(
    (s) => s.phoneLines,
  );
  const [addOpen, setAddOpen] = useState(false);
  const [confirm, setConfirm] = useState<BrokerDelegation | null>(null);

  const isPlatformOwner = user?.role === "platform_owner";
  const selfId = user?.id ?? null;
  const team = useMemo(
    () => mortgageBankers.filter(isTeamMember),
    [mortgageBankers],
  );

  useEffect(() => {
    dispatch(fetchMainLine());
    dispatch(fetchDelegations());
    dispatch(fetchMortgageBankers());
  }, [dispatch]);

  const canEditRow = (d: BrokerDelegation) =>
    isPlatformOwner || d.owner_broker_id === selfId;

  const handleRevoke = async () => {
    if (!confirm) return;
    const target = confirm;
    setConfirm(null);
    try {
      await dispatch(revokeDelegation(target.id)).unwrap();
      toast({ title: "Access revoked" });
    } catch (err) {
      logger.error("[PhoneLines] revoke failed", err);
      toast({
        title: "Could not revoke access",
        description: String(err),
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <MainLineCard canEdit={isPlatformOwner} team={team} />

      <div className="space-y-3 border-t border-border/40 pt-5">
        <div className="flex flex-wrap items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Team access</h3>
          <Button
            size="sm"
            variant="outline"
            className="ml-auto"
            onClick={() => setAddOpen(true)}
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Add access
          </Button>
        </div>

        {delegationsLoading && !delegationsLoaded ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : delegations.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border/60 px-4 py-6 text-center text-sm text-muted-foreground">
            No one has delegated access yet.
          </p>
        ) : (
          <div className="space-y-2">
            <AnimatePresence initial={false}>
              {delegations.map((d) => (
                <DelegationRow
                  key={d.id}
                  d={d}
                  canEdit={canEditRow(d)}
                  onRevoke={setConfirm}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      <AddDelegationDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        team={team}
        selfId={selfId}
        isPlatformOwner={isPlatformOwner}
      />

      <AlertDialog
        open={!!confirm}
        onOpenChange={(v) => !v && setConfirm(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke access?</AlertDialogTitle>
            <AlertDialogDescription>
              {confirm
                ? `${confirm.delegate_name} will lose access to ${confirm.owner_name}'s book immediately.`
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRevoke}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Revoke
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default PhoneLinesTeamAccessCard;
