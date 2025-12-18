import React from "react";
import { Link } from "react-router-dom";
import { motion, Variants } from "framer-motion";
import {
  ArrowRight,
  ShieldCheck,
  Zap,
  BarChart3,
  Users,
  FileText,
  MessageSquare,
  CheckCircle2,
  Clock,
  Smartphone,
  Lock as LockIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import HeroBackground from "@/components/visuals/HeroBackground";

const Index = () => {
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
      },
    },
  };

  const floatingVariants: Variants = {
    animate: {
      y: [0, -15, 0],
      transition: {
        duration: 4,
        repeat: Infinity,
      },
    },
  };
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-background py-20 md:py-32">
        <HeroBackground />

        <div className="container relative z-10">
          <motion.div
            className="mx-auto max-w-3xl text-center"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div variants={itemVariants}>
              <Badge
                variant="outline"
                className="mb-4 py-1 px-4 border-primary/20 bg-primary/5 text-primary backdrop-blur-sm"
              >
                Next-Gen Brokerage Platform
              </Badge>
            </motion.div>

            <motion.h1
              variants={itemVariants}
              className="mb-6 text-5xl font-extrabold tracking-tight sm:text-6xl lg:text-7xl"
            >
              Bridge the Gap Between{" "}
              <span className="text-primary">Brokers</span> and{" "}
              <span className="text-primary">Clients</span>
            </motion.h1>

            <motion.p
              variants={itemVariants}
              className="mb-10 text-xl text-muted-foreground leading-relaxed"
            >
              The all-in-one platform for seamless loan lifecycles. Automate
              workflows, manage documents, and provide clients with a
              world-class digital experience.
            </motion.p>

            <motion.div
              variants={itemVariants}
              className="flex flex-col items-center justify-center gap-4 sm:flex-row"
            >
              <Link to="/apply">
                <Button
                  size="lg"
                  className="h-14 px-8 text-lg font-semibold shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95"
                >
                  I'm a Client <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/admin">
                <Button
                  variant="outline"
                  size="lg"
                  className="h-14 px-8 text-lg font-semibold transition-all hover:bg-accent active:scale-95"
                >
                  I'm a Broker
                </Button>
              </Link>
            </motion.div>

            <motion.div
              variants={itemVariants}
              className="mt-12 flex items-center justify-center gap-8 text-sm text-muted-foreground opacity-70 grayscale"
            >
              <span className="flex items-center gap-1">
                <ShieldCheck className="h-4 w-4" /> Secure & Compliant
              </span>
              <span className="flex items-center gap-1">
                <Zap className="h-4 w-4" /> Real-time Updates
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4" /> 99.9% Success Rate
              </span>
            </motion.div>
          </motion.div>
        </div>

        {/* Background blobs (kept for extra depth) */}
        <div className="absolute top-1/2 left-1/2 -z-20 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/5 blur-[120px]" />
      </section>

      {/* Stats Section */}
      <section className="border-y bg-muted/30 py-12">
        <div className="container">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            <div className="text-center">
              <div className="text-3xl font-bold md:text-4xl">$2.4B+</div>
              <div className="text-sm text-muted-foreground">
                Loans Processed
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold md:text-4xl">15k+</div>
              <div className="text-sm text-muted-foreground">
                Active Brokers
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold md:text-4xl">45%</div>
              <div className="text-sm text-muted-foreground">
                Faster Closings
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold md:text-4xl">98%</div>
              <div className="text-sm text-muted-foreground">
                Client Satisfaction
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features for Clients */}
      <section className="py-24">
        <div className="container">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">
              Empowering Clients
            </h2>
            <p className="mx-auto max-w-2xl text-muted-foreground">
              We've redesigned the loan application from the ground up to be
              transparent, fast, and stress-free.
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                icon: <Zap className="h-8 w-8 text-primary" />,
                title: "Full-Page Wizard",
                description:
                  "A beautiful, step-by-step onboarding experience that guides you through every requirement.",
              },
              {
                icon: <FileText className="h-8 w-8 text-primary" />,
                title: "Smart Doc Management",
                description:
                  "Upload and manage documents securely. We'll automatically verify and track what's missing.",
              },
              {
                icon: <Clock className="h-8 w-8 text-primary" />,
                title: "Live Tracking",
                description:
                  "See exactly where your application stands in the pipeline with real-time status updates.",
              },
            ].map((feature, i) => (
              <Card
                key={i}
                className="group transition-all hover:shadow-xl hover:-translate-y-1"
              >
                <CardHeader>
                  <div className="mb-2 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 transition-colors group-hover:bg-primary/20">
                    {feature.icon}
                  </div>
                  <CardTitle>{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features for Brokers */}
      <section className="bg-muted/50 py-24">
        <div className="container">
          <div className="flex flex-col items-center gap-12 lg:flex-row">
            <div className="flex-1 space-y-6">
              <Badge variant="outline" className="bg-primary/5 text-primary">
                Broker Operations
              </Badge>
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
                Total Operational Control
              </h2>
              <p className="text-lg text-muted-foreground">
                NexusBroker gives you the tools to manage high-volume pipelines
                without breaking a sweat.
              </p>
              <ul className="space-y-4">
                {[
                  "Automated lead follow-up and status tracking",
                  "Unified communication (Email, SMS, VoIP)",
                  "Intelligent task assignment and reminders",
                  "Marketing automation & campaign management",
                  "Compliance tracking and document auditing",
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <Button className="mt-4">Explore Broker Suite</Button>
            </div>
            <div className="flex-1">
              <div className="relative rounded-2xl border bg-background p-4 shadow-2xl">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <div className="h-32 rounded-lg bg-muted animate-pulse" />
                    <div className="h-48 rounded-lg bg-muted animate-pulse" />
                  </div>
                  <div className="space-y-4 pt-8">
                    <div className="h-48 rounded-lg bg-muted animate-pulse" />
                    <div className="h-32 rounded-lg bg-muted animate-pulse" />
                  </div>
                </div>
                {/* Overlay card for detail */}
                <div className="absolute -bottom-6 -left-6 max-w-[240px] rounded-xl border bg-background p-4 shadow-xl">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                      <BarChart3 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold">
                        Active Pipeline
                      </div>
                      <div className="text-sm font-bold">$12.4M</div>
                    </div>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                    <div className="h-full w-2/3 bg-primary" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section className="py-24">
        <div className="container">
          <div className="rounded-3xl bg-primary px-8 py-16 text-primary-foreground md:px-16">
            <div className="grid gap-12 lg:grid-cols-2">
              <div>
                <h2 className="mb-6 text-3xl font-bold md:text-4xl">
                  Security is not an option. It's our foundation.
                </h2>
                <p className="mb-8 text-primary-foreground/80 text-lg">
                  We use bank-grade encryption and comply with all major
                  financial regulations to ensure your clients' data is always
                  protected.
                </p>
                <div className="grid grid-cols-2 gap-6">
                  <div className="flex items-start gap-3">
                    <LockIcon className="h-6 w-6 mt-1" />
                    <div>
                      <h4 className="font-bold">AES-256 Encryption</h4>
                      <p className="text-xs text-primary-foreground/70">
                        At rest and in transit
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <ShieldCheck className="h-6 w-6 mt-1" />
                    <div>
                      <h4 className="font-bold">SOC2 Type II</h4>
                      <p className="text-xs text-primary-foreground/70">
                        Certified infrastructure
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Smartphone className="h-6 w-6 mt-1" />
                    <div>
                      <h4 className="font-bold">MFA Auth</h4>
                      <p className="text-xs text-primary-foreground/70">
                        Multi-factor security
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Users className="h-6 w-6 mt-1" />
                    <div>
                      <h4 className="font-bold">Role-Based Access</h4>
                      <p className="text-xs text-primary-foreground/70">
                        Granular permissions
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-center">
                <div className="text-center">
                  <div className="mb-4 inline-flex h-24 w-24 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm">
                    <ShieldCheck className="h-12 w-12" />
                  </div>
                  <h3 className="text-2xl font-bold">100% Secure</h3>
                  <p className="text-primary-foreground/70">
                    Trusted by 500+ institutions
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 text-center">
        <div className="container">
          <h2 className="mb-6 text-3xl font-bold md:text-4xl">
            Ready to transform your brokerage?
          </h2>
          <p className="mx-auto mb-10 max-w-xl text-muted-foreground text-lg">
            Join thousands of brokers who have scaled their operations with
            NexusBroker.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link to="/apply">
              <Button size="lg" className="h-14 px-8 text-lg font-semibold">
                Start Free Trial
              </Button>
            </Link>
            <Button
              variant="outline"
              size="lg"
              className="h-14 px-8 text-lg font-semibold"
            >
              Book a Demo
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
