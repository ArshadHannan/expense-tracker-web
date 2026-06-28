"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { ReceiptItem, ReceiptTotals } from "./receipt-form-utils";

export type PendingReceipt = {
  id: string;
  from_email: string;
  subject: string;
  created_at: string;
  extracted_data: {
    storeName: string;
    items: ReceiptItem[];
    totals: ReceiptTotals;
  };
};

type PendingReceiptsContextValue = {
  pendingReceipts: PendingReceipt[];
  loading: boolean;
  refresh: () => Promise<void>;
  dismiss: (id: string) => Promise<void>;
  isOpen: boolean;
  open: () => void;
  close: () => void;
};

const PendingReceiptsContext = createContext<PendingReceiptsContextValue | null>(null);

export function PendingReceiptsProvider({ children }: { children: ReactNode }) {
  const [pendingReceipts, setPendingReceipts] = useState<PendingReceipt[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/pending-receipts");
      if (!res.ok) return;
      const data = await res.json();
      setPendingReceipts(data.pending_receipts ?? []);
    } catch {
      // silent — non-critical background poll
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const dismiss = useCallback(async (id: string) => {
    await fetch(`/api/pending-receipts?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    setPendingReceipts((prev) => prev.filter((r) => r.id !== id));
  }, []);

  return (
    <PendingReceiptsContext.Provider
      value={{
        pendingReceipts,
        loading,
        refresh,
        dismiss,
        isOpen,
        open: () => setIsOpen(true),
        close: () => setIsOpen(false),
      }}
    >
      {children}
    </PendingReceiptsContext.Provider>
  );
}

export function usePendingReceipts() {
  const ctx = useContext(PendingReceiptsContext);
  if (!ctx) throw new Error("usePendingReceipts must be used inside PendingReceiptsProvider");
  return ctx;
}
