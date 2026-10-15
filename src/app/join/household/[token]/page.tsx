'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { Users, CheckCircle2, AlertCircle } from 'lucide-react'

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

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-xs text-gray-400">Loading invite details...</div>
      </div>
    )
  }

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

      const data = await res.json()
      if (res.ok) {
        setJoinedHousehold(data.householdName)
        setTimeout(() => {
          router.push('/')
        }, 1500)
      } else {
        setError(data.error || 'Failed to join household')
      }
    } catch (err: unknown) {
      const error = err as Error
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-8 shadow-xl border border-gray-100 space-y-6 text-center">
        <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto">
          <Users className="w-6 h-6" />
        </div>

        <div>
          <h2 className="text-xl font-bold text-gray-900">Joint Household Invitation</h2>
          <p className="text-xs text-gray-500 mt-1">
            You have been invited to share and manage a Joint Household Virtual BSB
          </p>
        </div>

        {joinedHousehold ? (
          <div className="p-4 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200 text-xs flex items-center justify-center gap-2 font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Joined {joinedHousehold}! Redirecting to Dashboard...
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
              onClick={handleJoin}
              disabled={loading}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold transition shadow-sm disabled:opacity-50"
            >
              {loading ? 'Joining Household...' : 'Accept Invitation & Sync Portfolio'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}