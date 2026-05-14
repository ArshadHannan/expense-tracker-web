"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import ReceiptImportModal from "./receipt-import-modal";

type DashboardShellProps = {
  children: ReactNode;
  user: {
    name: string;
    email: string;
  };
};

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/expenses", label: "Expenses" },
  { href: "/budgets", label: "Budgets" },
  { href: "/approvals", label: "Approvals" },
  { href: "/report", label: "Report" },
];

export default function DashboardShell({
  children,
  user,
}: DashboardShellProps) {
  const pathname = usePathname();
  const title =
    navItems.find((item) => item.href === pathname)?.label ?? "Dashboard";

  return (
    <main className="min-h-screen bg-background text-text-primary">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-border bg-secondary px-5 py-6 text-text-primary lg:block">
        <div className="mb-10 flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-[8px] bg-primary text-lg font-bold text-text-button">
            ET
          </div>
          <div>
            <p className="font-semibold">Expense Tracker</p>
            <p className="text-xs text-text-secondary">Finance console</p>
          </div>
        </div>

        <nav className="space-y-1 text-sm">
          {navItems.map((item) => {
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`block w-full rounded-[8px] px-3 py-2.5 transition ${
                  isActive
                    ? "bg-primary text-text-button"
                    : "text-text-secondary hover:bg-white/8 hover:text-text-primary"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="lg:pl-64">
        <header className="border-b border-border bg-surface px-6 py-5 sm:px-8">
          <div className="mx-auto flex max-w-7xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-primary">Dashboard</p>
              <h1 className="mt-1 text-3xl font-semibold tracking-normal">
                {title}
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden text-right sm:block">
                <p className="text-sm font-medium">{user.name}</p>
                <p className="text-xs text-text-secondary">{user.email}</p>
              </div>
              <ReceiptImportModal />
              <button className="h-10 rounded-[8px] bg-primary px-4 text-sm font-medium text-text-button transition hover:bg-primary-dark">
                Add expense
              </button>
              <form action="/auth/logout" method="POST">
                <button
                  className="h-10 rounded-[8px] bg-primary px-4 text-sm font-medium text-text-button transition hover:bg-primary-dark"
                  type="submit"
                >
                  Log out
                </button>
              </form>
            </div>
          </div>
        </header>

        <section className="mx-auto max-w-7xl px-6 py-8 sm:px-8">
          {children}
        </section>
      </div>
    </main>
  );
}
