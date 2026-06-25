export type ReceiptItem = {
  amount: string;
  item: string;
  quantity: string;
};

export type ReceiptTotals = {
  subtotal: string;
  discount: string;
  tax: string;
  serviceCharge: string;
  deliveryFee: string;
  total: string;
};

export const editableTotalFields = [
  "discount",
  "tax",
  "serviceCharge",
  "deliveryFee",
] as const;

export const emptyReceiptItem = (): ReceiptItem => ({
  item: "",
  quantity: "1",
  amount: "",
});

export const emptyReceiptTotals = (): ReceiptTotals => ({
  subtotal: "0",
  discount: "0",
  tax: "0",
  serviceCharge: "0",
  deliveryFee: "0",
  total: "0",
});

export function parseAmountInput(value: string) {
  const numericValue = Number(value.replace(/,/g, "").replace(/[^\d.-]/g, ""));
  return Number.isFinite(numericValue) ? numericValue : 0;
}

export function formatAmountInput(value: number) {
  return value.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

export function formatTotalLabel(label: string) {
  return label
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (character) => character.toUpperCase());
}

export function computeSubtotal(items: ReceiptItem[]) {
  return items.reduce((total, item) => total + parseAmountInput(item.amount), 0);
}

export function computeFinalTotal(subtotal: number, totals: ReceiptTotals) {
  return (
    subtotal -
    parseAmountInput(totals.discount) +
    parseAmountInput(totals.tax) +
    parseAmountInput(totals.serviceCharge) +
    parseAmountInput(totals.deliveryFee)
  );
}

export function normalizeAmountInput(value: string) {
  return value.replace(/\s*rs$/i, "").replace(/[^\d.,-]/g, "").trim();
}

/** YYYY-MM-DD for native date inputs (local calendar date). */
export function getTodayPickerDate(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Convert stored ISO timestamp to YYYY-MM-DD for the date picker. */
export function createdAtToPickerDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return getTodayPickerDate();
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Convert date picker value to ISO UTC for storage (matches existing created_at format).
 * Uses noon UTC so the calendar date stays stable across timezones.
 */
export function pickerDateToCreatedAt(pickerValue: string): string {
  return `${pickerValue}T12:00:00.000Z`;
}

export function isValidPickerDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

export async function saveReceipt(payload: {
  storeName: string;
  items: ReceiptItem[];
  totals: ReceiptTotals;
  created_at: string;
}) {
  const response = await fetch("/api/receipts", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.error ?? "Unable to save receipt.");
  }

  return data;
}
