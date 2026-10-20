'use client'

import { FormEvent, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ShieldCheck } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { getSafeCallbackUrl } from '@/lib/auth-redirect'

export function SecondFactorForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = getSafeCallbackUrl(searchParams.get('callbackUrl'))
  const [code, setCode] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [loading, setLoading] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      const supabase = createClient()
      const { data } = await supabase.auth.getUser()
      if (cancelled) return
      if (!data.user) {
        router.replace(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`)
        return
      }
      const verified = data.user.factors?.some((factor) => factor.status === 'verified')
      if (!verified) {
        router.replace(callbackUrl)
        return
      }
      setReady(true)
    })()
    return () => {
      cancelled = true
    }
  }, [callbackUrl, router])

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (code.length !== 6) return
    setErrorMsg('')
    setLoading(true)
    const supabase = createClient()
    const factors = await supabase.auth.mfa.listFactors()
    const factor = factors.data?.totp[0]
    if (factors.error || !factor) {
      setErrorMsg(factors.error?.message || 'No authenticator is set up on this account.')
      setLoading(false)
      return
    }
    const verified = await supabase.auth.mfa.challengeAndVerify({
      factorId: factor.id,
      code,
    })
    if (verified.error) {
      setErrorMsg(verified.error.message)
      setLoading(false)
      return
    }
    router.push(callbackUrl)
    router.refresh()
  }

  return (
    <div className="w-full max-w-md p-8 bg-white rounded-xl shadow-md border border-gray-100">
      <div className="mb-6 flex items-center gap-2">
        <ShieldCheck className="h-5 w-5 text-emerald-600" />
        <h1 className="text-lg font-bold text-gray-900">Authenticator code</h1>
      </div>
      <p className="mb-6 text-sm text-gray-500">
        Enter the 6-digit code from the authenticator app on this account.
      </p>
      <form onSubmit={(event) => void submit(event)} className="space-y-4">
        <input
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]*"
          maxLength={6}
          value={code}
          onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-center font-mono text-lg tracking-[0.4em] focus:outline-none focus:ring-2 focus:ring-emerald-500"
          aria-label="Authenticator code"
          disabled={!ready || loading}
        />
        {errorMsg && (
          <div className="rounded-md border border-red-200 bg-red-50 p-3 text-xs text-red-600">{errorMsg}</div>
        )}
        <button
          type="submit"
          disabled={!ready || loading || code.length !== 6}
          className="w-full rounded-md bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {loading ? 'Checking…' : 'Continue'}
        </button>
      </form>
    </div>
  )
}
