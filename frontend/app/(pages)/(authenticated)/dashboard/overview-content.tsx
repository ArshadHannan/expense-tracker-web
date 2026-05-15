"use client";

import { LineChart } from "@mui/x-charts/LineChart";
import { useMemo } from "react";
import { useReceipts } from "../../../_lib/use-receipts";

type OverviewContentProps = {
  userEmail: string;
};

const mockExpenseTrend = [
  { date: "May 01", amount: 4200 },
  { date: "May 05", amount: 7800 },
  { date: "May 09", amount: 11600 },
  { date: "May 13", amount: 15100 },
  { date: "May 17", amount: 20400 },
  { date: "May 21", amount: 25700 },
  { date: "May 25", amount: 31800 },
  { date: "May 29", amount: 38000 },
  { date: "May 31", amount: 50000 },
];

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
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Expense trend</h2>
          <p className="mt-1 text-sm text-text-secondary">
            Mock monthly spend by date
          </p>
        </div>
        <div className="h-[300px]">
          <LineChart
            colors={["#59b655"]}
            grid={{ horizontal: true, vertical: true }}
            hideLegend
            margin={{ right: 24, top: 30 }}
            series={[
              {
                data: mockExpenseTrend.map((point) => point.amount),
                label: "Amount",
                valueFormatter: (value) =>
                  value === null ? "" : `${value.toLocaleString("en-US")} Rs`,
              },
            ]}
            sx={{
              "& .MuiChartsAxis-line": { stroke: "var(--border)" },
              "& .MuiChartsAxis-tick": { stroke: "var(--border)" },
              "& .MuiChartsAxis-tickLabel": {
                fill: "var(--text-primary) !important",
                fontFamily: "var(--font-geist-sans)",
              },
              "& .MuiChartsAxis-tickLabel tspan": {
                fill: "var(--text-primary) !important",
              },
              "& .MuiChartsAxis-label": {
                fill: "var(--text-primary) !important",
                fontFamily: "var(--font-geist-sans)",
              },
              "& .MuiChartsAxis-label tspan": {
                fill: "var(--text-primary) !important",
              },
              "& .MuiChartsGrid-line": {
                stroke: "var(--border)",
                strokeDasharray: "4 4",
              },
            }}
            xAxis={[
              {
                data: mockExpenseTrend.map((point) => point.date),
                label: "Date",
                labelStyle: {
                  fill: "var(--text-primary)",
                },
                scaleType: "point",
                tickLabelStyle: {
                  fill: "var(--text-primary)",
                },
              },
            ]}
            yAxis={[
              {
                label: "Amount (Rs)",
                labelStyle: {
                  fill: "var(--text-primary)",
                },
                tickLabelStyle: {
                  fill: "var(--text-primary)",
                },
                valueFormatter: (value: number) =>
                  `${Number(value).toLocaleString("en-US")} Rs`,
                width: 112,
              },
            ]}
          />
        </div>
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
