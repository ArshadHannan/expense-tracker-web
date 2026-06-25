"use client";

import { ChangeEvent, DragEvent, useMemo, useRef, useState } from "react";
import { FileText, Upload } from "lucide-react";
import { toast } from "sonner";
import fakeExtractedReceipt from "@/fake-data/extracted-receipt.json";
import { useReceiptsRefresh } from "../_lib/receipts-refresh-context";
import { useReceiptImport } from "../_lib/receipt-import-context";
import { Alert } from "./ui/alert";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
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

type ExtractedReceiptItem = {
  amount: string;
  item: string;
  quantity: string;
};

type ExtractedReceiptTotals = typeof fakeExtractedReceipt.totals;
type ExtractedReceipt = {
  items: ExtractedReceiptItem[];
  storeName: string;
  totals: ExtractedReceiptTotals;
};

const acceptedFileTypes = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
const defaultExtractedTotals = fakeExtractedReceipt.totals;
const editableTotalFields = ["discount", "tax", "serviceCharge", "deliveryFee"] as const;

export default function ReceiptImportModal() {
  const { isOpen, close: closeImport } = useReceiptImport();
  const { refreshReceipts } = useReceiptsRefresh();
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [files, setFiles] = useState<ReceiptFile[]>([]);
  const [emailBody, setEmailBody] = useState("");
  const [extractError, setExtractError] = useState("");
  const [storeName, setStoreName] = useState("");
  const [extractedItems, setExtractedItems] = useState<ExtractedReceiptItem[]>([]);
  const [extractedTotals, setExtractedTotals] =
    useState<ExtractedReceiptTotals | null>(null);
  const shouldRefreshOnCloseRef = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const subtotal = useMemo(
    () =>
      extractedItems.reduce(
        (total, item) => total + parseAmountInput(item.amount),
        0,
      ),
    [extractedItems],
  );

  const finalTotal = useMemo(() => {
    if (!extractedTotals) return 0;

    return (
      subtotal -
      parseAmountInput(extractedTotals.discount) +
      parseAmountInput(extractedTotals.tax) +
      parseAmountInput(extractedTotals.serviceCharge) +
      parseAmountInput(extractedTotals.deliveryFee)
    );
  }, [extractedTotals, subtotal]);

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
    setExtractedItems([]);
    setExtractedTotals(null);
  }

  function resetForm() {
    setFiles([]);
    setEmailBody("");
    setExtractError("");
    setStoreName("");
    setExtractedItems([]);
    setExtractedTotals(null);
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
    setExtractedItems([]);
    setExtractedTotals(null);

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

      setStoreName(normalizedReceipt.storeName);
      setExtractedItems(normalizedReceipt.items);
      setExtractedTotals(normalizedReceipt.totals);
      toast.success("Receipt imported. Review the extracted details below.");
    } catch (error) {
      setExtractError(
        error instanceof Error ? error.message : "Receipt extraction failed.",
      );
    } finally {
      setIsUploading(false);
    }
  }

  async function saveReceipt() {
    if (!extractedTotals) return;

    setIsSaving(true);
    setExtractError("");

    try {
      const response = await fetch("/api/receipts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeName,
          items: extractedItems,
          totals: {
            ...extractedTotals,
            subtotal: formatAmountInput(subtotal),
            total: formatAmountInput(finalTotal),
          },
        }),
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.error ?? "Unable to save receipt.");
      }

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

  function updateExtractedItem(
    index: number,
    field: keyof ExtractedReceiptItem,
    value: string,
  ) {
    setExtractedItems((currentItems) =>
      currentItems.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item,
      ),
    );
  }

  function updateExtractedTotal(
    field: keyof ExtractedReceiptTotals,
    value: string,
  ) {
    setExtractedTotals((currentTotals) =>
      currentTotals ? { ...currentTotals, [field]: value } : currentTotals,
    );
  }

  return (
    <Modal
      description={
        extractedTotals
          ? "Review and edit the extracted values before saving."
          : "Upload a receipt image or PDF to extract expense details."
      }
      eyebrow="Receipt import"
      footer={
        <>
          <Button onClick={closeModal} variant="ghost">
            {extractedTotals ? "Close" : "Cancel"}
          </Button>
          <Button
            disabled={
              isUploading ||
              isSaving ||
              (!extractedTotals &&
                files.length === 0 &&
                emailBody.trim().length === 0)
            }
            loading={isUploading || isSaving}
            onClick={() =>
              extractedTotals ? void saveReceipt() : void importReceipts()
            }
          >
            {isUploading
              ? "Importing..."
              : isSaving
                ? "Saving..."
                : extractedTotals
                  ? "Save receipt"
                  : "Import receipt"}
          </Button>
        </>
      }
      onClose={closeModal}
      open={isOpen}
      size="lg"
      title={extractedTotals ? "Review extracted receipt" : "Add receipt"}
    >
      <div className="space-y-5">
        {!extractedTotals ? (
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
              label="Receipt email body"
              onChange={(event) => setEmailBody(event.target.value)}
              placeholder="Paste receipt details from an email here (optional)."
              value={emailBody}
            />
          </>
        ) : null}

        {files.length > 0 ? (
          <div className="rounded-[var(--radius-lg)] border border-border overflow-hidden">
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

        {extractedTotals ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-text-primary">
                Extracted details
              </p>
              <Badge variant="primary">Editable</Badge>
            </div>

            <Input
              label="Store name"
              onChange={(event) => setStoreName(event.target.value)}
              value={storeName}
            />

            <div className="overflow-hidden rounded-[var(--radius-lg)] border border-border">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[480px] text-sm">
                  <thead>
                    <tr className="border-b border-border bg-surface-muted/50">
                      <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-text-tertiary">
                        Item
                      </th>
                      <th className="w-24 px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-text-tertiary">
                        Qty
                      </th>
                      <th className="w-32 px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-text-tertiary">
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {extractedItems.map((item, index) => (
                      <tr key={index}>
                        <td className="px-3 py-2">
                          <input
                            className="h-8 w-full rounded-[var(--radius-sm)] border border-border bg-surface-muted px-2.5 text-sm focus-ring focus:border-primary"
                            onChange={(event) =>
                              updateExtractedItem(index, "item", event.target.value)
                            }
                            value={item.item}
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            className="h-8 w-full rounded-[var(--radius-sm)] border border-border bg-surface-muted px-2.5 text-sm focus-ring focus:border-primary"
                            onChange={(event) =>
                              updateExtractedItem(index, "quantity", event.target.value)
                            }
                            value={item.quantity}
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            className="h-8 w-full rounded-[var(--radius-sm)] border border-border bg-surface-muted px-2.5 text-sm focus-ring focus:border-primary"
                            onChange={(event) =>
                              updateExtractedItem(index, "amount", event.target.value)
                            }
                            value={item.amount}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="grid gap-3 border-t border-border bg-surface-muted/20 p-4 sm:grid-cols-2">
                <Input
                  label="Subtotal"
                  readOnly
                  value={formatAmountInput(subtotal)}
                />

                {editableTotalFields.map((field) => (
                  <Input
                    key={field}
                    label={formatTotalLabel(field)}
                    onChange={(event) =>
                      updateExtractedTotal(
                        field as keyof ExtractedReceiptTotals,
                        event.target.value,
                      )
                    }
                    value={extractedTotals[field]}
                  />
                ))}

                <div className="sm:col-span-2">
                  <Input
                    className="font-semibold"
                    label="Total"
                    readOnly
                    value={formatAmountInput(finalTotal)}
                  />
                </div>
              </div>
            </div>
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

function formatTotalLabel(label: string) {
  return label.replace(/([A-Z])/g, " $1").replace(/^./, (character) =>
    character.toUpperCase(),
  );
}

function parseAmountInput(value: string) {
  const numericValue = Number(value.replace(/,/g, "").replace(/[^\d.-]/g, ""));
  return Number.isFinite(numericValue) ? numericValue : 0;
}

function formatAmountInput(value: number) {
  return value.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

function normalizeAmountInput(value: string) {
  return value.replace(/\s*rs$/i, "").replace(/[^\d.,-]/g, "").trim();
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
      tax: normalizeAmountInput(receipt.totals?.tax ?? fallbackReceipt.totals.tax),
      serviceCharge: normalizeAmountInput(
        receipt.totals?.serviceCharge ?? fallbackReceipt.totals.serviceCharge,
      ),
      deliveryFee: normalizeAmountInput(
        receipt.totals?.deliveryFee ?? fallbackReceipt.totals.deliveryFee,
      ),
      subtotal: formatAmountInput(
        (receipt.items ?? fallbackReceipt.items).reduce(
          (total, item) => total + parseAmountInput(item.amount),
          0,
        ),
      ),
      total: "",
    },
  };
}
