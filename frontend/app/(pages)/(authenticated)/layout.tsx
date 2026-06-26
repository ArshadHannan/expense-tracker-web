import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AuthenticatedGate } from "../../_components/authenticated-gate";

export default async function AuthenticatedLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return <AuthenticatedGate user={user}>{children}</AuthenticatedGate>;
}
