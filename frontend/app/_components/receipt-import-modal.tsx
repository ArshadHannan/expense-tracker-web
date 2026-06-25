"use client";

import { ChangeEvent, DragEvent, useRef, useState } from "react";
import { FileText, Upload } from "lucide-react";
import { toast } from "sonner";
import fakeExtractedReceipt from "@/fake-data/extracted-receipt.json";
import { useReceiptsRefresh } from "../_lib/receipts-refresh-context";
import { useReceiptImport } from "../_lib/receipt-import-context";
import {
  formatAmountInput,
  normalizeAmountInput,
  saveReceipt,
  type ReceiptItem,
  type ReceiptTotals,
} from "../_lib/receipt-form-utils";
import { useReceiptForm } from "../_lib/use-receipt-form";
import ReceiptDetailsForm from "./receipt-details-form";
import { Alert } from "./ui/alert";
import { Button } from "./ui/button";
import { Modal } from "./ui/modal";
import { Textarea } from "./ui/input";
import { Badge } from "./ui/badge";

type ReceiptFile = {
  file: File;
  id: string;
  name: string;
  size: number;
  type: string;
};

type ExtractedReceipt = {
  items: ReceiptItem[];
  storeName: string;
  totals: ReceiptTotals;
};

const acceptedFileTypes = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
];
const defaultExtractedTotals = fakeExtractedReceipt.totals;

