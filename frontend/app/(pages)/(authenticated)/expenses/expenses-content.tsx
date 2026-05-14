"use client";

import { useReceipts } from "../../../_lib/use-receipts";
import ReceiptsTable from "./receipts-table";

type ExpensesContentProps = {
  userEmail: string;
};

export default function ExpensesContent({ userEmail }: ExpensesContentProps) {
  const { error, loading, receipts } = useReceipts(userEmail);

  if (loading) {
    return (
      <div className="rounded-[8px] border border-border bg-surface p-8 text-center">
        <p className="text-text-secondary">Loading receipts...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-[8px] border border-border bg-surface p-8">
        <p className="text-red-500">Error: {error}</p>
      </div>
    );
  }

  return <ReceiptsTable receipts={receipts} />;
}
