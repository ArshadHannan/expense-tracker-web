"use client";

import type { ReactNode } from "react";
import type { SessionUser } from "@/lib/auth";
import { useAccount } from "../_lib/use-account";
import DashboardShell from "./dashboard-shell";
import { OnboardingForm } from "./onboarding-form";
import { Alert } from "./ui/alert";
import { LoadingState } from "./ui/loading-state";

type AuthenticatedGateProps = {
  children: ReactNode;
  user: SessionUser;
};

export function AuthenticatedGate({ children, user }: AuthenticatedGateProps) {
  const { error, loading, onboarded, saveMonthlyBudget, saving } = useAccount();

  if (loading) {
    return (
      <main className="app-gradient flex min-h-screen items-center justify-center px-6 py-16">
        <LoadingState message="Loading your account..." />
      </main>
    );
  }

  if (error && !onboarded) {
    return (
      <main className="app-gradient flex min-h-screen items-center justify-center px-6 py-16">
        <div className="w-full max-w-md">
          <Alert variant="error">Error: {error}</Alert>
        </div>
      </main>
    );
  }

  if (!onboarded) {
    return (
      <OnboardingForm
        error={error}
        onSubmit={saveMonthlyBudget}
        saving={saving}
      />
    );
  }

  return <DashboardShell user={user}>{children}</DashboardShell>;
}
