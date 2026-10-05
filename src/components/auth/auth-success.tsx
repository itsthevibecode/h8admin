import { ArrowRight, ShieldCheck } from 'lucide-react'
import type { SecondFactorMethod } from './method-tabs'

export function AuthSuccess({
  mode,
  method,
  onRestart,
}: {
  mode: 'login' | 'signup'
  method: SecondFactorMethod
  onRestart: () => void
}) {
  const methodLabel = method === 'passkey' ? 'passkey' : 'authenticator app'

  return (
    <section
      aria-labelledby="success-heading"
      className="flex flex-col items-center gap-4 rounded-2xl border border-primary/30 bg-card p-8 text-center shadow-sm shadow-primary/5 sm:p-10"
    >
      <span className="flex size-14 items-center justify-center rounded-full bg-accent text-primary">
        <ShieldCheck className="size-7" aria-hidden="true" />
      </span>
      <div className="flex flex-col gap-1.5">
        <h2 id="success-heading" className="text-xl font-semibold tracking-tight">
          {mode === 'signup' ? 'Your account is secured' : 'You’re signed in'}
        </h2>
        <p className="text-sm text-pretty text-muted-foreground">
          {mode === 'signup'
            ? `Two-factor authentication is enabled with your ${methodLabel}.`
            : `Verified with your ${methodLabel}.`}
        </p>
      </div>
      <button
        type="button"
        onClick={onRestart}
        className="group mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary text-sm font-semibold text-primary-foreground shadow-md shadow-primary/25 transition-all outline-none hover:bg-primary/90 focus-visible:ring-3 focus-visible:ring-primary/30"
      >
        Go to dashboard
        <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
      </button>
    </section>
  )
}
