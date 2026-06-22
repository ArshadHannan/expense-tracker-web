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
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);
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

  return (
    <div className="space-y-3">
      <article className="rounded-[8px] border border-border bg-surface p-4">
        <p className="text-sm text-text-secondary">Total Expenses</p>
        <p className="mt-1 text-2xl font-semibold text-text-primary">
          {formatTotal(totalSpent)}
        </p>
        <p className="mt-1 text-sm text-text-secondary">
          Across all saved receipts
        </p>
      </article>

      <div className="flex flex-col overflow-hidden rounded-[8px] border border-border bg-surface">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary">
                <th className="px-5 py-2.5 text-left font-medium text-text-secondary">
                  Store Name
                </th>
                <th className="px-5 py-2.5 text-left font-medium text-text-secondary">
                  Receipt Amount
                </th>
                <th className="px-5 py-2.5 text-left font-medium text-text-secondary">
                  Date
                </th>
                <th className="px-5 py-2.5 text-right font-medium text-text-secondary">
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
                <td className="px-5 py-2.5">
                    <span className="text-text-primary">
                      {receipt.store_name ||
                        receipt.expense_name ||
                        "Unknown store"}
                    </span>
                  </td>
                <td className="px-5 py-2.5">
                    <span className="text-text-primary">
                      {receipt.total_amount}
                    </span>
                  </td>
                <td className="px-5 py-2.5">
                    <span className="text-text-primary">
                      {formatDate(receipt.created_at)}
                    </span>
                  </td>
                <td className="px-5 py-2.5 text-right">
                  <button
                      aria-label={`View receipt from ${
                        receipt.store_name ||
                        receipt.expense_name ||
                        "unknown store"
                      }`}
                      onClick={() => setSelectedReceipt(receipt)}
                      className="inline-grid size-9 place-items-center rounded-[8px] border border-primary bg-transparent text-primary transition hover:bg-primary-soft"
                      title="View receipt"
                      type="button"
                    >
                      <EyeIcon />
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

        <div className="flex flex-col gap-3 border-t border-border bg-secondary px-5 py-2.5 sm:flex-row sm:items-center sm:justify-between">
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

      {selectedReceipt ? (
        <ReceiptDetailsModal
          formatDate={formatDate}
          onClose={() => setSelectedReceipt(null)}
          receipt={selectedReceipt}
        />
      ) : null}
    </div>
  );
}

function ReceiptDetailsModal({
  formatDate,
  onClose,
  receipt,
}: {
  formatDate: (dateString: string) => string;
  onClose: () => void;
  receipt: Receipt;
}) {
  const items = receipt.items ?? [];
  const totals = receipt.totals ?? {
    deliveryFee: "0",
    discount: "0",
    serviceCharge: "0",
    subtotal: receipt.total_amount,
    tax: "0",
    total: receipt.total_amount,
  };
  const storeName = receipt.store_name || receipt.expense_name || "Unknown store";

  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-secondary/55 px-4 py-6 backdrop-blur-sm"
      role="dialog"
    >
      <div className="w-full max-w-3xl overflow-hidden rounded-[8px] border border-border bg-surface shadow-[0_28px_90px_rgba(16,16,16,0.24)]">
        <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
          <div>
            <p className="text-sm font-medium text-primary">Receipt details</p>
            <h2 className="mt-1 text-xl font-semibold text-text-primary">
              {storeName}
            </h2>
            <p className="mt-1 text-sm text-text-secondary">
              {formatDate(receipt.created_at)}
            </p>
          </div>
          <button
            aria-label="Close receipt details"
            className="grid size-9 place-items-center rounded-[8px] bg-primary text-lg leading-none text-text-button transition hover:bg-primary-dark"
            onClick={onClose}
            type="button"
          >
            x
          </button>
        </div>

        <div className="space-y-4 px-5 py-4">
          <div className="rounded-[8px] border border-border">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary">
                    <th className="px-4 py-2.5 text-left font-medium text-text-secondary">
                      Item
                    </th>
                    <th className="w-32 px-4 py-2.5 text-left font-medium text-text-secondary">
                      Quantity
                    </th>
                    <th className="w-40 px-4 py-2.5 text-left font-medium text-text-secondary">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {items.length > 0 ? (
                    items.map((item, index) => (
                      <tr className="border-b border-border" key={index}>
                        <td className="px-4 py-2.5 text-text-primary">
                          {item.item}
                        </td>
                        <td className="px-4 py-2.5 text-text-primary">
                          {item.quantity}
                        </td>
                        <td className="px-4 py-2.5 text-text-primary">
                          {item.amount}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        className="px-4 py-8 text-center text-text-secondary"
                        colSpan={3}
                      >
                        No item details saved for this receipt.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="grid gap-2.5 border-t border-border p-3 sm:grid-cols-2">
              {[
                ["Subtotal", totals.subtotal],
                ["Discount", totals.discount],
                ["Tax", totals.tax],
                ["Service Charge", totals.serviceCharge],
                ["Delivery Fee", totals.deliveryFee],
                ["Total", totals.total],
              ].map(([label, value]) => (
                <div
                  className={`rounded-[8px] border border-border bg-secondary px-3 py-2 ${
                    label === "Total" ? "sm:col-span-2" : ""
                  }`}
                  key={label}
                >
                  <p className="text-xs font-medium uppercase tracking-wide text-text-secondary">
                    {label}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-text-primary">
                    {value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function EyeIcon() {
  return (
    <svg
      aria-hidden="true"
      className="size-4"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
