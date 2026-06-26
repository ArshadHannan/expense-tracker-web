import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AccountProvider } from "../../_lib/account-context";
import { OnboardingGate } from "../../_components/onboarding-gate";
import DashboardShell from "../../_components/dashboard-shell";

export default async function AuthenticatedLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <AccountProvider>
      <DashboardShell user={user}>
        <OnboardingGate>{children}</OnboardingGate>
      </DashboardShell>
    </AccountProvider>
  );
}
