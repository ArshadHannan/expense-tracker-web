"use client";

import { useState } from "react";
import { ArrowLeft, Mail, Trash2 } from "lucide-react";
import {
  usePendingReceipts,
  type PendingReceipt,
} from "../_lib/pending-receipts-context";
import { useReceiptsRefresh } from "../_lib/receipts-refresh-context";
import { useReceiptForm } from "../_lib/use-receipt-form";
import { saveReceipt } from "../_lib/receipt-form-utils";
import ReceiptDetailsForm from "./receipt-details-form";
import { Alert } from "./ui/alert";
import { Button } from "./ui/button";
import { Modal } from "./ui/modal";

export default function PendingReceiptsModal() {
  const { pendingReceipts, isOpen, close, dismiss } = usePendingReceipts();
  const { refreshReceipts } = useReceiptsRefresh();
  const form = useReceiptForm();

  const [selected, setSelected] = useState<PendingReceipt | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  function handleSelect(receipt: PendingReceipt) {
    form.loadForm({
      storeName: receipt.extracted_data.storeName,
      items: receipt.extracted_data.items,
      totals: receipt.extracted_data.totals,
    });
    setSaveError(null);
    setSelected(receipt);
  }

  function handleBack() {
    setSelected(null);
    setSaveError(null);
    form.reset();
  }

  async function handleSave() {
    if (!selected) return;
    const { isValid, payload } = form.getSavePayload();
    if (!isValid) return;

    try {
      setIsSaving(true);
      setSaveError(null);
      await saveReceipt(payload);
      await dismiss(selected.id);
      refreshReceipts();
      setSelected(null);
      form.reset();
      if (pendingReceipts.length <= 1) close();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to save receipt.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDismiss(receipt: PendingReceipt) {
    await dismiss(receipt.id);
    if (selected?.id === receipt.id) {
      setSelected(null);
      form.reset();
    }
    if (pendingReceipts.length <= 1) close();
  }

  function handleClose() {
    setSelected(null);
    setSaveError(null);
    form.reset();
    close();
  }

  if (selected) {
    return (
      <Modal
        description={`From ${selected.from_email}`}
        eyebrow="Email receipt"
        footer={
          <>
            <Button
              onClick={() => handleDismiss(selected)}
              size="md"
              variant="destructive"
            >
              Dismiss
            </Button>
            <Button onClick={handleBack} size="md" variant="ghost">
              <ArrowLeft className="mr-1.5 size-3.5" />
              Back
            </Button>
            <Button loading={isSaving} onClick={handleSave} size="md">
              Save receipt
            </Button>
          </>
        }
        onClose={handleClose}
        open={isOpen}
        size="lg"
        title={selected.subject || "Receipt"}
      >
        {saveError ? (
          <Alert className="mb-4" variant="error">
            {saveError}
          </Alert>
        ) : null}
        <ReceiptDetailsForm
          errors={form.errors}
          finalTotal={form.finalTotal}
          items={form.items}
          onAddItem={form.addItem}
          onReceiptDateChange={form.setReceiptDate}
          onRemoveItem={form.removeItem}
          onRowBlur={form.handleRowBlur}
          onStoreNameChange={form.setStoreName}
          onUpdateItem={form.updateItem}
          onUpdateTotal={form.updateTotal}
          receiptDate={form.receiptDate}
          showErrors={form.showErrors}
          storeName={form.storeName}
          subtotal={form.subtotal}
          totals={form.totals}
        />
      </Modal>
    );
  }

  return (
    <Modal
      description={
        pendingReceipts.length > 0
          ? `${pendingReceipts.length} receipt${pendingReceipts.length !== 1 ? "s" : ""} received by email waiting for review.`
          : undefined
      }
      eyebrow="Email receipts"
      onClose={handleClose}
      open={isOpen}
      size="sm"
      title="Pending review"
    >
      {pendingReceipts.length === 0 ? (
        <p className="py-8 text-center text-sm text-text-tertiary">
          No pending receipts.
        </p>
      ) : (
        <div className="space-y-2">
          {pendingReceipts.map((receipt) => (
            <div
              className="flex items-center gap-3 rounded-[var(--radius-md)] border border-border p-3 transition hover:border-primary/30 hover:bg-surface-muted/50"
              key={receipt.id}
            >
              <div className="grid size-8 shrink-0 place-items-center rounded-full bg-primary-soft text-primary">
                <Mail className="size-4" />
              </div>

              <button
                className="min-w-0 flex-1 text-left"
                onClick={() => handleSelect(receipt)}
                type="button"
              >
                <p className="truncate text-sm font-medium">
                  {receipt.subject || "No subject"}
                </p>
                <p className="truncate text-xs text-text-tertiary">
                  {receipt.from_email} &middot;{" "}
                  {new Date(receipt.created_at).toLocaleDateString()}
                </p>
              </button>

              <button
                aria-label="Dismiss"
                className="grid size-7 place-items-center rounded-[var(--radius-sm)] text-text-tertiary transition hover:bg-destructive-soft hover:text-destructive"
                onClick={() => handleDismiss(receipt)}
                type="button"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}
