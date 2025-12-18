import React from "react";
import { Link } from "react-router-dom";
import { ShieldCheck, Mail, Phone, MapPin, Twitter, Linkedin, Facebook } from "lucide-react";

const Footer = () => {
  return (
    <footer className="border-t bg-muted/30">
      <div className="container py-12 md:py-16">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div className="space-y-4">
            <Link to="/" className="flex items-center space-x-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <span className="text-xl font-bold tracking-tight">NexusBroker</span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Streamlining the loan lifecycle with intelligent automation and human-centric design. The bridge between brokers and their clients.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Linkedin className="h-5 w-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
            </div>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider">Platform</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/portal" className="text-muted-foreground hover:text-primary transition-colors">Client Portal</Link></li>
              <li><Link to="/admin" className="text-muted-foreground hover:text-primary transition-colors">Broker Dashboard</Link></li>
              <li><Link to="#" className="text-muted-foreground hover:text-primary transition-colors">Pipeline Tracking</Link></li>
              <li><Link to="#" className="text-muted-foreground hover:text-primary transition-colors">Document Management</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider">Resources</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="#" className="text-muted-foreground hover:text-primary transition-colors">Help Center</Link></li>
              <li><Link to="#" className="text-muted-foreground hover:text-primary transition-colors">Marketing Tools</Link></li>
              <li><Link to="#" className="text-muted-foreground hover:text-primary transition-colors">Compliance Guide</Link></li>
              <li><Link to="#" className="text-muted-foreground hover:text-primary transition-colors">API Documentation</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider">Contact</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center space-x-2 text-muted-foreground">
                <Mail className="h-4 w-4" />
                <span>support@nexusbroker.com</span>
              </li>
              <li className="flex items-center space-x-2 text-muted-foreground">
                <Phone className="h-4 w-4" />
                <span>+1 (555) 123-4567</span>
              </li>
              <li className="flex items-center space-x-2 text-muted-foreground text-pretty">
                <MapPin className="h-4 w-4 shrink-0" />
                <span>123 Finance Plaza, Suite 400, New York, NY 10001</span>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-12 border-t pt-8 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} NexusBroker Inc. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
