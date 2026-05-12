"use client";

import { useEffect, useMemo, useState } from "react";

type ReceiptFile = {
  filename: string;
  content_type: string;
  size_bytes: number;
};

type Receipt = {
  id: string;
  created_at: string;
  userEmail: string;
  fileCount: number;
  files: ReceiptFile[];
  emailBody: {
    received: boolean;
    characterCount: number;
    preview: string;
  };
};

export default function ReceiptsTable({
  userEmail,
}: {
  userEmail: string;
}) {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReceipts = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(
          `/api/receipts?userEmail=${encodeURIComponent(userEmail)}`,
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          throw new Error(
            errorData?.error || "Failed to fetch receipts from backend",
          );
        }

        const data = await response.json();
        setReceipts(data.receipts || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        console.error("Error fetching receipts:", err);
      } finally {
        setLoading(false);
      }
    };

    if (userEmail) {
      fetchReceipts();
    }
  }, [userEmail]);

  const summary = useMemo(() => {
    const totalReceipts = receipts.length;
    const totalFiles = receipts.reduce((sum, receipt) => sum + receipt.fileCount, 0);
    const totalBytes = receipts.reduce(
      (sum, receipt) =>
        sum + receipt.files.reduce((fileSum, file) => fileSum + file.size_bytes, 0),
      0,
    );
    const latestReceipt = receipts
      .slice()
      .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))[0];

    return {
      totalReceipts,
      totalFiles,
      totalBytes,
      latestDate: latestReceipt?.created_at || null,
      latestPreview: latestReceipt?.emailBody.preview || "No receipts yet",
    };
  }, [receipts]);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${Math.round((bytes / 1024 ** i) * 100) / 100} ${sizes[i]}`;
  };

  const downloadReceipt = (receipt: Receipt) => {
    const data = JSON.stringify(receipt, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `receipt-${receipt.id}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <section className="mx-auto max-w-7xl px-6 py-8 sm:px-8">
        <div className="rounded-[8px] border border-border bg-surface p-8 text-center">
          <p className="text-text-secondary">Loading receipts...</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="mx-auto max-w-7xl px-6 py-8 sm:px-8">
        <div className="rounded-[8px] border border-border bg-surface p-8">
          <p className="text-red-500">Error: {error}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-7xl px-6 py-8 sm:px-8">
      <div className="grid gap-4 md:grid-cols-3">
        <article className="rounded-[8px] border border-border bg-surface p-5">
          <p className="text-sm text-text-secondary">Receipts</p>
          <p className="mt-3 text-3xl font-semibold">{summary.totalReceipts}</p>
          <p className="mt-2 text-sm font-medium text-primary">
            Uploaded receipts
          </p>
        </article>

        <article className="rounded-[8px] border border-border bg-surface p-5">
          <p className="text-sm text-text-secondary">Attachments</p>
          <p className="mt-3 text-3xl font-semibold">{summary.totalFiles}</p>
          <p className="mt-2 text-sm font-medium text-primary">
            Total saved files
          </p>
        </article>

        <article className="rounded-[8px] border border-border bg-surface p-5">
          <p className="text-sm text-text-secondary">Storage</p>
          <p className="mt-3 text-3xl font-semibold">
            {formatBytes(summary.totalBytes)}
          </p>
          <p className="mt-2 text-sm font-medium text-primary">
            Approximate receipt size
          </p>
        </article>
      </div>

      <div className="mt-6 rounded-[8px] border border-border bg-surface p-5">
        <h2 className="text-lg font-semibold">Latest receipt</h2>
        {summary.latestDate ? (
          <div className="mt-3 space-y-2 text-sm text-text-secondary">
            <p className="font-medium text-text-primary">
              {formatDate(summary.latestDate)}
            </p>
            <p className="truncate">{summary.latestPreview}</p>
          </div>
        ) : (
          <p className="mt-3 text-sm text-text-secondary">
            Upload a receipt to see your latest expense here.
          </p>
        )}
      </div>

      <div className="mt-6 overflow-x-auto rounded-[8px] border border-border bg-surface">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary">
              <th className="px-6 py-4 text-left font-medium text-text-secondary">
                Date
              </th>
              <th className="px-6 py-4 text-left font-medium text-text-secondary">
                Files
              </th>
              <th className="px-6 py-4 text-left font-medium text-text-secondary">
                Size
              </th>
              <th className="px-6 py-4 text-left font-medium text-text-secondary">
                Email Preview
              </th>
              <th className="px-6 py-4 text-right font-medium text-text-secondary">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {receipts.map((receipt) => (
              <tr
                key={receipt.id}
                className="border-b border-border transition hover:bg-secondary/50"
              >
                <td className="px-6 py-4">
                  <span className="text-text-primary">
                    {formatDate(receipt.created_at)}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-text-primary">{receipt.fileCount}</span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-text-primary">
                    {receipt.files.reduce((sum, file) => sum + file.size_bytes, 0) > 0
                      ? formatBytes(
                          receipt.files.reduce(
                            (sum, file) => sum + file.size_bytes,
                            0,
                          ),
                        )
                      : "—"}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="max-w-xs truncate text-text-secondary">
                    {receipt.emailBody.received
                      ? receipt.emailBody.preview
                      : "No email"}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => downloadReceipt(receipt)}
                    className="rounded-[4px] bg-primary px-3 py-1.5 text-xs font-medium text-text-button transition hover:bg-primary-dark"
                  >
                    Download
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}