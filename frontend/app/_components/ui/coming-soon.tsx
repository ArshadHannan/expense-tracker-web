import type { LucideIcon } from "lucide-react";
import { Card } from "./card";
import { Badge } from "./badge";

type ComingSoonProps = {
  title: string;
  description: string;
  icon: LucideIcon;
  features?: string[];
};

export function ComingSoon({
  title,
  description,
  icon: Icon,
  features = [],
}: ComingSoonProps) {
  return (
    <Card className="relative overflow-hidden" padding="lg">
      <div className="pointer-events-none absolute -right-12 -top-12 size-48 rounded-full bg-primary/5 blur-3xl" />
      <div className="relative mx-auto max-w-lg text-center">
        <div className="mx-auto flex size-16 items-center justify-center rounded-[var(--radius-xl)] bg-primary-soft text-primary">
          <Icon className="size-7" strokeWidth={1.5} />
        </div>
        <Badge className="mt-6" variant="primary">
          Coming soon
        </Badge>
        <h2 className="mt-4 text-2xl font-semibold tracking-tight text-text-primary">
          {title}
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-text-secondary">
          {description}
        </p>
        {features.length > 0 ? (
          <ul className="mt-8 space-y-3 text-left">
            {features.map((feature) => (
              <li
                className="flex items-center gap-3 rounded-[var(--radius-md)] border border-border/50 bg-surface-muted/50 px-4 py-3 text-sm text-text-secondary"
                key={feature}
              >
                <span className="size-1.5 shrink-0 rounded-full bg-primary" />
                {feature}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </Card>
  );
}
