import { BarChart3 } from "lucide-react";
import { ComingSoon } from "../../../_components/ui/coming-soon";

export default async function ReportPage() {
  return (
    <ComingSoon
      description="Generate detailed spending reports, export data for accounting, and uncover trends across categories and time periods."
      features={[
        "Monthly and yearly spending summaries",
        "Category breakdown charts",
        "CSV and PDF export",
        "Custom date range filtering",
      ]}
      icon={BarChart3}
      title="Reports & analytics"
    />
  );
}
