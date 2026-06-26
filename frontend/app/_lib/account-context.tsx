"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type AccountState = {
  monthly_budget: number | null;
  onboarded: boolean;
};

type AccountContextValue = {
  account: AccountState;
  error: string | null;
  loading: boolean;
  refreshAccount: () => Promise<void>;
  saveMonthlyBudget: (monthlyBudget: number) => Promise<void>;
};

const defaultAccount: AccountState = {
  monthly_budget: null,
  onboarded: false,
};

const AccountContext = createContext<AccountContextValue | null>(null);

export function AccountProvider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<AccountState>(defaultAccount);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshAccount = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/account");

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || "Failed to load account");
      }

      const data = await response.json();
      setAccount({
        monthly_budget:
          typeof data.monthly_budget === "number" ? data.monthly_budget : null,
        onboarded: Boolean(data.onboarded),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setAccount(defaultAccount);
    } finally {
      setLoading(false);
    }
  }, []);

  const saveMonthlyBudget = useCallback(async (monthlyBudget: number) => {
    setError(null);

    const response = await fetch("/api/account", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ monthly_budget: monthlyBudget }),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(data?.error || "Unable to save monthly budget");
    }

    setAccount({
      monthly_budget: data.monthly_budget,
      onboarded: true,
    });
  }, []);

  useEffect(() => {
    refreshAccount();
  }, [refreshAccount]);

  const value = useMemo(
    () => ({
      account,
      error,
      loading,
      refreshAccount,
      saveMonthlyBudget,
    }),
    [account, error, loading, refreshAccount, saveMonthlyBudget],
  );

  return (
    <AccountContext.Provider value={value}>{children}</AccountContext.Provider>
  );
}

export function useAccount() {
  const context = useContext(AccountContext);

  if (!context) {
    throw new Error("useAccount must be used within AccountProvider");
  }

  return context;
}
