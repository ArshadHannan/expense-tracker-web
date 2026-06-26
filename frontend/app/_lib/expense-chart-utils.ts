import type { Receipt } from "./use-receipts";

export type ExpenseChartPoint = {
  budgetPace: number;
  cumulativeSpent: number | null;
  day: number;
  label: string;
};

function getReceiptAmount(receipt: Receipt) {
  if (typeof receipt.total_amount_value === "number") {
    return receipt.total_amount_value;
  }

  return Number(receipt.total_amount.replace(/,/g, "")) || 0;
}

function getLocalDateParts(iso: string) {
  const date = new Date(iso);

  return {
    day: date.getDate(),
    month: date.getMonth(),
    year: date.getFullYear(),
  };
}

export function buildMonthlyExpenseChart(
  receipts: Receipt[],
  monthlyBudget: number,
  referenceDate = new Date(),
): ExpenseChartPoint[] {
  const year = referenceDate.getFullYear();
  const month = referenceDate.getMonth();
  const today = referenceDate.getDate();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthLabel = referenceDate.toLocaleDateString("en-US", { month: "short" });

  const dailySpend = new Map<number, number>();

  for (const receipt of receipts) {
    const parts = getLocalDateParts(receipt.created_at);

    if (parts.year !== year || parts.month !== month) {
      continue;
    }

    const amount = getReceiptAmount(receipt);
    dailySpend.set(parts.day, (dailySpend.get(parts.day) ?? 0) + amount);
  }

  const points: ExpenseChartPoint[] = [];
  let runningTotal = 0;

  for (let day = 1; day <= daysInMonth; day += 1) {
    runningTotal += dailySpend.get(day) ?? 0;

    const budgetPace =
      daysInMonth <= 1
        ? monthlyBudget
        : (monthlyBudget * (day - 1)) / (daysInMonth - 1);

    points.push({
      day,
      label: `${monthLabel} ${String(day).padStart(2, "0")}`,
      budgetPace,
      cumulativeSpent: day <= today ? runningTotal : null,
    });
  }

  return points;
}

export function getPredictedEndOfMonthSpend(
  chartPoints: ExpenseChartPoint[],
  referenceDate = new Date(),
) {
  const today = referenceDate.getDate();
  const daysInMonth = chartPoints.length;
  const todayPoint = chartPoints.find((point) => point.day === today);
  const spentSoFar = todayPoint?.cumulativeSpent ?? 0;

  if (today <= 0 || daysInMonth <= 0 || spentSoFar <= 0) {
    return 0;
  }

  return Math.round((spentSoFar / today) * daysInMonth);
}

export function shouldShowChartXTickLabel(index: number, total: number) {
  if (total <= 1) {
    return true;
  }

  if (index === 0 || index === total - 1) {
    return true;
  }

  return index % 5 === 0;
}
