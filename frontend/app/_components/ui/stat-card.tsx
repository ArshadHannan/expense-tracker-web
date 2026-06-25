import type { ReactNode } from "react";
import { Card } from "./card";

type StatCardProps = {
  label: string;
  value: string;
  hint?: string;
  icon?: ReactNode;
  trend?: {
    value: string;
    positive?: boolean;
  };
  accent?: boolean;
};

export function StatCard({
  label,
  value,
  hint,
  icon,
  trend,
  accent = false,
}: StatCardProps) {
  return (
    <Card
      className={`group relative overflow-hidden ${accent ? "border-primary/20 bg-gradient-to-br from-primary-soft/40 to-surface" : ""}`}
      hover
    >
      {accent ? (
        <div className="pointer-events-none absolute -right-6 -top-6 size-24 rounded-full bg-primary/10 blur-2xl transition-all duration-300 group-hover:bg-primary/15" />
      ) : null}
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-text-secondary">{label}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-text-primary">
            {value}
          </p>
          {hint ? (
            <p className="mt-2 text-xs text-text-tertiary">{hint}</p>
          ) : null}
          {trend ? (
            <p
              className={`mt-2 text-xs font-medium ${trend.positive ? "text-primary" : "text-text-secondary"}`}
            >
              {trend.value}
            </p>
          ) : null}
        </div>
        {icon ? (
          <div className="flex size-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-primary-soft text-primary">
            {icon}
          </div>
        ) : null}
      </div>
    </Card>
  );
}
