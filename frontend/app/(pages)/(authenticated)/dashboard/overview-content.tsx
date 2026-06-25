"use client";

import { LineChart } from "@mui/x-charts/LineChart";
import { Clock, IndianRupee, Receipt, TrendingUp, Wallet } from "lucide-react";
import { useMemo } from "react";
import expenseTrend from "@/fake-data/expense-trend.json";
import { useReceipts } from "../../../_lib/use-receipts";
import { Alert } from "../../../_components/ui/alert";
import { Badge } from "../../../_components/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "../../../_components/ui/card";
import { DashboardSkeleton } from "../../../_components/ui/loading-state";
import { StatCard } from "../../../_components/ui/stat-card";

type OverviewContentProps = {
  userEmail: string;
};

export default function OverviewContent({ userEmail }: OverviewContentProps) {
  const { dataSource, error, loading, receipts, totalSpent } =
    useReceipts(userEmail);

  const summary = useMemo(() => {
    const latestReceipt = receipts
      .slice()
      .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))[0];

    return {
      latestDate: latestReceipt?.created_at || null,
      latestPreview:
        latestReceipt?.emailBody?.preview ||
        latestReceipt?.items?.[0]?.item ||
        "No receipts yet",
      latestStore:
        latestReceipt?.store_name ||
        latestReceipt?.expense_name ||
        null,
      latestAmount: latestReceipt?.total_amount || null,
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
  const budgetUsedPercent = Math.min(
    100,
    Math.round((totalSpent / hardcodedBudget) * 100),
  );

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return <Alert variant="error">Error: {error}</Alert>;
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          accent
          hint="Monthly budget limit"
          icon={<Wallet className="size-5" strokeWidth={1.75} />}
          label="Budget amount"
          value={formatAmount(hardcodedBudget)}
        />
        <StatCard
          hint="Estimated total spend by month end"
          icon={<TrendingUp className="size-5" strokeWidth={1.75} />}
          label="Predicted end-of-month"
          trend={{
            positive: predictedEndOfMonth < hardcodedBudget,
            value: `${Math.round((predictedEndOfMonth / hardcodedBudget) * 100)}% of budget`,
          }}
          value={formatAmount(predictedEndOfMonth)}
        />
        <StatCard
          hint={`${budgetUsedPercent}% of budget used · ${dataSource === "fake" ? "demo data" : "live data"}`}
          icon={<IndianRupee className="size-5" strokeWidth={1.75} />}
          label="Total expenses"
          value={formatAmount(totalSpent)}
        />
      </div>

      {/* Budget progress */}
      <Card padding="md">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-text-secondary">
              Budget utilization
            </p>
            <p className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">
              {budgetUsedPercent}%
            </p>
          </div>
          <Badge variant={budgetUsedPercent > 80 ? "warning" : "primary"}>
            {budgetUsedPercent > 80 ? "Near limit" : "On track"}
          </Badge>
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-surface-muted">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${budgetUsedPercent}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-text-tertiary">
          {formatAmount(totalSpent)} spent of {formatAmount(hardcodedBudget)} budget
        </p>
      </Card>

      {/* Chart + Latest receipt */}
      <div className="grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
        <Card padding="md">
          <CardHeader>
            <div>
              <CardTitle>Expense trend</CardTitle>
              <CardDescription>Monthly spend by date</CardDescription>
            </div>
          </CardHeader>
          <div className="h-[280px]">
            <LineChart
              colors={["#59b655"]}
              grid={{ horizontal: true, vertical: false }}
              hideLegend
              margin={{ bottom: 32, left: 8, right: 16, top: 16 }}
              series={[
                {
                  area: true,
                  curve: "natural",
                  data: expenseTrend.map((point) => point.amount),
                  label: "Amount",
                  showMark: false,
                  valueFormatter: (value) =>
                    value === null ? "" : `${value.toLocaleString("en-US")} Rs`,
                },
              ]}
              sx={{
                "& .MuiAreaElement-root": {
                  fill: "url(#gradient)",
                  fillOpacity: 0.15,
                },
                "& .MuiChartsAxis-line": { stroke: "var(--border)" },
                "& .MuiChartsAxis-tick": { stroke: "var(--border)" },
                "& .MuiChartsAxis-tickLabel, & .MuiChartsAxis-tickLabel tspan": {
                  fill: "var(--text-tertiary) !important",
                  fontFamily: "var(--font-geist-sans)",
                  fontSize: "11px",
                },
                "& .MuiChartsAxis-label, & .MuiChartsAxis-label tspan": {
                  fill: "var(--text-secondary) !important",
                  fontFamily: "var(--font-geist-sans)",
                  fontSize: "12px",
                },
                "& .MuiChartsGrid-line": {
                  stroke: "var(--border)",
                  strokeDasharray: "3 6",
                  strokeOpacity: 0.5,
                },
                "& .MuiLineElement-root": {
                  strokeWidth: 2,
                },
              }}
              xAxis={[
                {
                  data: expenseTrend.map((point) => point.date),
                  scaleType: "point",
                  tickLabelStyle: { fill: "var(--text-tertiary)" },
                },
              ]}
              yAxis={[
                {
                  tickLabelStyle: { fill: "var(--text-tertiary)" },
                  valueFormatter: (value: number) =>
                    `${Number(value).toLocaleString("en-US")}`,
                  width: 56,
                },
              ]}
            />
          </div>
        </Card>

        <Card className="flex flex-col" padding="md">
          <CardHeader>
            <div>
              <CardTitle>Latest receipt</CardTitle>
              <CardDescription>Most recently saved expense</CardDescription>
            </div>
            <div className="flex size-9 items-center justify-center rounded-[var(--radius-md)] bg-primary-soft text-primary">
              <Receipt className="size-4" strokeWidth={1.75} />
            </div>
          </CardHeader>

          {summary.latestDate ? (
            <div className="mt-auto space-y-4">
              {summary.latestStore ? (
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-text-tertiary">
                    Store
                  </p>
                  <p className="mt-1 font-medium text-text-primary">
                    {summary.latestStore}
                  </p>
                </div>
              ) : null}
              {summary.latestAmount ? (
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-text-tertiary">
                    Amount
                  </p>
                  <p className="mt-1 text-2xl font-semibold tabular-nums text-primary">
                    {summary.latestAmount}
                  </p>
                </div>
              ) : null}
              <div className="flex items-center gap-2 text-sm text-text-secondary">
                <Clock className="size-3.5 shrink-0" />
                {formatDate(summary.latestDate)}
              </div>
              <p className="truncate text-sm text-text-tertiary">
                {summary.latestPreview}
              </p>
            </div>
          ) : (
            <div className="mt-auto flex flex-col items-center py-8 text-center">
              <div className="flex size-12 items-center justify-center rounded-[var(--radius-lg)] bg-surface-muted text-text-tertiary">
                <Receipt className="size-5" />
              </div>
              <p className="mt-4 text-sm text-text-secondary">
                Upload a receipt to see your latest expense here.
              </p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
