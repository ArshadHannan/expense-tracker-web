"use client";

import { useMemo } from "react";
import { useReceipts } from "../../../_lib/use-receipts";

type OverviewContentProps = {
  userEmail: string;
};

export default function OverviewContent({ userEmail }: OverviewContentProps) {
  const { error, loading, receipts, totalSpent } = useReceipts(userEmail);

  const summary = useMemo(() => {
    const latestReceipt = receipts
      .slice()
      .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))[0];

    return {
      latestDate: latestReceipt?.created_at || null,
      latestPreview: latestReceipt?.emailBody.preview || "No receipts yet",
    };
  }, [receipts]);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const formatAmount = (amount: number) =>
    `${amount.toLocaleString("en-US")} Rs`;

  const hardcodedBudget = 50000;
  const predictedEndOfMonth = 38000;

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

  return (
    <>
      <div className="grid gap-4 md:grid-cols-3">
        <article className="rounded-[8px] border border-border bg-surface p-5">
          <p className="text-sm text-text-secondary">Budget Amount</p>
          <p className="mt-3 text-3xl font-semibold">
            {formatAmount(hardcodedBudget)}
          </p>
          <p className="mt-2 text-sm font-medium text-primary">
            Monthly budget limit
          </p>
        </article>

        <article className="rounded-[8px] border border-border bg-surface p-5">
          <p className="text-sm text-text-secondary">Predicted End-of-Month</p>
          <p className="mt-3 text-3xl font-semibold">
            {formatAmount(predictedEndOfMonth)}
          </p>
          <p className="mt-2 text-sm font-medium text-primary">
            Estimated total spend by month end
          </p>
        </article>

        <article className="rounded-[8px] border border-border bg-surface p-5">
          <p className="text-sm text-text-secondary">Total Expenses</p>
          <p className="mt-3 text-3xl font-semibold">
            {formatAmount(totalSpent)}
          </p>
          <p className="mt-2 text-sm font-medium text-primary">
            Current total from backend
          </p>
        </article>
      </div>

      <div className="mt-6 rounded-[8px] border border-border bg-surface p-5">
        <h2 className="text-lg font-semibold">Latest receipt</h2>
        {summary.latestDate ? (
          <div className="mt-3 space-y-2 text-sm text-text-secondary">
            <p className="font-medium text-text-primary">
              {formatDate(summary.latestDate)}
            </p>
            <p className="truncate">{summary.latestPreview}</p>
          </div>
        ) : (
          <p className="mt-3 text-sm text-text-secondary">
            Upload a receipt to see your latest expense here.
          </p>
        )}
      </div>
    </>
  );
}
