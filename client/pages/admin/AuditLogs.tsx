import React from "react";
import { History } from "lucide-react";
import { MetaHelmet } from "@/components/MetaHelmet";
import { adminPageMeta } from "@/lib/seo-helpers";
import UnderConstruction from "../UnderConstruction";

const AuditLogs = () => {
  return (
    <>
      <MetaHelmet
        {...adminPageMeta(
          "Audit Logs",
          "Activity tracking and system audit trail",
        )}
      />
      <UnderConstruction
        title="Audit Logs"
        description="Complete activity tracking and audit trail for all system operations coming soon."
        icon={History}
        features={[
          "Activity Tracking",
          "User Actions",
          "System Events",
          "Export Logs",
        ]}
      />
    </>
  );
};

export default AuditLogs;
