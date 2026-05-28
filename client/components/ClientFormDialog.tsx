import React, { useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Loader2,
  User,
  MapPin,
  AlertTriangle,
  ArrowRightLeft,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  createClient,
  updateClient,
  reassignClient,
} from "@/store/slices/clientsSlice";
import type { ClientCreateConflict } from "@/store/slices/clientsSlice";
import { useToast } from "@/hooks/use-toast";
import type { GetClientsResponse } from "@shared/api";

type ClientRow = GetClientsResponse["clients"][0];

interface ClientFormDialogProps {
  open: boolean;
  onClose: () => void;
  /** When provided the dialog is in edit mode; otherwise create mode. */
  client?: ClientRow | null;
}

const validationSchema = Yup.object({
  first_name: Yup.string().trim().required("First name is required"),
  middle_name: Yup.string().trim(),
  last_name: Yup.string().trim().required("Last name is required"),
  email: Yup.string().email("Invalid email").optional(),
  phone: Yup.string().trim(),
  date_of_birth: Yup.string(),
  address_street: Yup.string().trim(),
  address_unit: Yup.string().trim(),
  address_city: Yup.string().trim(),
  address_state: Yup.string().trim(),
  address_zip: Yup.string().trim(),
});

const ClientFormDialog: React.FC<ClientFormDialogProps> = ({
  open,
  onClose,
  client,
}) => {
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const isEdit = !!client;
  const currentUser = useAppSelector((s) => s.brokerAuth.user);

  const [conflict, setConflict] = useState<
    ClientCreateConflict["conflict"] | null
  >(null);
  const [isReassigning, setIsReassigning] = useState(false);

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      first_name: client?.first_name ?? "",
      middle_name: (client as any)?.middle_name ?? "",
      last_name: client?.last_name ?? "",
      email: client?.email ?? "",
      phone: client?.phone ?? "",
      date_of_birth: client?.date_of_birth
        ? client.date_of_birth.split("T")[0]
        : "",
      address_street: (client as any)?.address_street ?? "",
      address_unit: (client as any)?.address_unit ?? "",
      address_city: (client as any)?.address_city ?? "",
      address_state: (client as any)?.address_state ?? "",
      address_zip: (client as any)?.address_zip ?? "",
    },
    validationSchema,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        if (isEdit) {
          await dispatch(
            updateClient({
              clientId: client.id,
              payload: {
                first_name: values.first_name,
                middle_name: values.middle_name || undefined,
                last_name: values.last_name,
                // Send null explicitly so the API clears the column when user empties the field.
                // Sending undefined would leave the existing value unchanged.
                phone: values.phone.trim() || null,
                date_of_birth: values.date_of_birth || undefined,
                address_street: values.address_street || undefined,
                address_unit: values.address_unit || undefined,
                address_city: values.address_city || undefined,
                address_state: values.address_state || undefined,
                address_zip: values.address_zip || undefined,
              },
            }),
          ).unwrap();
          toast({
            title: "Client updated",
            description: `${values.first_name} ${values.last_name} has been updated.`,
          });
        } else {
          await dispatch(
            createClient({
              first_name: values.first_name,
              middle_name: values.middle_name || undefined,
              last_name: values.last_name,
              email: values.email?.trim() || undefined,
              phone: values.phone || undefined,
              address_street: values.address_street || undefined,
              address_unit: values.address_unit || undefined,
              address_city: values.address_city || undefined,
              address_state: values.address_state || undefined,
              address_zip: values.address_zip || undefined,
            }),
          ).unwrap();
          toast({
            title: "Client created",
            description: `${values.first_name} ${values.last_name} has been added.`,
          });
        }
        onClose();
      } catch (err: any) {
        // Check if this is a structured email conflict (409 with existing owner info)
        if (err && typeof err === "object" && err.conflict) {
          const conflictData = (err as ClientCreateConflict).conflict;
          setConflict(conflictData);
          if (conflictData.conflict_field === "phone") {
            formik.setFieldError(
              "phone",
              "This phone number is already in use",
            );
            formik.setFieldTouched("phone", true, false);
          } else {
            formik.setFieldError("email", "This email is already in use");
            formik.setFieldTouched("email", true, false);
          }
        } else {
          const message: string = err || "Something went wrong.";
          setConflict(null);
          // Highlight the conflicting field inline so the user knows exactly what to fix
          if (/phone/i.test(message)) {
            formik.setFieldError("phone", message);
            formik.setFieldTouched("phone", true, false);
          } else if (/email/i.test(message)) {
            formik.setFieldError("email", message);
            formik.setFieldTouched("email", true, false);
          }
          toast({
            title: isEdit ? "Update failed" : "Create failed",
            description: message,
            variant: "destructive",
          });
        }
      } finally {
        setSubmitting(false);
      }
    },
  });

  const handleReassign = async () => {
    if (!conflict) return;
    setIsReassigning(true);
    try {
      const result = await dispatch(
        reassignClient({
          clientId: conflict.client_id,
          brokerId: currentUser!.id,
        }),
      ).unwrap();
      toast({ title: "Client transferred", description: result.message });
      setConflict(null);
      onClose();
    } catch (err: any) {
      toast({
        title: "Transfer failed",
        description: err || "Could not reassign client.",
        variant: "destructive",
      });
    } finally {
      setIsReassigning(false);
    }
  };

  const field = (
    name: keyof typeof formik.values,
    label: string,
    type = "text",
    placeholder = "",
  ) => (
    <div className="space-y-1.5">
      <Label htmlFor={name} className="text-sm font-medium">
        {label}
      </Label>
      <Input
        id={name}
        name={name}
        type={type}
        placeholder={placeholder}
        value={formik.values[name]}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        className={
          formik.touched[name] && formik.errors[name]
            ? "border-destructive focus-visible:ring-destructive"
            : ""
        }
      />
      {formik.touched[name] && formik.errors[name] && (
        <p className="text-xs text-destructive">
          {String(formik.errors[name])}
        </p>
      )}
    </div>
  );

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) {
          formik.resetForm();
          setConflict(null);
          onClose();
        }
      }}
    >
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            {isEdit ? "Edit Client" : "New Client"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={formik.handleSubmit} className="space-y-5 mt-2">
          {/* Basic info */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              Basic Info
            </p>
            <div className="grid grid-cols-2 gap-3">
              {field("first_name", "First Name", "text", "Jane")}
              {field("last_name", "Last Name", "text", "Doe")}
            </div>
            <div className="mt-3">
              {field("middle_name", "Middle Name (optional)", "text", "Marie")}
            </div>
            <div className="mt-3 space-y-3">
              {/* Email — custom render so we can inject the conflict banner */}
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email (optional)
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="jane@example.com"
                  value={formik.values.email}
                  onChange={(e) => {
                    if (conflict?.conflict_field === "email") setConflict(null);
                    formik.handleChange(e);
                  }}
                  onBlur={formik.handleBlur}
                  className={
                    formik.touched.email && formik.errors.email
                      ? "border-destructive focus-visible:ring-destructive"
                      : ""
                  }
                />
                {formik.touched.email && formik.errors.email && (
                  <p className="text-xs text-destructive">
                    {String(formik.errors.email)}
                  </p>
                )}
                {/* Email conflict banner */}
                {conflict?.conflict_field === "email" && (
                  <div className="rounded-lg border border-amber-500/30 bg-amber-50 dark:bg-amber-950/20 p-3 flex flex-col gap-2">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium text-amber-800 dark:text-amber-300">
                          {isEdit
                            ? "Email already in use"
                            : "Client already exists"}
                        </p>
                        <p className="text-amber-700 dark:text-amber-400 mt-0.5">
                          <span className="font-semibold">
                            {conflict.client_name}
                          </span>
                          {" is currently assigned to "}
                          <span className="font-semibold">
                            {conflict.broker_name ?? "an unassigned account"}
                          </span>
                          {isEdit ? ". Please use a different email." : "."}
                        </p>
                      </div>
                    </div>
                    {!isEdit && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="self-start border-amber-500/40 text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/30 gap-1.5"
                        onClick={handleReassign}
                        disabled={isReassigning}
                      >
                        {isReassigning ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <ArrowRightLeft className="h-3.5 w-3.5" />
                        )}
                        Transfer to my account
                      </Button>
                    )}
                  </div>
                )}
              </div>
              {/* Phone — custom render so we can inject the conflict banner */}
              <div className="space-y-1.5">
                <Label htmlFor="phone" className="text-sm font-medium">
                  Phone
                </Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="(555) 000-0000"
                  value={formik.values.phone}
                  onChange={(e) => {
                    if (conflict?.conflict_field === "phone") setConflict(null);
                    formik.handleChange(e);
                  }}
                  onBlur={formik.handleBlur}
                  className={
                    formik.touched.phone && formik.errors.phone
                      ? "border-destructive focus-visible:ring-destructive"
                      : ""
                  }
                />
                {formik.touched.phone && formik.errors.phone && (
                  <p className="text-xs text-destructive">
                    {String(formik.errors.phone)}
                  </p>
                )}
                {/* Phone conflict banner */}
                {conflict?.conflict_field === "phone" && (
                  <div className="rounded-lg border border-amber-500/30 bg-amber-50 dark:bg-amber-950/20 p-3 flex flex-col gap-2">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium text-amber-800 dark:text-amber-300">
                          {isEdit
                            ? "Phone already in use"
                            : "Client already exists"}
                        </p>
                        <p className="text-amber-700 dark:text-amber-400 mt-0.5">
                          <span className="font-semibold">
                            {conflict.client_name}
                          </span>
                          {" is currently assigned to "}
                          <span className="font-semibold">
                            {conflict.broker_name ?? "an unassigned account"}
                          </span>
                          {isEdit ? ". Please use a different number." : "."}
                        </p>
                      </div>
                    </div>
                    {!isEdit && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="self-start border-amber-500/40 text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/30 gap-1.5"
                        onClick={handleReassign}
                        disabled={isReassigning}
                      >
                        {isReassigning ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <ArrowRightLeft className="h-3.5 w-3.5" />
                        )}
                        Transfer to my account
                      </Button>
                    )}
                  </div>
                )}
              </div>
              {field("date_of_birth", "Date of Birth", "date")}
            </div>
          </div>

          <Separator />

          {/* Address */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" />
              Address{" "}
              <span className="font-normal normal-case">(optional)</span>
            </p>
            <div className="space-y-3">
              {field("address_street", "Street", "text", "123 Main St")}
              <div className="grid grid-cols-2 gap-3">
                {field("address_unit", "Unit / Apt", "text", "Apt 4B")}
                {field("address_zip", "ZIP", "text", "90001")}
              </div>
              <div className="grid grid-cols-3 gap-3">
                {field("address_city", "City", "text", "Los Angeles")}
                {field("address_state", "State", "text", "CA")}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                formik.resetForm();
                setConflict(null);
                onClose();
              }}
              disabled={formik.isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={formik.isSubmitting || (isEdit && !!conflict)}
            >
              {formik.isSubmitting && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              {isEdit ? "Save Changes" : "Create Client"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ClientFormDialog;
