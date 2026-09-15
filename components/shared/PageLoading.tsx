export interface PageLoadingProps {
  title?: string;
  className?: string;
  /** When true, omit sidebar/header chrome (for use inside app layout). */
  embedded?: boolean;
}

function LoadingBody({ title }: { title: string }) {
  return (
    <>
      <div className="mb-6 flex items-center gap-3">
        <svg
          className="h-5 w-5 animate-spin text-swapspot-blue"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
        <p className="text-sm font-medium text-slate-600">{title}</p>
      </div>

      <div className="animate-pulse space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="h-24 rounded-2xl bg-white shadow-sm ring-1 ring-slate-100" />
          <div className="h-24 rounded-2xl bg-white shadow-sm ring-1 ring-slate-100" />
          <div className="h-24 rounded-2xl bg-white shadow-sm ring-1 ring-slate-100" />
          <div className="h-24 rounded-2xl bg-white shadow-sm ring-1 ring-slate-100" />
        </div>
        <div className="h-64 rounded-2xl bg-white shadow-sm ring-1 ring-slate-100" />
        <div className="h-48 rounded-2xl bg-white shadow-sm ring-1 ring-slate-100" />
      </div>
    </>
  );
}

export function PageLoading({
  title = "Loading…",
  className = "",
  embedded = false,
}: PageLoadingProps) {
  if (embedded) {
    return (
      <div className={`flex-1 p-6 lg:p-8 ${className}`.trim()}>
        <LoadingBody title={title} />
      </div>
    );
  }

  return (
    <div className={`flex min-h-screen bg-slate-50 ${className}`.trim()}>
      <aside
        className="hidden w-64 shrink-0 border-r border-slate-200 bg-white lg:block"
        aria-hidden="true"
      >
        <div className="animate-pulse space-y-4 p-6">
          <div className="h-8 w-32 rounded-lg bg-slate-200" />
          <div className="h-4 w-24 rounded bg-slate-100" />
          <div className="mt-8 space-y-3">
            <div className="h-10 rounded-lg bg-slate-100" />
            <div className="h-10 rounded-lg bg-slate-100" />
            <div className="h-10 rounded-lg bg-slate-100" />
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="animate-pulse border-b border-slate-200 bg-white px-6 py-4">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-full bg-slate-200" />
            <div className="h-4 max-w-xs flex-1 rounded bg-slate-100" />
          </div>
        </header>

        <main className="flex-1 p-6 lg:p-8">
          <LoadingBody title={title} />
        </main>
      </div>
    </div>
  );
}
