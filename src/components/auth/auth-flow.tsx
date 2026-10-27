'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { AlertCircle, Loader2 } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { getSafeCallbackUrl } from '@/lib/auth-redirect'

export function AuthFlow() {
  const searchParams = useSearchParams()
  const closedBeta = searchParams.get('error') === 'closed-beta'
  const [mode, setMode] = useState<'signin' | 'signup'>(closedBeta ? 'signup' : 'signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [loading, setLoading] = useState(false)
  
  const router = useRouter()
  const callbackUrl = getSafeCallbackUrl(searchParams.get('callbackUrl'))
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')
    setLoading(true)

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
    <div className="w-full max-w-md rounded-2xl border border-gray-100 bg-white p-8 shadow-md">
      <h2 className="text-lg font-bold text-gray-900">Welcome to H8Admin</h2>
      <p className="mt-1 text-sm text-gray-500">
        Sign in to your autopilot, or request access to the private beta.
      </p>
      <div className="mt-6 flex border-b border-gray-100">
        <button
          type="button"
          className={`flex-1 py-2 text-center text-sm font-medium ${
            mode === 'signin'
              ? 'border-b-2 border-emerald-600 text-emerald-700'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => {
            setMode('signin')
            setErrorMsg('')
          }}
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
          onClick={() => {
            setMode('signup')
            setErrorMsg('')
          }}
        >
          Request Beta Access
        </button>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
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

        <div>
          <label htmlFor="auth-password" className="mb-1 block text-xs font-semibold text-gray-700">
            Password
          </label>
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
          {loading ? 'Please wait…' : mode === 'signup' ? 'Request Beta Access' : 'Sign In'}
        </button>
      </form>
    </div>
  )
}