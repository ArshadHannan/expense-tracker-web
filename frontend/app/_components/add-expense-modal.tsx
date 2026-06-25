"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useAddExpense } from "../_lib/add-expense-context";
import { saveReceipt } from "../_lib/receipt-form-utils";
import { useReceiptsRefresh } from "../_lib/receipts-refresh-context";
import { useReceiptForm } from "../_lib/use-receipt-form";
import ReceiptDetailsForm from "./receipt-details-form";
import { Alert } from "./ui/alert";
import { Button } from "./ui/button";
import { Modal } from "./ui/modal";

export default function AddExpenseModal() {
  const { isOpen, close } = useAddExpense();
  const { refreshReceipts } = useReceiptsRefresh();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const form = useReceiptForm();

  function closeModal() {
    form.reset();
    setError("");
    close();
  }

  async function handleSave() {
    const { isValid, errors, payload } = form.getSavePayload();

    if (!isValid) {
      setError(errors.form ?? "Fix the highlighted fields before saving.");
      return;
    }

    setIsSaving(true);
    setError("");

    try {
      await saveReceipt(payload);
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
          errors={form.errors}
          finalTotal={form.finalTotal}
          items={form.items}
          onAddItem={form.addItem}
          onRemoveItem={form.removeItem}
          onRowBlur={form.handleRowBlur}
          onStoreNameChange={form.setStoreName}
          onUpdateItem={form.updateItem}
          onUpdateTotal={form.updateTotal}
          showErrors={form.showErrors}
          storeName={form.storeName}
          subtotal={form.subtotal}
          totals={form.totals}
        />
      </div>
    </Modal>
  );
}
