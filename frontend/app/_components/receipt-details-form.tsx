"use client";

import type { ReactNode } from "react";
import { Plus, Trash2 } from "lucide-react";
import {
  editableTotalFields,
  formatAmountInput,
  formatTotalLabel,
  type ReceiptItem,
  type ReceiptTotals,
} from "../_lib/receipt-form-utils";
import type { ReceiptFormFieldErrors } from "../_lib/receipt-form-validation";
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
  onAddItem: () => void;
  onRemoveItem: (index: number) => void;
  onRowBlur?: (index: number) => void;
  totals: ReceiptTotals;
  onUpdateTotal: (field: keyof ReceiptTotals, value: string) => void;
  subtotal: number;
  finalTotal: number;
  errors?: ReceiptFormFieldErrors;
  showErrors?: boolean;
};

const inputErrorClass = "border-destructive/50 focus:border-destructive";

function RequiredLabel({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <span className="ml-0.5 text-destructive" aria-hidden="true">
        *
      </span>
    </>
  );
}

function OptionalLabel({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <span className="ml-1 font-normal normal-case tracking-normal text-text-tertiary">
        (optional)
      </span>
    </>
  );
}

export default function ReceiptDetailsForm({
  storeName,
  onStoreNameChange,
  items,
  onUpdateItem,
  onAddItem,
  onRemoveItem,
  onRowBlur,
  totals,
  onUpdateTotal,
  subtotal,
  finalTotal,
  errors,
  showErrors = false,
}: ReceiptDetailsFormProps) {
  return (
    <div className="space-y-4">
      <Input
        error={showErrors ? errors?.storeName : undefined}
        label="Store name"
        maxLength={100}
        onChange={(event) => onStoreNameChange(event.target.value)}
        placeholder="e.g. Keells Super"
        required
        value={storeName}
      />

      {showErrors && errors?.form ? (
        <p className="text-sm text-destructive" role="alert">
          {errors.form}
        </p>
      ) : null}

      <div className="overflow-hidden rounded-[var(--radius-lg)] border border-border">
        <div className="flex items-center justify-between border-b border-border bg-surface-muted/50 px-4 py-2.5">
          <p className="text-xs font-medium uppercase tracking-wider text-text-tertiary">
            <RequiredLabel>Line items</RequiredLabel>
          </p>
          <Button
            leftIcon={<Plus className="size-3.5" />}
            onClick={onAddItem}
            size="sm"
            type="button"
            variant="ghost"
          >
            Add row
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
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
                <th className="w-12 px-2 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {items.map((item, index) => {
                const rowErrors = showErrors ? errors?.items?.[index] : undefined;

                return (
                  <tr key={index}>
                    <td className="px-3 py-2 align-top">
                      <input
                        aria-invalid={Boolean(rowErrors?.item)}
                        className={`h-8 w-full rounded-[var(--radius-sm)] border border-border bg-surface-muted px-2.5 text-sm focus-ring focus:border-primary ${rowErrors?.item ? inputErrorClass : ""}`}
                        onBlur={() => onRowBlur?.(index)}
                        onChange={(event) =>
                          onUpdateItem(index, "item", event.target.value)
                        }
                        placeholder="Item name"
                        value={item.item}
                      />
                      {rowErrors?.item ? (
                        <p className="mt-1 text-xs text-destructive">
                          {rowErrors.item}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-3 py-2 align-top">
                      <input
                        aria-invalid={Boolean(rowErrors?.quantity)}
                        className={`h-8 w-full rounded-[var(--radius-sm)] border border-border bg-surface-muted px-2.5 text-sm tabular-nums focus-ring focus:border-primary ${rowErrors?.quantity ? inputErrorClass : ""}`}
                        inputMode="decimal"
                        onBlur={() => onRowBlur?.(index)}
                        onChange={(event) =>
                          onUpdateItem(index, "quantity", event.target.value)
                        }
                        placeholder="1"
                        value={item.quantity}
                      />
                      {rowErrors?.quantity ? (
                        <p className="mt-1 text-xs text-destructive">
                          {rowErrors.quantity}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-3 py-2 align-top">
                      <input
                        aria-invalid={Boolean(rowErrors?.amount)}
                        className={`h-8 w-full rounded-[var(--radius-sm)] border border-border bg-surface-muted px-2.5 text-sm tabular-nums focus-ring focus:border-primary ${rowErrors?.amount ? inputErrorClass : ""}`}
                        inputMode="decimal"
                        onBlur={() => onRowBlur?.(index)}
                        onChange={(event) =>
                          onUpdateItem(index, "amount", event.target.value)
                        }
                        placeholder="0"
                        value={item.amount}
                      />
                      {rowErrors?.amount ? (
                        <p className="mt-1 text-xs text-destructive">
                          {rowErrors.amount}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-2 py-2 align-top">
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
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="grid gap-3 border-t border-border bg-surface-muted/20 p-4 sm:grid-cols-2">
          <Input
            hint="Calculated from line items"
            label="Subtotal"
            readOnly
            value={formatAmountInput(subtotal)}
          />

          {editableTotalFields.map((field) => (
            <Input
              error={showErrors ? errors?.totals?.[field] : undefined}
              inputMode="decimal"
              key={field}
              label={
                <OptionalLabel>{formatTotalLabel(field)}</OptionalLabel>
              }
              onChange={(event) => onUpdateTotal(field, event.target.value)}
              placeholder="0"
              value={totals[field]}
            />
          ))}

          <div className="sm:col-span-2">
            <Input
              className="font-semibold"
              hint="Subtotal − discount + tax + charges"
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
