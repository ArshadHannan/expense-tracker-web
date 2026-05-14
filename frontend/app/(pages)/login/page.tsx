export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="min-h-screen bg-background px-6 py-8 text-text-primary">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-6xl overflow-hidden rounded-[8px] border border-border bg-surface shadow-[0_24px_80px_rgba(16,16,16,0.08)] lg:grid-cols-[1.02fr_0.98fr]">
        <section className="flex flex-col justify-between bg-secondary p-8 text-text-primary sm:p-10 lg:p-12">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-[8px] bg-primary text-lg font-bold text-text-button">
              ET
            </div>
            <span className="text-sm font-semibold uppercase tracking-[0.18em] text-text-secondary">
              Expense Tracker
            </span>
          </div>

          <div className="my-16 max-w-lg">
            <p className="mb-5 text-sm font-medium text-primary">
              Unified finance workspace
            </p>
            <h1 className="text-4xl font-semibold leading-tight tracking-normal sm:text-5xl">
              Sign in with Google. Keep every spend decision clear.
            </h1>
            <p className="mt-6 text-base leading-7 text-text-secondary">
              Use your Google account to review budgets and keep approvals
              moving without juggling separate tools.
            </p>
          </div>

          <div className="grid gap-3 text-sm text-text-secondary sm:grid-cols-3">
            {["Google login", "Budget controls", "Live insights"].map((item) => (
              <div key={item} className="border-t border-white/14 pt-4">
                {item}
              </div>
            ))}
          </div>
        </section>

        <section className="flex items-center justify-center px-6 py-12 sm:px-10">
          <div className="w-full max-w-md">
            <div className="mb-9">
              <p className="text-sm font-medium text-primary">Welcome back</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-normal text-text-primary">
                Log in to your account
              </h2>
              <p className="mt-3 text-sm leading-6 text-text-secondary">
                Continue with Google to access your dashboard.
              </p>
            </div>

            {error ? (
              <div className="mb-5 rounded-[8px] border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-700">
                {error}
              </div>
            ) : null}

            <form action="/auth/google" method="GET">
              <button
                className="flex h-12 w-full items-center justify-center gap-3 rounded-[8px] bg-primary px-5 text-sm font-semibold text-text-button transition hover:bg-primary-dark focus:outline-none focus:ring-4 focus:ring-primary/25"
                type="submit"
              >
                <span className="grid size-6 place-items-center rounded-full bg-text-primary text-sm font-bold text-text-button">
                  G
                </span>
                Continue with Google
              </button>
            </form>

            <div className="my-8 flex items-center gap-4 text-xs uppercase tracking-[0.16em] text-text-secondary">
              <span className="h-px flex-1 bg-border" />
              Secure access
              <span className="h-px flex-1 bg-border" />
            </div>

            <div className="rounded-[8px] border border-border bg-primary-soft p-4 text-sm leading-6 text-text-secondary">
              Google authentication is enabled for this app. Configure your
              Google OAuth client credentials in the environment file.
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
