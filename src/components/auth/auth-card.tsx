'use client'

import { useId, useState } from 'react'
import { ArrowRight, Eye, EyeOff, Lock, Mail } from 'lucide-react'
import { cn } from '@/lib/utils'

export type AuthMode = 'login' | 'signup'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function AuthCard({
  mode,
  onModeChange,
  defaultEmail,
  onComplete,
}: {
  mode: AuthMode
  onModeChange: (mode: AuthMode) => void
  defaultEmail: string
  onComplete: (email: string) => void
}) {
  const setMode = onModeChange
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})
  const emailId = useId()
  const passwordId = useId()

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const email = String(data.get('email') ?? '').trim()
    const password = String(data.get('password') ?? '')
    const nextErrors: typeof errors = {}

    if (!EMAIL_PATTERN.test(email)) nextErrors.email = 'Enter a valid email address.'
    if (password.length < 8) nextErrors.password = 'Password must be at least 8 characters.'

    setErrors(nextErrors)
    if (Object.keys(nextErrors).length === 0) onComplete(email)
  }

  return (
    <div className="rounded-2xl border bg-card p-6 shadow-sm shadow-primary/5 sm:p-8">
      <div className="flex flex-col gap-1.5">
        <h2 className="text-2xl font-semibold tracking-tight text-balance">
          {mode === 'login' ? 'Welcome back' : 'Create your account'}
        </h2>
        <p className="text-sm text-muted-foreground">
          {mode === 'login'
            ? 'Sign in to access your financial address.'
            : 'Claim your permanent financial address in minutes.'}
        </p>
      </div>

      <div role="tablist" aria-label="Authentication mode" className="mt-6 grid grid-cols-2 rounded-lg bg-muted p-1">
        {(['login', 'signup'] as const).map((value) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={mode === value}
            onClick={() => {
              setMode(value)
              setErrors({})
            }}
            className={cn(
              'rounded-md py-2 text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring',
              mode === value ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {value === 'login' ? 'Log in' : 'Sign up'}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} noValidate className="mt-6 flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <label htmlFor={emailId} className="text-sm font-medium">
            Email
          </label>
          <div className="relative">
            <Mail
              className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <input
              id={emailId}
              name="email"
              type="email"
              autoComplete="email"
              defaultValue={defaultEmail}
              placeholder="you@company.com"
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? `${emailId}-error` : undefined}
              className="h-11 w-full rounded-lg border border-input bg-background pr-3 pl-10 text-sm transition-colors outline-none placeholder:text-muted-foreground/70 focus:border-primary focus:ring-3 focus:ring-primary/15 aria-invalid:border-destructive aria-invalid:ring-destructive/15"
            />
          </div>
          {errors.email && (
            <p id={`${emailId}-error`} className="text-xs text-destructive">
              {errors.email}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label htmlFor={passwordId} className="text-sm font-medium">
              Password
            </label>
            {mode === 'login' && (
              <a href="#" className="text-xs font-medium text-primary hover:underline">
                Forgot password?
              </a>
            )}
          </div>
          <div className="relative">
            <Lock
              className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <input
              id={passwordId}
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              placeholder={mode === 'login' ? 'Enter your password' : 'At least 8 characters'}
              aria-invalid={Boolean(errors.password)}
              aria-describedby={errors.password ? `${passwordId}-error` : undefined}
              className="h-11 w-full rounded-lg border border-input bg-background pr-11 pl-10 text-sm transition-colors outline-none placeholder:text-muted-foreground/70 focus:border-primary focus:ring-3 focus:ring-primary/15 aria-invalid:border-destructive aria-invalid:ring-destructive/15"
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              aria-pressed={showPassword}
              className="absolute top-1/2 right-1.5 flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          {errors.password && (
            <p id={`${passwordId}-error`} className="text-xs text-destructive">
              {errors.password}
            </p>
          )}
        </div>

        <button
          type="submit"
          className="group mt-1 flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary text-sm font-semibold text-primary-foreground shadow-md shadow-primary/25 transition-all outline-none hover:bg-primary/90 focus-visible:ring-3 focus-visible:ring-primary/30 active:translate-y-px"
        >
          Continue
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
        </button>

        <p className="text-center text-xs text-muted-foreground">
          {mode === 'signup'
            ? 'Next, you’ll secure your account with a passkey or authenticator app.'
            : 'You’ll confirm with your passkey or authenticator app next.'}
        </p>
      </form>

      <p className="mt-6 text-center text-xs leading-relaxed text-muted-foreground">
        {'By continuing you agree to the '}
        <a href="#" className="font-medium text-foreground underline-offset-4 hover:underline">
          Terms
        </a>
        {' and '}
        <a href="#" className="font-medium text-foreground underline-offset-4 hover:underline">
          Privacy Policy
        </a>
        .
      </p>
    </div>
  )
}
