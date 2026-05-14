import { getCurrentUser } from "@/lib/auth";
import OverviewContent from "./overview-content";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  return <OverviewContent userEmail={user?.email ?? ""} />;
}
