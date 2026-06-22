"use client";

import { ChangeEvent, DragEvent, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import fakeExtractedReceipt from "@/fake-data/extracted-receipt.json";
import { useReceiptsRefresh } from "../_lib/receipts-refresh-context";

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
  totals: ExtractedReceiptTotals;
};

const acceptedFileTypes = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
const defaultExtractedTotals = fakeExtractedReceipt.totals;
const editableTotalFields = ["discount", "tax", "serviceCharge", "deliveryFee"] as const;

export default function ReceiptImportModal() {
  const { refreshReceipts } = useReceiptsRefresh();
  const [isOpen, setIsOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [files, setFiles] = useState<ReceiptFile[]>([]);
  const [emailBody, setEmailBody] = useState("");
  const [extractError, setExtractError] = useState("");
  const [extractedItems, setExtractedItems] = useState<ExtractedReceiptItem[]>(
    [],
  );
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
    if (!extractedTotals) {
      return 0;
    }

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
    setIsOpen(false);
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
    if (!extractedTotals) {
      return;
    }

    setIsSaving(true);
    setExtractError("");

    try {
      const response = await fetch("/api/receipts", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
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
    <>
      <button
        className="h-10 rounded-[8px] bg-primary px-4 text-sm font-medium text-text-button transition hover:bg-primary-dark"
        onClick={() => setIsOpen(true)}
        type="button"
      >
        Export
      </button>

      {isOpen ? (
        <div
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-secondary/55 px-4 py-6 backdrop-blur-sm"
          role="dialog"
        >
          <div className="max-h-[calc(100vh-3rem)] w-full max-w-2xl overflow-y-auto rounded-[8px] border border-border bg-surface shadow-[0_28px_90px_rgba(16,16,16,0.24)]">
            <div className="flex items-start justify-between gap-4 border-b border-border px-6 py-5">
              <div>
                <p className="text-sm font-medium text-primary">
                  Receipt import
                </p>
                <h2 className="mt-1 text-2xl font-semibold text-text-primary">
                  Add receipts
                </h2>
              </div>
              <button
                aria-label="Close receipt import"
                className="grid size-9 place-items-center rounded-[8px] bg-primary text-lg leading-none text-text-button transition hover:bg-primary-dark"
                onClick={closeModal}
                type="button"
              >
                x
              </button>
            </div>

            <div className="space-y-5 px-6 py-5">
              <div
                className={`flex min-h-48 flex-col items-center justify-center rounded-[8px] border border-dashed px-6 py-8 text-center transition ${
                  isDragging
                    ? "border-primary bg-primary-soft"
                    : "border-border bg-surface-muted"
                }`}
                onDragLeave={() => setIsDragging(false)}
                onDragOver={(event) => {
                  event.preventDefault();
                  setIsDragging(true);
                }}
                onDrop={handleDrop}
              >
                <div className="grid size-12 place-items-center rounded-full bg-primary text-lg font-semibold text-text-button">
                  +
                </div>
                <p className="mt-4 text-base font-semibold text-text-primary">
                  Drag and drop a receipt
                </p>
                <p className="mt-2 max-w-sm text-sm leading-6 text-text-secondary">
                  One PDF, screenshot, photo, or exported receipt image is
                  accepted.
                </p>
                <button
                  className="mt-5 h-10 rounded-[8px] bg-primary px-4 text-sm font-medium text-text-button transition hover:bg-primary-dark"
                  onClick={() => inputRef.current?.click()}
                  type="button"
                >
                  Choose file
                </button>
                <input
                  accept="application/pdf,image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleFileChange}
                  ref={inputRef}
                  type="file"
                />
              </div>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-text-primary">
                  Receipt email body
                </span>
                <textarea
                  className="min-h-32 w-full resize-y rounded-[8px] border border-border bg-secondary px-4 py-3 text-sm leading-6 text-text-primary outline-none transition placeholder:text-text-secondary focus:border-primary focus:ring-4 focus:ring-primary/15"
                  onChange={(event) => setEmailBody(event.target.value)}
                  placeholder="Paste receipt details from an email here."
                  value={emailBody}
                />
              </label>

              {files.length > 0 ? (
                <div className="rounded-[8px] border border-border">
                  <div className="border-b border-border px-4 py-3 text-sm font-medium">
                    Selected file
                  </div>
                  <div className="divide-y divide-border">
                    {files.map((file) => (
                      <div
                        className="flex items-center justify-between gap-4 px-4 py-3 text-sm"
                        key={file.id}
                      >
                        <div className="min-w-0">
                          <p className="truncate font-medium text-text-primary">
                            {file.name}
                          </p>
                          <p className="text-xs text-text-secondary">
                            {formatFileSize(file.size)}
                          </p>
                        </div>
                        <button
                          className="rounded-[8px] bg-primary px-3 py-1.5 text-xs font-medium text-text-button transition hover:bg-primary-dark"
                          onClick={() => removeFile(file.id)}
                          type="button"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {extractError ? (
                <div className="rounded-[8px] border border-red-400/30 bg-red-950/30 p-4 text-sm leading-6 text-red-200">
                  {extractError}
                </div>
              ) : null}

              {extractedTotals ? (
                <div className="rounded-[8px] border border-border">
                  <div className="border-b border-border px-4 py-3">
                    <h3 className="text-sm font-semibold text-text-primary">
                      Extracted receipt details
                    </h3>
                    <p className="mt-1 text-xs text-text-secondary">
                      These values are editable before you save the receipt.
                    </p>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[520px] text-sm">
                      <thead>
                        <tr className="border-b border-border bg-secondary">
                          <th className="px-4 py-3 text-left font-medium text-text-secondary">
                            Item
                          </th>
                          <th className="w-32 px-4 py-3 text-left font-medium text-text-secondary">
                            Quantity
                          </th>
                          <th className="w-40 px-4 py-3 text-left font-medium text-text-secondary">
                            Amount
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {extractedItems.map((item, index) => (
                          <tr className="border-b border-border" key={index}>
                            <td className="px-4 py-3">
                              <input
                                className="h-10 w-full rounded-[8px] border border-border bg-secondary px-3 text-sm text-text-primary outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/15"
                                onChange={(event) =>
                                  updateExtractedItem(
                                    index,
                                    "item",
                                    event.target.value,
                                  )
                                }
                                value={item.item}
                              />
                            </td>
                            <td className="px-4 py-3">
                              <input
                                className="h-10 w-full rounded-[8px] border border-border bg-secondary px-3 text-sm text-text-primary outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/15"
                                onChange={(event) =>
                                  updateExtractedItem(
                                    index,
                                    "quantity",
                                    event.target.value,
                                  )
                                }
                                value={item.quantity}
                              />
                            </td>
                            <td className="px-4 py-3">
                              <input
                                className="h-10 w-full rounded-[8px] border border-border bg-secondary px-3 text-sm text-text-primary outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/15"
                                onChange={(event) =>
                                  updateExtractedItem(
                                    index,
                                    "amount",
                                    event.target.value,
                                  )
                                }
                                value={item.amount}
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="grid gap-3 border-t border-border p-4 sm:grid-cols-2">
                    <label className="block">
                      <span className="mb-2 block text-xs font-medium uppercase tracking-wide text-text-secondary">
                        Subtotal
                      </span>
                      <input
                        className="h-10 w-full rounded-[8px] border border-border bg-surface-muted px-3 text-sm text-text-primary outline-none"
                        readOnly
                        value={formatAmountInput(subtotal)}
                      />
                    </label>

                    {editableTotalFields.map((field) => (
                      <label className="block" key={field}>
                        <span className="mb-2 block text-xs font-medium uppercase tracking-wide text-text-secondary">
                          {formatTotalLabel(field)}
                        </span>
                        <input
                          className="h-10 w-full rounded-[8px] border border-border bg-secondary px-3 text-sm text-text-primary outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/15"
                          onChange={(event) =>
                            updateExtractedTotal(
                              field as keyof ExtractedReceiptTotals,
                              event.target.value,
                            )
                          }
                          value={extractedTotals[field]}
                        />
                      </label>
                    ))}

                    <label className="block sm:col-span-2">
                      <span className="mb-2 block text-xs font-medium uppercase tracking-wide text-text-secondary">
                        Total
                      </span>
                      <input
                        className="h-10 w-full rounded-[8px] border border-border bg-surface-muted px-3 text-sm font-semibold text-text-primary outline-none"
                        readOnly
                        value={formatAmountInput(finalTotal)}
                      />
                    </label>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-border px-6 py-5 sm:flex-row sm:justify-end">
              <button
                className="h-10 rounded-[8px] bg-primary px-4 text-sm font-medium text-text-button transition hover:bg-primary-dark"
                onClick={closeModal}
                type="button"
              >
                {extractedTotals ? "Close" : "Cancel"}
              </button>
              <button
                className="h-10 rounded-[8px] bg-primary px-4 text-sm font-semibold text-text-button transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
                disabled={
                  isUploading ||
                  isSaving ||
                  (!extractedTotals &&
                    files.length === 0 &&
                    emailBody.trim().length === 0)
                }
                onClick={() =>
                  extractedTotals ? void saveReceipt() : void importReceipts()
                }
                type="button"
              >
                {isUploading ? "Importing..." : null}
                {isSaving ? "Saving..." : null}
                {!isUploading && !isSaving && extractedTotals ? "Done" : null}
                {!isUploading && !isSaving && !extractedTotals
                  ? "Import receipt"
                  : null}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

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
  return value.toLocaleString("en-US", {
    maximumFractionDigits: 2,
  });
}

function normalizeAmountInput(value: string) {
  return value.replace(/\s*rs$/i, "").replace(/[^\d.,-]/g, "").trim();
}

function normalizeExtractedReceipt(receipt: ExtractedReceipt): ExtractedReceipt {
  const fallbackReceipt = fakeExtractedReceipt;

  return {
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
