import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  FileText,
  Users,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  ShieldCheck,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

const Navbar = () => {
  const [isOpen, setIsOpen] = React.useState(false);
  const location = useLocation();

  const navLinks = [
    { name: "Purchase", href: "/purchase" },
    { name: "Refinance", href: "/refinance" },
    { name: "Loan Options", href: "/loan-options" },
    { name: "About", href: "/about" },
    { name: "Contact", href: "/contact" },
  ];

  const isHome = location.pathname === "/";

  return (
    <nav className="sticky top-4 z-50 w-[95%] mx-auto max-w-7xl">
      <div
        className={cn(
          "relative rounded-2xl bg-white/10 p-[1px] shadow-2xl backdrop-blur-2xl transition-all duration-300",
          isHome
            ? "border border-white/20 hover:border-white/40"
            : "border-transparent",
        )}
      >
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/20 to-transparent pointer-events-none" />
        <div className="relative flex h-16 items-center justify-between px-6 rounded-2xl bg-background/40">
          <div className="flex items-center gap-2">
            <Link
              to="/"
              className="flex items-center space-x-2 transition-transform hover:scale-105"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/20 text-primary-foreground">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <span className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
                Encore Mortgage
              </span>
            </Link>
            <div className="hidden md:flex md:ml-10 md:gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className={cn(
                    "relative text-sm font-semibold transition-all hover:text-primary py-2",
                    location.pathname === link.href
                      ? "text-primary after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-full after:bg-primary after:rounded-full"
                      : "text-muted-foreground",
                  )}
                >
                  {link.name}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-3">
              <a href="tel:(562)337-0000">
                <Button
                  variant="ghost"
                  size="sm"
                  className="font-semibold hover:bg-white/10 transition-colors"
                >
                  (562) 337-0000
                </Button>
              </a>
              <Link to="/apply">
                <Button
                  size="sm"
                  className="font-bold shadow-lg shadow-primary/20 px-6 rounded-xl hover:scale-105 active:scale-95 transition-all"
                >
                  Get Pre-Approved
                </Button>
              </Link>
            </div>
            <button
              className="inline-flex items-center justify-center rounded-xl p-2 text-muted-foreground hover:bg-white/10 transition-colors md:hidden"
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu with glass effect */}
      {isOpen && (
        <div
          className={cn(
            "mt-2 rounded-2xl bg-background/60 p-2 shadow-2xl backdrop-blur-2xl md:hidden animate-in slide-in-from-top-2 duration-300",
            isHome ? "border border-white/20" : "border-transparent",
          )}
        >
          <div className="container space-y-1 pb-3 pt-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={cn(
                  "block rounded-xl px-3 py-3 text-base font-semibold transition-all",
                  location.pathname === link.href
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-white/5",
                )}
                onClick={() => setIsOpen(false)}
              >
                {link.name}
              </Link>
            ))}
            <div className="mt-4 flex flex-col gap-2 px-1 pb-2">
              <a href="tel:(562)337-0000" className="w-full">
                <Button
                  variant="outline"
                  className="w-full rounded-xl border-white/20 hover:bg-white/10"
                >
                  (562) 337-0000
                </Button>
              </a>
              <Link to="/apply">
                <Button className="w-full rounded-xl font-bold shadow-lg shadow-primary/20">
                  Get Pre-Approved
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
