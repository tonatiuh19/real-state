import "./global.css";

import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, useLocation, useNavigate } from "react-router-dom";
import { Provider } from "react-redux";
import { HelmetProvider } from "react-helmet-async";
import { store } from "./store";
import AppRoutes from "./AppRoutes";
import { validateClientSession } from "./store/slices/clientAuthSlice";
import { validateSession as validateBrokerSession } from "./store/slices/brokerAuthSlice";

const queryClient = new QueryClient();

// Scrolls to hash element after navigation (e.g. /#contact)
const ScrollToHash = () => {
  const { hash, pathname } = useLocation();
  useEffect(() => {
    if (hash) {
      // Small delay to allow page to render first
      const timer = setTimeout(() => {
        const el = document.querySelector(hash);
        if (el) el.scrollIntoView({ behavior: "smooth" });
      }, 100);
      return () => clearTimeout(timer);
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [hash, pathname]);
  return null;
};

// Detects subdomain and enforces route scope:
// admin.* → only /admin and /broker-login are accessible
// portal.* → only /portal, /client-login, /wizard, /apply are accessible
const SubdomainRedirect = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  useEffect(() => {
    const subdomain = window.location.hostname.split(".")[0];

    if (subdomain === "admin") {
      const allowed =
        pathname.startsWith("/admin") || pathname.startsWith("/broker-login");
      if (!allowed) navigate("/admin", { replace: true });
    } else if (subdomain === "portal") {
      const allowed =
        pathname.startsWith("/portal") ||
        pathname.startsWith("/client-login") ||
        pathname.startsWith("/wizard") ||
        pathname.startsWith("/apply");
      if (!allowed) navigate("/portal", { replace: true });
    }
  }, [pathname, navigate]);

  return null;
};

const AppContent = () => {
  useEffect(() => {
    // Validate client session on app load
    const clientToken = localStorage.getItem("client_session_token");
    if (clientToken) {
      store.dispatch(validateClientSession());
    }

    // Validate broker session on app load
    const brokerToken = localStorage.getItem("broker_session");
    if (brokerToken) {
      store.dispatch(validateBrokerSession());
    }
  }, []);

  return (
    <>
      <ScrollToHash />
      <SubdomainRedirect />
      <AppRoutes />
    </>
  );
};

const App = () => (
  <HelmetProvider>
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppContent />
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </Provider>
  </HelmetProvider>
);

export default App;