export default function ReceiptImportModal() {
  const { isOpen, close: closeImport } = useReceiptImport();
  const { refreshReceipts } = useReceiptsRefresh();
  const form = useReceiptForm();
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [files, setFiles] = useState<ReceiptFile[]>([]);
  const [emailBody, setEmailBody] = useState("");
  const [extractError, setExtractError] = useState("");
  const [hasExtractedData, setHasExtractedData] = useState(false);
  const shouldRefreshOnCloseRef = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function addFiles(fileList: FileList | File[]) {
    const nextFiles: ReceiptFile[] = Array.from(fileList)
      .filter((file) => acceptedFileTypes.includes(file.type))
      .slice(0, 1)
      .map((file) => ({
        file,
        id: `${file.name}-${file.size}-${file.lastModified}`,
        name: file.name,
        size: file.size,
        type: file.type || "Unknown",
      }));

    setFiles(nextFiles);
    return nextFiles;
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    const addedFiles = addFiles(event.dataTransfer.files);

    if (addedFiles.length > 0) {
      void importReceipts(addedFiles);
    }
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    if (event.target.files) {
      const addedFiles = addFiles(event.target.files);

      if (addedFiles.length > 0) {
        void importReceipts(addedFiles);
      }
    }
  }

  function removeFile(fileId: string) {
    setFiles((currentFiles) =>
      currentFiles.filter((file) => file.id !== fileId),
    );
    form.reset();
    setHasExtractedData(false);
  }

  function resetForm() {
    setFiles([]);
    setEmailBody("");
    setExtractError("");
    form.reset();
    setHasExtractedData(false);
    setIsDragging(false);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  function closeModal() {
    if (shouldRefreshOnCloseRef.current) {
      refreshReceipts();
      shouldRefreshOnCloseRef.current = false;
    }

    resetForm();
    closeImport();
  }

  async function importReceipts(receiptFiles = files) {
    setIsUploading(true);
    setExtractError("");
    form.reset();
    setHasExtractedData(false);

    try {
      const formData = new FormData();

      for (const receiptFile of receiptFiles) {
        formData.append("files", receiptFile.file, receiptFile.name);
      }

      formData.set("emailBody", emailBody);

      const response = await fetch("/api/receipts", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Receipt extraction failed.");
      }

      const extractedReceipt =
        "extractedReceipt" in data
          ? (data.extractedReceipt as ExtractedReceipt)
          : fakeExtractedReceipt;

      const normalizedReceipt = normalizeExtractedReceipt(extractedReceipt);

      form.loadForm({
        storeName: normalizedReceipt.storeName,
        items: normalizedReceipt.items,
        totals: normalizedReceipt.totals,
      });
      setHasExtractedData(true);
      toast.success("Receipt imported. Review the extracted details below.");
    } catch (error) {
      setExtractError(
        error instanceof Error ? error.message : "Receipt extraction failed.",
      );
    } finally {
      setIsUploading(false);
    }
  }

  async function handleSaveReceipt() {
    const { isValid, errors, payload } = form.getSavePayload();

    if (!isValid) {
      setExtractError(
        errors.form ?? "Fix the highlighted fields before saving.",
      );
      return;
    }

    setIsSaving(true);
    setExtractError("");

    try {
      await saveReceipt(payload);
      shouldRefreshOnCloseRef.current = true;
      toast.success("Receipt saved");
      closeModal();
    } catch (error) {
      setExtractError(
        error instanceof Error ? error.message : "Unable to save receipt.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Modal
      description={
        hasExtractedData
          ? "Review and edit the extracted values before saving."
          : "Upload a receipt image or PDF to extract expense details."
      }
      eyebrow="Receipt import"
      footer={
        <>
          <Button onClick={closeModal} variant="ghost">
            {hasExtractedData ? "Close" : "Cancel"}
          </Button>
          <Button
            disabled={
              isUploading ||
              isSaving ||
              (!hasExtractedData &&
                files.length === 0 &&
                emailBody.trim().length === 0)
            }
            loading={isUploading || isSaving}
            onClick={() =>
              hasExtractedData ? void handleSaveReceipt() : void importReceipts()
            }
          >
            {isUploading
              ? "Importing..."
              : isSaving
                ? "Saving..."
                : hasExtractedData
                  ? "Save receipt"
                  : "Import receipt"}
          </Button>
        </>
      }
      onClose={closeModal}
      open={isOpen}
      size="lg"
      title={hasExtractedData ? "Review extracted receipt" : "Import receipt"}
    >
      <div className="space-y-5">
        {!hasExtractedData ? (
          <>
            <div
              className={`flex min-h-44 flex-col items-center justify-center rounded-[var(--radius-lg)] border-2 border-dashed px-6 py-10 text-center transition-all duration-200 ${
                isDragging
                  ? "border-primary bg-primary-soft/50"
                  : "border-border bg-surface-muted/30 hover:border-primary/30 hover:bg-surface-muted/50"
              }`}
              onDragLeave={() => setIsDragging(false)}
              onDragOver={(event) => {
                event.preventDefault();
                setIsDragging(true);
              }}
              onDrop={handleDrop}
            >
              <div className="flex size-12 items-center justify-center rounded-full bg-primary-soft text-primary">
                <Upload className="size-5" strokeWidth={1.75} />
              </div>
              <p className="mt-4 text-sm font-medium text-text-primary">
                Drag and drop a receipt
              </p>
              <p className="mt-1.5 max-w-xs text-xs leading-relaxed text-text-tertiary">
                PDF, JPEG, PNG, or WebP — one file at a time
              </p>
              <Button
                className="mt-5"
                onClick={() => inputRef.current?.click()}
                size="sm"
                variant="outline"
              >
                Choose file
              </Button>
              <input
                accept="application/pdf,image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleFileChange}
                ref={inputRef}
                type="file"
              />
            </div>

            <Textarea
              hint="Optional — paste email text if you don't have a file."
              label="Receipt email body (optional)"
              onChange={(event) => setEmailBody(event.target.value)}
              placeholder="Paste receipt details from an email here."
              value={emailBody}
            />
          </>
        ) : null}

        {files.length > 0 ? (
          <div className="overflow-hidden rounded-[var(--radius-lg)] border border-border">
            <div className="border-b border-border bg-surface-muted/50 px-4 py-2.5">
              <p className="text-xs font-medium uppercase tracking-wider text-text-tertiary">
                Selected file
              </p>
            </div>
            {files.map((file) => (
              <div
                className="flex items-center justify-between gap-4 px-4 py-3"
                key={file.id}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-primary-soft text-primary">
                    <FileText className="size-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{file.name}</p>
                    <p className="text-xs text-text-tertiary">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => removeFile(file.id)}
                  size="sm"
                  variant="ghost"
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
        ) : null}

        {extractError ? <Alert variant="error">{extractError}</Alert> : null}

        {hasExtractedData ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-text-primary">
                Extracted details
              </p>
              <Badge variant="primary">Editable</Badge>
            </div>

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
          </div>
        ) : null}
      </div>
    </Modal>
  );
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function normalizeExtractedReceipt(receipt: ExtractedReceipt): ExtractedReceipt {
  const fallbackReceipt = fakeExtractedReceipt;

  return {
    storeName: receipt.storeName ?? fallbackReceipt.storeName,
    items: (receipt.items ?? fallbackReceipt.items).map((item) => ({
      ...item,
      amount: normalizeAmountInput(item.amount),
      quantity: normalizeAmountInput(item.quantity),
    })),
    totals: {
      ...defaultExtractedTotals,
      ...(receipt.totals ?? fallbackReceipt.totals),
      discount: normalizeAmountInput(
        receipt.totals?.discount ?? fallbackReceipt.totals.discount,
      ),
      tax: normalizeAmountInput(
        receipt.totals?.tax ?? fallbackReceipt.totals.tax,
      ),
      serviceCharge: normalizeAmountInput(
        receipt.totals?.serviceCharge ?? fallbackReceipt.totals.serviceCharge,
      ),
      deliveryFee: normalizeAmountInput(
        receipt.totals?.deliveryFee ?? fallbackReceipt.totals.deliveryFee,
      ),
      subtotal: formatAmountInput(
        (receipt.items ?? fallbackReceipt.items).reduce(
          (total, item) =>
            total +
            Number(item.amount.replace(/,/g, "").replace(/[^\d.-]/g, "") || 0),
          0,
        ),
      ),
      total: "",
    },
  };
}
