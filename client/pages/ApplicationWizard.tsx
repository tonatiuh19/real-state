import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { useFormik } from "formik";
import * as Yup from "yup";
import { MetaHelmet } from "@/components/MetaHelmet";
import { applicationPageMeta } from "@/lib/seo-helpers";
import { IS_DEV } from "@/lib/env";
import { useToast } from "@/hooks/use-toast";
import {
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Home,
  User,
  Briefcase,
  ShieldCheck,
  FileText,
  X,
  DollarSign,
  Building2,
  Lock as LockIcon,
  ClipboardList,
  Loader2,
  AlertCircle,
  BadgeCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  submitPublicApplication,
  resetWizard,
} from "@/store/slices/applicationWizardSlice";

// ─── Steps definition ──────────────────────────────────────────────────────

const STEPS = [
  { id: 1, title: "Identity", icon: <User className="h-5 w-5" /> },
  { id: 2, title: "Property", icon: <Home className="h-5 w-5" /> },
  { id: 3, title: "Finances", icon: <DollarSign className="h-5 w-5" /> },
  { id: 4, title: "Employment", icon: <Briefcase className="h-5 w-5" /> },
  { id: 5, title: "Review", icon: <ClipboardList className="h-5 w-5" /> },
  { id: 6, title: "Complete", icon: <BadgeCheck className="h-5 w-5" /> },
];

// ─── Per-step Yup schemas ──────────────────────────────────────────────────

const stepSchemas: Record<number, Yup.AnyObjectSchema> = {
  1: Yup.object({
    first_name: Yup.string().required("First name is required"),
    last_name: Yup.string().required("Last name is required"),
    email: Yup.string().email("Invalid email").required("Email is required"),
    phone: Yup.string().required("Phone number is required"),
    address_street: Yup.string().required("Street address is required"),
    address_city: Yup.string().required("City is required"),
    address_state: Yup.string().required("State is required"),
    address_zip: Yup.string().required("ZIP code is required"),
  }),
  2: Yup.object({
    loan_type: Yup.string().required("Loan type is required"),
    property_value: Yup.number()
      .typeError("Must be a number")
      .positive("Must be greater than 0")
      .required("Property value is required"),
    down_payment: Yup.number()
      .typeError("Must be a number")
      .min(0, "Cannot be negative")
      .required("Down payment is required"),
    property_type: Yup.string().required("Property type is required"),
    property_address: Yup.string().required("Property address is required"),
    property_city: Yup.string().required("City is required"),
    property_state: Yup.string().required("State is required"),
    property_zip: Yup.string().required("ZIP code is required"),
  }),
  3: Yup.object({
    income_type: Yup.string().required("Income type is required"),
    annual_income: Yup.number()
      .typeError("Must be a number")
      .positive("Must be greater than 0")
      .required("Annual income is required"),
    credit_score_range: Yup.string().required("Credit score range is required"),
  }),
  4: Yup.object({
    employment_status: Yup.string().required("Employment status is required"),
    employer_name: Yup.string().when("employment_status", {
      is: (v: string) => v === "employed" || v === "self_employed",
      then: (s) => s.required("Employer / business name is required"),
      otherwise: (s) => s.notRequired(),
    }),
    years_employed: Yup.string().notRequired(),
  }),
  5: Yup.object({}),
};

// ─── Initial form values ───────────────────────────────────────────────────

const initialValues = {
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  address_street: "",
  address_city: "",
  address_state: "",
  address_zip: "",
  loan_type: "purchase",
  property_value: "",
  down_payment: "",
  property_type: "single_family",
  property_address: "",
  property_city: "",
  property_state: "",
  property_zip: "",
  loan_purpose: "",
  income_type: "W-2",
  annual_income: "",
  credit_score_range: "",
  employment_status: "",
  employer_name: "",
  years_employed: "",
};

// ─── Helpers ───────────────────────────────────────────────────────────────

const FieldError = ({ msg }: { msg?: string }) =>
  msg ? (
    <p className="flex items-center gap-1 text-xs text-destructive mt-1">
      <AlertCircle className="h-3 w-3" />
      {msg}
    </p>
  ) : null;

const reviewField = (label: string, value: string | number | undefined) =>
  value ? (
    <div className="flex justify-between items-start py-2 border-b border-border/40 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-right max-w-[55%]">
        {value}
      </span>
    </div>
  ) : null;

