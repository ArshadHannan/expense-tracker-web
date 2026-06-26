import type { Receipt } from "./use-receipts";

export type ExpenseTrendPoint = {
  date: string;
  amount: number;
};

export function getReceiptAmount(receipt: Receipt) {
  if (typeof receipt.total_amount_value === "number") {
    return receipt.total_amount_value;
  }

  const parsed = Number(
    receipt.total_amount?.replace(/,/g, "").replace(/[^\d.-]/g, "") ?? "0",
  );
  return Number.isFinite(parsed) ? parsed : 0;
}

export function getMonthBounds(referenceDate = new Date()) {
  const year = referenceDate.getFullYear();
  const month = referenceDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  return { year, month, daysInMonth };
}

export function isDateInMonth(isoDate: string, referenceDate = new Date()) {
  const date = new Date(isoDate);

  if (Number.isNaN(date.getTime())) {
    return false;
  }

  const { year, month } = getMonthBounds(referenceDate);
  return date.getFullYear() === year && date.getMonth() === month;
}

export function formatChartDate(day: number, referenceDate = new Date()) {
  const { year, month } = getMonthBounds(referenceDate);
  const date = new Date(year, month, day);
  const monthLabel = date.toLocaleDateString("en-US", { month: "short" });
  const dayLabel = String(day).padStart(2, "0");

  return `${monthLabel} ${dayLabel}`;
}

export function computeMonthlySpent(
  receipts: Receipt[],
  referenceDate = new Date(),
) {
  return receipts
    .filter((receipt) => isDateInMonth(receipt.created_at, referenceDate))
    .reduce((total, receipt) => total + getReceiptAmount(receipt), 0);
}

export function buildMonthlyExpenseTrend(
  receipts: Receipt[],
  referenceDate = new Date(),
): ExpenseTrendPoint[] {
  const { daysInMonth } = getMonthBounds(referenceDate);
  const dailySpend = new Map<number, number>();

  for (const receipt of receipts) {
    if (!isDateInMonth(receipt.created_at, referenceDate)) {
      continue;
    }

    const day = new Date(receipt.created_at).getDate();
    dailySpend.set(day, (dailySpend.get(day) ?? 0) + getReceiptAmount(receipt));
  }

  const points: ExpenseTrendPoint[] = [];
  let cumulative = 0;

  for (let day = 1; day <= daysInMonth; day++) {
    cumulative += dailySpend.get(day) ?? 0;
    points.push({
      date: formatChartDate(day, referenceDate),
      amount: cumulative,
    });
  }

  return points;
}

export function predictEndOfMonthSpend(
  monthlySpent: number,
  referenceDate = new Date(),
) {
  const { daysInMonth } = getMonthBounds(referenceDate);
  const dayOfMonth = referenceDate.getDate();

  if (dayOfMonth <= 0 || monthlySpent <= 0) {
    return 0;
  }

  return Math.round((monthlySpent / dayOfMonth) * daysInMonth);
}
