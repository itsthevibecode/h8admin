'use client'

import { FormEvent, useCallback, useEffect, useState } from 'react'

type AllowRow = { id: string; email: string; notes: string | null; createdAt: string }
type FeedRow = {
  id: string
  email: string
  billerName: string
  amountCents: number
  status: string
  feeWaived: boolean
  createdAt: string
}

type Snapshot = {
  users: number
  betaTesters: number
  nonBetaCount: number
  betaGraduationTarget: number
  betaFreeUnlocked: boolean
  monthVolumeCents: number
  successCount: number
  declinedCount: number
  allowlist: AllowRow[]
  feed: FeedRow[]
}

function money(cents: number) {
  return (cents / 100).toLocaleString('en-AU', { style: 'currency', currency: 'AUD' })
}

function when(iso: string) {
  return new Date(iso).toLocaleString('en-AU', {
    timeZone: 'Australia/Sydney',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function AdminConsole() {
  const [data, setData] = useState<Snapshot | null>(null)
  const [error, setError] = useState('')
  const [email, setEmail] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    const res = await fetch('/api/admin')
    const body = (await res.json()) as Snapshot & { error?: string }
    if (!res.ok) {
      setError(body.error || 'Admin data is unavailable.')
      return
    }
    setData(body)
    setError('')
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const add = async (event: FormEvent) => {
    event.preventDefault()
    setSaving(true)
    const res = await fetch('/api/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, notes }),
    })
    const body = (await res.json().catch(() => null)) as { error?: string } | null
    setSaving(false)
    if (!res.ok) {
      setError(body?.error || 'Could not add that email.')
      return
    }
    setEmail('')
    setNotes('')
    await load()
  }

  const remove = async (target: string) => {
    const res = await fetch('/api/admin', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: target }),
    })
    if (res.ok) await load()
  }

  if (!data) {
    return <p className="text-sm text-gray-500">{error || 'Loading admin…'}</p>
  }

  const cards = [
    ['Accounts', String(data.users)],
    ['Beta testers', String(data.betaTesters)],
    ['Non-beta toward free routing', `${data.nonBetaCount} / ${data.betaGraduationTarget}`],
    ['Beta routing', data.betaFreeUnlocked ? 'Free, permanently' : 'Cost price'],
    ['Month volume', money(data.monthVolumeCents)],
    ['Debits this month', `${data.successCount} settled · ${data.declinedCount} declined`],
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Admin</h1>
        <p className="text-sm text-gray-500">Private beta controls for this platform.</p>
      </div>
      {error && <p className="text-sm font-semibold text-red-700">{error}</p>}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">{label}</p>
            <p className="mt-1 text-lg font-bold text-gray-900">{value}</p>
          </div>
        ))}
      </div>

      <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-bold text-gray-900">Beta allowlist</h2>
        <form onSubmit={(event) => void add(event)} className="mt-4 flex flex-wrap gap-2">
          <input
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="tester@email.com"
            className="min-w-56 flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm"
          />
          <input
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Notes"
            className="min-w-40 flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Add'}
          </button>
        </form>
        <ul className="mt-4 divide-y divide-gray-100">
          {data.allowlist.map((row) => (
            <li key={row.id} className="flex items-center justify-between gap-3 py-2 text-sm">
              <div>
                <p className="font-medium text-gray-900">{row.email}</p>
                {row.notes && <p className="text-xs text-gray-500">{row.notes}</p>}
              </div>
              <button
                type="button"
                onClick={() => void remove(row.email)}
                className="text-xs font-semibold text-red-700 hover:underline"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <h2 className="border-b border-gray-100 px-5 py-4 text-sm font-bold text-gray-900">
          Direct debit audit
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-2">When</th>
                <th className="px-4 py-2">Account</th>
                <th className="px-4 py-2">Biller</th>
                <th className="px-4 py-2">Amount</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Fee</th>
              </tr>
            </thead>
            <tbody>
              {data.feed.map((row) => (
                <tr key={row.id} className="border-t border-gray-100">
                  <td className="px-4 py-2 text-gray-600">{when(row.createdAt)}</td>
                  <td className="px-4 py-2">{row.email}</td>
                  <td className="px-4 py-2">{row.billerName}</td>
                  <td className="px-4 py-2 font-mono">{money(row.amountCents)}</td>
                  <td className="px-4 py-2">{row.status}</td>
                  <td className="px-4 py-2">{row.feeWaived ? 'Waived' : 'Charged'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {data.feed.length === 0 && (
            <p className="px-5 py-8 text-sm text-gray-500">No direct debits recorded yet.</p>
          )}
        </div>
      </section>
    </div>
  )
}
