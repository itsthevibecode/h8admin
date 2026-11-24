'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertCircle, Building2, CheckCircle2, EyeOff, ShieldCheck } from 'lucide-react'

export default function JoinPropertyPage({
  params,
}: {
  params: Promise<{ token: string }> | { token: string }
}) {
  const resolvedParams = params instanceof Promise ? use(params) : params
  const token = resolvedParams?.token
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [joined, setJoined] = useState(false)
  const [mounted, setMounted] = useState(false)
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleJoin = async () => {
    if (!token) {
      setError('Invalid or missing token')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/properties/accept-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })
      if (res.status === 401) {
        router.push(`/login?callbackUrl=${encodeURIComponent(`/join/property/${token}`)}`)
        return
      }
      const data = (await res.json()) as { error?: string }
      if (!res.ok) {
        setError(data.error || 'Failed to join this property')
        return
      }
      setJoined(true)
      window.setTimeout(() => {
        router.push('/direct-debits/investment')
      }, 1600)
    } catch (err: unknown) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-emerald-50/70 p-4">
        <div className="text-xs font-medium text-emerald-700">Loading invitation…</div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-emerald-50 to-white p-4">
      <div className="w-full max-w-lg space-y-6 rounded-2xl border border-emerald-100 bg-white p-8 shadow-xl">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
          <Building2 className="h-6 w-6" />
        </div>
        <div className="space-y-1 text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-700">H8Admin</p>
          <h1 className="text-2xl font-bold text-gray-900">Investment property partner</h1>
          <p className="text-sm text-gray-500">
            You have been invited as a business partner or equity owner. You will see this
            property&apos;s Virtual BSB. Your bill privacy is separate from the owner&apos;s.
          </p>
        </div>
        <ul className="space-y-2 rounded-xl border border-emerald-100 bg-emerald-50/60 p-4 text-xs text-gray-700">
          <li className="flex gap-2">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
            Partners can view the property address and its debits.
          </li>
          <li className="flex gap-2">
            <EyeOff className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
            Funding cards stay private. Sharing bill details is opted in from Settings, per person.
          </li>
        </ul>
        {joined ? (
          <div className="flex items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" /> You&apos;re on this property. Opening it…
          </div>
        ) : (
          <div className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}
            <button
              type="button"
              onClick={() => void handleJoin()}
              disabled={loading}
              className="w-full rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {loading ? 'Accepting invitation…' : 'Accept property invitation'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
