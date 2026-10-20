'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

export function EnrollMfaGate() {
  const router = useRouter()
  const [factorId, setFactorId] = useState('')
  const [qr, setQr] = useState('')
  const [secret, setSecret] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const start = async () => {
    setError('')
    setLoading(true)
    const supabase = createClient()
    const existing = await supabase.auth.mfa.listFactors()
    if (existing.error) {
      setError(existing.error.message)
      setLoading(false)
      return
    }
    if (existing.data?.totp[0]) {
      router.push('/')
      router.refresh()
      return
    }
    for (const stale of existing.data?.all.filter((item) => item.status !== 'verified') ?? []) {
      await supabase.auth.mfa.unenroll({ factorId: stale.id })
    }
    const enrolled = await supabase.auth.mfa.enroll({
      factorType: 'totp',
      friendlyName: 'Authenticator app',
      issuer: 'H8Admin',
    })
    if (enrolled.error || !enrolled.data) {
      setError(enrolled.error?.message || 'Could not start authenticator setup.')
      setLoading(false)
      return
    }
    const image = enrolled.data.totp.qr_code
    setFactorId(enrolled.data.id)
    setSecret(enrolled.data.totp.secret)
    setQr(image.startsWith('data:') ? image : `data:image/svg+xml;utf-8,${encodeURIComponent(image)}`)
    setLoading(false)
  }

  const confirm = async (event: FormEvent) => {
    event.preventDefault()
    if (code.length !== 6) return
    setError('')
    setLoading(true)
    const supabase = createClient()
    const verified = await supabase.auth.mfa.challengeAndVerify({ factorId, code })
    if (verified.error) {
      setError(verified.error.message)
      setLoading(false)
      return
    }
    router.push('/')
    router.refresh()
  }

  return (
    <div className="w-full max-w-md rounded-xl border border-gray-100 bg-white p-8 shadow-md">
      <h1 className="text-lg font-bold text-gray-900">Set up your authenticator</h1>
      <p className="mt-2 text-sm text-gray-500">
        Every account needs an authenticator app before the dashboard opens. Use Google Authenticator, 1Password, or Authy.
      </p>
      {!qr ? (
        <button
          type="button"
          onClick={() => void start()}
          disabled={loading}
          className="mt-6 w-full rounded-md bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {loading ? 'Starting…' : 'Show QR code'}
        </button>
      ) : (
        <form onSubmit={(event) => void confirm(event)} className="mt-6 space-y-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qr} alt="QR code for the H8Admin authenticator" className="h-36 w-36 rounded-xl border border-gray-200 p-2" />
          <p className="break-all font-mono text-xs text-gray-700">{secret}</p>
          <input
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={code}
            onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
            aria-label="Authenticator code"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-center font-mono text-lg tracking-[0.4em]"
          />
          <button
            type="submit"
            disabled={loading || code.length !== 6}
            className="w-full rounded-md bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {loading ? 'Checking…' : 'Turn on and continue'}
          </button>
          <button
            type="button"
            onClick={() => {
              const id = factorId
              setQr('')
              setSecret('')
              setFactorId('')
              setCode('')
              if (id) void createClient().auth.mfa.unenroll({ factorId: id })
            }}
            className="w-full text-xs font-semibold text-gray-500 hover:text-gray-800"
          >
            Cancel
          </button>
        </form>
      )}
      {error && <p className="mt-4 text-xs font-semibold text-red-700">{error}</p>}
      <button
        type="button"
        onClick={() => void createClient().auth.signOut().then(() => router.push('/login'))}
        className="mt-6 text-xs font-semibold text-gray-500 hover:text-gray-800"
      >
        Sign out
      </button>
    </div>
  )
}
