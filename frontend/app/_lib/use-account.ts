"use client";

import { useCallback, useEffect, useState } from "react";

type AccountDataSource = "backend" | "fake";

export function useAccount() {
  const [monthlyBudget, setMonthlyBudget] = useState<number | null>(null);
  const [onboarded, setOnboarded] = useState(false);
  const [dataSource, setDataSource] = useState<AccountDataSource>("backend");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchAccount = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/account");

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || "Failed to load account");
      }

      const data = await response.json();
      const budget =
        typeof data.monthly_budget === "number" ? data.monthly_budget : null;

      setMonthlyBudget(budget);
      setOnboarded(Boolean(data.onboarded && budget !== null));
      setDataSource(data.data_source === "fake" ? "fake" : "backend");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      console.error("Error fetching account:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAccount();
  }, [fetchAccount]);

  const saveMonthlyBudget = useCallback(
    async (budget: number) => {
      try {
        setSaving(true);
        setError(null);

        const response = await fetch("/api/account", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ monthly_budget: budget }),
        });

        const data = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(data?.error || "Unable to save monthly budget");
        }

        const savedBudget =
          typeof data.monthly_budget === "number" ? data.monthly_budget : budget;

        setMonthlyBudget(savedBudget);
        setOnboarded(true);
        setDataSource(data.data_source === "fake" ? "fake" : "backend");

        return savedBudget;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Unable to save monthly budget";
        setError(message);
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [],
  );

  return {
    dataSource,
    error,
    loading,
    monthlyBudget,
    onboarded,
    refresh: fetchAccount,
    saveMonthlyBudget,
    saving,
  };
}
