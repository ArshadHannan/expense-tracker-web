"use client";

import { ChangeEvent, DragEvent, useRef, useState } from "react";

type ReceiptFile = {
  file: File;
  id: string;
  name: string;
  size: number;
  type: string;
};

const acceptedFileTypes = ["application/pdf", "image/jpeg", "image/png", "image/webp"];

export default function ReceiptImportModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [files, setFiles] = useState<ReceiptFile[]>([]);
  const [emailBody, setEmailBody] = useState("");
  const [extractError, setExtractError] = useState("");
  const [extractResponse, setExtractResponse] = useState<unknown>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function addFiles(fileList: FileList | File[]) {
    const nextFiles = Array.from(fileList)
      .filter((file) => acceptedFileTypes.includes(file.type))
      .map((file) => ({
        file,
        id: `${file.name}-${file.size}-${file.lastModified}`,
        name: file.name,
        size: file.size,
        type: file.type || "Unknown",
      }));

    setFiles((currentFiles) => {
      const currentIds = new Set(currentFiles.map((file) => file.id));
      const uniqueFiles = nextFiles.filter((file) => !currentIds.has(file.id));

      return [...currentFiles, ...uniqueFiles];
    });
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    addFiles(event.dataTransfer.files);
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    if (event.target.files) {
      addFiles(event.target.files);
    }
  }

  function removeFile(fileId: string) {
    setFiles((currentFiles) =>
      currentFiles.filter((file) => file.id !== fileId),
    );
  }

  function closeModal() {
    setIsOpen(false);
    setIsDragging(false);
  }

  async function importReceipts() {
    setIsUploading(true);
    setExtractError("");
    setExtractResponse(null);

    try {
      const formData = new FormData();

      for (const receiptFile of files) {
        formData.append("files", receiptFile.file, receiptFile.name);
      }

      formData.set("emailBody", emailBody);

      const response = await fetch("/api/receipts/extract", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Receipt extraction failed.");
      }

      setExtractResponse(data);
    } catch (error) {
      setExtractError(
        error instanceof Error ? error.message : "Receipt extraction failed.",
      );
    } finally {
      setIsUploading(false);
    }
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
                  Drag and drop receipts
                </p>
                <p className="mt-2 max-w-sm text-sm leading-6 text-text-secondary">
                  PDFs, screenshots, photos, and exported receipt images are
                  accepted.
                </p>
                <button
                  className="mt-5 h-10 rounded-[8px] bg-primary px-4 text-sm font-medium text-text-button transition hover:bg-primary-dark"
                  onClick={() => inputRef.current?.click()}
                  type="button"
                >
                  Choose files
                </button>
                <input
                  accept="application/pdf,image/jpeg,image/png,image/webp"
                  className="hidden"
                  multiple
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
                    Selected files
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

              {extractResponse ? (
                <div className="rounded-[8px] border border-border bg-secondary p-4">
                  <p className="mb-3 text-sm font-medium text-text-primary">
                    Backend response
                  </p>
                  <pre className="max-h-56 overflow-auto whitespace-pre-wrap text-xs leading-5 text-text-secondary">
                    {JSON.stringify(extractResponse, null, 2)}
                  </pre>
                </div>
              ) : null}
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-border px-6 py-5 sm:flex-row sm:justify-end">
              <button
                className="h-10 rounded-[8px] bg-primary px-4 text-sm font-medium text-text-button transition hover:bg-primary-dark"
                onClick={closeModal}
                type="button"
              >
                Cancel
              </button>
              <button
                className="h-10 rounded-[8px] bg-primary px-4 text-sm font-semibold text-text-button transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
                disabled={
                  isUploading ||
                  (files.length === 0 && emailBody.trim().length === 0)
                }
                onClick={importReceipts}
                type="button"
              >
                {isUploading ? "Importing..." : "Import receipts"}
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
