"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";

type ReceiptsRefreshContextValue = {
  refreshKey: number;
  refreshReceipts: () => void;
};

const ReceiptsRefreshContext =
  createContext<ReceiptsRefreshContextValue | null>(null);

export function ReceiptsRefreshProvider({ children }: { children: ReactNode }) {
  const [refreshKey, setRefreshKey] = useState(0);

  const refreshReceipts = useCallback(() => {
    setRefreshKey((key) => key + 1);
  }, []);

  return (
    <ReceiptsRefreshContext.Provider value={{ refreshKey, refreshReceipts }}>
      {children}
    </ReceiptsRefreshContext.Provider>
  );
}

export function useReceiptsRefresh() {
  const context = useContext(ReceiptsRefreshContext);

  if (!context) {
    throw new Error(
      "useReceiptsRefresh must be used within ReceiptsRefreshProvider",
    );
  }

  return context;
}

export function useReceiptsRefreshKey() {
  return useContext(ReceiptsRefreshContext)?.refreshKey ?? 0;
}
