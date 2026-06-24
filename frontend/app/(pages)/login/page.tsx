const features = [
  {
    title: "Receipt review before saving",
    description:
      "Upload a receipt, review the extracted store, item, tax, discount, and total values, then save only after everything looks right.",
  },
  {
    title: "Expense history in one table",
    description:
      "Keep every saved receipt organized by store, amount, and date with quick access to the full receipt breakdown.",
  },
  {
    title: "Built for rupee tracking",
    description:
      "RupeeFlow keeps your spending workflow focused on practical day-to-day expense tracking.",
  },
];

const previewItems = [
  { amount: "3,250", item: "Basmati rice 5kg", quantity: "1" },
  { amount: "1,080", item: "Fresh milk 1L", quantity: "2" },
  { amount: "1,450", item: "Vegetables bundle", quantity: "1" },
];

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="min-h-screen bg-background text-text-primary">
      <section className="mx-auto grid max-w-7xl gap-10 px-6 py-12 lg:grid-cols-[1.02fr_0.98fr] lg:items-center">
        <div>
          <div className="text-sm font-medium text-primary">
             <div className="mb-5 grid size-10 place-items-center rounded-[8px] bg-primary text-lg font-bold text-text-button">
              RF
            </div>
            Receipt-to-expense workflow
          </div>
          <h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-tight tracking-normal sm:text-5xl">
            A clearer way to turn receipts into trusted expense records.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-text-secondary">
            RupeeFlow helps you upload receipts, review the extracted line
            items, adjust totals when OCR gets something wrong, and save a clean
            expense history.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <LoginButton label="Continue with Google" />
            <a
              className="flex h-11 items-center justify-center rounded-[8px] border border-border px-5 text-sm font-semibold text-text-primary transition hover:border-primary hover:text-primary"
              href="#how-it-works"
            >
              See how it works
            </a>
          </div>

          {error ? (
            <div className="mt-6 rounded-[8px] border border-red-400/30 bg-red-950/30 p-4 text-sm leading-6 text-red-200">
              {error}
            </div>
          ) : null}
        </div>

        <div className="rounded-[8px] border border-border bg-surface p-5 shadow-[0_24px_80px_rgba(0,0,0,0.22)]">
          <div className="flex items-center justify-between gap-4 border-b border-border pb-4">
            <div>
              <p className="text-sm text-text-secondary">Extracted receipt</p>
              <h2 className="mt-1 text-xl font-semibold">Keells Super</h2>
            </div>
            <div className="rounded-[8px] bg-primary-soft px-3 py-1.5 text-sm font-medium text-primary">
              Reviewed
            </div>
          </div>

          <div className="mt-4 overflow-hidden rounded-[8px] border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary">
                  <th className="px-4 py-3 text-left font-medium text-text-secondary">
                    Item
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-text-secondary">
                    Qty
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-text-secondary">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                {previewItems.map((item) => (
                  <tr className="border-b border-border" key={item.item}>
                    <td className="px-4 py-3">{item.item}</td>
                    <td className="px-4 py-3">{item.quantity}</td>
                    <td className="px-4 py-3">{item.amount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <SummaryTile label="Subtotal" value="5,780" />
            <SummaryTile label="Discount" value="250" />
            <SummaryTile label="Tax" value="0" />
            <SummaryTile label="Total" value="5,530" strong />
          </div>
        </div>
      </section>

      <section
        className="border-y border-border bg-surface px-6 py-10"
        id="how-it-works"
      >
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl">
            <p className="text-sm font-medium text-primary">How it works</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-normal">
              From receipt upload to clean Firestore data.
            </h2>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              ["1", "Upload one receipt", "Send one PDF or image for extraction."],
              [
                "2",
                "Review extracted fields",
                "Edit store name, items, discount, tax, and total before saving.",
              ],
              [
                "3",
                "Save expense history",
                "Store reviewed receipt details and view them later from the expenses table.",
              ],
            ].map(([step, title, description]) => (
              <article
                className="rounded-[8px] border border-border bg-background p-5"
                key={step}
              >
                <div className="grid size-9 place-items-center rounded-[8px] bg-primary text-sm font-bold text-text-button">
                  {step}
                </div>
                <h3 className="mt-4 font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-text-secondary">
                  {description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid gap-4 md:grid-cols-3">
          {features.map((feature) => (
            <article
              className="rounded-[8px] border border-border bg-surface p-5"
              key={feature.title}
            >
              <h3 className="font-semibold">{feature.title}</h3>
              <p className="mt-3 text-sm leading-6 text-text-secondary">
                {feature.description}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="px-6 pb-12">
        <div className="mx-auto max-w-7xl rounded-[8px] border border-border bg-surface p-6 sm:flex sm:items-center sm:justify-between sm:gap-8">
          <div>
            <p className="text-sm font-medium text-primary">Ready to continue?</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-normal">
              Log in to manage your RupeeFlow workspace.
            </h2>
            <p className="mt-2 text-sm leading-6 text-text-secondary">
              Use your Google account to access the dashboard, receipts, and
              expense history.
            </p>
          </div>
          <div className="mt-5 sm:mt-0">
            <LoginButton label="Log in with Google" />
          </div>
        </div>
      </section>
    </main>
  );
}

function LoginButton({
  compact = false,
  label,
}: {
  compact?: boolean;
  label: string;
}) {
  return (
    <form action="/auth/google" method="GET">
      <button
        className={`flex items-center justify-center gap-3 rounded-[8px] bg-primary text-sm font-semibold text-text-button transition hover:bg-primary-dark focus:outline-none focus:ring-4 focus:ring-primary/25 ${
          compact ? "h-10 px-4" : "h-11 px-5"
        }`}
        type="submit"
      >
        <span className="grid size-6 place-items-center rounded-full bg-text-primary text-sm font-bold text-text-button">
          G
        </span>
        {label}
      </button>
    </form>
  );
}

function SummaryTile({
  label,
  strong = false,
  value,
}: {
  label: string;
  strong?: boolean;
  value: string;
}) {
  return (
    <div className="rounded-[8px] border border-border bg-secondary px-3 py-2">
      <p className="text-xs font-medium uppercase tracking-wide text-text-secondary">
        {label}
      </p>
      <p
        className={`mt-1 text-sm ${
          strong ? "font-semibold text-primary" : "text-text-primary"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
