"use client";

import { LineChart } from "@mui/x-charts/LineChart";
import { Clock, IndianRupee, Receipt, TrendingUp, Wallet } from "lucide-react";
import { useMemo } from "react";
import {
  buildMonthlyExpenseChart,
  getChartXAxisTickDays,
  getPredictedEndOfMonthSpend,
} from "../../../_lib/expense-chart-utils";
import { useAccount } from "../../../_lib/use-account";
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
  const { loading: accountLoading, monthlyBudget } = useAccount();
  const { dataSource, error, loading, receipts } = useReceipts(userEmail);

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

  const monthlyBudgetLimit = monthlyBudget ?? 0;

  const chartPoints = useMemo(
    () => buildMonthlyExpenseChart(receipts, monthlyBudgetLimit),
    [monthlyBudgetLimit, receipts],
  );

  const chartXAxisTickDays = useMemo(
    () => getChartXAxisTickDays(chartPoints),
    [chartPoints],
  );

  const predictedEndOfMonth = useMemo(
    () => getPredictedEndOfMonthSpend(chartPoints),
    [chartPoints],
  );

  const monthlySpent = useMemo(() => {
    const today = new Date().getDate();
    return chartPoints.find((point) => point.day === today)?.cumulativeSpent ?? 0;
  }, [chartPoints]);

  const budgetUsedPercent =
    monthlyBudgetLimit > 0
      ? Math.min(100, Math.round((monthlySpent / monthlyBudgetLimit) * 100))
      : 0;

  if (loading || accountLoading) {
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
          value={formatAmount(monthlyBudgetLimit)}
        />
        <StatCard
          hint="Estimated total spend by month end"
          icon={<TrendingUp className="size-5" strokeWidth={1.75} />}
          label="Predicted end-of-month"
          trend={{
            positive: predictedEndOfMonth < monthlyBudgetLimit,
            value:
              monthlyBudgetLimit > 0
                ? `${Math.round((predictedEndOfMonth / monthlyBudgetLimit) * 100)}% of budget`
                : "—",
          }}
          value={formatAmount(predictedEndOfMonth)}
        />
        <StatCard
          hint={`${budgetUsedPercent}% of budget used this month · ${dataSource === "fake" ? "demo data" : "live data"}`}
          icon={<IndianRupee className="size-5" strokeWidth={1.75} />}
          label="Spent this month"
          value={formatAmount(monthlySpent)}
        />
      </div>

      {/* Budget utilization + Latest receipt */}
      <div className="grid gap-6 lg:grid-cols-2">
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
            {formatAmount(monthlySpent)} spent of {formatAmount(monthlyBudgetLimit)} budget
          </p>
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

      {/* Expense trend — full width */}
      <Card padding="md">
          <CardHeader>
            <div>
              <CardTitle>Expense trend</CardTitle>
              <CardDescription>
                Cumulative spending this month vs budget pace
              </CardDescription>
              <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-text-secondary">
                <span className="inline-flex items-center gap-2">
                  <span
                    aria-hidden
                    className="inline-block h-0 w-6 border-t-2 border-dashed border-[#c65d12]"
                  />
                  Budget pace
                </span>
                <span className="inline-flex items-center gap-2">
                  <span
                    aria-hidden
                    className="inline-block h-0.5 w-6 rounded-full bg-primary"
                  />
                  Spent
                </span>
              </div>
            </div>
          </CardHeader>
          <div className="relative h-[300px] w-full overflow-visible">
            <LineChart
              colors={["#c65d12", "#59b655"]}
              grid={{ horizontal: true, vertical: false }}
              hideLegend
              margin={{ bottom: 4, left: 4, right: 20, top: 12 }}
              series={[
                {
                  curve: "linear",
                  data: chartPoints.map((point) => point.budgetPace),
                  id: "budgetPace",
                  label: "Budget pace",
                  showMark: false,
                  valueFormatter: (value) =>
                    value === null ? "" : `${value.toLocaleString("en-US")} Rs`,
                },
                {
                  area: true,
                  curve: "linear",
                  connectNulls: false,
                  data: chartPoints.map((point) => point.cumulativeSpent),
                  id: "spent",
                  label: "Spent",
                  showMark: false,
                  valueFormatter: (value) =>
                    value === null ? "" : `${value.toLocaleString("en-US")} Rs`,
                },
              ]}
              sx={{
                "& .MuiAreaElement-series-spent": {
                  fill: "url(#spent-gradient)",
                  fillOpacity: 1,
                },
                "& .MuiChartsAxis-bottom .MuiChartsAxis-tickLabel": {
                  fontSize: "10px",
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
                  strokeOpacity: 0.35,
                },
                "& .MuiLineElement-series-budgetPace": {
                  stroke: "#c65d12 !important",
                  strokeDasharray: "8 6 !important",
                  strokeWidth: 2.5,
                },
                "& .MuiLineElement-series-spent": {
                  stroke: "#59b655 !important",
                  strokeWidth: 2.5,
                },
              }}
              xAxis={[
                {
                  data: chartPoints.map((point) => point.day),
                  height: "auto",
                  scaleType: "point",
                  tickInterval: chartXAxisTickDays,
                  tickLabelStyle: { fill: "var(--text-tertiary)" },
                  valueFormatter: (day) => {
                    const point = chartPoints.find((chartPoint) => chartPoint.day === day);
                    return point?.label ?? String(day);
                  },
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
            <svg aria-hidden className="absolute size-0">
              <defs>
                <linearGradient id="spent-gradient" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#59b655" stopOpacity={0.14} />
                  <stop offset="85%" stopColor="#59b655" stopOpacity={0.04} />
                  <stop offset="100%" stopColor="#59b655" stopOpacity={0} />
                </linearGradient>
              </defs>
            </svg>
          </div>
      </Card>
    </div>
  );
}
