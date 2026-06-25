"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";

type AddExpenseContextValue = {
  isOpen: boolean;
  open: () => void;
  close: () => void;
};

const AddExpenseContext = createContext<AddExpenseContextValue | null>(null);

export function AddExpenseProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  return (
    <AddExpenseContext.Provider value={{ isOpen, open, close }}>
      {children}
    </AddExpenseContext.Provider>
  );
}

export function useAddExpense() {
  const context = useContext(AddExpenseContext);

  if (!context) {
    throw new Error("useAddExpense must be used within AddExpenseProvider");
  }

  return context;
}
