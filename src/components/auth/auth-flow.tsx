'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { getSafeCallbackUrl } from '@/lib/auth-redirect'

type Mode = 'signin' | 'signup' | 'forgot'

function siteOrigin() {
  if (typeof window !== 'undefined') return window.location.origin
  return (process.env.NEXT_PUBLIC_SITE_URL || 'https://h8admin.com').replace(/\/$/, '')
}

export function AuthFlow() {
  const searchParams = useSearchParams()
  const closedBeta = searchParams.get('error') === 'closed-beta'
  const [mode, setMode] = useState<Mode>(closedBeta ? 'signup' : 'signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [infoMsg, setInfoMsg] = useState('')
  const [loading, setLoading] = useState(false)

  const router = useRouter()
  const callbackUrl = getSafeCallbackUrl(searchParams.get('callbackUrl'))
  const supabase = createClient()

  const switchMode = (next: Mode) => {
    setMode(next)
    setErrorMsg('')
    setInfoMsg('')
  }

  const handleForgot = async () => {
    setErrorMsg('')
    setInfoMsg('')
    setLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${siteOrigin()}/login/update-password`,
    })
    setLoading(false)
    if (error) {
      setErrorMsg(error.message)
      return
    }
    setInfoMsg('If that email is registered, a reset link is on its way. Check your inbox.')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')
    setInfoMsg('')
    setLoading(true)

    if (mode === 'forgot') {
      await handleForgot()
      return
    }

    if (mode === 'signup') {
      const gate = await fetch('/api/auth/can-register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const gateBody = (await gate.json().catch(() => null)) as { error?: string } | null
      if (!gate.ok) {
        setErrorMsg(gateBody?.error || 'This email cannot register during the private beta.')
        setLoading(false)
        return
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      })

      if (error) {
        setErrorMsg(error.message)
      } else if (data.user) {
        router.push(callbackUrl)
        router.refresh()
      }
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setErrorMsg(error.message)
      } else if (data.user) {
        const factors = await supabase.auth.mfa.listFactors()
        const verified = Boolean(factors.data?.totp.length)
        if (!verified) {
          router.push('/login/enroll')
        } else {
          const { data: assurance } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
          if (assurance?.nextLevel === 'aal2' && assurance.currentLevel !== 'aal2') {
            router.push(`/login/verify?callbackUrl=${encodeURIComponent(callbackUrl)}`)
          } else {
            router.push(callbackUrl)
          }
        }
        router.refresh()
      }
    }

    setLoading(false)
  }

  return (
    <div className="my-auto w-full max-w-md rounded-2xl border border-gray-100 bg-white p-8 shadow-md">
      <h2 className="text-lg font-bold text-gray-900">
        {mode === 'forgot' ? 'Reset your password' : 'Welcome to H8Admin'}
      </h2>
      <p className="mt-1 text-sm text-gray-500">
        {mode === 'forgot'
          ? 'Enter the email on your account and we will send a secure reset link.'
          : 'Sign in to your autopilot, or request access to the private beta.'}
      </p>

      {mode !== 'forgot' && (
        <div className="mt-6 flex border-b border-gray-100">
          <button
            type="button"
            className={`flex-1 py-2 text-center text-sm font-medium ${
              mode === 'signin'
                ? 'border-b-2 border-emerald-600 text-emerald-700'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => switchMode('signin')}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`flex-1 py-2 text-center text-sm font-medium ${
              mode === 'signup'
                ? 'border-b-2 border-emerald-600 text-emerald-700'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => switchMode('signup')}
          >
            Request Beta Access
          </button>
        </div>
      )}

      <form onSubmit={(event) => void handleSubmit(event)} className="mt-6 space-y-4">
        <div>
          <label htmlFor="auth-email" className="mb-1 block text-xs font-semibold text-gray-700">
            Email
          </label>
          <input
            id="auth-email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder="name@email.com"
          />
        </div>

        {mode !== 'forgot' && (
          <div>
            <div className="mb-1 flex items-center justify-between gap-2">
              <label htmlFor="auth-password" className="block text-xs font-semibold text-gray-700">
                Password
              </label>
              {mode === 'signin' && (
                <button
                  type="button"
                  onClick={() => switchMode('forgot')}
                  className="text-xs font-semibold text-emerald-700 hover:text-emerald-800"
                >
                  Forgot password?
                </button>
              )}
            </div>
            <input
              id="auth-password"
              type="password"
              required
              minLength={6}
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="At least 6 characters"
            />
          </div>
        )}

        {infoMsg && (
          <div className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            <p>{infoMsg}</p>
          </div>
        )}

        {(errorMsg || closedBeta) && (
          <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>{errorMsg || 'H8Admin is in a private beta. This email is not on the tester list.'}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {loading
            ? 'Please wait…'
            : mode === 'signup'
              ? 'Request Beta Access'
              : mode === 'forgot'
                ? 'Send reset link'
                : 'Sign In'}
        </button>
      </form>

      {mode === 'forgot' && (
        <button
          type="button"
          onClick={() => switchMode('signin')}
          className="mt-4 w-full text-center text-xs font-semibold text-emerald-700 hover:text-emerald-800"
        >
          Back to Sign In
        </button>
      )}
    </div>
  )
}
