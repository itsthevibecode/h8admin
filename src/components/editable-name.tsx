'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Pencil, X } from 'lucide-react'
import { cleanBillingName } from '@/lib/billing-name'

function cleanDraft(value: string) {
  return value.trim().replace(/\s+/g, ' ').slice(0, 40)
}

export function EditableName({
  name,
  fallback,
  onSave,
  className = 'text-2xl font-bold text-gray-900',
  level = 'h1',
}: {
  name: string | null
  fallback: string
  onSave: (next: string | null) => Promise<string | null>
  className?: string
  level?: 'h1' | 'h2'
}) {
  const router = useRouter()
  const shown = name?.trim() || fallback
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(shown)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const start = () => {
    setDraft(shown)
    setError('')
    setEditing(true)
  }

  const save = async () => {
    const next = cleanBillingName(cleanDraft(draft))
    if (next === undefined) {
      setError('Use letters, numbers, and symbols such as / ? ! @ # $ % & * ( ).')
      return
    }
    setSaving(true)
    setError('')
    const message = await onSave(next || null)
    setSaving(false)
    if (message) {
      setError(message)
      return
    }
    setEditing(false)
    router.refresh()
  }

  if (!editing) {
    const Heading = level
    return (
      <div className="flex items-center gap-2">
        <Heading className={className}>{shown}</Heading>
        <button
          type="button"
          onClick={start}
          className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-emerald-700"
          aria-label={`Rename ${shown}`}
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          maxLength={40}
          autoFocus
          aria-label="Billing method name"
          className="w-full max-w-sm rounded-xl border border-emerald-200 px-3 py-2 text-sm font-semibold text-gray-900 outline-none ring-emerald-500 focus:ring-2"
          onKeyDown={(event) => {
            if (event.key === 'Enter') void save()
            if (event.key === 'Escape') setEditing(false)
          }}
        />
        <button
          type="button"
          onClick={() => void save()}
          disabled={saving}
          className="rounded-lg bg-emerald-600 p-2 text-white hover:bg-emerald-700 disabled:opacity-50"
          aria-label="Save name"
        >
          <Check className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
          aria-label="Cancel rename"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      {error && <p className="text-xs font-semibold text-rose-700">{error}</p>}
    </div>
  )
}

export function AccountNameEditor({
  accountId,
  name,
  fallback,
  className,
  level,
}: {
  accountId: string
  name: string | null
  fallback: string
  className?: string
  level?: 'h1' | 'h2'
}) {
  return (
    <EditableName
      name={name}
      fallback={fallback}
      className={className}
      level={level}
      onSave={async (next) => {
        try {
          const res = await fetch('/api/virtual-accounts/name', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: accountId, displayName: next }),
          })
          const data = (await res.json()) as { error?: string }
          if (!res.ok) return data.error || 'Could not rename this billing method'
          return null
        } catch {
          return 'Could not rename this billing method'
        }
      }}
    />
  )
}

export function HouseholdNameEditor({
  householdId,
  name,
  className,
}: {
  householdId: string
  name: string
  className?: string
}) {
  return (
    <EditableName
      name={name}
      fallback="Household"
      className={className}
      onSave={async (next) => {
        const label = next?.trim() || 'Household'
        try {
          const res = await fetch('/api/households', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ householdId, name: label }),
          })
          const data = (await res.json()) as { error?: string }
          if (!res.ok) return data.error || 'Could not rename this household'
          return null
        } catch {
          return 'Could not rename this household'
        }
      }}
    />
  )
}
