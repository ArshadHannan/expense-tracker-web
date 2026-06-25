import { CheckSquare } from "lucide-react";
import { ComingSoon } from "../../../_components/ui/coming-soon";

export default async function ApprovalsPage() {
  return (
    <ComingSoon
      description="Review pending expense submissions, approve or reject with comments, and maintain a clear audit trail for your team."
      features={[
        "Pending expense queue",
        "One-click approve or reject",
        "Comment and feedback on submissions",
        "Full approval history and audit log",
      ]}
      icon={CheckSquare}
      title="Approval workflow"
    />
  );
}
