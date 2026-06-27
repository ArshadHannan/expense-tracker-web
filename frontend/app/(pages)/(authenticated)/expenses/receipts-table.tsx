"use client";

import { Eye, Receipt as ReceiptIcon, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import type { Receipt } from "../../../_lib/use-receipts";
import { useReceiptsRefresh } from "../../../_lib/receipts-refresh-context";
import { Button } from "../../../_components/ui/button";
import { Card } from "../../../_components/ui/card";
import { EmptyState } from "../../../_components/ui/empty-state";
import { Modal } from "../../../_components/ui/modal";
import { StatCard } from "../../../_components/ui/stat-card";

const pageSize = 8;

export default function ReceiptsTable({
  receipts,
  totalSpent,
}: {
  receipts: Receipt[];
  totalSpent: number;
}) {
  const { refreshReceipts } = useReceiptsRefresh();
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);
  const [receiptToDelete, setReceiptToDelete] = useState<Receipt | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
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

  if (receipts.length === 0) {
    return (
      <div className="space-y-6">
        <StatCard
          accent
          hint="Across all saved receipts"
          icon={<ReceiptIcon className="size-5" strokeWidth={1.75} />}
          label="Total expenses"
          value={formatTotal(totalSpent)}
        />
        <EmptyState
          description="Import your first receipt to start building your expense history. Upload a PDF or image to extract and save expense details."
          icon={<ReceiptIcon className="size-6" strokeWidth={1.5} />}
          title="No receipts yet"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <StatCard
        accent
        hint={`${receipts.length} receipt${receipts.length === 1 ? "" : "s"} saved`}
        icon={<ReceiptIcon className="size-5" strokeWidth={1.75} />}
        label="Total expenses"
        value={formatTotal(totalSpent)}
      />

      <Card padding="none" className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-muted/40">
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-tertiary">
                  Store
                </th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-tertiary">
                  Amount
                </th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-tertiary">
                  Date
                </th>
                <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wider text-text-tertiary">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {pageReceipts.map((receipt) => {
                const storeName =
                  receipt.store_name ||
                  receipt.expense_name ||
                  "Unknown store";

                return (
                  <tr
                    key={receipt.id}
                    className="group transition-colors hover:bg-surface-muted/30"
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="flex size-8 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-primary-soft/50 text-primary opacity-0 transition-opacity group-hover:opacity-100">
                          <ReceiptIcon className="size-3.5" />
                        </div>
                        <span className="font-medium text-text-primary">
                          {storeName}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="font-medium tabular-nums text-text-primary">
                        {receipt.total_amount}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-text-secondary">
                      {formatDate(receipt.created_at)}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          aria-label={`View receipt from ${storeName}`}
                          onClick={() => setSelectedReceipt(receipt)}
                          size="icon"
                          title="View receipt"
                          variant="ghost"
                        >
                          <Eye className="size-4" />
                        </Button>
                        <Button
                          aria-label={`Delete receipt from ${storeName}`}
                          onClick={() => setReceiptToDelete(receipt)}
                          size="icon"
                          title="Delete receipt"
                          variant="ghost"
                        >
                          <Trash2 className="size-4 text-red-500" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 border-t border-border bg-surface-muted/20 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-text-tertiary">
            Showing{" "}
            <span className="font-medium text-text-secondary">
              {firstReceiptIndex}–{lastReceiptIndex}
            </span>{" "}
            of{" "}
            <span className="font-medium text-text-secondary">
              {receipts.length}
            </span>
          </p>

          <div className="flex items-center gap-2">
            <Button
              disabled={visiblePage === 1}
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              size="sm"
              variant="outline"
            >
              Previous
            </Button>
            <span className="min-w-24 text-center text-sm tabular-nums text-text-tertiary">
              {visiblePage} / {totalPages}
            </span>
            <Button
              disabled={visiblePage === totalPages}
              onClick={() =>
                setCurrentPage((page) => Math.min(totalPages, page + 1))
              }
              size="sm"
              variant="outline"
            >
              Next
            </Button>
          </div>
        </div>
      </Card>

      {selectedReceipt ? (
        <ReceiptDetailsModal
          formatDate={formatDate}
          onClose={() => setSelectedReceipt(null)}
          receipt={selectedReceipt}
        />
      ) : null}

      {receiptToDelete ? (
        <Modal
          eyebrow="Delete receipt"
          footer={
            <>
              <Button
                disabled={isDeleting}
                onClick={() => setReceiptToDelete(null)}
                variant="ghost"
              >
                Cancel
              </Button>
              <Button
                loading={isDeleting}
                onClick={async () => {
                  setIsDeleting(true);
                  try {
                    const response = await fetch(
                      `/api/receipts?receiptId=${encodeURIComponent(receiptToDelete.id)}`,
                      { method: "DELETE" },
                    );
                    if (!response.ok) {
                      const data = await response.json().catch(() => null);
                      throw new Error(data?.error ?? "Unable to delete receipt.");
                    }
                    toast.success("Receipt deleted");
                    setReceiptToDelete(null);
                    refreshReceipts();
                  } catch (err) {
                    toast.error(err instanceof Error ? err.message : "Unable to delete receipt.");
                  } finally {
                    setIsDeleting(false);
                  }
                }}
                variant="destructive"
              >
                Delete
              </Button>
            </>
          }
          onClose={() => setReceiptToDelete(null)}
          open
          title={`Delete "${receiptToDelete.store_name ?? receiptToDelete.expense_name ?? "receipt"}"`}
        >
          <p className="text-sm text-text-secondary">
            This will permanently remove this receipt and deduct its amount from your total. This cannot be undone.
          </p>
        </Modal>
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
  const storeName =
    receipt.store_name || receipt.expense_name || "Unknown store";

  return (
    <Modal
      description={formatDate(receipt.created_at)}
      eyebrow="Receipt details"
      onClose={onClose}
      open
      size="lg"
      title={storeName}
    >
      <div className="overflow-hidden rounded-[var(--radius-lg)] border border-border">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-muted/40">
                <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-text-tertiary">
                  Item
                </th>
                <th className="w-24 px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-text-tertiary">
                  Qty
                </th>
                <th className="w-32 px-4 py-2.5 text-right text-xs font-medium uppercase tracking-wider text-text-tertiary">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {items.length > 0 ? (
                items.map((item, index) => (
                  <tr key={index}>
                    <td className="px-4 py-3 text-text-primary">{item.item}</td>
                    <td className="px-4 py-3 text-text-secondary">
                      {item.quantity}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-text-primary">
                      {item.amount}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    className="px-4 py-10 text-center text-text-tertiary"
                    colSpan={3}
                  >
                    No item details saved for this receipt.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="grid gap-2 border-t border-border bg-surface-muted/20 p-4 sm:grid-cols-2">
          {[
            ["Subtotal", totals.subtotal],
            ["Discount", totals.discount],
            ["Tax", totals.tax],
            ["Service charge", totals.serviceCharge],
            ["Delivery fee", totals.deliveryFee],
            ["Total", totals.total],
          ].map(([label, value]) => (
            <div
              className={`rounded-[var(--radius-md)] border px-3 py-2.5 ${
                label === "Total"
                  ? "border-primary/30 bg-primary-soft/20 sm:col-span-2"
                  : "border-border/50 bg-surface/50"
              }`}
              key={label}
            >
              <p className="text-[11px] font-medium uppercase tracking-wider text-text-tertiary">
                {label}
              </p>
              <p
                className={`mt-0.5 text-sm tabular-nums ${
                  label === "Total"
                    ? "font-semibold text-primary"
                    : "text-text-primary"
                }`}
              >
                {value}
              </p>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
}