const formatCurrency = (v: string | number) => {
  const n = parseFloat(String(v));
  if (isNaN(n)) return String(v);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
};

// ─── Component ────────────────────────────────────────────────────────────

const ApplicationWizard = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { loading, error, submittedApplicationNumber } = useAppSelector(
    (s) => s.applicationWizard,
  );
  const { toast } = useToast();
  const isDev = IS_DEV;

  const fillTestData = () => {
    formik.setValues({
      first_name: "Jane",
      last_name: "Doe",
      email: "test.client@example.com",
      phone: "(555) 123-4567",
      address_street: "789 Elm Street",
      address_city: "Los Angeles",
      address_state: "CA",
      address_zip: "90001",
      loan_type: "purchase",
      property_value: "550000",
      down_payment: "110000",
      property_type: "single_family",
      property_address: "123 Oak Avenue",
      property_city: "San Francisco",
      property_state: "CA",
      property_zip: "94102",
      loan_purpose: "Primary residence purchase for development testing",
      income_type: "W-2",
      annual_income: "120000",
      credit_score_range: "740",
      employment_status: "employed",
      employer_name: "Acme Corp",
      years_employed: "5",
    });
    toast({
      title: "Test data filled",
      description: "All form fields have been populated with test data.",
    });
  };

  const formik = useFormik({
    initialValues,
    validationSchema: stepSchemas[currentStep] ?? Yup.object({}),
    validateOnChange: false,
    validateOnBlur: true,
    onSubmit: async (values) => {
      const result = await dispatch(
        submitPublicApplication({
          first_name: values.first_name,
          last_name: values.last_name,
          email: values.email,
          phone: values.phone,
          address_street: values.address_street,
          address_city: values.address_city,
          address_state: values.address_state,
          address_zip: values.address_zip,
          loan_type: values.loan_type,
          property_value: values.property_value,
          down_payment: values.down_payment,
          property_type: values.property_type,
          property_address: values.property_address,
          property_city: values.property_city,
          property_state: values.property_state,
          property_zip: values.property_zip,
          loan_purpose: values.loan_purpose,
          annual_income: values.annual_income,
          credit_score_range: values.credit_score_range,
          income_type: values.income_type,
          employment_status: values.employment_status,
          employer_name: values.employer_name,
          years_employed: values.years_employed,
        }),
      );
      if (submitPublicApplication.fulfilled.match(result)) {
        setCurrentStep(6);
      }
    },
  });

  const nextStep = async () => {
    if (currentStep === 5) {
      await formik.submitForm();
      return;
    }
    const schema = stepSchemas[currentStep];
    if (schema) {
      const errors = await formik.validateForm();
      if (Object.keys(errors).length > 0) {
        formik.setTouched(
          Object.keys(errors).reduce(
            (acc, key) => ({ ...acc, [key]: true }),
            {},
          ),
        );
        return;
      }
    }
    setCurrentStep((prev) => Math.min(prev + 1, STEPS.length));
  };

  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 1));
  const isComplete = currentStep === 6;

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-background overflow-y-auto">
      <MetaHelmet {...applicationPageMeta} />

      {/* ── Header ── */}
      <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-xl border-b">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="flex items-center transition-transform hover:scale-105"
            >
              <img
                src="https://disruptinglabs.com/data/encore/assets/images/logo.png"
                alt="Encore Mortgage"
                className="h-10 w-auto"
              />
            </Link>
            <div className="h-4 w-px bg-border hidden sm:block" />
            <span className="text-sm font-medium text-muted-foreground hidden sm:block">
              Loan Application Wizard
            </span>
          </div>
          <div className="flex items-center gap-2">
            {isDev && !isComplete && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={fillTestData}
                className="text-xs"
              >
                Fill Test Data
              </Button>
            )}
            {!isComplete && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/")}
                className="rounded-full"
              >
                <X className="h-5 w-5" />
              </Button>
            )}
          </div>
        </div>
        {!isComplete && (
          <Progress
            value={((currentStep - 1) / (STEPS.length - 1)) * 100}
            className="h-1 rounded-none bg-primary/10"
          />
        )}
      </header>

      <div className="flex-1 flex flex-col">
        <div className="container max-w-5xl py-12 md:py-20 flex-1 flex flex-col">
          {/* ── Success screen ── */}
          {isComplete ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center flex-1 text-center space-y-8 py-10"
            >
              <div className="relative">
                <div className="rounded-full bg-emerald-500/10 p-10">
                  <CheckCircle2 className="h-20 w-20 text-emerald-500" />
                </div>
                <div className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-emerald-500 animate-ping opacity-60" />
              </div>
              <div className="space-y-3 max-w-lg">
                <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-sm px-4 py-1">
                  Application Submitted
                </Badge>
                <h2 className="text-4xl font-bold tracking-tight">
                  You're all set!
                </h2>
                <p className="text-muted-foreground text-lg leading-relaxed">
                  Your application{" "}
                  <span className="font-bold text-primary">
                    #{submittedApplicationNumber}
                  </span>{" "}
                  has been received. A loan officer from Encore Mortgage will
                  review it and contact you within 1–2 business days.
                </p>
              </div>
              <div className="grid sm:grid-cols-3 gap-4 max-w-lg w-full">
                {[
                  {
                    icon: <ClipboardList className="h-5 w-5" />,
                    text: "Application reviewed by a loan officer",
                  },
                  {
                    icon: <ArrowRight className="h-5 w-5" />,
                    text: "You'll be contacted within 48 hours",
                  },
                  {
                    icon: <LockIcon className="h-5 w-5" />,
                    text: "Access your portal to track progress",
                  },
                ].map((item, i) => (
                  <div
                    key={i}
                    className="rounded-2xl border bg-card p-5 text-center space-y-2"
                  >
                    <div className="flex justify-center text-primary">
                      {item.icon}
                    </div>
                    <p className="text-xs text-muted-foreground leading-snug">
                      {item.text}
                    </p>
                  </div>
                ))}
              </div>
              <div className="flex gap-4 pt-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    dispatch(resetWizard());
                    navigate("/");
                  }}
                  className="rounded-xl"
                >
                  Back to Home
                </Button>
                <Button
                  onClick={() => navigate("/portal")}
                  className="rounded-xl px-8 font-bold shadow-lg shadow-primary/20"
                >
                  Go to My Portal
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          ) : (
            <div className="grid gap-12 lg:grid-cols-[280px_1fr]">
              {/* ── Sidebar ── */}
              <aside className="hidden lg:block space-y-6">
                <div className="space-y-2">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-primary/60">
                    Application Steps
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Fill in all details accurately for smooth processing.
                  </p>
                </div>
                <nav className="space-y-4">
                  {STEPS.map((step) => (
                    <div
                      key={step.id}
                      className={cn(
                        "flex items-center gap-4 transition-all duration-200",
                        currentStep === step.id
                          ? "translate-x-2"
                          : "opacity-50",
                      )}
                    >
                      <div
                        className={cn(
                          "flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all",
                          currentStep === step.id
                            ? "border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                            : currentStep > step.id
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-muted",
                        )}
                      >
                        {currentStep > step.id ? (
                          <CheckCircle2 className="h-4 w-4" />
                        ) : (
                          step.icon
                        )}
                      </div>
                      <span
                        className={cn(
                          "text-sm font-semibold",
                          currentStep === step.id
                            ? "text-primary"
                            : "text-muted-foreground",
                        )}
                      >
                        {step.title}
                      </span>
                    </div>
                  ))}
                </nav>
              </aside>

              {/* ── Main content ── */}
              <main className="flex-1">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.25 }}
                    className="space-y-8"
                  >
                    <div className="space-y-2">
                      <Badge
                        variant="outline"
                        className="mb-2 text-primary border-primary/20 bg-primary/5"
                      >
                        Step {currentStep} of {STEPS.length}
                      </Badge>
                      <h2 className="text-3xl font-bold tracking-tight">
                        {STEPS[currentStep - 1].title}
                      </h2>
                      <p className="text-muted-foreground">
                        {currentStep === 1 &&
                          "Tell us about yourself so we can personalize your loan options."}
                        {currentStep === 2 &&
                          "Share details about the property you have in mind."}
                        {currentStep === 3 &&
                          "A snapshot of your finances helps us find the best rates."}
                        {currentStep === 4 &&
                          "Your employment history helps us assess your eligibility."}
                        {currentStep === 5 &&
                          "Review your information before submitting."}
                      </p>
                    </div>

                    <form
                      onSubmit={formik.handleSubmit}
                      className="rounded-3xl border bg-card p-8 md:p-10 shadow-sm"
                    >
                      {/* ── Step 1: Identity ── */}
                      {currentStep === 1 && (
                        <div className="grid gap-5 md:grid-cols-2">
                          <div className="space-y-1.5">
                            <Label htmlFor="first_name">First Name *</Label>
                            <Input
                              id="first_name"
                              placeholder="Jane"
                              className="h-12 rounded-xl"
                              {...formik.getFieldProps("first_name")}
                            />
                            <FieldError
                              msg={
                                formik.touched.first_name
                                  ? formik.errors.first_name
                                  : undefined
                              }
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label htmlFor="last_name">Last Name *</Label>
                            <Input
                              id="last_name"
                              placeholder="Doe"
                              className="h-12 rounded-xl"
                              {...formik.getFieldProps("last_name")}
                            />
                            <FieldError
                              msg={
                                formik.touched.last_name
                                  ? formik.errors.last_name
                                  : undefined
                              }
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label htmlFor="email">Email Address *</Label>
                            <Input
                              id="email"
                              type="email"
                              placeholder="jane@example.com"
                              className="h-12 rounded-xl"
                              {...formik.getFieldProps("email")}
                            />
                            <FieldError
                              msg={
                                formik.touched.email
                                  ? formik.errors.email
                                  : undefined
                              }
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label htmlFor="phone">Phone Number *</Label>
                            <Input
                              id="phone"
                              type="tel"
                              placeholder="(555) 000-0000"
                              className="h-12 rounded-xl"
                              {...formik.getFieldProps("phone")}
                            />
                            <FieldError
                              msg={
                                formik.touched.phone
                                  ? formik.errors.phone
                                  : undefined
                              }
                            />
                          </div>
                          <div className="space-y-1.5 md:col-span-2">
                            <Label htmlFor="address_street">
                              Street Address *
                            </Label>
                            <Input
                              id="address_street"
                              placeholder="123 Main St, Apt 4B"
                              className="h-12 rounded-xl"
                              {...formik.getFieldProps("address_street")}
                            />
                            <FieldError
                              msg={
                                formik.touched.address_street
                                  ? formik.errors.address_street
                                  : undefined
                              }
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label htmlFor="address_city">City *</Label>
                            <Input
                              id="address_city"
                              placeholder="Los Angeles"
                              className="h-12 rounded-xl"
                              {...formik.getFieldProps("address_city")}
                            />
                            <FieldError
                              msg={
                                formik.touched.address_city
                                  ? formik.errors.address_city
                                  : undefined
                              }
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <Label htmlFor="address_state">State *</Label>
                              <Input
                                id="address_state"
                                placeholder="CA"
                                maxLength={2}
                                className="h-12 rounded-xl uppercase"
                                {...formik.getFieldProps("address_state")}
                              />
                              <FieldError
                                msg={
                                  formik.touched.address_state
                                    ? formik.errors.address_state
                                    : undefined
                                }
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label htmlFor="address_zip">ZIP *</Label>
                              <Input
                                id="address_zip"
                                placeholder="90001"
                                className="h-12 rounded-xl"
                                {...formik.getFieldProps("address_zip")}
                              />
                              <FieldError
                                msg={
                                  formik.touched.address_zip
                                    ? formik.errors.address_zip
                                    : undefined
                                }
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* ── Step 2: Property ── */}
                      {currentStep === 2 && (
                        <div className="grid gap-5 md:grid-cols-2">
                          <div className="space-y-1.5">
                            <Label htmlFor="loan_type">Loan Purpose *</Label>
                            <select
                              id="loan_type"
                              className="flex h-12 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                              {...formik.getFieldProps("loan_type")}
                            >
                              <option value="purchase">Home Purchase</option>
                              <option value="refinance">Refinance</option>
                              <option value="home_equity">Home Equity</option>
                              <option value="commercial">Commercial</option>
                              <option value="construction">Construction</option>
                              <option value="other">Other</option>
                            </select>
                          </div>
                          <div className="space-y-1.5">
                            <Label htmlFor="property_value">
                              Estimated Property Value *
                            </Label>
                            <div className="relative">
                              <DollarSign className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                              <Input
                                id="property_value"
                                type="number"
                                placeholder="500000"
                                className="h-12 rounded-xl pl-9"
                                {...formik.getFieldProps("property_value")}
                              />
                            </div>
                            <FieldError
                              msg={
                                formik.touched.property_value
                                  ? (formik.errors.property_value as string)
                                  : undefined
                              }
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label>Property Type *</Label>
                            <div className="grid grid-cols-3 gap-2">
                              {[
                                {
                                  v: "single_family",
                                  label: "Single Family",
                                  icon: <Home className="h-4 w-4" />,
                                },
                                {
                                  v: "condo",
                                  label: "Condo",
                                  icon: <Building2 className="h-4 w-4" />,
                                },
                                {
                                  v: "multi_family",
                                  label: "Multi Family",
                                  icon: <Building2 className="h-4 w-4" />,
                                },
                              ].map(({ v, label, icon }) => (
                                <button
                                  key={v}
                                  type="button"
                                  onClick={() =>
                                    formik.setFieldValue("property_type", v)
                                  }
                                  className={cn(
                                    "h-20 flex flex-col items-center justify-center gap-1.5 rounded-xl border-2 text-xs font-medium transition-all",
                                    formik.values.property_type === v
                                      ? "border-primary bg-primary/5 text-primary"
                                      : "border-muted hover:border-primary/40",
                                  )}
                                >
                                  {icon}
                                  {label}
                                </button>
                              ))}
                            </div>
                            <FieldError
                              msg={
                                formik.touched.property_type
                                  ? formik.errors.property_type
                                  : undefined
                              }
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label htmlFor="down_payment">
                              Planned Down Payment *
                            </Label>
                            <div className="relative">
                              <DollarSign className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                              <Input
                                id="down_payment"
                                type="number"
                                placeholder="100000"
                                className="h-12 rounded-xl pl-9"
                                {...formik.getFieldProps("down_payment")}
                              />
                            </div>
                            <FieldError
                              msg={
                                formik.touched.down_payment
                                  ? (formik.errors.down_payment as string)
                                  : undefined
                              }
                            />
                          </div>
                          <div className="space-y-1.5 md:col-span-2">
                            <Label htmlFor="property_address">
                              Property Address *
                            </Label>
                            <Input
                              id="property_address"
                              placeholder="456 Oak Ave"
                              className="h-12 rounded-xl"
                              {...formik.getFieldProps("property_address")}
                            />
                            <FieldError
                              msg={
                                formik.touched.property_address
                                  ? formik.errors.property_address
                                  : undefined
                              }
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label htmlFor="property_city">City *</Label>
                            <Input
                              id="property_city"
                              placeholder="San Francisco"
                              className="h-12 rounded-xl"
                              {...formik.getFieldProps("property_city")}
                            />
                            <FieldError
                              msg={
                                formik.touched.property_city
                                  ? formik.errors.property_city
                                  : undefined
                              }
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <Label htmlFor="property_state">State *</Label>
                              <Input
                                id="property_state"
                                placeholder="CA"
                                maxLength={2}
                                className="h-12 rounded-xl uppercase"
                                {...formik.getFieldProps("property_state")}
                              />
                              <FieldError
                                msg={
                                  formik.touched.property_state
                                    ? formik.errors.property_state
                                    : undefined
                                }
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label htmlFor="property_zip">ZIP *</Label>
                              <Input
                                id="property_zip"
                                placeholder="94102"
                                className="h-12 rounded-xl"
                                {...formik.getFieldProps("property_zip")}
                              />
                              <FieldError
                                msg={
                                  formik.touched.property_zip
                                    ? formik.errors.property_zip
                                    : undefined
                                }
                              />
                            </div>
                          </div>
                          <div className="space-y-1.5 md:col-span-2">
                            <Label htmlFor="loan_purpose">
                              Additional Notes{" "}
                              <span className="text-muted-foreground text-xs">
                                (optional)
                              </span>
                            </Label>
                            <textarea
                              id="loan_purpose"
                              rows={3}
                              placeholder="Any other details about the loan purpose…"
                              className="flex w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none resize-none"
                              {...formik.getFieldProps("loan_purpose")}
                            />
                          </div>
                        </div>
                      )}

                      {/* ── Step 3: Finances ── */}
                      {currentStep === 3 && (
                        <div className="grid gap-6">
                          <div className="space-y-1.5">
                            <Label>Income Type *</Label>
                            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                              {[
                                "W-2",
                                "1099",
                                "Self-Employed",
                                "Investor",
                                "Mixed",
                              ].map((t) => (
                                <button
                                  key={t}
                                  type="button"
                                  onClick={() =>
                                    formik.setFieldValue("income_type", t)
                                  }
                                  className={cn(
                                    "h-12 rounded-xl border-2 text-xs font-semibold transition-all",
                                    formik.values.income_type === t
                                      ? "border-primary bg-primary/5 text-primary"
                                      : "border-muted hover:border-primary/40",
                                  )}
                                >
                                  {t}
                                </button>
                              ))}
                            </div>
                            <FieldError
                              msg={
                                formik.touched.income_type
                                  ? formik.errors.income_type
                                  : undefined
                              }
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label htmlFor="annual_income">
                              Annual Household Income *
                            </Label>
                            <div className="relative">
                              <DollarSign className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                              <Input
                                id="annual_income"
                                type="number"
                                placeholder="75000"
                                className="h-12 rounded-xl pl-9"
                                {...formik.getFieldProps("annual_income")}
                              />
                            </div>
                            {formik.values.annual_income && (
                              <p className="text-xs text-primary font-medium">
                                {formatCurrency(formik.values.annual_income)} /
                                year
                              </p>
                            )}
                            <FieldError
                              msg={
                                formik.touched.annual_income
                                  ? (formik.errors.annual_income as string)
                                  : undefined
                              }
                            />
                          </div>
                          <div className="space-y-3">
                            <Label>Credit Score Range *</Label>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                              {[
                                {
                                  v: "740",
                                  label: "740+",
                                  desc: "Excellent",
                                },
                                {
                                  v: "700",
                                  label: "700–739",
                                  desc: "Very Good",
                                },
                                {
                                  v: "650",
                                  label: "650–699",
                                  desc: "Good",
                                },
                                {
                                  v: "600",
                                  label: "600–649",
                                  desc: "Fair",
                                },
                              ].map(({ v, label, desc }) => (
                                <button
                                  key={v}
                                  type="button"
                                  onClick={() =>
                                    formik.setFieldValue(
                                      "credit_score_range",
                                      v,
                                    )
                                  }
                                  className={cn(
                                    "flex flex-col items-center gap-1 py-4 rounded-xl border-2 transition-all",
                                    formik.values.credit_score_range === v
                                      ? "border-primary bg-primary/5"
                                      : "border-muted hover:border-primary/40",
                                  )}
                                >
                                  <span
                                    className={cn(
                                      "text-base font-bold",
                                      formik.values.credit_score_range === v
                                        ? "text-primary"
                                        : "text-foreground",
                                    )}
                                  >
                                    {label}
                                  </span>
                                  <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">
                                    {desc}
                                  </span>
                                </button>
                              ))}
                            </div>
                            <FieldError
                              msg={
                                formik.touched.credit_score_range
                                  ? formik.errors.credit_score_range
                                  : undefined
                              }
                            />
                          </div>
                        </div>
                      )}

                      {/* ── Step 4: Employment ── */}
                      {currentStep === 4 && (
                        <div className="grid gap-5 md:grid-cols-2">
                          <div className="space-y-1.5 md:col-span-2">
                            <Label>Employment Status *</Label>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                              {[
                                { v: "employed", label: "Employed" },
                                {
                                  v: "self_employed",
                                  label: "Self-Employed",
                                },
                                { v: "retired", label: "Retired" },
                                { v: "other", label: "Other" },
                              ].map(({ v, label }) => (
                                <button
                                  key={v}
                                  type="button"
                                  onClick={() =>
                                    formik.setFieldValue("employment_status", v)
                                  }
                                  className={cn(
                                    "h-14 rounded-xl border-2 text-sm font-semibold transition-all",
                                    formik.values.employment_status === v
                                      ? "border-primary bg-primary/5 text-primary"
                                      : "border-muted hover:border-primary/40",
                                  )}
                                >
                                  {label}
                                </button>
                              ))}
                            </div>
                            <FieldError
                              msg={
                                formik.touched.employment_status
                                  ? formik.errors.employment_status
                                  : undefined
                              }
                            />
                          </div>

                          {(formik.values.employment_status === "employed" ||
                            formik.values.employment_status ===
                              "self_employed") && (
                            <>
                              <div className="space-y-1.5 md:col-span-2">
                                <Label htmlFor="employer_name">
                                  {formik.values.employment_status ===
                                  "self_employed"
                                    ? "Business Name *"
                                    : "Employer Name *"}
                                </Label>
                                <Input
                                  id="employer_name"
                                  placeholder={
                                    formik.values.employment_status ===
                                    "self_employed"
                                      ? "Acme LLC"
                                      : "Acme Corp"
                                  }
                                  className="h-12 rounded-xl"
                                  {...formik.getFieldProps("employer_name")}
                                />
                                <FieldError
                                  msg={
                                    formik.touched.employer_name
                                      ? formik.errors.employer_name
                                      : undefined
                                  }
                                />
                              </div>
                              <div className="space-y-1.5">
                                <Label htmlFor="years_employed">
                                  Years at Current Job / Business
                                </Label>
                                <select
                                  id="years_employed"
                                  className="flex h-12 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                                  {...formik.getFieldProps("years_employed")}
                                >
                                  <option value="">Select…</option>
                                  <option value="0">Less than 1 year</option>
                                  <option value="1">1–2 years</option>
                                  <option value="2">2–5 years</option>
                                  <option value="5">5–10 years</option>
                                  <option value="10">10+ years</option>
                                </select>
                              </div>
                            </>
                          )}

                          {formik.values.employment_status &&
                            formik.values.employment_status !== "employed" &&
                            formik.values.employment_status !==
                              "self_employed" && (
                              <div className="md:col-span-2 rounded-2xl border bg-muted/30 p-6 text-center">
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                  No additional employment information needed.
                                  Our loan team may follow up with questions.
                                </p>
                              </div>
                            )}
                        </div>
                      )}

                      {/* ── Step 5: Review ── */}
                      {currentStep === 5 && (
                        <div className="space-y-6">
                          {error && (
                            <div className="flex items-start gap-3 rounded-xl bg-destructive/10 border border-destructive/20 p-4 text-sm text-destructive">
                              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                              <span>{error}</span>
                            </div>
                          )}

                          {(
                            [
                              {
                                title: "Personal Information",
                                fields: [
                                  [
                                    "Full Name",
                                    `${formik.values.first_name} ${formik.values.last_name}`,
                                  ],
                                  ["Email", formik.values.email],
                                  ["Phone", formik.values.phone],
                                  [
                                    "Address",
                                    `${formik.values.address_street}, ${formik.values.address_city}, ${formik.values.address_state} ${formik.values.address_zip}`,
                                  ],
                                ],
                              },
                              {
                                title: "Property & Loan",
                                fields: [
                                  [
                                    "Loan Type",
                                    formik.values.loan_type
                                      .replace(/_/g, " ")
                                      .replace(/\b\w/g, (c) => c.toUpperCase()),
                                  ],
                                  [
                                    "Property Value",
                                    formatCurrency(
                                      formik.values.property_value,
                                    ),
                                  ],
                                  [
                                    "Down Payment",
                                    formatCurrency(formik.values.down_payment),
                                  ],
                                  [
                                    "Estimated Loan",
                                    formatCurrency(
                                      String(
                                        Math.max(
                                          0,
                                          parseFloat(
                                            formik.values.property_value,
                                          ) -
                                            parseFloat(
                                              formik.values.down_payment,
                                            ),
                                        ),
                                      ),
                                    ),
                                  ],
                                  [
                                    "Property Type",
                                    formik.values.property_type
                                      .replace(/_/g, " ")
                                      .replace(/\b\w/g, (c) => c.toUpperCase()),
                                  ],
                                  [
                                    "Property Address",
                                    `${formik.values.property_address}, ${formik.values.property_city}, ${formik.values.property_state} ${formik.values.property_zip}`,
                                  ],
                                ],
                              },
                              {
                                title: "Finances",
                                fields: [
                                  ["Income Type", formik.values.income_type],
                                  [
                                    "Annual Income",
                                    formatCurrency(formik.values.annual_income),
                                  ],
                                  [
                                    "Credit Score",
                                    (
                                      {
                                        "740": "740+ (Excellent)",
                                        "700": "700–739 (Very Good)",
                                        "650": "650–699 (Good)",
                                        "600": "600–649 (Fair)",
                                      } as Record<string, string>
                                    )[formik.values.credit_score_range] ||
                                      formik.values.credit_score_range,
                                  ],
                                ],
                              },
                              {
                                title: "Employment",
                                fields: [
                                  [
                                    "Status",
                                    formik.values.employment_status
                                      .replace(/_/g, " ")
                                      .replace(/\b\w/g, (c) => c.toUpperCase()),
                                  ],
                                  ...(formik.values.employer_name
                                    ? [
                                        [
                                          "Employer / Business",
                                          formik.values.employer_name,
                                        ],
                                      ]
                                    : []),
                                  ...(formik.values.years_employed
                                    ? [
                                        [
                                          "Years",
                                          (
                                            {
                                              "0": "Less than 1 year",
                                              "1": "1–2 years",
                                              "2": "2–5 years",
                                              "5": "5–10 years",
                                              "10": "10+ years",
                                            } as Record<string, string>
                                          )[formik.values.years_employed] ||
                                            formik.values.years_employed,
                                        ],
                                      ]
                                    : []),
                                ],
                              },
                            ] as Array<{
                              title: string;
                              fields: [string, string][];
                            }>
                          ).map((section) => (
                            <div
                              key={section.title}
                              className="rounded-2xl border bg-muted/20 overflow-hidden"
                            >
                              <div className="px-5 py-3 border-b bg-muted/40">
                                <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wide">
                                  {section.title}
                                </h4>
                              </div>
                              <div className="px-5 py-3 divide-y divide-border/40">
                                {section.fields.map(([label, value]) =>
                                  reviewField(label, value),
                                )}
                              </div>
                            </div>
                          ))}

                          <div className="flex items-start gap-3 rounded-xl bg-primary/5 border border-primary/10 p-4 text-sm text-muted-foreground">
                            <FileText className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                            <p>
                              By submitting, you authorize Encore Mortgage to
                              obtain your credit report and verify the
                              information provided. A loan officer will contact
                              you within 1–2 business days.
                            </p>
                          </div>
                        </div>
                      )}
                    </form>

                    {/* Navigation */}
                    <div className="flex items-center justify-between pt-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="lg"
                        onClick={prevStep}
                        disabled={currentStep === 1 || loading}
                        className="rounded-xl text-muted-foreground"
                      >
                        <ArrowLeft className="mr-2 h-5 w-5" /> Back
                      </Button>
                      <div className="flex gap-4">
                        {currentStep < 5 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="lg"
                            onClick={() => navigate("/")}
                            className="rounded-xl hidden sm:flex"
                          >
                            Save for later
                          </Button>
                        )}
                        <Button
                          type="button"
                          size="lg"
                          onClick={nextStep}
                          disabled={loading}
                          className="rounded-xl px-10 font-bold shadow-xl shadow-primary/20 transition-all hover:scale-105 active:scale-95"
                        >
                          {loading ? (
                            <>
                              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                              Submitting…
                            </>
                          ) : currentStep === 5 ? (
                            <>
                              Submit Application
                              <ArrowRight className="ml-2 h-5 w-5" />
                            </>
                          ) : (
                            <>
                              Continue
                              <ArrowRight className="ml-2 h-5 w-5" />
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </main>
            </div>
          )}
        </div>

        {/* Footer */}
        {!isComplete && (
          <footer className="border-t bg-muted/30 py-6">
            <div className="container flex flex-col items-center justify-between gap-4 sm:flex-row">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  <ShieldCheck className="h-3 w-3 text-emerald-500" /> SOC2
                  Compliant
                </div>
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  <LockIcon className="h-3 w-3 text-emerald-500" /> 256-bit
                  Encryption
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                © 2026 Encore Mortgage
              </p>
            </div>
          </footer>
        )}
      </div>

      {/* Decorative background blobs */}
      <div className="fixed top-0 left-0 -z-10 h-[500px] w-[500px] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />
      <div className="fixed bottom-0 right-0 -z-10 h-[500px] w-[500px] rounded-full bg-blue-500/5 blur-[120px] pointer-events-none" />
    </div>
  );
};

export default ApplicationWizard;
