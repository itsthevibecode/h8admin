'use client'

import { FormEvent, useEffect, useState } from 'react'
import { ArrowRight, Trash2 } from 'lucide-react'
import { useToast } from '@/components/ui/toast'

export interface OverrideFundingSource {
  id: string
  brand: string
  last4: string
  nickname?: string | null
}

interface RoutingRule {
  id: string
  billerName: string | null
  isActive: boolean
  fundingSource: OverrideFundingSource
}

function cardLabel(source: OverrideFundingSource) {
  const nickname = source.nickname?.trim()
  return nickname || `${source.brand} ••${source.last4}`
}

function cleanBillerName(value: string) {
  return value
    .replace(/[^\p{L}\p{N}&'’.\- ]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 80)
}

export function RoutingRulesManager({
  fundingSources,
}: {
  fundingSources: OverrideFundingSource[]
}) {
  const { toast } = useToast()
  const [rules, setRules] = useState<RoutingRule[]>([])
  const [loading, setLoading] = useState(true)
  const [billerName, setBillerName] = useState('')
  const [fundingSourceId, setFundingSourceId] = useState(fundingSources[0]?.id || '')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const res = await fetch('/api/rules')
        const data = (await res.json()) as { rules?: RoutingRule[] }
        if (!cancelled && res.ok) setRules(data.rules ?? [])
      } catch {
        if (!cancelled) toast('Could not load biller overrides', 'error')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [toast])

  const addOverride = async (event: FormEvent) => {
    event.preventDefault()
    const name = cleanBillerName(billerName)
    if (!name || !fundingSourceId) return
    setSaving(true)
    try {
      const res = await fetch('/api/rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ billerName: name, fundingSourceId }),
      })
      const data = (await res.json()) as { error?: string; rule?: RoutingRule }
      if (!res.ok || !data.rule) {
        toast(data.error || 'Could not add that override', 'error')
        return
      }
      setRules((current) => [data.rule as RoutingRule, ...current])
      setBillerName('')
      toast(`${name} will charge ${cardLabel(data.rule.fundingSource)}`, 'success')
    } catch {
      toast('Could not add that override', 'error')
    } finally {
      setSaving(false)
    }
  }

  const toggle = async (rule: RoutingRule) => {
    const next = !rule.isActive
    setRules((current) =>
      current.map((item) => (item.id === rule.id ? { ...item, isActive: next } : item))
    )
    try {
      const res = await fetch('/api/rules', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ruleId: rule.id, isActive: next }),
      })
      if (!res.ok) throw new Error('update failed')
      toast(next ? `${rule.billerName} override is on` : `${rule.billerName} override is off`, 'success')
    } catch {
      setRules((current) =>
        current.map((item) => (item.id === rule.id ? { ...item, isActive: rule.isActive } : item))
      )
      toast('Could not update that override', 'error')
    }
  }

  const remove = async (rule: RoutingRule) => {
    setRules((current) => current.filter((item) => item.id !== rule.id))
    try {
      const res = await fetch('/api/rules', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ruleId: rule.id }),
      })
      if (!res.ok) throw new Error('delete failed')
      toast(`${rule.billerName} override removed`, 'success')
    } catch {
      setRules((current) => [rule, ...current])
      toast('Could not remove that override', 'error')
    }
  }

  return (
    <section className="space-y-6 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <div className="rounded-xl border border-emerald-100 bg-emerald-50/70 p-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-800">
          Default flow
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm font-semibold text-gray-900">
          <span className="rounded-lg border border-emerald-200 bg-white px-3 py-2">
            Inbound Direct Debit
          </span>
          <ArrowRight className="h-4 w-4 text-emerald-600" />
          <span className="rounded-lg border border-emerald-300 bg-white px-3 py-2">
            Default Linked Card (Automatic)
          </span>
        </div>
        <p className="mt-3 text-xs text-emerald-900/80">
          All direct debits automatically charge your default card. Custom overrides below are
          completely optional.
        </p>
      </div>

      <form onSubmit={(event) => void addOverride(event)} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
        <div>
          <label htmlFor="override-biller" className="mb-1 block text-xs font-semibold text-gray-700">
            Biller name
          </label>
          <input
            id="override-biller"
            value={billerName}
            onChange={(event) => setBillerName(event.target.value)}
            placeholder="Synergy, Water Corporation, Aussie Broadband"
            maxLength={80}
            required
            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900"
          />
        </div>
        <div>
          <label htmlFor="override-card" className="mb-1 block text-xs font-semibold text-gray-700">
            Charge this card
          </label>
          <select
            id="override-card"
            value={fundingSourceId}
            onChange={(event) => setFundingSourceId(event.target.value)}
            disabled={fundingSources.length === 0}
            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-semibold text-gray-900"
          >
            {fundingSources.length === 0 ? (
              <option value="">Link a card first</option>
            ) : (
              fundingSources.map((source) => (
                <option key={source.id} value={source.id}>
                  {cardLabel(source)}
                </option>
              ))
            )}
          </select>
        </div>
        <button
          type="submit"
          disabled={saving || fundingSources.length === 0}
          className="self-end rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {saving ? 'Adding…' : 'Add Override'}
        </button>
      </form>

      <div>
        <h2 className="text-xs font-bold uppercase tracking-wider text-gray-700">
          Active biller overrides
        </h2>
        {loading ? (
          <p className="mt-3 text-xs text-gray-400">Loading overrides…</p>
        ) : rules.length === 0 ? (
          <p className="mt-3 rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-5 text-center text-sm text-gray-500">
            No custom overrides active. All direct debits follow your default card.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-gray-100 rounded-xl border border-gray-100">
            {rules.map((rule) => (
              <li key={rule.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div>
                  <p className="text-sm font-bold text-gray-900">{rule.billerName}</p>
                  <span className="mt-1 inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">
                    {cardLabel(rule.fundingSource)}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={rule.isActive}
                    aria-label={`${rule.isActive ? 'Turn off' : 'Turn on'} ${rule.billerName}`}
                    onClick={() => void toggle(rule)}
                    className={`relative h-6 w-11 rounded-full transition ${rule.isActive ? 'bg-emerald-600' : 'bg-gray-300'}`}
                  >
                    <span
                      className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${rule.isActive ? 'left-5' : 'left-0.5'}`}
                    />
                  </button>
                  <button
                    type="button"
                    aria-label={`Delete ${rule.billerName} override`}
                    onClick={() => void remove(rule)}
                    className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
