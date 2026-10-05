'use client'

import { useState } from 'react'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Logo } from './logo'
import { AuthCard, type AuthMode } from './auth-card'
import { TwoFactorSetup } from './two-factor-setup'
import { TwoFactorVerify } from './two-factor-verify'
import { AuthSuccess } from './auth-success'
import type { SecondFactorMethod } from './method-tabs'

type Step = 'credentials' | 'second-factor' | 'done'

const STEP_ORDER: Step[] = ['credentials', 'second-factor']

export function AuthFlow() {
  const [step, setStep] = useState<Step>('credentials')
  const [mode, setMode] = useState<AuthMode>('login')
  const [email, setEmail] = useState('')
  const [method, setMethod] = useState<SecondFactorMethod>('passkey')

  const labels = mode === 'signup' ? ['Create account', 'Set up 2FA'] : ['Sign in', 'Verify 2FA']
  const currentIndex = step === 'done' ? STEP_ORDER.length : STEP_ORDER.indexOf(step)

  function handleSecondFactor(usedMethod: SecondFactorMethod) {
    setMethod(usedMethod)
    setStep('done')
  }

  return (
    <section className="flex flex-col bg-muted/60">
      <header className="flex items-center justify-between px-6 py-5 sm:px-10">
        <Logo className="lg:invisible" />
        <ol className="flex items-center gap-2 text-xs font-medium" aria-label="Progress">
          {labels.map((label, index) => {
            const done = index < currentIndex
            const active = index === currentIndex
            return (
              <li key={label} className="flex items-center gap-2" aria-current={active ? 'step' : undefined}>
                {index > 0 && <span className="h-px w-6 bg-border" aria-hidden="true" />}
                <span
                  className={cn(
                    'flex size-5 items-center justify-center rounded-full border text-[10px]',
                    done && 'border-primary bg-primary text-primary-foreground',
                    active && 'border-primary text-primary',
                    !done && !active && 'border-border text-muted-foreground',
                  )}
                  aria-hidden="true"
                >
                  {done ? <Check className="size-3" /> : index + 1}
                </span>
                <span className={cn(done || active ? 'text-foreground' : 'text-muted-foreground')}>
                  {label}
                  {done && <span className="sr-only"> (complete)</span>}
                </span>
              </li>
            )
          })}
        </ol>
      </header>

      <div className="flex flex-1 justify-center px-4 pb-12 sm:px-10">
        <div className="w-full max-w-md pt-4 lg:pt-10">
          {step === 'credentials' && (
            <AuthCard
              mode={mode}
              onModeChange={setMode}
              defaultEmail={email}
              onComplete={(submittedEmail) => {
                setEmail(submittedEmail)
                setStep('second-factor')
              }}
            />
          )}
          {step === 'second-factor' &&
            (mode === 'signup' ? (
              <TwoFactorSetup
                email={email}
                onBack={() => setStep('credentials')}
                onComplete={handleSecondFactor}
              />
            ) : (
              <TwoFactorVerify
                email={email}
                onBack={() => setStep('credentials')}
                onComplete={handleSecondFactor}
              />
            ))}
          {step === 'done' && (
            <AuthSuccess
              mode={mode}
              method={method}
              onRestart={() => {
                setStep('credentials')
                setMode('login')
              }}
            />
          )}
        </div>
      </div>
    </section>
  )
}
