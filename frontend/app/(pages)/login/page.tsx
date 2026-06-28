import Image from "next/image";
import {
  ArrowRight,
  CheckCircle2,
  Receipt,
  Shield,
  Sparkles,
  Table2,
  TrendingUp,
} from "lucide-react";
import { Badge } from "../../_components/ui/badge";
import { Button } from "../../_components/ui/button";
import { Card } from "../../_components/ui/card";
import { Alert } from "../../_components/ui/alert";

const features = [
  {
    icon: Receipt,
    title: "Receipt review before saving",
    description:
      "Upload a receipt, review extracted store, item, tax, discount, and total values, then save only after everything looks right.",
  },
  {
    icon: Table2,
    title: "Expense history in one table",
    description:
      "Keep every saved receipt organized by store, amount, and date with quick access to the full breakdown.",
  },
  {
    icon: TrendingUp,
    title: "Spending predictions from past data",
    description:
      "RupeeFlow analyses your saved receipts month over month to forecast how much you're likely to spend, so you can adjust before you overshoot.",
  },
  {
    icon: Shield,
    title: "Built for rupee tracking",
    description:
      "RupeeFlow keeps your spending workflow focused on practical day-to-day expense tracking.",
  },
];

const previewItems = [
  { amount: "3,250", item: "Basmati rice 5kg", quantity: "1" },
  { amount: "1,080", item: "Fresh milk 1L", quantity: "2" },
  { amount: "1,450", item: "Vegetables bundle", quantity: "1" },
];

const spendingData = [
  { month: "Jan", amount: 38200 },
  { month: "Feb", amount: 41500 },
  { month: "Mar", amount: 36800 },
  { month: "Apr", amount: 44100 },
  { month: "May", amount: 39700 },
  { month: "Jun", amount: 42300, predicted: true },
];

const predictionPoints = [
  "Forecasts next month's spend based on your last 3–6 months of receipts",
  "Highlights categories where you're trending over budget",
  "Updates automatically each time you save a new receipt",
];

