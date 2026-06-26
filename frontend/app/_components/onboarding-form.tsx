"use client";

import { Wallet } from "lucide-react";
import { FormEvent, useState } from "react";
import { Alert } from "./ui/alert";
import { Button } from "./ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";

type OnboardingFormProps = {
  error: string | null;
  onSubmit: (monthlyBudget: number) => Promise<void>;
  saving: boolean;
};

function parseBudgetInput(value: string) {
  return Number(value.replace(/,/g, "").replace(/[^\d.]/g, ""));
}

export function OnboardingForm({ error, onSubmit, saving }: OnboardingFormProps) {
  const [budgetInput, setBudgetInput] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const monthlyBudget = parseBudgetInput(budgetInput);

    if (!budgetInput.trim()) {
      setFieldError("Enter your monthly budget to continue.");
      return;
    }

    if (!Number.isFinite(monthlyBudget) || monthlyBudget <= 0) {
      setFieldError("Monthly budget must be greater than zero.");
      return;
    }

    setFieldError(null);
    await onSubmit(monthlyBudget);
  };

  return (
    <main className="app-gradient flex min-h-screen items-center justify-center px-6 py-16">
      <Card className="w-full max-w-md" padding="lg" variant="elevated">
        <CardHeader className="mb-6">
          <div className="flex size-11 items-center justify-center rounded-[var(--radius-md)] bg-primary-soft text-primary">
            <Wallet className="size-5" strokeWidth={1.75} />
          </div>
          <div className="mt-4">
            <CardTitle>Set your monthly budget</CardTitle>
            <CardDescription>
              Tell us how much you plan to spend each month. We use this on your
              dashboard to track budget utilization.
            </CardDescription>
          </div>
        </CardHeader>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <Input
            autoComplete="off"
            error={fieldError ?? undefined}
            hint="Amount in rupees (Rs)"
            inputMode="decimal"
            label="Monthly budget"
            min="1"
            onChange={(event) => {
              setBudgetInput(event.target.value);
              if (fieldError) {
                setFieldError(null);
              }
            }}
            placeholder="e.g. 50000"
            required
            step="1"
            type="text"
            value={budgetInput}
          />

          {error ? <Alert variant="error">{error}</Alert> : null}

          <Button className="w-full" loading={saving} size="lg" type="submit">
            Continue to dashboard
          </Button>
        </form>
      </Card>
    </main>
  );
}
