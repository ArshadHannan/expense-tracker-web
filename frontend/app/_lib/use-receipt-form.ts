"use client";

import { useCallback, useMemo, useState } from "react";
import {
  emptyReceiptItem,
  emptyReceiptTotals,
  computeFinalTotal,
  computeSubtotal,
  formatAmountInput,
  type ReceiptItem,
  type ReceiptTotals,
} from "./receipt-form-utils";
import {
  filterEmptyLineItems,
  pruneEmptyRows,
  type ReceiptFormFieldErrors,
  sanitizeNumericInput,
  validateReceiptForm,
} from "./receipt-form-validation";

export function useReceiptForm(initial?: {
  storeName?: string;
  items?: ReceiptItem[];
  totals?: ReceiptTotals;
}) {
  const [storeName, setStoreNameState] = useState(initial?.storeName ?? "");
  const [items, setItems] = useState<ReceiptItem[]>(
    initial?.items ?? [emptyReceiptItem()],
  );
  const [totals, setTotals] = useState<ReceiptTotals>(
    initial?.totals ?? emptyReceiptTotals(),
  );
  const [errors, setErrors] = useState<ReceiptFormFieldErrors>({});
  const [showErrors, setShowErrors] = useState(false);

  const visibleItems = useMemo(() => filterEmptyLineItems(items), [items]);
  const subtotal = useMemo(() => computeSubtotal(visibleItems), [visibleItems]);
  const finalTotal = useMemo(
    () => computeFinalTotal(subtotal, totals),
    [subtotal, totals],
  );

  const clearFieldError = useCallback(
    (scope: "storeName" | "form" | "items" | "totals", key?: string | number) => {
      setErrors((current) => {
        if (scope === "storeName") {
          const { storeName: _, ...rest } = current;
          return rest;
        }
        if (scope === "form") {
          const { form: _, ...rest } = current;
          return rest;
        }
        if (scope === "items" && typeof key === "number" && current.items) {
          const nextItems = { ...current.items };
          delete nextItems[key];
          return {
            ...current,
            items: Object.keys(nextItems).length > 0 ? nextItems : undefined,
          };
        }
        if (scope === "totals" && typeof key === "string" && current.totals) {
          const nextTotals = { ...current.totals };
          delete nextTotals[key as keyof typeof nextTotals];
          return {
            ...current,
            totals: Object.keys(nextTotals).length > 0 ? nextTotals : undefined,
          };
        }
        return current;
      });
    },
    [],
  );

  const setStoreName = useCallback(
    (value: string) => {
      setStoreNameState(value);
      clearFieldError("storeName");
      clearFieldError("form");
    },
    [clearFieldError],
  );

  const updateItem = useCallback(
    (index: number, field: keyof ReceiptItem, rawValue: string) => {
      const value =
        field === "quantity" || field === "amount"
          ? sanitizeNumericInput(rawValue)
          : rawValue;

      setItems((current) =>
        current.map((item, itemIndex) =>
          itemIndex === index ? { ...item, [field]: value } : item,
        ),
      );
      clearFieldError("items", index);
      clearFieldError("form");
    },
    [clearFieldError],
  );

  const updateTotal = useCallback(
    (field: keyof ReceiptTotals, rawValue: string) => {
      const value = sanitizeNumericInput(rawValue);
      setTotals((current) => ({ ...current, [field]: value }));
      clearFieldError("totals", field);
      clearFieldError("form");
    },
    [clearFieldError],
  );

  const addItem = useCallback(() => {
    setItems((current) => [...current, emptyReceiptItem()]);
  }, []);

  const removeItem = useCallback((index: number) => {
    setItems((current) => {
      const next = current.filter((_, itemIndex) => itemIndex !== index);
      return next.length > 0 ? next : [emptyReceiptItem()];
    });
    setErrors((current) => {
      if (!current.items) return current;
      const nextItems: Record<number, Partial<Record<keyof ReceiptItem, string>>> =
        {};
      Object.entries(current.items).forEach(([key, value]) => {
        const numericKey = Number(key);
        if (numericKey < index) nextItems[numericKey] = value;
        if (numericKey > index) nextItems[numericKey - 1] = value;
      });
      return {
        ...current,
        items: Object.keys(nextItems).length > 0 ? nextItems : undefined,
      };
    });
  }, []);

  const handleRowBlur = useCallback((index: number) => {
    setItems((current) => {
      const row = current[index];
      if (!row || !isRowFullyEmpty(row) || current.length <= 1) {
        return current;
      }
      return current.filter((_, itemIndex) => itemIndex !== index);
    });
  }, []);

  const validate = useCallback(() => {
    const result = validateReceiptForm(storeName, items, totals);
    setErrors(result.errors);
    setShowErrors(true);
    return result;
  }, [storeName, items, totals]);

  const getSavePayload = useCallback(() => {
    const result = validateReceiptForm(storeName, items, totals);
    setErrors(result.errors);
    setShowErrors(true);

    return {
      isValid: result.isValid,
      errors: result.errors,
      payload: {
        storeName: storeName.trim(),
        items: result.cleanedItems.map((item) => ({
          ...item,
          item: item.item.trim(),
          quantity: sanitizeNumericInput(item.quantity),
          amount: sanitizeNumericInput(item.amount),
        })),
        totals: {
          ...totals,
          subtotal: formatAmountInput(computeSubtotal(result.cleanedItems)),
          total: formatAmountInput(
            computeFinalTotal(computeSubtotal(result.cleanedItems), totals),
          ),
        },
      },
    };
  }, [storeName, items, totals]);

  const reset = useCallback(() => {
    setStoreNameState("");
    setItems([emptyReceiptItem()]);
    setTotals(emptyReceiptTotals());
    setErrors({});
    setShowErrors(false);
  }, []);

  const loadForm = useCallback(
    (data: {
      storeName: string;
      items: ReceiptItem[];
      totals: ReceiptTotals;
    }) => {
      setStoreNameState(data.storeName);
      setItems(data.items.length > 0 ? data.items : [emptyReceiptItem()]);
      setTotals(data.totals);
      setErrors({});
      setShowErrors(false);
    },
    [],
  );

  return {
    storeName,
    setStoreName,
    items,
    totals,
    subtotal,
    finalTotal,
    errors,
    showErrors,
    updateItem,
    updateTotal,
    addItem,
    removeItem,
    handleRowBlur,
    validate,
    getSavePayload,
    reset,
    loadForm,
    pruneEmptyRows: () => setItems((current) => pruneEmptyRows(current)),
  };
}

function isRowFullyEmpty(item: ReceiptItem): boolean {
  return (
    !item.item.trim() &&
    !item.amount.trim() &&
    (!item.quantity.trim() || item.quantity.trim() === "1")
  );
}
