'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  AlertCircle,
  CheckCircle2,
  EyeOff,
  ShieldCheck,
  Users,
} from 'lucide-react'

export default function JoinHouseholdPage({
  params,
}: {
  params: Promise<{ token: string }> | { token: string }
}) {
  const resolvedParams = params instanceof Promise ? use(params) : params
  const token = resolvedParams?.token

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [joinedHousehold, setJoinedHousehold] = useState('')
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
      const res = await fetch('/api/households/accept-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })

      if (res.status === 401) {
        router.push(`/login?callbackUrl=${encodeURIComponent(`/join/household/${token}`)}`)
        return
      }

      const data = (await res.json()) as { householdName?: string; error?: string }
      if (res.ok && data.householdName) {
        setJoinedHousehold(data.householdName)
        setTimeout(() => {
          router.push('/')
        }, 1600)
      } else {
        setError(data.error || 'Failed to join household')
      }
    } catch (err: unknown) {
      const caught = err as Error
      setError(caught.message)
    } finally {
      setLoading(false)
    }
  }

  if (!mounted) {
    return (
      <div className="min-h-screen bg-emerald-50/70 flex items-center justify-center p-4">
        <div className="text-xs text-emerald-700 font-medium">Loading invitation…</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-8 shadow-xl border border-emerald-100 space-y-6">
        <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto">
          <Users className="w-6 h-6" />
        </div>

        <div className="text-center space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-700">
            H8Admin
          </p>
          <h1 className="text-2xl font-bold text-gray-900">Joint Financial Autopilot</h1>
          <p className="text-sm text-gray-500">
            You have been invited to share a Household Virtual BSB — without exposing
            each other&apos;s underlying funding cards.
          </p>
        </div>

        <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-4 space-y-3 text-left">
          <p className="text-xs font-bold text-emerald-900 uppercase tracking-wide">
            Shared access rules
          </p>
          <ul className="space-y-2 text-xs text-gray-700">
            <li className="flex gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              Both partners can view and route bills against the joint Virtual BSB.
            </li>
            <li className="flex gap-2">
              <EyeOff className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              Personal funding accounts stay zero-knowledge. Card PANs never leave the vault.
            </li>
            <li className="flex gap-2">
              <Users className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              Sharing personal bills is opt-in per member via household privacy settings.
            </li>
          </ul>
        </div>

        {joinedHousehold ? (
          <div className="p-4 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200 text-sm flex items-center justify-center gap-2 font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            You&apos;re in {joinedHousehold}. Redirecting to your dashboard…
          </div>
        ) : (
          <div className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            <button
              onClick={() => void handleJoin()}
              disabled={loading}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold transition shadow-sm disabled:opacity-50"
            >
              {loading ? 'Accepting invitation…' : 'Accept Household Invitation'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
