import type { ReactNode } from "react";

type BadgeVariant = "default" | "primary" | "success" | "warning" | "muted";

const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-surface-muted text-text-secondary border-border",
  primary: "bg-primary-soft text-primary border-primary/20",
  success: "bg-primary-soft text-primary border-primary/20",
  warning: "bg-amber-950/40 text-amber-300 border-amber-500/20",
  muted: "bg-white/5 text-text-tertiary border-transparent",
};

export function Badge({
  children,
  variant = "default",
  className = "",
}: {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-[var(--radius-sm)] border px-2 py-0.5 text-xs font-medium ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
