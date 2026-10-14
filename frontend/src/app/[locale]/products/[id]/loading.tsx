export default function ProductLoading() {
  return (
    <div className="relative overflow-hidden blueprint-grid min-h-screen py-10 md:py-16">
      <div className="container-custom relative z-10">
        {/* Back navigation placeholder */}
        <div className="mb-6 h-5 w-36 rounded bg-[var(--surface-2)] border border-[var(--line)] animate-pulse" />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Main Content (2 Columns) */}
          <div className="lg:col-span-2 space-y-8">
            <div className="deeptools-card rounded-2xl p-6 md:p-8 animate-pulse">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-6 w-20 rounded bg-[var(--surface-3)]" />
                <div className="h-6 w-14 rounded bg-[var(--surface-3)]" />
              </div>
              <div className="h-10 w-3/4 rounded bg-[var(--surface-3)] mb-4" />
              <div className="space-y-2">
                <div className="h-4 w-full rounded bg-[var(--surface-2)]" />
                <div className="h-4 w-5/6 rounded bg-[var(--surface-2)]" />
                <div className="h-4 w-2/3 rounded bg-[var(--surface-2)]" />
              </div>
              <div className="mt-8 pt-6 border-t border-[var(--line)] grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="h-8 rounded bg-[var(--surface-2)]" />
                <div className="h-8 rounded bg-[var(--surface-2)]" />
                <div className="h-8 rounded bg-[var(--surface-2)]" />
              </div>
            </div>

            <div className="deeptools-card rounded-2xl p-6 md:p-8 animate-pulse">
              <div className="h-6 w-32 rounded bg-[var(--surface-3)] mb-4" />
              <div className="space-y-3">
                <div className="h-4 w-full rounded bg-[var(--surface-2)]" />
                <div className="h-4 w-full rounded bg-[var(--surface-2)]" />
                <div className="h-4 w-4/5 rounded bg-[var(--surface-2)]" />
              </div>
            </div>
          </div>

          {/* Sticky Purchase Widget (1 Column) */}
          <div className="lg:col-span-1 space-y-6">
            <div className="deeptools-card rounded-2xl p-6 md:p-8 animate-pulse">
              <div className="h-4 w-20 rounded bg-[var(--surface-2)] mb-2" />
              <div className="h-10 w-32 rounded bg-[var(--surface-3)] mb-6" />
              <div className="h-12 w-full rounded-xl bg-[var(--surface-3)] mb-4" />
              <div className="h-4 w-3/4 rounded bg-[var(--surface-2)] mx-auto" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
