import Link from "next/link";

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-surface-muted px-6 py-8 text-secondary">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-6xl overflow-hidden rounded-[8px] border border-border bg-surface shadow-[0_24px_80px_rgba(16,16,16,0.08)] lg:grid-cols-[1.02fr_0.98fr]">
        <section className="flex flex-col justify-between bg-secondary p-8 text-white sm:p-10 lg:p-12">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-[8px] bg-primary text-lg font-bold text-secondary">
              ET
            </div>
            <span className="text-sm font-semibold uppercase tracking-[0.18em] text-white/72">
              Expense Tracker
            </span>
          </div>

          <div className="my-16 max-w-lg">
            <p className="mb-5 text-sm font-medium text-primary">
              Unified finance workspace
            </p>
            <h1 className="text-4xl font-semibold leading-tight tracking-normal sm:text-5xl">
              Sign in once. Keep every spend decision clear.
            </h1>
            <p className="mt-6 text-base leading-7 text-white/68">
              Connect through your organization, review budgets, and keep
              approvals moving without juggling separate tools.
            </p>
          </div>

          <div className="grid gap-3 text-sm text-white/72 sm:grid-cols-3">
            {["SSO ready", "Budget controls", "Live insights"].map((item) => (
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
              <h2 className="mt-3 text-3xl font-semibold tracking-normal text-secondary">
                Log in to your account
              </h2>
              <p className="mt-3 text-sm leading-6 text-secondary-muted">
                Use single sign-on to continue with your company identity.
              </p>
            </div>

            <form className="space-y-5">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-secondary">
                  Work email
                </span>
                <input
                  className="h-12 w-full rounded-[8px] border border-border bg-white px-4 text-base text-secondary outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/15"
                  name="email"
                  placeholder="you@company.com"
                  type="email"
                />
              </label>

              <Link
                className="flex h-12 w-full items-center justify-center rounded-[8px] bg-primary px-5 text-sm font-semibold text-secondary transition hover:bg-primary-dark hover:text-white focus:outline-none focus:ring-4 focus:ring-primary/25"
                href="/dashboard"
              >
                Continue with SSO
              </Link>
            </form>

            <div className="my-8 flex items-center gap-4 text-xs uppercase tracking-[0.16em] text-secondary-muted">
              <span className="h-px flex-1 bg-border" />
              Secure access
              <span className="h-px flex-1 bg-border" />
            </div>

            <div className="rounded-[8px] border border-border bg-primary-soft p-4 text-sm leading-6 text-secondary-muted">
              SSO can be connected to your identity provider when auth is wired
              in. This page is ready for that handoff.
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
