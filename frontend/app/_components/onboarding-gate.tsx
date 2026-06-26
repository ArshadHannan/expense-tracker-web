"use client";

import type { ReactNode } from "react";
import { useAccount } from "../_lib/account-context";
import { OnboardingForm } from "./onboarding-form";
import { DashboardSkeleton } from "./ui/loading-state";

type OnboardingGateProps = {
  children: ReactNode;
};

export function OnboardingGate({ children }: OnboardingGateProps) {
  const { account, loading } = useAccount();

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (!account.onboarded || account.monthly_budget === null) {
    return <OnboardingForm />;
  }

  return children;
}
