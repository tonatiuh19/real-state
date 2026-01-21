import React from "react";
import { TrendingUp } from "lucide-react";
import { MetaHelmet } from "@/components/MetaHelmet";
import { adminPageMeta } from "@/lib/seo-helpers";
import UnderConstruction from "../UnderConstruction";

const Reports = () => {
  return (
    <>
      <MetaHelmet
        {...adminPageMeta(
          "Reports & Analytics",
          "Advanced reporting and analytics dashboard",
        )}
      />
      <UnderConstruction
        title="Reports & Analytics"
        description="Advanced reporting and analytics dashboard coming soon. Track performance metrics, loan statistics, and business insights."
        icon={TrendingUp}
        features={[
          "Performance Metrics",
          "Loan Statistics",
          "Revenue Analysis",
          "Custom Reports",
        ]}
      />
    </>
  );
};

export default Reports;
