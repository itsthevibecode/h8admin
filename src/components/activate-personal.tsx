'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { User } from 'lucide-react'

export function ActivatePersonal() {
  const router = useRouter()
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')

  const activate = async () => {
    setCreating(true)
    setError('')
    try {
      const res = await fetch('/api/virtual-accounts/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountType: 'INDIVIDUAL' }),
      })
      const data = (await res.json()) as { error?: string }
      if (!res.ok) {
        setError(data.error || 'Could not activate this billing method')
        return
      }
      router.refresh()
    } catch {
      setError('Could not activate this billing method')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="space-y-4 rounded-2xl border border-emerald-100 bg-white p-8 shadow-sm">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
        <User className="h-6 w-6" />
      </div>
      <h2 className="text-lg font-bold text-gray-900">Activate your personal billing method</h2>
      <p className="text-sm text-gray-600">
        A Virtual BSB is issued only when you activate this method. Until then, no personal account
        details are shown to billers or on this page.
      </p>
      {error && <p className="text-xs font-semibold text-rose-700">{error}</p>}
      <button
        type="button"
        onClick={() => void activate()}
        disabled={creating}
        className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
      >
        {creating ? 'Activating…' : 'Activate personal account'}
      </button>
    </div>
  )
}
