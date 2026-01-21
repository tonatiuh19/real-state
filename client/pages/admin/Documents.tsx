import React from "react";
import { Briefcase } from "lucide-react";
import { motion } from "framer-motion";
import { MetaHelmet } from "@/components/MetaHelmet";
import { adminPageMeta } from "@/lib/seo-helpers";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const Documents = () => {
  const navigate = useNavigate();

  return (
    <>
      <MetaHelmet
        {...adminPageMeta("Documents", "Manage client documents and files")}
      />
      <div className="p-8">
        <div className="flex flex-col items-center justify-center min-h-[80vh] text-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="relative"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-amber-500/20 to-amber-500/5 blur-3xl rounded-full" />
            <div className="relative rounded-full bg-gradient-to-br from-amber-500/10 to-amber-500/5 p-12 mb-6 border-2 border-amber-500/20">
              <Briefcase className="h-20 w-20 text-amber-500 animate-pulse" />
            </div>
          </motion.div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="space-y-4 max-w-md"
          >
            <h2 className="text-3xl font-bold bg-gradient-to-r from-amber-500 to-amber-400 bg-clip-text text-transparent">
              Document Manager
            </h2>
            <p className="text-muted-foreground text-lg">
              Securely store, organize, and share loan documents with clients.
              Track document status and automate collection.
            </p>
            <div className="flex flex-wrap gap-2 justify-center pt-4">
              {[
                "Secure Storage",
                "E-Signatures",
                "Version Control",
                "Client Portal",
              ].map((feature, i) => (
                <div
                  key={i}
                  className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-500 text-sm font-medium border border-amber-500/20"
                >
                  {feature}
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="mt-8"
          >
            <Button variant="outline" onClick={() => navigate("/admin")}>
              Back to Dashboard
            </Button>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default Documents;
