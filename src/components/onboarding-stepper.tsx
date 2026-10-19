'use client'

import Link from 'next/link'
import { CheckCircle2, Circle, Sparkles } from 'lucide-react'

interface OnboardingStepperProps {
  hasCard: boolean
  hasBillerRule: boolean
  hasSimulated: boolean
}

const STEPS: {
  key: keyof OnboardingStepperProps
  title: string
  href: string
}[] = [
  {
    key: 'hasCard',
    title: 'Link Your Primary Funding Source',
    href: '/cards',
  },
  {
    key: 'hasBillerRule',
    title: 'Update Your First Utility Biller',
    href: '#permanent-address',
  },
  {
    key: 'hasSimulated',
    title: 'Simulate Your First Pass-Through',
    href: '#simulator',
  },
]

export function OnboardingStepper({
  hasCard,
  hasBillerRule,
  hasSimulated,
}: OnboardingStepperProps) {
  const flags: OnboardingStepperProps = { hasCard, hasBillerRule, hasSimulated }
  const completed = STEPS.filter((step) => flags[step.key]).length

  if (completed === STEPS.length) {
    return null
  }

  return (
    <section className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-emerald-600" />
          <h2 className="text-sm font-bold text-gray-900">Get your autopilot live</h2>
        </div>
        <span className="text-[11px] font-semibold text-emerald-700">
          {completed} of {STEPS.length}
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-emerald-50">
        <div
          className="h-full rounded-full bg-emerald-600 transition-all"
          style={{ width: `${(completed / STEPS.length) * 100}%` }}
        />
      </div>
      <ol className="space-y-2">
        {STEPS.map((step, index) => {
          const done = flags[step.key]
          const className = `flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5 text-sm ${
            done
              ? 'border-emerald-100 bg-emerald-50/60 text-emerald-800'
              : 'border-gray-100 bg-white text-gray-900 hover:border-emerald-200'
          }`
          const body = (
            <>
              <span className="flex items-center gap-2.5">
                {done ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                ) : (
                  <Circle className="h-4 w-4 text-gray-300" />
                )}
                <span className={done ? 'font-medium' : 'font-semibold'}>
                  {index + 1}. {step.title}
                </span>
              </span>
              {!done && (
                <span className="text-[11px] font-bold uppercase tracking-wide text-emerald-700">
                  Start
                </span>
              )}
            </>
          )

          if (done) {
            return (
              <li key={step.key} className={className}>
                {body}
              </li>
            )
          }

          if (step.href.startsWith('#')) {
            return (
              <li key={step.key}>
                <a href={step.href} className={className}>
                  {body}
                </a>
              </li>
            )
          }

          return (
            <li key={step.key}>
              <Link href={step.href} className={className}>
                {body}
              </Link>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
