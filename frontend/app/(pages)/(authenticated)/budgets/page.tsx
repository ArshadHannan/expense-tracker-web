import { Wallet } from "lucide-react";
import { ComingSoon } from "../../../_components/ui/coming-soon";

export default async function BudgetsPage() {
  return (
    <ComingSoon
      description="Set monthly spending limits, track utilization in real time, and get alerts when you're approaching your budget cap."
      features={[
        "Create category-based budgets",
        "Visual progress tracking against limits",
        "Alerts when spending exceeds thresholds",
        "Monthly and quarterly budget views",
      ]}
      icon={Wallet}
      title="Budget management"
    />
  );
}
