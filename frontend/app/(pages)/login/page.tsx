export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="grid min-h-screen place-items-center bg-background px-6 text-text-primary">
      <section className="w-full max-w-sm rounded-[8px] border border-border bg-surface p-6">
        <div className="mb-8 text-center">
          <div className="mx-auto grid size-12 place-items-center rounded-[8px] bg-primary text-lg font-bold text-text-button">
            RF
          </div>
          <h1 className="mt-4 text-2xl font-semibold">RupeeFlow</h1>
          <p className="mt-2 text-sm text-text-secondary">
            Sign in to manage your expenses.
          </p>
        </div>

        {error ? (
          <div className="mb-4 rounded-[8px] border border-red-400/30 bg-red-950/30 p-3 text-sm leading-6 text-red-200">
            {error}
          </div>
        ) : null}

        <form action="/auth/google" method="GET">
          <button
            className="flex h-11 w-full items-center justify-center gap-3 rounded-[8px] bg-primary px-4 text-sm font-semibold text-text-button transition hover:bg-primary-dark focus:outline-none focus:ring-4 focus:ring-primary/25"
            type="submit"
          >
            <span className="grid size-6 place-items-center rounded-full bg-text-primary text-sm font-bold text-text-button">
              G
            </span>
            Continue with Google
          </button>
        </form>
      </section>
    </main>
  );
}
