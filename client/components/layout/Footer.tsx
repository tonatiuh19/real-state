import React from "react";
import { Link } from "react-router-dom";
import {
  Mail,
  Phone,
  MapPin,
  Twitter,
  Linkedin,
  Facebook,
  LogIn,
} from "lucide-react";

const Footer = () => {
  return (
    <footer className="border-t bg-muted/30">
      <div className="container py-12 md:py-16">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div className="space-y-4">
            <Link to="/" className="flex items-center">
              <img
                src="https://disruptinglabs.com/data/encore/assets/images/logo.png"
                alt="Encore Mortgage"
                className="h-10 w-auto"
              />
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Your trusted partner in personalized mortgage solutions. Making
              homeownership dreams come true.
            </p>
            <div className="flex space-x-4">
              <a
                href="#"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <Twitter className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <Linkedin className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <Facebook className="h-5 w-5" />
              </a>
            </div>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider">
              Platform
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  to="/apply"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Apply Now
                </Link>
              </li>
              <li>
                <Link
                  to="/broker-login"
                  className="text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1.5"
                >
                  <LogIn className="h-3.5 w-3.5" />
                  Broker Login
                </Link>
              </li>
              <li>
                <Link
                  to="#"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Track Application
                </Link>
              </li>
              <li>
                <Link
                  to="#"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Resources
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider">
              Resources
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  to="#"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Loan Calculator
                </Link>
              </li>
              <li>
                <Link
                  to="#"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  FAQ
                </Link>
              </li>
              <li>
                <Link
                  to="#"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Learning Center
                </Link>
              </li>
              <li>
                <Link
                  to="#"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider">
              Contact
            </h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center space-x-2 text-muted-foreground">
                <Mail className="h-4 w-4" />
                <span>info@encoremortgage.org</span>
              </li>
              <li className="flex items-center space-x-2 text-muted-foreground">
                <Phone className="h-4 w-4" />
                <span>(562) 337-0000</span>
              </li>
              <li className="flex items-center space-x-2 text-muted-foreground text-pretty">
                <MapPin className="h-4 w-4 shrink-0" />
                <span>Serving clients nationwide</span>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-12 border-t pt-8 text-center text-sm text-muted-foreground">
          <p>
            © {new Date().getFullYear()} Encore Mortgage. All rights reserved.
            NMLS #123456
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
