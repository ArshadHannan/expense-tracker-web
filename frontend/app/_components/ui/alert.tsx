import type { ReactNode } from "react";
import { AlertCircle, CheckCircle2, Info } from "lucide-react";

type AlertVariant = "error" | "success" | "info";

const variantStyles: Record<AlertVariant, string> = {
  error: "border-destructive/30 bg-destructive-soft text-red-200",
  success: "border-primary/30 bg-primary-soft text-primary",
  info: "border-border bg-surface-muted text-text-secondary",
};

const icons: Record<AlertVariant, ReactNode> = {
  error: <AlertCircle className="size-4 shrink-0 text-destructive" />,
  success: <CheckCircle2 className="size-4 shrink-0 text-primary" />,
  info: <Info className="size-4 shrink-0 text-text-secondary" />,
};

export function Alert({
  children,
  variant = "error",
  className = "",
}: {
  children: ReactNode;
  variant?: AlertVariant;
  className?: string;
}) {
  return (
    <div
      className={`flex items-start gap-3 rounded-[var(--radius-md)] border p-4 text-sm leading-relaxed ${variantStyles[variant]} ${className}`}
      role="alert"
    >
      {icons[variant]}
      <div>{children}</div>
    </div>
  );
}
