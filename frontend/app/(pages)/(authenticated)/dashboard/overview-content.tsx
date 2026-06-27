"use client";

import { LineChart, lineClasses } from "@mui/x-charts/LineChart";
import { ChevronDown, Clock, IndianRupee, Receipt, TrendingUp, Wallet } from "lucide-react";
import { useMemo, useState } from "react";
import {
  buildMonthlyExpenseChart,
  getChartXAxisTickDays,
  getPredictedEndOfMonthSpend,
} from "../../../_lib/expense-chart-utils";
import { useAccount } from "../../../_lib/use-account";
import { useReceipts } from "../../../_lib/use-receipts";
import { ExpenseChartLine } from "../../../_components/expense-chart-line";
import { Alert } from "../../../_components/ui/alert";
import { Badge } from "../../../_components/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "../../../_components/ui/card";
import { DashboardSkeleton } from "../../../_components/ui/loading-state";
import { StatCard } from "../../../_components/ui/stat-card";

type OverviewContentProps = {
  userEmail: string;
};

function toMonthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function monthKeyToLabel(monthKey: string) {
  const [year, month] = monthKey.split("-").map(Number);
  return new Date(year, month - 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

export default function OverviewContent({ userEmail }: OverviewContentProps) {
  const { loading: accountLoading, monthlyBudget } = useAccount();
  const { dataSource, error, loading, receipts } = useReceipts(userEmail);

  const currentMonthKey = toMonthKey(new Date());
  const [selectedMonth, setSelectedMonth] = useState(currentMonthKey);

  const availableMonths = useMemo(() => {
    const monthSet = new Set<string>([currentMonthKey]);

    for (const receipt of receipts) {
      monthSet.add(toMonthKey(new Date(receipt.created_at)));
    }

    return Array.from(monthSet).sort().reverse();
  }, [receipts, currentMonthKey]);

  const isCurrentMonth = selectedMonth === currentMonthKey;

  const referenceDate = useMemo(() => {
    if (isCurrentMonth) return new Date();
    const [year, month] = selectedMonth.split("-").map(Number);
    return new Date(year, month, 0); // last day of selected month
  }, [selectedMonth, isCurrentMonth]);

  const selectedMonthLabel = useMemo(
    () => monthKeyToLabel(selectedMonth),
    [selectedMonth],
  );

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
    () => buildMonthlyExpenseChart(receipts, monthlyBudgetLimit, referenceDate),
    [monthlyBudgetLimit, receipts, referenceDate],
  );

  const chartXAxisTickDays = useMemo(
    () => getChartXAxisTickDays(chartPoints, referenceDate),
    [chartPoints, referenceDate],
  );

  const predictedEndOfMonth = useMemo(
    () => getPredictedEndOfMonthSpend(chartPoints, referenceDate),
    [chartPoints, referenceDate],
  );

  const monthlySpent = useMemo(() => {
    const today = referenceDate.getDate();
    return chartPoints.find((point) => point.day === today)?.cumulativeSpent ?? 0;
  }, [chartPoints, referenceDate]);

  const hasDataForMonth = useMemo(
    () => chartPoints.some((p) => p.cumulativeSpent !== null && p.cumulativeSpent > 0),
    [chartPoints],
  );

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
      {/* Month filter */}
      <div className="flex items-center justify-end">
        <div className="relative">
          <select
            className="cursor-pointer appearance-none rounded-[var(--radius-md)] border border-border bg-surface py-1.5 pl-3 pr-8 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-primary"
            onChange={(e) => setSelectedMonth(e.target.value)}
            value={selectedMonth}
          >
            {availableMonths.map((monthKey) => (
              <option key={monthKey} value={monthKey}>
                {monthKeyToLabel(monthKey)}
                {monthKey === currentMonthKey ? " (current)" : ""}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-3.5 -translate-y-1/2 text-text-tertiary" />
        </div>
      </div>

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
          hint={
            isCurrentMonth
              ? "Estimated total spend by month end"
              : `Full month total for ${selectedMonthLabel}`
          }
          icon={<TrendingUp className="size-5" strokeWidth={1.75} />}
          label={isCurrentMonth ? "Predicted end-of-month" : "Month total"}
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
          hint={`${budgetUsedPercent}% of budget used · ${dataSource === "fake" ? "demo data" : "live data"}`}
          icon={<IndianRupee className="size-5" strokeWidth={1.75} />}
          label={isCurrentMonth ? "Spent this month" : `Spent in ${selectedMonthLabel}`}
          value={formatAmount(monthlySpent)}
        />
      </div>

      {/* Budget utilization + Latest receipt */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-l-2 border-l-primary/50" padding="sm">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[11px] font-medium uppercase tracking-wider text-text-tertiary">
              Budget utilization
            </p>
            <Badge
              className="shrink-0"
              variant={budgetUsedPercent > 80 ? "warning" : "primary"}
            >
              {budgetUsedPercent > 80 ? "Near limit" : "On track"}
            </Badge>
          </div>

          <p className="mt-2 text-3xl font-semibold tracking-tight tabular-nums text-text-primary">
            {budgetUsedPercent}%
          </p>

          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-surface-muted">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${budgetUsedPercent}%` }}
            />
          </div>

          <div className="mt-2.5 flex items-center justify-between gap-3 text-xs text-text-tertiary">
            <span className="tabular-nums">
              {formatAmount(monthlySpent)} spent
            </span>
            <span className="tabular-nums">
              of {formatAmount(monthlyBudgetLimit)}
            </span>
          </div>
        </Card>

        <Card padding="sm">
          <div className="flex items-center justify-between gap-3 border-b border-border/60 pb-3">
            <div className="min-w-0">
              <h3 className="text-sm font-semibold tracking-tight text-text-primary">
                Latest receipt
              </h3>
              <p className="mt-0.5 text-xs text-text-tertiary">
                Most recently saved expense
              </p>
            </div>
            <div className="flex size-8 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-primary-soft text-primary">
              <Receipt className="size-3.5" strokeWidth={1.75} />
            </div>
          </div>

          {summary.latestDate ? (
            <div className="pt-3">
              <div className="grid grid-cols-[1fr_auto] items-end gap-x-4 gap-y-1">
                {summary.latestStore ? (
                  <div className="min-w-0">
                    <p className="text-[10px] font-medium uppercase tracking-wider text-text-tertiary">
                      Store
                    </p>
                    <p className="mt-0.5 truncate text-sm font-medium text-text-primary">
                      {summary.latestStore}
                    </p>
                  </div>
                ) : (
                  <div />
                )}
                {summary.latestAmount ? (
                  <div className="text-right">
                    <p className="text-[10px] font-medium uppercase tracking-wider text-text-tertiary">
                      Amount
                    </p>
                    <p className="mt-0.5 text-xl font-semibold tabular-nums text-primary">
                      {summary.latestAmount}
                    </p>
                  </div>
                ) : null}
              </div>

              <div className="mt-3 flex items-center justify-between gap-3 border-t border-border/40 pt-2.5">
                <div className="flex min-w-0 items-center gap-1.5 text-xs text-text-secondary">
                  <Clock className="size-3 shrink-0" strokeWidth={1.75} />
                  <span className="truncate">{formatDate(summary.latestDate)}</span>
                </div>
                <p className="max-w-[48%] truncate text-right text-xs text-text-tertiary">
                  {summary.latestPreview}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 py-4">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-surface-muted text-text-tertiary">
                <Receipt className="size-4" strokeWidth={1.75} />
              </div>
              <p className="text-sm leading-snug text-text-secondary">
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
              {isCurrentMonth
                ? "Cumulative spending this month vs budget pace"
                : `Cumulative spending in ${selectedMonthLabel} vs budget pace`}
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

        {hasDataForMonth ? (
          <div className="relative h-[300px] w-full overflow-visible">
            <LineChart
              colors={["#c65d12", "#59b655"]}
              grid={{ horizontal: true, vertical: false }}
              hideLegend
              margin={{ bottom: 4, left: 4, right: 20, top: 12 }}
              slots={{ line: ExpenseChartLine }}
              slotProps={{
                line: (ownerState) =>
                  ownerState.seriesId === "budgetPace"
                    ? {
                        stroke: "#c65d12",
                        strokeDasharray: "8 6",
                        strokeWidth: 2.5,
                      }
                    : {
                        stroke: "#59b655",
                        strokeWidth: 2.5,
                      },
              }}
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
                [`& .${lineClasses.area}[data-series="spent"]`]: {
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
        ) : (
          <div className="flex h-[300px] items-center justify-center">
            <p className="text-sm text-text-tertiary">
              No receipts recorded for {selectedMonthLabel}.
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}