const steps = [
  {
    step: "01",
    title: "Upload one receipt",
    description: "Send one PDF or image for extraction.",
  },
  {
    step: "02",
    title: "Review extracted fields",
    description: "Edit store name, items, discount, tax, and total before saving.",
  },
  {
    step: "03",
    title: "Save expense history",
    description: "Store reviewed receipt details and view them from the expenses table.",
  },
];

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="app-gradient min-h-screen text-text-primary">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-32 top-0 size-96 rounded-full bg-primary/8 blur-3xl" />
          <div className="absolute -right-32 bottom-0 size-80 rounded-full bg-primary/5 blur-3xl" />
        </div>

        <div className="relative mx-auto grid max-w-7xl gap-12 px-6 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:py-24">
          <div className="animate-fade-up">
            <div className="flex items-center gap-3">
              <div className="grid size-10 place-items-center rounded-[var(--radius-md)] bg-primary text-sm font-bold text-text-button shadow-glow">
                RF
              </div>
              <Badge variant="primary">
                <Sparkles className="mr-1 size-3" />
                RupeeFlow
              </Badge>
            </div>

            <h1 className="mt-8 max-w-2xl text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl lg:text-[3.25rem]">
              Turn receipts into trusted expense records
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-text-secondary">
              Upload receipts, review extracted line items, adjust totals when OCR
              gets something wrong, and save a clean expense history. All in one
              place.
            </p>

            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <LoginButton label="Continue with Google" />
              <a
                className="inline-flex h-10 items-center justify-center gap-2 rounded-[var(--radius-md)] border border-border px-5 text-sm font-medium text-text-primary transition hover:border-primary/40 hover:bg-primary-soft/20"
                href="#how-it-works"
              >
                See how it works
                <ArrowRight className="size-3.5" />
              </a>
            </div>

            {error ? (
              <Alert className="mt-8" variant="error">
                {error}
              </Alert>
            ) : null}
          </div>

          {/* Preview card */}
          <Card
            className="animate-fade-up stagger-2 shadow-xl"
            padding="none"
            variant="elevated"
          >
            <div className="flex items-center justify-between gap-4 border-b border-border px-6 py-5">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-text-tertiary">
                  Extracted receipt
                </p>
                <h2 className="mt-1 text-lg font-semibold tracking-tight">
                  Keells Super
                </h2>
              </div>
              <Badge variant="success">
                <CheckCircle2 className="mr-1 size-3" />
                Reviewed
              </Badge>
            </div>

            <div className="mx-6 mt-5 overflow-hidden rounded-[var(--radius-md)] border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-surface-muted/50">
                    <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-text-tertiary">
                      Item
                    </th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-text-tertiary">
                      Qty
                    </th>
                    <th className="px-4 py-2.5 text-right text-xs font-medium uppercase tracking-wider text-text-tertiary">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {previewItems.map((item) => (
                    <tr key={item.item}>
                      <td className="px-4 py-3 text-text-primary">{item.item}</td>
                      <td className="px-4 py-3 text-text-secondary">
                        {item.quantity}
                      </td>
                      <td className="px-4 py-3 text-right font-medium tabular-nums">
                        {item.amount}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid gap-3 p-6 sm:grid-cols-2">
              <SummaryTile label="Subtotal" value="5,780" />
              <SummaryTile label="Discount" value="250" />
              <SummaryTile label="Tax" value="0" />
              <SummaryTile highlight label="Total" value="5,530" />
            </div>
          </Card>
        </div>
      </section>

      {/* How it works */}
      <section
        className="border-y border-border/60 bg-surface/40 px-6 py-16 backdrop-blur-sm"
        id="how-it-works"
      >
        <div className="mx-auto max-w-7xl">
          <div className="max-w-xl">
            <p className="text-xs font-medium uppercase tracking-wider text-primary">
              How it works
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight">
              From receipt upload to clean expense data
            </h2>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {steps.map((step, index) => (
              <Card
                className={`animate-fade-up stagger-${index + 1} relative overflow-hidden`}
                hover
                key={step.step}
              >
                <span className="text-4xl font-bold text-primary/20">
                  {step.step}
                </span>
                <h3 className="mt-4 font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-text-secondary">
                  {step.description}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Predictions section */}
      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <div className="animate-fade-up">
            <p className="text-xs font-medium uppercase tracking-wider text-primary">
              Spending intelligence
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight">
              Know where your budget is heading
            </h2>
            <p className="mt-4 text-base leading-relaxed text-text-secondary">
              RupeeFlow analyses your past months of saved receipts to predict how
              much you'll spend this month, so you can course-correct early
              instead of overspending and finding out too late.
            </p>
            <ul className="mt-6 space-y-3">
              {predictionPoints.map((point) => (
                <li
                  className="flex items-start gap-2.5 text-sm text-text-secondary"
                  key={point}
                >
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
                  {point}
                </li>
              ))}
            </ul>
          </div>

          <Card
            className="animate-fade-up stagger-2 shadow-xl"
            padding="none"
            variant="elevated"
          >
            <div className="flex items-center justify-between gap-4 border-b border-border px-6 py-5">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-text-tertiary">
                  Spending trend
                </p>
                <h3 className="mt-1 text-lg font-semibold tracking-tight">
                  Monthly forecast
                </h3>
              </div>
              <div className="flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary-soft/40 px-3 py-1 text-xs font-medium text-primary">
                <TrendingUp className="size-3" />
                Predicted
              </div>
            </div>

            <div className="px-6 pb-2 pt-6">
              <div className="flex h-36 items-end gap-2">
                {spendingData.map((d) => {
                  const heightPct = Math.round((d.amount / 50000) * 100);
                  return (
                    <div
                      className="flex flex-1 flex-col items-center gap-1.5"
                      key={d.month}
                    >
                      <span className="text-[10px] tabular-nums text-text-tertiary">
                        {Math.round(d.amount / 1000)}k
                      </span>
                      <div
                        className={`w-full rounded-t-[3px] transition-all ${
                          d.predicted
                            ? "border border-dashed border-primary/50 bg-primary-soft/40"
                            : "bg-primary/70"
                        }`}
                        style={{ height: `${heightPct}%` }}
                      />
                    </div>
                  );
                })}
              </div>
              <div className="mt-1.5 flex gap-2">
                {spendingData.map((d) => (
                  <div className="flex flex-1 justify-center" key={d.month}>
                    <span
                      className={`text-[10px] font-medium ${d.predicted ? "text-primary" : "text-text-tertiary"}`}
                    >
                      {d.month}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 p-6 pt-4">
              <SummaryTile label="Avg last 5 months" value="40,060" />
              <SummaryTile highlight label="Predicted (Jun)" value="42,300" />
            </div>
          </Card>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-6 sm:grid-cols-2">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Card hover key={feature.title}>
                <div className="flex size-10 items-center justify-center rounded-[var(--radius-md)] bg-primary-soft text-primary">
                  <Icon className="size-5" strokeWidth={1.75} />
                </div>
                <h3 className="mt-4 font-semibold">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-text-secondary">
                  {feature.description}
                </p>
              </Card>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 pb-16">
        <Card
          className="relative mx-auto max-w-7xl overflow-hidden"
          padding="lg"
          variant="elevated"
        >
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-primary-soft/20 to-transparent" />
          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-primary">
                Ready to continue?
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                Log in to manage your RupeeFlow workspace
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-text-secondary">
                Use your Google account to access the dashboard, receipts, and
                expense history.
              </p>
            </div>
            <LoginButton label="Log in with Google" />
          </div>
        </Card>
      </section>
    </main>
  );
}

function LoginButton({ label }: { label: string }) {
  return (
    <form action="/auth/google" method="GET">
      <Button
        className="w-full sm:w-auto"
        leftIcon={
          <Image alt="Google logo" height={18} src="/google.svg" width={18} />
        }
        size="lg"
        type="submit"
      >
        {label}
      </Button>
    </form>
  );
}

function SummaryTile({
  label,
  highlight = false,
  value,
}: {
  label: string;
  highlight?: boolean;
  value: string;
}) {
  return (
    <div
      className={`rounded-[var(--radius-md)] border px-4 py-3 ${
        highlight
          ? "border-primary/30 bg-primary-soft/30"
          : "border-border bg-surface-muted/30"
      }`}
    >
      <p className="text-[11px] font-medium uppercase tracking-wider text-text-tertiary">
        {label}
      </p>
      <p
        className={`mt-1 text-sm tabular-nums ${
          highlight ? "font-semibold text-primary" : "text-text-primary"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
