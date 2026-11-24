'use client'

import { useEffect, useState } from 'react'
import { AlertCircle, Gift, Info, Loader2 } from 'lucide-react'

interface BillingMetrics {
  monthlyVolumeCents: number
  monthlyVolumeCapCents: number
  monthlyTxCount: number
  baseFeeCents: number
  rolloverBalanceCents: number
  overageVolumeCents: number
  overageFeeCents: number
  estimatedTotalMonthlyFeeCents: number
  feePlan: 'retail' | 'beta-cost' | 'beta-free'
  nonBetaCount: number
  betaGraduationTarget: number
  cycleStartDate: string
  cycleEndDate: string
}

function formatAudCents(cents: number) {
  return (cents / 100).toLocaleString('en-AU', {
    style: 'currency',
    currency: 'AUD',
  })
}

function formatCycleDay(iso: string) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })
}

export function BillingHub() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [metrics, setMetrics] = useState<BillingMetrics | null>(null)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const res = await fetch('/api/billing')
        const data = (await res.json()) as {
          metrics?: BillingMetrics
          error?: string
        }
        if (!res.ok || !data.metrics) {
          throw new Error(data.error || 'Failed to load billing')
        }
        if (!cancelled) {
          setMetrics(data.metrics)
        }
      } catch (err: unknown) {
        if (!cancelled) setError((err as Error).message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
        Loading billing metrics…
      </div>
    )
  }

  const cap = metrics?.monthlyVolumeCapCents ?? 300_000
  const volume = metrics?.monthlyVolumeCents ?? 0
  const progressPct = Math.min(100, cap > 0 ? (volume / cap) * 100 : 0)
  const overCap = volume > cap

  return (
    <div className="space-y-8">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-700">
          Routing fees
        </p>
        <h2 className="text-lg font-bold text-gray-900">This month</h2>
        <p className="mt-1 text-sm text-gray-500">
          {metrics
            ? `${formatCycleDay(metrics.cycleStartDate)} – ${formatCycleDay(metrics.cycleEndDate)} cycle`
            : 'Current calendar month'}
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            {metrics?.feePlan === 'retail' ? 'Monthly Volume Cap' : 'Monthly routed volume'}
          </p>
          <p className="text-2xl font-bold text-gray-900">
            {formatAudCents(volume)}
            {metrics?.feePlan === 'retail' && (
              <span className="text-sm font-medium text-gray-400">
                {' '}
                / {formatAudCents(cap)}
              </span>
            )}
          </p>
          {metrics?.feePlan === 'retail' && (
            <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
              <div
                className={`h-full rounded-full ${overCap ? 'bg-amber-500' : 'bg-emerald-600'}`}
                style={{ width: `${progressPct}%` }}
              />
            </div>
          )}
          <p className="text-[11px] text-gray-500">
            {metrics?.feePlan === 'beta-free'
              ? 'This beta account routes at no charge.'
              : metrics?.feePlan === 'beta-cost'
                ? 'Cost price is 0.30% of this volume, with no base fee.'
                : overCap
                  ? `${formatAudCents(metrics?.overageVolumeCents ?? 0)} above the included $3,000 routing cap.`
                  : `${formatAudCents(Math.max(0, cap - volume))} remaining inside this month's included volume.`}
          </p>
        </div>

        <div className="bg-gradient-to-br from-emerald-900 to-emerald-950 text-white rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-emerald-300 uppercase tracking-wide flex items-center gap-1.5">
              <Gift className="w-3.5 h-3.5" /> Rollover Ledger
            </p>
            <span className="text-[10px] font-bold uppercase tracking-wide bg-white/15 px-2 py-1 rounded-full">
              Never Expires
            </span>
          </div>
          <p className="text-2xl font-mono font-bold">
            {formatAudCents(metrics?.rolloverBalanceCents ?? 0)}
          </p>
          <p className="text-[11px] text-emerald-200/80">
            {metrics?.feePlan === 'retail'
              ? 'Stacked fee-free referral volume. While this ledger is positive, 0.5% overage on routing above $3,000 is fully offset.'
              : 'Held for when this account moves to the standard plan. Beta routing does not draw this ledger down.'}
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Current Month Fees
          </p>
          <p className="text-2xl font-bold text-gray-900">
            {formatAudCents(metrics?.estimatedTotalMonthlyFeeCents ?? 0)}
          </p>
          <ul className="text-[11px] text-gray-600 space-y-1">
            <li className="flex justify-between">
              <span>
                {metrics?.feePlan === 'beta-free'
                  ? 'Beta routing (free)'
                  : metrics?.feePlan === 'beta-cost'
                    ? 'Beta base fee'
                    : 'Base tier ($1/tx up to $5)'}
              </span>
              <span className="font-semibold text-gray-900">
                {formatAudCents(metrics?.baseFeeCents ?? 0)}
              </span>
            </li>
            <li className="flex justify-between">
              <span>
                {metrics?.feePlan === 'beta-cost'
                  ? '0.30% of routed volume'
                  : metrics?.feePlan === 'beta-free'
                    ? 'Routing fee'
                    : '0.5% overage'}
              </span>
              <span className="font-semibold text-gray-900">
                {formatAudCents(metrics?.overageFeeCents ?? 0)}
              </span>
            </li>
            <li className="text-gray-400">
              {metrics?.monthlyTxCount ?? 0} successful{' '}
              {(metrics?.monthlyTxCount ?? 0) === 1 ? 'debit' : 'debits'} this cycle
            </li>
          </ul>
        </div>
      </div>

      <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-5 flex gap-3">
        <Info className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
        <div className="text-sm text-emerald-950 space-y-1">
          <p className="font-bold">How H8Admin bills routing</p>
          <p className="text-xs text-emerald-900/80">
            {metrics?.feePlan === 'beta-free'
              ? 'This beta account routes at no charge. That rate stays in place even if the non-beta count later drops.'
              : metrics?.feePlan === 'beta-cost'
                ? `Private-beta accounts pay cost price: 0.30% of successful routing and no base fee. When ${metrics.betaGraduationTarget} non-beta accounts exist (${metrics.nonBetaCount} so far), beta routing becomes free and stays free.`
                : 'The platform fee is $1 per successful direct debit, capped at $5/month, covering up to $3,000 of routed volume. Volume above $3,000 attracts 0.5% overage unless your rollover ledger still has fee-free balance.'}
          </p>
        </div>
      </div>

    </div>
  )
}
