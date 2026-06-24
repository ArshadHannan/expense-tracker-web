"use client";

import { useEffect, useState } from "react";
import { useReceiptsRefreshKey } from "./receipts-refresh-context";

type ReceiptFile = {
  filename: string;
  content_type: string;
  size_bytes: number;
};

export type Receipt = {
  id: string;
  created_at: string;
  userEmail: string;
  fileCount?: number;
  files?: ReceiptFile[];
  emailBody?: {
    received: boolean;
    characterCount: number;
    preview: string;
  };
  items?: {
    amount: string;
    item: string;
    quantity: string;
  }[];
  totals?: {
    subtotal: string;
    discount: string;
    tax: string;
    serviceCharge: string;
    deliveryFee: string;
    total: string;
  };
  total_amount: string;
  total_amount_value?: number;
  store_name?: string;
  expense_name?: string;
  type: string;
};

type ReceiptsDataSource = "backend" | "fake";

export function useReceipts(userEmail: string) {
  const refreshKey = useReceiptsRefreshKey();
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [totalSpent, setTotalSpent] = useState(0);
  const [dataSource, setDataSource] = useState<ReceiptsDataSource>("backend");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReceipts = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch("/api/receipts");

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          throw new Error(
            errorData?.error || "Failed to fetch receipts from backend",
          );
        }

        const data = await response.json();
        setReceipts(data.receipts || []);
        setTotalSpent(data.total_spent || 0);
        setDataSource(data.data_source === "fake" ? "fake" : "backend");
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
  }, [userEmail, refreshKey]);

  return {
    dataSource,
    error,
    loading,
    receipts,
    totalSpent,
  };
}
