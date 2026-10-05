import { ArrowLeft, ShieldCheck } from 'lucide-react'

export function StepCard({
  title,
  description,
  badge,
  onBack,
  children,
}: {
  title: string
  description: React.ReactNode
  badge?: string
  onBack: () => void
  children: React.ReactNode
}) {
  return (
    <section aria-labelledby="step-heading" className="rounded-2xl border bg-card p-6 shadow-sm shadow-primary/5 sm:p-8">
      <button
        type="button"
        onClick={onBack}
        className="-ml-2 flex items-center gap-1.5 rounded-md px-2 py-1 text-sm font-medium text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back
      </button>

      <div className="mt-5 flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <ShieldCheck className="size-5" aria-hidden="true" />
        </span>
        <div className="flex min-w-0 flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 id="step-heading" className="text-xl font-semibold tracking-tight text-balance">
              {title}
            </h2>
            {badge && (
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold tracking-wide text-primary uppercase">
                {badge}
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-6">{children}</div>
    </section>
  )
}
