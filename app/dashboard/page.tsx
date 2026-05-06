const stats = [
  { label: "Total spend", value: "$18,420", change: "12% under budget" },
  { label: "This month", value: "$4,860", change: "$1,140 remaining" },
  { label: "Pending approvals", value: "9", change: "3 need review today" },
];

const transactions = [
  ["Cloud services", "Engineering", "$1,280", "Approved"],
  ["Team lunch", "Operations", "$342", "Pending"],
  ["Design software", "Product", "$620", "Approved"],
  ["Travel booking", "Sales", "$1,940", "Review"],
];

const budgets = [
  { name: "Operations", spent: 68 },
  { name: "Engineering", spent: 74 },
  { name: "Marketing", spent: 42 },
];

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-surface-muted text-secondary">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-border bg-secondary px-5 py-6 text-white lg:block">
        <div className="mb-10 flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-[8px] bg-primary text-lg font-bold text-secondary">
            ET
          </div>
          <div>
            <p className="font-semibold">Expense Tracker</p>
            <p className="text-xs text-white/52">Finance console</p>
          </div>
        </div>

        <nav className="space-y-1 text-sm">
          {["Overview", "Expenses", "Budgets", "Approvals", "Reports"].map(
            (item) => (
              <a
                className={`block rounded-[8px] px-3 py-2.5 ${
                  item === "Overview"
                    ? "bg-primary text-secondary"
                    : "text-white/68 transition hover:bg-white/8 hover:text-white"
                }`}
                href="#"
                key={item}
              >
                {item}
              </a>
            ),
          )}
        </nav>
      </aside>

      <div className="lg:pl-64">
        <header className="border-b border-border bg-surface px-6 py-5 sm:px-8">
          <div className="mx-auto flex max-w-7xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-primary">Dashboard</p>
              <h1 className="mt-1 text-3xl font-semibold tracking-normal">
                Company spending overview
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <button className="h-10 rounded-[8px] border border-border bg-white px-4 text-sm font-medium transition hover:border-primary">
                Export
              </button>
              <button className="h-10 rounded-[8px] bg-secondary px-4 text-sm font-medium text-white transition hover:bg-primary hover:text-secondary">
                Add expense
              </button>
            </div>
          </div>
        </header>

        <section className="mx-auto max-w-7xl px-6 py-8 sm:px-8">
          <div className="grid gap-4 md:grid-cols-3">
            {stats.map((stat) => (
              <article
                className="rounded-[8px] border border-border bg-surface p-5"
                key={stat.label}
              >
                <p className="text-sm text-secondary-muted">{stat.label}</p>
                <p className="mt-3 text-3xl font-semibold">{stat.value}</p>
                <p className="mt-2 text-sm font-medium text-primary">
                  {stat.change}
                </p>
              </article>
            ))}
          </div>

          <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_380px]">
            <section className="rounded-[8px] border border-border bg-surface">
              <div className="flex items-center justify-between border-b border-border p-5">
                <div>
                  <h2 className="text-lg font-semibold">Recent expenses</h2>
                  <p className="text-sm text-secondary-muted">
                    Latest activity across teams
                  </p>
                </div>
                <span className="rounded-[8px] bg-primary-soft px-3 py-1 text-sm font-medium text-primary-dark">
                  Live
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[620px] text-left text-sm">
                  <thead className="bg-surface-muted text-secondary-muted">
                    <tr>
                      <th className="px-5 py-3 font-medium">Merchant</th>
                      <th className="px-5 py-3 font-medium">Team</th>
                      <th className="px-5 py-3 font-medium">Amount</th>
                      <th className="px-5 py-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {transactions.map(([merchant, team, amount, status]) => (
                      <tr key={merchant}>
                        <td className="px-5 py-4 font-medium">{merchant}</td>
                        <td className="px-5 py-4 text-secondary-muted">
                          {team}
                        </td>
                        <td className="px-5 py-4">{amount}</td>
                        <td className="px-5 py-4">
                          <span className="rounded-[8px] bg-surface-muted px-2.5 py-1 text-xs font-medium">
                            {status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="rounded-[8px] border border-border bg-surface p-5">
              <h2 className="text-lg font-semibold">Budget health</h2>
              <p className="mt-1 text-sm text-secondary-muted">
                Spend against monthly limits
              </p>
              <div className="mt-6 space-y-5">
                {budgets.map((budget) => (
                  <div key={budget.name}>
                    <div className="mb-2 flex justify-between text-sm">
                      <span className="font-medium">{budget.name}</span>
                      <span className="text-secondary-muted">
                        {budget.spent}%
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-surface-muted">
                      <div
                        className="h-2 rounded-full bg-primary"
                        style={{ width: `${budget.spent}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}
