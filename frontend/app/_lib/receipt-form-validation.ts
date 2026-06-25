import {
  computeFinalTotal,
  computeSubtotal,
  editableTotalFields,
  emptyReceiptItem,
  parseAmountInput,
  type ReceiptItem,
  type ReceiptTotals,
} from "./receipt-form-utils";

export type LineItemFieldErrors = Partial<Record<keyof ReceiptItem, string>>;

export type ReceiptFormFieldErrors = {
  storeName?: string;
  items?: Record<number, LineItemFieldErrors>;
  totals?: Partial<Record<(typeof editableTotalFields)[number], string>>;
  form?: string;
};

const STORE_NAME_MIN = 2;
const STORE_NAME_MAX = 100;

export function isLineItemEmpty(item: ReceiptItem): boolean {
  const hasItem = item.item.trim().length > 0;
  const hasAmount = item.amount.trim().length > 0 && parseAmountInput(item.amount) > 0;
  return !hasItem && !hasAmount;
}

export function isLineItemPartial(item: ReceiptItem): boolean {
  if (isLineItemEmpty(item)) return false;

  const hasItem = item.item.trim().length > 0;
  const hasQuantity =
    item.quantity.trim().length > 0 && parseAmountInput(item.quantity) > 0;
  const hasAmount =
    item.amount.trim().length > 0 && parseAmountInput(item.amount) > 0;

  return !(hasItem && hasQuantity && hasAmount);
}

export function filterEmptyLineItems(items: ReceiptItem[]): ReceiptItem[] {
  return items.filter((item) => !isLineItemEmpty(item));
}

export function ensureMinimumRows(items: ReceiptItem[]): ReceiptItem[] {
  const nonEmpty = filterEmptyLineItems(items);
  return nonEmpty.length > 0 ? items : [emptyReceiptItem()];
}

/** Strip non-numeric characters; allow a single decimal point. */
export function sanitizeNumericInput(value: string): string {
  let sanitized = value.replace(/[^\d.]/g, "");
  const dotIndex = sanitized.indexOf(".");

  if (dotIndex !== -1) {
    sanitized =
      sanitized.slice(0, dotIndex + 1) +
      sanitized.slice(dotIndex + 1).replace(/\./g, "");
  }

  return sanitized;
}

export function isValidPositiveNumber(value: string): boolean {
  if (!value.trim()) return false;
  const numericValue = parseAmountInput(value);
  return Number.isFinite(numericValue) && numericValue > 0;
}

export function isValidNonNegativeNumber(value: string): boolean {
  if (!value.trim()) return true;
  const numericValue = parseAmountInput(value);
  return Number.isFinite(numericValue) && numericValue >= 0;
}

export function validateLineItem(
  item: ReceiptItem,
): LineItemFieldErrors {
  const rowErrors: LineItemFieldErrors = {};
  const itemName = item.item.trim();

  if (!itemName) {
    rowErrors.item = "Item name is required.";
  } else if (/^\d+([.,]\d+)?$/.test(itemName)) {
    rowErrors.item = "Item name cannot be numbers only.";
  } else if (itemName.length > 120) {
    rowErrors.item = "Item name must be 120 characters or fewer.";
  }

  if (!item.quantity.trim()) {
    rowErrors.quantity = "Quantity is required.";
  } else if (!isValidPositiveNumber(item.quantity)) {
    rowErrors.quantity = "Enter a number greater than 0.";
  }

  if (!item.amount.trim()) {
    rowErrors.amount = "Amount is required.";
  } else if (!isValidPositiveNumber(item.amount)) {
    rowErrors.amount = "Enter a number greater than 0.";
  }

  return rowErrors;
}

export function validateReceiptForm(
  storeName: string,
  items: ReceiptItem[],
  totals: ReceiptTotals,
): {
  isValid: boolean;
  errors: ReceiptFormFieldErrors;
  cleanedItems: ReceiptItem[];
} {
  const errors: ReceiptFormFieldErrors = {};
  const trimmedStore = storeName.trim();

  if (!trimmedStore) {
    errors.storeName = "Store name is required.";
  } else if (trimmedStore.length < STORE_NAME_MIN) {
    errors.storeName = `Store name must be at least ${STORE_NAME_MIN} characters.`;
  } else if (trimmedStore.length > STORE_NAME_MAX) {
    errors.storeName = `Store name must be ${STORE_NAME_MAX} characters or fewer.`;
  }

  const nonEmptyItems = filterEmptyLineItems(items);
  const itemErrors: Record<number, LineItemFieldErrors> = {};

  items.forEach((item, index) => {
    if (isLineItemEmpty(item)) return;

    const rowErrors = validateLineItem(item);

    if (Object.keys(rowErrors).length > 0) {
      itemErrors[index] = rowErrors;
    }
  });

  if (nonEmptyItems.length === 0) {
    errors.form = "Add at least one line item.";
  } else if (Object.keys(itemErrors).length === 0) {
    const cleanedItems = filterEmptyLineItems(items);
    const subtotal = computeSubtotal(cleanedItems);
    const finalTotal = computeFinalTotal(subtotal, totals);

    if (finalTotal <= 0) {
      errors.form = "Total must be greater than 0.";
    }
  }

  const totalsErrors: ReceiptFormFieldErrors["totals"] = {};

  for (const field of editableTotalFields) {
    if (!isValidNonNegativeNumber(totals[field])) {
      totalsErrors[field] = "Enter a valid number (0 or greater).";
    }
  }

  if (Object.keys(itemErrors).length > 0) {
    errors.items = itemErrors;
  }

  if (Object.keys(totalsErrors).length > 0) {
    errors.totals = totalsErrors;
  }

  const isValid =
    !errors.storeName &&
    !errors.form &&
    !errors.items &&
    !errors.totals;

  return {
    isValid,
    errors,
    cleanedItems: filterEmptyLineItems(items),
  };
}

export function pruneEmptyRows(items: ReceiptItem[]): ReceiptItem[] {
  const filtered = filterEmptyLineItems(items);
  return filtered.length > 0 ? filtered : [emptyReceiptItem()];
}
