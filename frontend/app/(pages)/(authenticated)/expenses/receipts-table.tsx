"use client";

import type { Receipt } from "../../../_lib/use-receipts";

export default function ReceiptsTable({
  receipts,
  totalSpent,
}: {
  receipts: Receipt[];
  totalSpent: number;
}) {
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
    <div className="overflow-x-auto rounded-[8px] border border-border bg-surface">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-secondary">
            <th className="px-6 py-4 text-left font-medium text-text-secondary">
              Expense Name
            </th>
            <th className="px-6 py-4 text-left font-medium text-text-secondary">
              Receipt Amount
            </th>
            <th className="px-6 py-4 text-left font-medium text-text-secondary">
              Date
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
                  {receipt.expense_name}
                </span>
              </td>
              <td className="px-6 py-4">
                <span className="text-text-primary">{receipt.total_amount}</span>
              </td>
              <td className="px-6 py-4">
                <span className="text-text-primary">
                  {formatDate(receipt.created_at)}
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
        {receipts.length > 0 && (
          <tfoot>
            <tr className="border-t border-border bg-secondary">
              <td className="px-6 py-4 font-medium text-text-primary">Total</td>
              <td className="px-6 py-4 font-medium text-text-primary">
                {formatTotal(totalSpent)}
              </td>
              <td className="px-6 py-4" />
              <td className="px-6 py-4" />
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}
