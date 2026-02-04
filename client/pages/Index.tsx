import React, { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, Variants } from "framer-motion";
import {
  ArrowRight,
  ShieldCheck,
  Home,
  TrendingDown,
  CheckCircle2,
  Phone,
  Calendar,
  MessageSquare,
  Clock,
  Award,
  Sparkles,
  TrendingUp,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import HeroBackground from "@/components/visuals/HeroBackground";
import { MetaHelmet } from "@/components/MetaHelmet";
import { useAppSelector } from "@/store/hooks";
import { selectIsClientAuthenticated } from "@/store/slices/clientAuthSlice";

const Index = () => {
  const navigate = useNavigate();
  const isClientAuthenticated = useAppSelector(selectIsClientAuthenticated);

  // Redirect to client portal if already logged in
  useEffect(() => {
    if (isClientAuthenticated) {
      navigate("/portal");
    }
  }, [isClientAuthenticated, navigate]);
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

  const floatVariants: Variants = {
    animate: {
      y: [0, -10, 0],
      transition: {
        duration: 3,
        repeat: Infinity,
        ease: "easeInOut",
      },
    },
  };

  const statsVariants: Variants = {
    hidden: { scale: 0.8, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15,
      },
    },
  };

  const loanOptions = [
    {
      name: "30 Year Fixed",
      description:
        "Most popular mortgage program. Enjoy a low interest rate and fixed monthly payments. Quick approval and closing complete within 30 days.",
    },
    {
      name: "15 Year Fixed",
      description:
        "Pay-off your home and save thousands of dollars during the life of the loan. Enjoy a low interest rate and fixed monthly payments.",
    },
    {
      name: "FHA Loans",
      description:
        "Qualify with a down payment as low as 3.5%, worry-free loan qualification & marginal credit acceptable.",
    },
    {
      name: "VA Loans",
      description:
        "$0 down payment required, no monthly mortgage insurance, low rates and worry-free approval.",
    },
    {
      name: "JUMBO Loans",
      description:
        "5% and 10% down payment options. Low rates for fixed and adjustable terms.",
    },
    {
      name: "Non QM",
      description:
        "Non-Qualified Mortgage loans for borrowers with unique income qualifying circumstances.",
    },
    {
      name: "ARM Loans",
      description:
        "Ideal if you plan to stay in your home for less than ten years. Enjoy a low interest rate for a 5, 7, or 10-year period.",
    },
  ];

  return (
    <div className="flex flex-col">
      <MetaHelmet
        title="Your Online Resource for Personalized Mortgage Loans"
        description="Encore Mortgage provides personalized mortgage solutions including purchase loans, refinancing, FHA, VA, and more. Get pre-approved today!"
        keywords="mortgage, home loans, refinance, FHA loans, VA loans, purchase loans, Encore Mortgage"
      />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-background via-background to-primary/5 py-20 md:py-32 lg:py-40">
        <HeroBackground />

        {/* Animated gradient orbs */}
        <div className="absolute top-20 left-10 h-72 w-72 rounded-full bg-primary/20 blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 h-96 w-96 rounded-full bg-primary/10 blur-3xl animate-pulse delay-700" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-primary/5 blur-[120px]" />

        <div className="container relative z-10">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
            {/* Left Column - Content */}
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="space-y-8"
            >
              <motion.div variants={itemVariants} className="inline-flex">
                <Badge className="bg-primary/10 text-primary border-primary/20 px-4 py-2 text-sm font-semibold backdrop-blur-sm hover:bg-primary/20 transition-colors">
                  <Sparkles className="mr-2 h-4 w-4" />
                  Fast. Simple. Personalized.
                </Badge>
              </motion.div>

              <motion.h1
                variants={itemVariants}
                className="text-5xl font-black tracking-tight sm:text-6xl lg:text-7xl xl:text-8xl leading-[1.1]"
              >
                Your Dream Home{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-red-600 to-primary">
                  Starts Here
                </span>
              </motion.h1>

              <motion.p
                variants={itemVariants}
                className="text-xl text-muted-foreground leading-relaxed max-w-xl"
              >
                Get pre-approved in 60 seconds. Experience mortgage lending
                that's{" "}
                <span className="text-foreground font-semibold">
                  fast, transparent
                </span>
                , and built around{" "}
                <span className="text-foreground font-semibold">
                  your goals
                </span>
                .
              </motion.p>

              {/* Quick Stats */}
              <motion.div
                variants={itemVariants}
                className="flex flex-wrap gap-6 py-4"
              >
                <div className="flex items-center gap-2">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Clock className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">30 Days</div>
                    <div className="text-xs text-muted-foreground">
                      Quick Closing
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Award className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">Best Rates</div>
                    <div className="text-xs text-muted-foreground">
                      Guaranteed
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <ShieldCheck className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">100%</div>
                    <div className="text-xs text-muted-foreground">Secure</div>
                  </div>
                </div>
              </motion.div>

              {/* CTA Buttons */}
              <motion.div
                variants={itemVariants}
                className="flex flex-col sm:flex-row gap-4"
              >
                <Link to="/apply" className="flex-1 sm:flex-initial">
                  <Button
                    size="lg"
                    className="w-full sm:w-auto h-14 px-8 text-lg font-bold shadow-2xl shadow-primary/30 transition-all hover:scale-105 active:scale-95 bg-gradient-to-r from-primary to-red-600 hover:from-primary/90 hover:to-red-600/90"
                  >
                    Get Pre-Approved
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link
                  to="/client-login"
                  className="flex-1 sm:flex-initial w-full sm:w-auto"
                >
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full h-14 px-8 text-lg font-semibold border-2 border-primary/20 hover:bg-primary/5 backdrop-blur-sm transition-all hover:scale-105 active:scale-95"
                  >
                    <FileText className="mr-2 h-5 w-5" />
                    My Applications
                  </Button>
                </Link>
                <a href="tel:(562)337-0000" className="flex-1 sm:flex-initial">
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full sm:w-auto h-14 px-8 text-lg font-semibold border-2 hover:bg-accent/50 backdrop-blur-sm transition-all hover:scale-105 active:scale-95"
                  >
                    <Phone className="mr-2 h-5 w-5" />
                    (562) 337-0000
                  </Button>
                </a>
              </motion.div>

              {/* Trust Indicators */}
              <motion.div
                variants={itemVariants}
                className="flex items-center gap-6 pt-4 text-sm text-muted-foreground"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span>No hidden fees</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span>Free consultation</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span>Expert guidance</span>
                </div>
              </motion.div>
            </motion.div>

            {/* Right Column - Interactive Cards */}
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="relative hidden lg:block"
            >
              {/* Main Card */}
              <motion.div variants={statsVariants} className="relative">
                <Card className="relative overflow-hidden border-2 bg-gradient-to-br from-white/80 to-white/40 backdrop-blur-xl shadow-2xl">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
                  <CardHeader className="relative">
                    <div className="flex items-center justify-between mb-4">
                      <Badge
                        variant="secondary"
                        className="bg-green-500/10 text-green-700 border-green-200"
                      >
                        <TrendingUp className="mr-1 h-3 w-3" />
                        Rates Down
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        Updated Today
                      </span>
                    </div>
                    <CardTitle className="text-3xl font-bold">
                      Today's Rates
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="relative space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 rounded-xl bg-white/60 backdrop-blur-sm border">
                        <div>
                          <div className="text-sm font-medium text-muted-foreground">
                            30-Year Fixed
                          </div>
                          <div className="text-2xl font-bold text-primary">
                            6.75%
                          </div>
                        </div>
                        <ArrowRight className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex items-center justify-between p-4 rounded-xl bg-white/60 backdrop-blur-sm border">
                        <div>
                          <div className="text-sm font-medium text-muted-foreground">
                            15-Year Fixed
                          </div>
                          <div className="text-2xl font-bold text-primary">
                            6.25%
                          </div>
                        </div>
                        <ArrowRight className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex items-center justify-between p-4 rounded-xl bg-white/60 backdrop-blur-sm border">
                        <div>
                          <div className="text-sm font-medium text-muted-foreground">
                            FHA Loans
                          </div>
                          <div className="text-2xl font-bold text-primary">
                            6.50%
                          </div>
                        </div>
                        <ArrowRight className="h-5 w-5 text-primary" />
                      </div>
                    </div>
                    <Link to="/apply">
                      <Button className="w-full" variant="secondary">
                        View All Rates
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Floating stat cards */}
              <motion.div
                variants={floatVariants}
                animate="animate"
                className="absolute -top-6 -right-6 max-w-[200px]"
              >
                <Card className="border-2 bg-white/90 backdrop-blur-xl shadow-xl">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <Home className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-muted-foreground">
                          New Loans
                        </div>
                        <div className="text-xl font-bold">This Month</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                variants={floatVariants}
                animate="animate"
                className="absolute -bottom-6 -left-6 max-w-[220px]"
                transition={{ delay: 0.5 }}
              >
                <Card className="border-2 bg-white/90 backdrop-blur-xl shadow-xl">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
                        <CheckCircle2 className="h-6 w-6 text-green-600" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-muted-foreground">
                          Happy Customers
                        </div>
                        <div className="text-xl font-bold">500+</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          </div>

          {/* Bottom CTA for mobile */}
          <motion.div
            variants={itemVariants}
            initial="hidden"
            animate="visible"
            className="mt-12 lg:hidden text-center"
          >
            <a
              href="https://calendly.com/danielcarrillodc/initial-call"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button
                variant="ghost"
                size="lg"
                className="h-12 text-base font-semibold hover:bg-accent/50"
              >
                <Calendar className="mr-2 h-5 w-5" />
                Schedule Free Consultation
              </Button>
            </a>
          </motion.div>
        </div>
      </section>

      {/* Our Story Section */}
      <section className="py-24 bg-muted/30">
        <div className="container">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="mb-6 text-3xl font-bold tracking-tight md:text-4xl">
              Our Story
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              The Story of Encore Mortgage begins in Montebello, CA., where they
              sought out to represent the communities that they serve. Their
              goal has always been to build on the goal of providing the best
              options to achieve home ownership.
            </p>
          </div>
        </div>
      </section>

      {/* Purchase & Refinance Section */}
      <section className="py-24">
        <div className="container">
          <div className="grid gap-12 lg:grid-cols-2">
            <Card className="group transition-all hover:shadow-xl">
              <CardHeader>
                <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-xl bg-primary/10 transition-colors group-hover:bg-primary/20">
                  <Home className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-2xl">Purchase</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  Owning a home is one the biggest investments in your life. We
                  will help you get you in your new home on-time, at the lowest
                  available rate, and with the best mortgage.
                </p>
                <Link to="/purchase">
                  <Button className="mt-4">
                    Get Pre-Approved <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="group transition-all hover:shadow-xl">
              <CardHeader>
                <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-xl bg-primary/10 transition-colors group-hover:bg-primary/20">
                  <TrendingDown className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-2xl">Refinance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  Whether you're looking to lower your monthly payment, or get
                  cash to consolidate your debt, we can help you determine how
                  refinancing fits with your financial goals.
                </p>
                <Link to="/refinance">
                  <Button className="mt-4">
                    Get a Custom Quote <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Loan Options Section */}
      <section className="bg-muted/50 py-24">
        <div className="container">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">
              Review Your Loan Options
            </h2>
            <p className="mx-auto max-w-2xl text-muted-foreground">
              No two loans are alike. Learn more about our various loan options
              to see what fits your needs.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {loanOptions.map((loan, i) => (
              <Card
                key={i}
                className="group transition-all hover:shadow-xl hover:-translate-y-1"
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                    {loan.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm">
                    {loan.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-24">
        <div className="container">
          <div className="rounded-3xl bg-primary px-8 py-16 text-primary-foreground md:px-16">
            <div className="grid gap-12 lg:grid-cols-2">
              <div>
                <Badge className="mb-4 bg-white/20 text-white">
                  ENCORE MORTGAGE
                </Badge>
                <h2 className="mb-6 text-3xl font-bold md:text-4xl">
                  Get Started
                </h2>
                <p className="mb-8 text-primary-foreground/90 text-lg">
                  The biggest decision of your life deserves a phone call.
                </p>
                <div className="space-y-4">
                  <div>
                    <div className="text-sm font-semibold opacity-80">
                      Office Address
                    </div>
                    <div className="text-lg">
                      15111 Whittier Blvd Suite 101-B
                    </div>
                    <div className="text-lg">Whittier, CA 90603</div>
                  </div>
                  <div>
                    <div className="text-sm font-semibold opacity-80">
                      Hours
                    </div>
                    <div className="text-lg">Monday–Friday: 7am to 8pm</div>
                  </div>
                  <div>
                    <div className="text-sm font-semibold opacity-80">
                      Phone
                    </div>
                    <a
                      href="tel:(562)337-0000"
                      className="text-2xl font-bold hover:underline"
                    >
                      (562) 337-0000
                    </a>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-center">
                <div className="text-center">
                  <div className="mb-6 inline-flex h-32 w-32 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm">
                    <ShieldCheck className="h-16 w-16" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4">
                    Get Pre-Approved Today
                  </h3>
                  <p className="mb-6 text-primary-foreground/80">
                    Quick approval and closing complete within 30 days
                  </p>
                  <Link to="/apply">
                    <Button size="lg" variant="secondary" className="h-12 px-8">
                      Apply Now
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer Info */}
      <section className="border-t bg-muted/30 py-12">
        <div className="container text-center">
          <p className="text-sm text-muted-foreground mb-2">
            Encore Mortgage, NMLS #1946451
          </p>
          <p className="text-xs text-muted-foreground">
            For our NMLS consumer access page, please{" "}
            <a
              href="https://www.nmlsconsumeraccess.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-primary"
            >
              click here
            </a>
            .
          </p>
        </div>
      </section>
    </div>
  );
};

export default Index;
