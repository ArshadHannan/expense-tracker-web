"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useAddExpense } from "../_lib/add-expense-context";
import {
  computeFinalTotal,
  computeSubtotal,
  emptyReceiptItem,
  emptyReceiptTotals,
  formatAmountInput,
  parseAmountInput,
  saveReceipt,
  type ReceiptItem,
  type ReceiptTotals,
} from "../_lib/receipt-form-utils";
import { useReceiptsRefresh } from "../_lib/receipts-refresh-context";
import ReceiptDetailsForm from "./receipt-details-form";
import { Alert } from "./ui/alert";
import { Button } from "./ui/button";
import { Modal } from "./ui/modal";

export default function AddExpenseModal() {
  const { isOpen, close } = useAddExpense();
  const { refreshReceipts } = useReceiptsRefresh();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [storeName, setStoreName] = useState("");
  const [items, setItems] = useState<ReceiptItem[]>([emptyReceiptItem()]);
  const [totals, setTotals] = useState<ReceiptTotals>(emptyReceiptTotals());

  const subtotal = useMemo(() => computeSubtotal(items), [items]);
  const finalTotal = useMemo(
    () => computeFinalTotal(subtotal, totals),
    [subtotal, totals],
  );

  function resetForm() {
    setStoreName("");
    setItems([emptyReceiptItem()]);
    setTotals(emptyReceiptTotals());
    setError("");
  }

  function closeModal() {
    resetForm();
    close();
  }

  function updateItem(
    index: number,
    field: keyof ReceiptItem,
    value: string,
  ) {
    setItems((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item,
      ),
    );
  }

  function addItem() {
    setItems((current) => [...current, emptyReceiptItem()]);
  }

  function removeItem(index: number) {
    setItems((current) =>
      current.length === 1 ? current : current.filter((_, i) => i !== index),
    );
  }

  function updateTotal(field: keyof ReceiptTotals, value: string) {
    setTotals((current) => ({ ...current, [field]: value }));
  }

  function validateForm() {
    if (!storeName.trim()) {
      return "Store name is required.";
    }

    const hasLineItem = items.some(
      (item) => item.item.trim() || parseAmountInput(item.amount) > 0,
    );

    if (!hasLineItem) {
      return "Add at least one line item with a name or amount.";
    }

    return null;
  }

  async function handleSave() {
    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSaving(true);
    setError("");

    try {
      await saveReceipt({
        storeName: storeName.trim(),
        items: items.filter(
          (item) => item.item.trim() || parseAmountInput(item.amount) > 0,
        ),
        totals: {
          ...totals,
          subtotal: formatAmountInput(subtotal),
          total: formatAmountInput(finalTotal),
        },
      });

      toast.success("Expense saved");
      refreshReceipts();
      closeModal();
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : "Unable to save expense.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Modal
      description="Fill in the expense details manually — no receipt upload needed."
      eyebrow="Manual entry"
      footer={
        <>
          <Button onClick={closeModal} variant="ghost">
            Cancel
          </Button>
          <Button loading={isSaving} onClick={() => void handleSave()}>
            Save expense
          </Button>
        </>
      }
      onClose={closeModal}
      open={isOpen}
      size="lg"
      title="Add expense"
    >
      <div className="space-y-4">
        {error ? <Alert variant="error">{error}</Alert> : null}

        <ReceiptDetailsForm
          finalTotal={finalTotal}
          items={items}
          onAddItem={addItem}
          onRemoveItem={removeItem}
          onStoreNameChange={setStoreName}
          onUpdateItem={updateItem}
          onUpdateTotal={updateTotal}
          storeName={storeName}
          subtotal={subtotal}
          totals={totals}
        />
      </div>
    </Modal>
  );
}
