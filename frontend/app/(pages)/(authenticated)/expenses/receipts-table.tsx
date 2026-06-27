"use client";

import { ChevronDown, Eye, Receipt as ReceiptIcon, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import type { Receipt } from "../../../_lib/use-receipts";
import { useReceiptsRefresh } from "../../../_lib/receipts-refresh-context";
import { Button } from "../../../_components/ui/button";
import { Card } from "../../../_components/ui/card";
import { EmptyState } from "../../../_components/ui/empty-state";
import { Modal } from "../../../_components/ui/modal";
import { StatCard } from "../../../_components/ui/stat-card";

const pageSize = 8;

function toMonthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function monthKeyToLabel(key: string) {
  const [year, month] = key.split("-").map(Number);
  return new Date(year, month - 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

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
  const [filterMonth, setFilterMonth] = useState("");
  const [filterStore, setFilterStore] = useState("");

  const availableMonths = useMemo(() => {
    const monthSet = new Set<string>();
    for (const receipt of receipts) {
      monthSet.add(toMonthKey(new Date(receipt.created_at)));
    }
    return Array.from(monthSet).sort().reverse();
  }, [receipts]);

  const availableStores = useMemo(() => {
    const storeSet = new Set<string>();
    for (const receipt of receipts) {
      const name = receipt.store_name || receipt.expense_name;
      if (name) storeSet.add(name);
    }
    return Array.from(storeSet).sort();
  }, [receipts]);

  const filteredReceipts = useMemo(() => {
    return receipts.filter((receipt) => {
      if (filterMonth) {
        const key = toMonthKey(new Date(receipt.created_at));
        if (key !== filterMonth) return false;
      }
      if (filterStore) {
        const name = receipt.store_name || receipt.expense_name || "";
        if (name !== filterStore) return false;
      }
      return true;
    });
  }, [receipts, filterMonth, filterStore]);

  const filteredTotalSpent = useMemo(
    () => filteredReceipts.reduce((sum, r) => sum + (r.total_amount_value ?? 0), 0),
    [filteredReceipts],
  );

  const isFiltered = filterMonth !== "" || filterStore !== "";

  useEffect(() => {
    setCurrentPage(1);
  }, [filterMonth, filterStore]);

  const totalPages = Math.max(1, Math.ceil(filteredReceipts.length / pageSize));
  const visiblePage = Math.min(currentPage, totalPages);

  const pageReceipts = useMemo(() => {
    const startIndex = (visiblePage - 1) * pageSize;
    return filteredReceipts.slice(startIndex, startIndex + pageSize);
  }, [visiblePage, filteredReceipts]);

  const firstReceiptIndex =
    filteredReceipts.length === 0 ? 0 : (visiblePage - 1) * pageSize + 1;
  const lastReceiptIndex = Math.min(visiblePage * pageSize, filteredReceipts.length);

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

  const statHint = isFiltered
    ? `${filteredReceipts.length} of ${receipts.length} receipts shown`
    : `${receipts.length} receipt${receipts.length === 1 ? "" : "s"} saved`;

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
        hint={statHint}
        icon={<ReceiptIcon className="size-5" strokeWidth={1.75} />}
        label="Total expenses"
        value={formatTotal(isFiltered ? filteredTotalSpent : totalSpent)}
      />

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Month filter */}
        <div className="relative">
          <select
            className="cursor-pointer appearance-none rounded-[var(--radius-md)] border border-border bg-surface py-1.5 pl-3 pr-8 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-primary"
            onChange={(e) => setFilterMonth(e.target.value)}
            value={filterMonth}
          >
            <option value="">All months</option>
            {availableMonths.map((key) => (
              <option key={key} value={key}>
                {monthKeyToLabel(key)}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-3.5 -translate-y-1/2 text-text-tertiary" />
        </div>

        {/* Store filter */}
        <div className="relative">
          <select
            className="cursor-pointer appearance-none rounded-[var(--radius-md)] border border-border bg-surface py-1.5 pl-3 pr-8 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-primary"
            onChange={(e) => setFilterStore(e.target.value)}
            value={filterStore}
          >
            <option value="">All stores</option>
            {availableStores.map((store) => (
              <option key={store} value={store}>
                {store}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-3.5 -translate-y-1/2 text-text-tertiary" />
        </div>

        {/* Clear filters */}
        {isFiltered ? (
          <Button
            onClick={() => {
              setFilterMonth("");
              setFilterStore("");
            }}
            size="sm"
            variant="ghost"
          >
            <X className="mr-1.5 size-3.5" />
            Clear filters
          </Button>
        ) : null}
      </div>

      <Card padding="none" className="overflow-hidden">
        {filteredReceipts.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
            <div className="flex size-10 items-center justify-center rounded-full bg-surface-muted text-text-tertiary">
              <ReceiptIcon className="size-5" strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-sm font-medium text-text-primary">No receipts match your filters</p>
              <p className="mt-1 text-xs text-text-tertiary">
                Try changing or clearing the filters above.
              </p>
            </div>
          </div>
        ) : (
          <>
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
                  {filteredReceipts.length}
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
          </>
        )}
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
