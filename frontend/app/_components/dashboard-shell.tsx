"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  CheckSquare,
  LayoutDashboard,
  LogOut,
  Menu,
  Plus,
  Receipt,
  Upload,
  User,
  Wallet,
  X,
} from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { ReceiptsRefreshProvider } from "../_lib/receipts-refresh-context";
import {
  ReceiptImportProvider,
  useReceiptImport,
} from "../_lib/receipt-import-context";
import { Button } from "./ui/button";
import ReceiptImportModal from "./receipt-import-modal";

type DashboardShellProps = {
  children: ReactNode;
  user: {
    name: string;
    email: string;
  };
};

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/expenses", label: "Expenses", icon: Receipt },
  { href: "/budgets", label: "Budgets", icon: Wallet },
  { href: "/approvals", label: "Approvals", icon: CheckSquare },
  { href: "/report", label: "Report", icon: BarChart3 },
];

const pageDescriptions: Record<string, string> = {
  "/dashboard": "Overview of your spending and budget health",
  "/expenses": "Browse and manage all saved receipts",
  "/budgets": "Set and track monthly spending limits",
  "/approvals": "Review and approve pending expenses",
  "/report": "Generate spending reports and insights",
};

function ShellContent({ children, user }: DashboardShellProps) {
  const pathname = usePathname();
  const { open: openImport } = useReceiptImport();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  const activeItem = navItems.find((item) => item.href === pathname);
  const title = activeItem?.label ?? "Dashboard";
  const description =
    pageDescriptions[pathname] ?? "Manage your rupee spending";

  useEffect(() => {
    setIsMobileNavOpen(false);
  }, [pathname]);

  useEffect(() => {
    function closeProfileMenu(event: MouseEvent) {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target as Node)
      ) {
        setIsProfileMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", closeProfileMenu);
    return () => document.removeEventListener("mousedown", closeProfileMenu);
  }, []);

  useEffect(() => {
    if (!isMobileNavOpen) return;

    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileNavOpen]);

  const initials = user.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="app-gradient min-h-screen text-text-primary">
      {/* Mobile overlay */}
      {isMobileNavOpen ? (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setIsMobileNavOpen(false)}
          aria-hidden="true"
        />
      ) : null}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border bg-surface/95 backdrop-blur-xl transition-transform duration-300 lg:translate-x-0 ${
          isMobileNavOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-5">
          <Link className="flex items-center gap-3" href="/dashboard">
            <div className="grid size-9 place-items-center rounded-[var(--radius-md)] bg-primary text-sm font-bold text-text-button shadow-glow">
              RF
            </div>
            <div>
              <p className="text-sm font-semibold tracking-tight">RupeeFlow</p>
              <p className="text-[11px] text-text-tertiary">Expense console</p>
            </div>
          </Link>
          <button
            aria-label="Close navigation"
            className="grid size-8 place-items-center rounded-[var(--radius-md)] text-text-secondary transition hover:bg-white/5 hover:text-text-primary lg:hidden"
            onClick={() => setIsMobileNavOpen(false)}
            type="button"
          >
            <X className="size-4" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          <p className="mb-2 px-3 text-[11px] font-medium uppercase tracking-wider text-text-tertiary">
            Navigation
          </p>
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                className={`group flex items-center gap-3 rounded-[var(--radius-md)] px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-primary text-text-button shadow-sm"
                    : "text-text-secondary hover:bg-white/5 hover:text-text-primary"
                }`}
                href={item.href}
              >
                <Icon
                  className={`size-4 shrink-0 ${isActive ? "" : "text-text-tertiary group-hover:text-text-secondary"}`}
                  strokeWidth={isActive ? 2.25 : 1.75}
                />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-border p-4">
          <div className="flex items-center gap-3 rounded-[var(--radius-md)] bg-surface-muted/50 px-3 py-2.5">
            <div className="grid size-8 shrink-0 place-items-center rounded-full bg-primary-soft text-xs font-semibold text-primary">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{user.name}</p>
              <p className="truncate text-[11px] text-text-tertiary">
                {user.email}
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 border-b border-border/80 bg-background/80 backdrop-blur-xl">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <button
                aria-label="Open navigation"
                className="grid size-9 shrink-0 place-items-center rounded-[var(--radius-md)] border border-border text-text-secondary transition hover:bg-white/5 hover:text-text-primary lg:hidden"
                onClick={() => setIsMobileNavOpen(true)}
                type="button"
              >
                <Menu className="size-4" />
              </button>
              <div className="min-w-0">
                <h1 className="truncate text-xl font-semibold tracking-tight sm:text-2xl">
                  {title}
                </h1>
                <p className="mt-0.5 hidden truncate text-sm text-text-secondary sm:block">
                  {description}
                </p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <Button
                className="hidden sm:inline-flex"
                leftIcon={<Upload className="size-3.5" />}
                onClick={openImport}
                size="md"
                variant="outline"
              >
                Import
              </Button>
              <Button
                className="sm:hidden"
                leftIcon={<Upload className="size-3.5" />}
                onClick={openImport}
                size="icon"
                variant="outline"
              />
              <Button
                className="hidden sm:inline-flex"
                leftIcon={<Plus className="size-3.5" />}
                onClick={openImport}
                size="md"
              >
                Add expense
              </Button>
              <Button
                className="sm:hidden"
                leftIcon={<Plus className="size-3.5" />}
                onClick={openImport}
                size="icon"
              />

              <div className="relative" ref={profileMenuRef}>
                <button
                  aria-expanded={isProfileMenuOpen}
                  aria-haspopup="menu"
                  aria-label="Open profile menu"
                  className="grid size-9 place-items-center rounded-[var(--radius-md)] border border-border bg-surface-muted text-xs font-semibold text-text-primary transition hover:border-primary/40 hover:bg-primary-soft/30"
                  onClick={() => setIsProfileMenuOpen((open) => !open)}
                  type="button"
                >
                  {initials}
                </button>

                {isProfileMenuOpen ? (
                  <div
                    className="absolute right-0 top-11 z-20 w-64 animate-scale-in rounded-[var(--radius-lg)] border border-border bg-surface-elevated p-2 shadow-lg"
                    role="menu"
                  >
                    <div className="rounded-[var(--radius-md)] px-3 py-2.5">
                      <p className="truncate text-sm font-medium">{user.name}</p>
                      <p className="mt-0.5 truncate text-xs text-text-tertiary">
                        {user.email}
                      </p>
                    </div>
                    <div className="my-1 h-px bg-border" />
                    <button
                      className="flex w-full items-center gap-2.5 rounded-[var(--radius-md)] px-3 py-2 text-sm text-text-secondary transition hover:bg-white/5 hover:text-text-primary"
                      role="menuitem"
                      type="button"
                    >
                      <User className="size-4" />
                      Profile
                    </button>
                    <form action="/auth/logout" method="POST">
                      <button
                        className="flex w-full items-center gap-2.5 rounded-[var(--radius-md)] px-3 py-2 text-sm text-text-secondary transition hover:bg-destructive-soft hover:text-destructive"
                        role="menuitem"
                        type="submit"
                      >
                        <LogOut className="size-4" />
                        Log out
                      </button>
                    </form>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          <div className="animate-fade-up">{children}</div>
        </main>
      </div>

      <ReceiptImportModal />
    </div>
  );
}

export default function DashboardShell(props: DashboardShellProps) {
  return (
    <ReceiptsRefreshProvider>
      <ReceiptImportProvider>
        <ShellContent {...props} />
      </ReceiptImportProvider>
    </ReceiptsRefreshProvider>
  );
}
