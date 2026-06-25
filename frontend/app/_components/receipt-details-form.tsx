"use client";

import { Plus, Trash2 } from "lucide-react";
import {
  editableTotalFields,
  formatAmountInput,
  formatTotalLabel,
  type ReceiptItem,
  type ReceiptTotals,
} from "../_lib/receipt-form-utils";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

type ReceiptDetailsFormProps = {
  storeName: string;
  onStoreNameChange: (value: string) => void;
  items: ReceiptItem[];
  onUpdateItem: (
    index: number,
    field: keyof ReceiptItem,
    value: string,
  ) => void;
  onAddItem?: () => void;
  onRemoveItem?: (index: number) => void;
  totals: ReceiptTotals;
  onUpdateTotal: (field: keyof ReceiptTotals, value: string) => void;
  subtotal: number;
  finalTotal: number;
};

export default function ReceiptDetailsForm({
  storeName,
  onStoreNameChange,
  items,
  onUpdateItem,
  onAddItem,
  onRemoveItem,
  totals,
  onUpdateTotal,
  subtotal,
  finalTotal,
}: ReceiptDetailsFormProps) {
  const canManageItems = onAddItem && onRemoveItem;

  return (
    <div className="space-y-4">
      <Input
        label="Store name"
        onChange={(event) => onStoreNameChange(event.target.value)}
        placeholder="e.g. Keells Super"
        value={storeName}
      />

      <div className="overflow-hidden rounded-[var(--radius-lg)] border border-border">
        <div className="flex items-center justify-between border-b border-border bg-surface-muted/50 px-4 py-2.5">
          <p className="text-xs font-medium uppercase tracking-wider text-text-tertiary">
            Line items
          </p>
          {canManageItems ? (
            <Button
              leftIcon={<Plus className="size-3.5" />}
              onClick={onAddItem}
              size="sm"
              type="button"
              variant="ghost"
            >
              Add row
            </Button>
          ) : null}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-muted/30">
                <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-text-tertiary">
                  Item
                </th>
                <th className="w-24 px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-text-tertiary">
                  Qty
                </th>
                <th className="w-32 px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-text-tertiary">
                  Amount
                </th>
                {canManageItems ? (
                  <th className="w-12 px-2 py-2.5" />
                ) : null}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {items.map((item, index) => (
                <tr key={index}>
                  <td className="px-3 py-2">
                    <input
                      className="h-8 w-full rounded-[var(--radius-sm)] border border-border bg-surface-muted px-2.5 text-sm focus-ring focus:border-primary"
                      onChange={(event) =>
                        onUpdateItem(index, "item", event.target.value)
                      }
                      placeholder="Item name"
                      value={item.item}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      className="h-8 w-full rounded-[var(--radius-sm)] border border-border bg-surface-muted px-2.5 text-sm focus-ring focus:border-primary"
                      onChange={(event) =>
                        onUpdateItem(index, "quantity", event.target.value)
                      }
                      placeholder="1"
                      value={item.quantity}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      className="h-8 w-full rounded-[var(--radius-sm)] border border-border bg-surface-muted px-2.5 text-sm focus-ring focus:border-primary"
                      onChange={(event) =>
                        onUpdateItem(index, "amount", event.target.value)
                      }
                      placeholder="0"
                      value={item.amount}
                    />
                  </td>
                  {canManageItems ? (
                    <td className="px-2 py-2">
                      <Button
                        aria-label="Remove line item"
                        disabled={items.length === 1}
                        onClick={() => onRemoveItem(index)}
                        size="icon"
                        type="button"
                        variant="ghost"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="grid gap-3 border-t border-border bg-surface-muted/20 p-4 sm:grid-cols-2">
          <Input label="Subtotal" readOnly value={formatAmountInput(subtotal)} />

          {editableTotalFields.map((field) => (
            <Input
              key={field}
              label={formatTotalLabel(field)}
              onChange={(event) => onUpdateTotal(field, event.target.value)}
              placeholder="0"
              value={totals[field]}
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
  );
}
