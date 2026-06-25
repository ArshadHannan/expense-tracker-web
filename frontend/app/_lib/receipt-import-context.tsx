"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";

type ReceiptImportContextValue = {
  isOpen: boolean;
  open: () => void;
  close: () => void;
};

const ReceiptImportContext = createContext<ReceiptImportContextValue | null>(
  null,
);

export function ReceiptImportProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  return (
    <ReceiptImportContext.Provider value={{ isOpen, open, close }}>
      {children}
    </ReceiptImportContext.Provider>
  );
}

export function useReceiptImport() {
  const context = useContext(ReceiptImportContext);

  if (!context) {
    throw new Error("useReceiptImport must be used within ReceiptImportProvider");
  }

  return context;
}
