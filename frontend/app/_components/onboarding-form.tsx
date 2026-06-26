"use client";

import { Wallet } from "lucide-react";
import { FormEvent, useState } from "react";
import { useAccount } from "../_lib/account-context";
import { parseAmountInput } from "../_lib/receipt-form-utils";
import { Alert } from "./ui/alert";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Input } from "./ui/input";

export function OnboardingForm() {
  const { error, saveMonthlyBudget } = useAccount();
  const [budgetInput, setBudgetInput] = useState("");
  const [fieldError, setFieldError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFieldError("");
    setSaveError("");

    const monthlyBudget = parseAmountInput(budgetInput);

    if (monthlyBudget <= 0) {
      setFieldError("Enter a monthly budget greater than zero.");
      return;
    }

    try {
      setIsSaving(true);
      await saveMonthlyBudget(monthlyBudget);
    } catch (err) {
      setSaveError(
        err instanceof Error ? err.message : "Unable to save monthly budget.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Card className="w-full max-w-lg" padding="lg">
        <div className="flex size-12 items-center justify-center rounded-[var(--radius-lg)] bg-primary-soft text-primary">
          <Wallet className="size-5" strokeWidth={1.75} />
        </div>

        <h1 className="mt-5 text-2xl font-semibold tracking-tight text-text-primary">
          Set your monthly budget
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-text-secondary">
          Before you can use the dashboard, tell us how much you plan to spend
          this month. We&apos;ll use it to track utilization and projections.
        </p>

        {error ? (
          <Alert className="mt-5" variant="error">
            {error}
          </Alert>
        ) : null}

        <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
          <Input
            autoFocus
            error={fieldError}
            hint="Amount in Sri Lankan rupees (Rs)"
            inputMode="decimal"
            label="Monthly budget"
            onChange={(event) => setBudgetInput(event.target.value)}
            placeholder="e.g. 50000"
            required
            type="text"
            value={budgetInput}
          />

          {saveError ? (
            <Alert variant="error">{saveError}</Alert>
          ) : null}

          <Button className="w-full" loading={isSaving} size="lg" type="submit">
            Continue to dashboard
          </Button>
        </form>
      </Card>
    </div>
  );
}
