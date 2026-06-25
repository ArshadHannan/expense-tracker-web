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

export async function saveReceipt(payload: {
  storeName: string;
  items: ReceiptItem[];
  totals: ReceiptTotals;
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
