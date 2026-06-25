import type { HTMLAttributes, ReactNode } from "react";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  variant?: "default" | "elevated" | "ghost";
  padding?: "none" | "sm" | "md" | "lg";
  hover?: boolean;
};

const variantStyles = {
  default: "bg-surface border border-border shadow-sm",
  elevated: "bg-surface-elevated border border-border shadow-md",
  ghost: "bg-transparent border border-border/50",
};

const paddingStyles = {
  none: "",
  sm: "p-4",
  md: "p-5",
  lg: "p-6",
};

export function Card({
  children,
  variant = "default",
  padding = "md",
  hover = false,
  className = "",
  ...props
}: CardProps) {
  return (
    <div
      className={`rounded-[var(--radius-lg)] transition-all duration-200 ${variantStyles[variant]} ${paddingStyles[padding]} ${hover ? "hover:border-primary/30 hover:shadow-md" : ""} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`mb-4 flex items-start justify-between gap-4 ${className}`}>
      {children}
    </div>
  );
}

export function CardTitle({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <h3 className={`text-base font-semibold tracking-tight text-text-primary ${className}`}>
      {children}
    </h3>
  );
}

export function CardDescription({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <p className={`mt-1 text-sm text-text-secondary ${className}`}>{children}</p>
  );
}
