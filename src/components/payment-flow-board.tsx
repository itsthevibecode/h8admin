'use client'

import { useState } from 'react'
import { ArrowRight, Landmark, Shield } from 'lucide-react'
import { RoutingRulesManager } from '@/components/routing-rules-manager'

export interface FlowSource {
  id: string
  brand: string
  last4: string
  nickname: string | null
  isDefault: boolean
}

export interface FlowLane {
  id: string
  label: string
  bsb: string
  accountNumber: string
  preferredId: string | null
  backupId: string | null
}

function sourceLabel(source: FlowSource) {
  const name = source.nickname || (source.brand === 'DIRECT DEBIT' ? 'Direct debit' : source.brand)
  return `${name} ••${source.last4}`
}

function FlowRow({
  lane,
  sources,
}: {
  lane: FlowLane
  sources: FlowSource[]
}) {
  const fallbackPreferred = sources.find((source) => source.isDefault)?.id || sources[0]?.id || ''
  const [preferredId, setPreferredId] = useState(lane.preferredId || fallbackPreferred)
  const [selectedBackup, setSelectedBackup] = useState(
    lane.backupId && lane.backupId !== (lane.preferredId || fallbackPreferred) ? lane.backupId : ''
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  const save = async (nextPreferred: string, nextBackup: string) => {
    setSaving(true)
    setError('')
    setSaved(false)
    try {
      const res = await fetch('/api/funding/flow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          virtualAccountId: lane.id,
          preferredId: nextPreferred,
          backupId: nextBackup || null,
        }),
      })
      const data = (await res.json()) as { error?: string }
      if (!res.ok) {
        setError(data.error || 'Could not save this payment flow')
        return
      }
      setSaved(true)
    } catch {
      setError('Could not save this payment flow')
    } finally {
      setSaving(false)
    }
  }

  const onPreferred = (value: string) => {
    const nextBackup = selectedBackup === value ? '' : selectedBackup
    setPreferredId(value)
    setSelectedBackup(nextBackup)
    void save(value, nextBackup)
  }

  const onBackup = (value: string) => {
    setSelectedBackup(value)
    void save(preferredId, value)
  }

  return (
    <div className="space-y-2">
      <div className="flex items-stretch gap-3 overflow-x-auto pb-1">
        <section className="min-w-[220px] flex-1 rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-900 to-emerald-950 p-5 text-white shadow-sm">
          <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-emerald-300">
            <Landmark className="h-3.5 w-3.5" /> {lane.label}
          </p>
          <div className="mt-5 space-y-4">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-emerald-200/70">BSB</p>
              <p className="font-mono text-2xl font-bold tracking-widest">{lane.bsb}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-emerald-200/70">Account</p>
              <p className="font-mono text-2xl font-bold tracking-widest">{lane.accountNumber}</p>
            </div>
          </div>
        </section>

        <div className="flex shrink-0 items-center text-emerald-600">
          <ArrowRight className="h-6 w-6" />
        </div>

        <section className="min-w-[220px] flex-1 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Preferred</p>
          <h2 className="mt-1 text-sm font-bold text-gray-900">Charge this first</h2>
          <label className="mt-4 block text-xs font-semibold text-gray-700" htmlFor={`preferred-${lane.id}`}>
            Payment method
          </label>
          <select
            id={`preferred-${lane.id}`}
            value={preferredId}
            onChange={(event) => onPreferred(event.target.value)}
            disabled={sources.length === 0 || saving}
            className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm font-semibold text-gray-900"
          >
            {sources.length === 0 ? (
              <option value="">Link a card or direct debit</option>
            ) : (
              sources.map((source) => (
                <option key={source.id} value={source.id}>
                  {sourceLabel(source)}
                </option>
              ))
            )}
          </select>
        </section>

        <div className="flex shrink-0 items-center text-emerald-600">
          <ArrowRight className="h-6 w-6" />
        </div>

        <section className="min-w-[220px] flex-1 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-400">
            <Shield className="h-3.5 w-3.5" /> If it declines
          </p>
          <h2 className="mt-1 text-sm font-bold text-gray-900">Backup</h2>
          <label className="mt-4 block text-xs font-semibold text-gray-700" htmlFor={`backup-${lane.id}`}>
            Second card or direct debit
          </label>
          <select
            id={`backup-${lane.id}`}
            value={selectedBackup}
            onChange={(event) => onBackup(event.target.value)}
            disabled={sources.length < 2 || saving}
            className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm font-semibold text-gray-900"
          >
            <option value="">No backup</option>
            {sources
              .filter((source) => source.id !== preferredId)
              .map((source) => (
                <option key={source.id} value={source.id}>
                  {sourceLabel(source)}
                </option>
              ))}
          </select>
        </section>
      </div>
      {error && <p className="text-xs font-semibold text-red-700">{error}</p>}
      {saved && !error && <p className="text-xs font-semibold text-emerald-700">Payment flow saved.</p>}
    </div>
  )
}

export function PaymentFlowBoard({
  lanes,
  sources,
}: {
  lanes: FlowLane[]
  sources: FlowSource[]
}) {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Payment flow</h1>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">
          Each direct debit is charged left to right: the BSB a biller uses, the payment method
          tried first, then a backup if that charge declines.
        </p>
      </div>
      {lanes.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-emerald-200 bg-white p-8 text-sm text-gray-600">
          Your personal Virtual BSB has not been created yet.
        </p>
      ) : (
        lanes.map((lane) => <FlowRow key={lane.id} lane={lane} sources={sources} />)
      )}
      <RoutingRulesManager fundingSources={sources} />
    </div>
  )
}
