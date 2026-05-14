import { getCurrentUser } from "@/lib/auth";
import ExpensesContent from "./expenses-content";

export default async function ExpensesPage() {
  const user = await getCurrentUser();

  return <ExpensesContent userEmail={user?.email ?? ""} />;
}
