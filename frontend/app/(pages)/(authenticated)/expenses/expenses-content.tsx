"use client";

import { useReceipts } from "../../../_lib/use-receipts";
import { Alert } from "../../../_components/ui/alert";
import { SkeletonTable } from "../../../_components/ui/loading-state";
import ReceiptsTable from "./receipts-table";

type ExpensesContentProps = {
  userEmail: string;
};

export default function ExpensesContent({ userEmail }: ExpensesContentProps) {
  const { error, loading, receipts, totalSpent } = useReceipts(userEmail);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="skeleton h-24 w-full rounded-[var(--radius-lg)]" />
        <SkeletonTable rows={6} />
      </div>
    );
  }

  if (error) {
    return <Alert variant="error">Error: {error}</Alert>;
  }

  return <ReceiptsTable receipts={receipts} totalSpent={totalSpent} />;
}
