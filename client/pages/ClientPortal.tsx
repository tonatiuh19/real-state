import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { MetaHelmet } from "@/components/MetaHelmet";
import { clientPageMeta } from "@/lib/seo-helpers";
import {
  CheckCircle2,
  Circle,
  Upload,
  FileText,
  ArrowRight,
  ArrowLeft,
  Home,
  User,
  Briefcase,
  ShieldCheck,
  Search,
  Clock,
  MessageCircle,
  AlertCircle,
  X,
  FileUp,
  ChevronRight,
  Plus,
  Lock as LockIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

const STEPS = [
  { id: 1, title: "Personal Information", icon: <User className="h-5 w-5" /> },
  { id: 2, title: "Loan Details", icon: <Home className="h-5 w-5" /> },
  { id: 3, title: "Employment", icon: <Briefcase className="h-5 w-5" /> },
  { id: 4, title: "Document Upload", icon: <Upload className="h-5 w-5" /> },
  { id: 5, title: "Final Review", icon: <ShieldCheck className="h-5 w-5" /> },
];

const ClientPortal = () => {
  const [view, setView] = useState<"dashboard" | "wizard">("dashboard");
  const [currentStep, setCurrentStep] = useState(1);
  const [applicationProgress, setApplicationProgress] = useState(65);

  const nextStep = () =>
    setCurrentStep((prev) => Math.min(prev + 1, STEPS.length));
  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 1));

  return (
    <div className="min-h-screen bg-muted/30 pb-20">
      {/* Portal Header */}
      <div className="bg-background py-6">
        <div className="container flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Welcome back, Sarah</h1>
            <p className="text-sm text-muted-foreground">
              Application ID: #NB-99284-A
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/apply">
              <Button size="sm" className="gap-2">
                <Plus className="h-4 w-4" /> New Application
              </Button>
            </Link>
            <Button variant="outline" size="sm" className="gap-2">
              <MessageCircle className="h-4 w-4" /> Message Broker
            </Button>
          </div>
        </div>
      </div>

      <div className="container py-8">
        <Tabs
          value={view}
          onValueChange={(v) => setView(v as "dashboard" | "wizard")}
          className="w-full"
        >
          <div className="mb-8 flex justify-center">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="wizard">New Application</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent
            value="dashboard"
            className="space-y-8 animate-in fade-in duration-500"
          >
            {/* Status Card */}
            <div className="grid gap-8 md:grid-cols-3">
              <Card className="md:col-span-2 overflow-hidden border-primary/20 bg-primary/5">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">
                      Current Loan Status
                    </CardTitle>
                    <Badge className="bg-amber-500 text-white hover:bg-amber-600">
                      Under Review
                    </Badge>
                  </div>
                  <CardDescription>
                    Your application is being processed by our underwriting
                    team.
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="font-medium text-primary">
                      Application Progress
                    </span>
                    <span className="font-bold text-primary">
                      {applicationProgress}%
                    </span>
                  </div>
                  <Progress value={applicationProgress} className="h-3" />

                  <div className="mt-8 grid gap-4 md:grid-cols-4">
                    {[
                      { label: "Submitted", date: "Oct 12", completed: true },
                      {
                        label: "Verification",
                        date: "Oct 15",
                        completed: true,
                      },
                      {
                        label: "Underwriting",
                        date: "Processing",
                        completed: false,
                        active: true,
                      },
                      { label: "Closing", date: "Pending", completed: false },
                    ].map((step, i) => (
                      <div
                        key={i}
                        className="relative flex flex-col items-center text-center"
                      >
                        <div
                          className={cn(
                            "z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 bg-background transition-colors",
                            step.completed
                              ? "border-primary bg-primary text-primary-foreground"
                              : step.active
                                ? "border-primary animate-pulse"
                                : "border-muted text-muted-foreground",
                          )}
                        >
                          {step.completed ? (
                            <CheckCircle2 className="h-5 w-5" />
                          ) : (
                            <Circle className="h-4 w-4" />
                          )}
                        </div>
                        <div className="mt-2">
                          <div className="text-xs font-bold">{step.label}</div>
                          <div className="text-[10px] text-muted-foreground">
                            {step.date}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Quick Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-sm text-muted-foreground">
                      Loan Amount
                    </span>
                    <span className="text-sm font-bold">$450,000</span>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-sm text-muted-foreground">Term</span>
                    <span className="text-sm font-bold">30 Years Fixed</span>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-sm text-muted-foreground">
                      Interest Rate
                    </span>
                    <span className="text-sm font-bold">6.25% (Estimated)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">LTV</span>
                    <span className="text-sm font-bold">80%</span>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" className="w-full text-xs">
                    View Full Breakdown
                  </Button>
                </CardFooter>
              </Card>
            </div>

            {/* Document Tasks */}
            <div className="grid gap-8 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">
                      Required Documents
                    </CardTitle>
                    <Badge
                      variant="outline"
                      className="text-destructive border-destructive/30 bg-destructive/5"
                    >
                      2 Action Items
                    </Badge>
                  </div>
                  <CardDescription>
                    Documents needed to move to the next stage.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between rounded-lg border border-destructive/20 bg-destructive/5 p-3">
                    <div className="flex items-center gap-3">
                      <div className="rounded-md bg-destructive/10 p-2 text-destructive">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold">
                          2023 W-2 Forms
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Missing from upload
                        </div>
                      </div>
                    </div>
                    <Button size="sm" variant="outline" className="h-8">
                      Upload
                    </Button>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-destructive/20 bg-destructive/5 p-3">
                    <div className="flex items-center gap-3">
                      <div className="rounded-md bg-destructive/10 p-2 text-destructive">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold">
                          Last 30 Days Paystubs
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Expired/Need updated copy
                        </div>
                      </div>
                    </div>
                    <Button size="sm" variant="outline" className="h-8">
                      Upload
                    </Button>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-muted p-3">
                    <div className="flex items-center gap-3">
                      <div className="rounded-md bg-muted p-2 text-muted-foreground">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold">
                          Home Appraisal Report
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Completed & Verified
                        </div>
                      </div>
                    </div>
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Recent Updates</CardTitle>
                  <CardDescription>
                    Stay updated on your application journey.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {[
                    {
                      title: "Underwriting started",
                      time: "2 hours ago",
                      desc: "Senior underwriter David R. is now reviewing your file.",
                      icon: <Clock className="h-4 w-4" />,
                    },
                    {
                      title: "Documents Verified",
                      time: "Yesterday",
                      desc: "Bank statements and tax returns have been approved.",
                      icon: <CheckCircle2 className="h-4 w-4" />,
                    },
                    {
                      title: "Message from Broker",
                      time: "2 days ago",
                      desc: "Please check your email for the updated closing cost disclosure.",
                      icon: <MessageCircle className="h-4 w-4" />,
                    },
                  ].map((update, i) => (
                    <div key={i} className="flex gap-4">
                      <div className="mt-1 shrink-0 rounded-full border bg-muted p-2">
                        {update.icon}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold">{update.title}</h4>
                          <span className="text-[10px] text-muted-foreground">
                            {update.time}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {update.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </CardContent>
                <CardFooter>
                  <Button variant="ghost" className="w-full text-xs">
                    View History
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </TabsContent>

          <TabsContent
            value="wizard"
            className="animate-in slide-in-from-bottom-4 duration-500"
          >
            <div className="mx-auto max-w-4xl">
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  {STEPS.map((step) => (
                    <div
                      key={step.id}
                      className="flex flex-col items-center gap-2 relative"
                    >
                      <div
                        className={cn(
                          "flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all",
                          currentStep === step.id
                            ? "border-primary bg-primary text-primary-foreground scale-110 shadow-lg"
                            : currentStep > step.id
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-muted text-muted-foreground",
                        )}
                      >
                        {currentStep > step.id ? (
                          <CheckCircle2 className="h-5 w-5" />
                        ) : (
                          step.icon
                        )}
                      </div>
                      <span
                        className={cn(
                          "text-[10px] font-bold uppercase tracking-wider hidden md:block",
                          currentStep === step.id
                            ? "text-primary"
                            : "text-muted-foreground",
                        )}
                      >
                        {step.title}
                      </span>
                    </div>
                  ))}
                </div>
                <Progress
                  value={(currentStep / STEPS.length) * 100}
                  className="h-1"
                />
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="shadow-2xl border-primary/10">
                    <CardHeader>
                      <CardTitle>{STEPS[currentStep - 1].title}</CardTitle>
                      <CardDescription>
                        Please complete the required information to proceed.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="min-h-[400px] py-6">
                      {currentStep === 1 && (
                        <div className="grid gap-6 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor="firstName">First Name</Label>
                            <Input id="firstName" placeholder="Jane" />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="lastName">Last Name</Label>
                            <Input id="lastName" placeholder="Doe" />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="email">Email Address</Label>
                            <Input
                              id="email"
                              type="email"
                              placeholder="jane@example.com"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="phone">Phone Number</Label>
                            <Input
                              id="phone"
                              type="tel"
                              placeholder="(555) 000-0000"
                            />
                          </div>
                          <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="address">
                              Current Home Address
                            </Label>
                            <Input
                              id="address"
                              placeholder="123 Main St, Apartment 4B"
                            />
                          </div>
                        </div>
                      )}

                      {currentStep === 2 && (
                        <div className="grid gap-6 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor="loanType">Loan Type</Label>
                            <Input
                              id="loanType"
                              placeholder="Purchase, Refinance, etc."
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="amount">Desired Loan Amount</Label>
                            <Input
                              id="amount"
                              type="number"
                              placeholder="$400,000"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="propertyType">Property Type</Label>
                            <Input
                              id="propertyType"
                              placeholder="Single Family Residence"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="downPayment">Down Payment</Label>
                            <Input
                              id="downPayment"
                              type="number"
                              placeholder="$80,000"
                            />
                          </div>
                        </div>
                      )}

                      {currentStep === 4 && (
                        <div className="space-y-6">
                          <div className="rounded-xl border-2 border-dashed p-10 text-center transition-colors hover:bg-muted/50">
                            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                              <FileUp className="h-6 w-6 text-primary" />
                            </div>
                            <h4 className="mb-2 font-bold">Upload Documents</h4>
                            <p className="text-sm text-muted-foreground mb-4">
                              Drag and drop files here, or click to browse
                            </p>
                            <Button size="sm">Browse Files</Button>
                          </div>
                          <div className="space-y-3">
                            <h5 className="text-sm font-semibold">
                              Suggested Uploads:
                            </h5>
                            <div className="grid gap-3 sm:grid-cols-2">
                              {[
                                "W-2 Form (2023)",
                                "Last 2 Paystubs",
                                "Bank Statement (Last 60 days)",
                                "ID/Driver's License",
                              ].map((doc) => (
                                <div
                                  key={doc}
                                  className="flex items-center justify-between rounded-lg border p-3"
                                >
                                  <span className="text-xs">{doc}</span>
                                  <Badge
                                    variant="outline"
                                    className="text-[10px]"
                                  >
                                    Pending
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Fallback for other steps */}
                      {[3, 5].includes(currentStep) && (
                        <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                          <div className="rounded-full bg-primary/5 p-6">
                            {STEPS[currentStep - 1].icon}
                          </div>
                          <div>
                            <h3 className="text-xl font-bold">
                              {STEPS[currentStep - 1].title}
                            </h3>
                            <p className="text-muted-foreground max-w-sm mx-auto mt-2">
                              Continue prompting to fill in this specific step
                              content. We'll collect all necessary data for a
                              perfect submission.
                            </p>
                          </div>
                        </div>
                      )}
                    </CardContent>
                    <CardFooter className="flex justify-between border-t pt-6">
                      <Button
                        variant="ghost"
                        onClick={prevStep}
                        disabled={currentStep === 1}
                      >
                        <ArrowLeft className="mr-2 h-4 w-4" /> Previous
                      </Button>
                      <Button onClick={nextStep} className="px-8">
                        {currentStep === STEPS.length
                          ? "Submit Application"
                          : "Next Step"}{" "}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </CardFooter>
                  </Card>
                </motion.div>
              </AnimatePresence>

              <div className="mt-8 flex items-center justify-center gap-6">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <ShieldCheck className="h-4 w-4 text-emerald-500" /> Encrypted
                  Connection
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <LockIcon className="h-4 w-4 text-emerald-500" /> Bank-Grade
                  Security
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ClientPortal;
