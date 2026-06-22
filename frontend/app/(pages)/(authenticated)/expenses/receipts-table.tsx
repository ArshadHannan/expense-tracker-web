"use client";

import { useMemo, useState } from "react";
import type { Receipt } from "../../../_lib/use-receipts";

const pageSize = 8;

export default function ReceiptsTable({
  receipts,
  totalSpent,
}: {
  receipts: Receipt[];
  totalSpent: number;
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(receipts.length / pageSize));
  const visiblePage = Math.min(currentPage, totalPages);

  const pageReceipts = useMemo(() => {
    const startIndex = (visiblePage - 1) * pageSize;

    return receipts.slice(startIndex, startIndex + pageSize);
  }, [visiblePage, receipts]);
  const firstReceiptIndex =
    receipts.length === 0 ? 0 : (visiblePage - 1) * pageSize + 1;
  const lastReceiptIndex = Math.min(visiblePage * pageSize, receipts.length);

  const formatTotal = (amount: number) =>
    `${amount.toLocaleString("en-US")} Rs`;
  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

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

  return (
    <div className="space-y-4">
      <article className="rounded-[8px] border border-border bg-surface p-5">
        <p className="text-sm text-text-secondary">Total Expenses</p>
        <p className="mt-2 text-3xl font-semibold text-text-primary">
          {formatTotal(totalSpent)}
        </p>
        <p className="mt-1 text-sm text-text-secondary">
          Across all saved receipts
        </p>
      </article>

      <div className="flex max-h-[calc(100vh-20rem)] flex-col overflow-hidden rounded-[8px] border border-border bg-surface">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary">
                <th className="px-5 py-3 text-left font-medium text-text-secondary">
                  Store Name
                </th>
                <th className="px-5 py-3 text-left font-medium text-text-secondary">
                  Receipt Amount
                </th>
                <th className="px-5 py-3 text-left font-medium text-text-secondary">
                  Date
                </th>
                <th className="px-5 py-3 text-right font-medium text-text-secondary">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {pageReceipts.map((receipt) => (
                <tr
                  key={receipt.id}
                  className="border-b border-border transition hover:bg-secondary/50"
                >
                  <td className="px-5 py-3">
                    <span className="text-text-primary">
                      {receipt.store_name ||
                        receipt.expense_name ||
                        "Unknown store"}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span className="text-text-primary">
                      {receipt.total_amount}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span className="text-text-primary">
                      {formatDate(receipt.created_at)}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button
                      onClick={() => downloadReceipt(receipt)}
                      className="rounded-[4px] bg-primary px-3 py-1.5 text-xs font-medium text-text-button transition hover:bg-primary-dark"
                    >
                      Download
                    </button>
                  </td>
                </tr>
              ))}
              {receipts.length === 0 ? (
                <tr>
                  <td
                    className="px-5 py-12 text-center text-text-secondary"
                    colSpan={4}
                  >
                    No receipts found.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 border-t border-border bg-secondary px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-text-secondary">
            <span>
              Showing {firstReceiptIndex}-{lastReceiptIndex} of{" "}
              {receipts.length}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              className="h-9 rounded-[8px] bg-primary px-3 text-sm font-medium text-text-button transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
              disabled={visiblePage === 1}
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              type="button"
            >
              Previous
            </button>
            <span className="min-w-20 text-center text-sm text-text-secondary">
              Page {visiblePage} of {totalPages}
            </span>
            <button
              className="h-9 rounded-[8px] bg-primary px-3 text-sm font-medium text-text-button transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
              disabled={visiblePage === totalPages}
              onClick={() =>
                setCurrentPage((page) => Math.min(totalPages, page + 1))
              }
              type="button"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
