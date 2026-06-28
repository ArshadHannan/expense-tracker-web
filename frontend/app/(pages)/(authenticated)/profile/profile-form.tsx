"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { User, Wallet, Save } from "lucide-react";
import { useAccount } from "@/app/_lib/use-account";
import { Alert } from "@/app/_components/ui/alert";
import { Button } from "@/app/_components/ui/button";
import { Input } from "@/app/_components/ui/input";
import { Card, CardTitle, CardDescription } from "@/app/_components/ui/card";

type ProfileFormProps = {
  initialName: string;
  initialEmail: string;
};

function parseBudgetInput(value: string) {
  return Number(value.replace(/,/g, "").replace(/[^\d.]/g, ""));
}

export function ProfileForm({ initialName, initialEmail }: ProfileFormProps) {
  const router = useRouter();
  const { monthlyBudget, loading: budgetLoading, saveMonthlyBudget } = useAccount();

  const [name, setName] = useState(initialName);
  const [budgetInput, setBudgetInput] = useState("");

  const [savingProfile, setSavingProfile] = useState(false);
  const [savingBudget, setSavingBudget] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [budgetError, setBudgetError] = useState<string | null>(null);
  const [budgetSuccess, setBudgetSuccess] = useState(false);

  useEffect(() => {
    if (monthlyBudget !== null) {
      setBudgetInput(String(monthlyBudget));
    }
  }, [monthlyBudget]);

  const initials = name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  async function handleProfileSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setProfileError(null);
    setProfileSuccess(false);

    if (!name.trim()) {
      setProfileError("Name is required.");
      return;
    }

    try {
      setSavingProfile(true);
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.error ?? "Failed to update profile.");
      }

      setProfileSuccess(true);
      router.refresh();
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : "Failed to update profile.");
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleBudgetSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBudgetError(null);
    setBudgetSuccess(false);

    const budget = parseBudgetInput(budgetInput);

    if (!budgetInput.trim()) {
      setBudgetError("Enter a monthly budget amount.");
      return;
    }
    if (!Number.isFinite(budget) || budget <= 0) {
      setBudgetError("Monthly budget must be greater than zero.");
      return;
    }

    try {
      setSavingBudget(true);
      await saveMonthlyBudget(budget);
      setBudgetSuccess(true);
    } catch (err) {
      setBudgetError(err instanceof Error ? err.message : "Failed to save budget.");
    } finally {
      setSavingBudget(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Avatar */}
      <div className="flex items-center gap-4">
        <div className="grid size-16 shrink-0 place-items-center rounded-full bg-primary-soft text-xl font-semibold text-primary">
          {initials || <User className="size-7" />}
        </div>
        <div>
          <p className="text-base font-semibold">{name || "Your Name"}</p>
          <p className="text-sm text-text-tertiary">{initialEmail}</p>
        </div>
      </div>

      <div className="h-px bg-border" />

      {/* Personal Details */}
      <Card padding="lg" variant="elevated">
        <div className="mb-5">
          <div className="flex size-9 items-center justify-center rounded-[var(--radius-md)] bg-primary-soft text-primary">
            <User className="size-4" strokeWidth={1.75} />
          </div>
          <div className="mt-3">
            <CardTitle>Personal details</CardTitle>
            <CardDescription>Update your display name. Email is linked to your Google account and cannot be changed here.</CardDescription>
          </div>
        </div>

        <form className="space-y-4" onSubmit={handleProfileSubmit}>
          <Input
            autoComplete="name"
            label="Full name"
            onChange={(e) => {
              setName(e.target.value);
              setProfileSuccess(false);
            }}
            placeholder="Your full name"
            type="text"
            value={name}
          />
          <div>
            <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-text-secondary">
              Email address
            </span>
            <div className="flex h-9 w-full items-center rounded-[var(--radius-md)] border border-border bg-surface-muted/50 px-3 text-sm text-text-tertiary">
              {initialEmail}
            </div>
            <p className="mt-1.5 text-xs text-text-tertiary">Linked to your Google account</p>
          </div>

          {profileError ? <Alert variant="error">{profileError}</Alert> : null}
          {profileSuccess ? (
            <Alert variant="success">Profile updated successfully.</Alert>
          ) : null}

          <Button
            className="w-full sm:w-auto"
            leftIcon={<Save className="size-3.5" />}
            loading={savingProfile}
            size="md"
            type="submit"
          >
            Save details
          </Button>
        </form>
      </Card>

      {/* Monthly Budget */}
      <Card padding="lg" variant="elevated">
        <div className="mb-5">
          <div className="flex size-9 items-center justify-center rounded-[var(--radius-md)] bg-primary-soft text-primary">
            <Wallet className="size-4" strokeWidth={1.75} />
          </div>
          <div className="mt-3">
            <CardTitle>Monthly budget</CardTitle>
            <CardDescription>
              Set your monthly spending limit. Used to track budget utilization on
              your dashboard.
            </CardDescription>
          </div>
        </div>

        <form className="space-y-4" onSubmit={handleBudgetSubmit}>
          <Input
            autoComplete="off"
            disabled={budgetLoading}
            hint="Amount in rupees (Rs)"
            inputMode="decimal"
            label="Monthly budget"
            onChange={(e) => {
              setBudgetInput(e.target.value);
              setBudgetSuccess(false);
            }}
            placeholder="e.g. 50000"
            type="text"
            value={budgetInput}
          />

          {budgetError ? <Alert variant="error">{budgetError}</Alert> : null}
          {budgetSuccess ? (
            <Alert variant="success">Monthly budget updated.</Alert>
          ) : null}

          <Button
            className="w-full sm:w-auto"
            disabled={budgetLoading}
            leftIcon={<Save className="size-3.5" />}
            loading={savingBudget}
            size="md"
            type="submit"
          >
            Save budget
          </Button>
        </form>
      </Card>
    </div>
  );
}
