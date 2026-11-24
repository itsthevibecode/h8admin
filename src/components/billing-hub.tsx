'use client'

import { useEffect, useState } from 'react'
import { AlertCircle, Info, Loader2 } from 'lucide-react'

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
        <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
        Loading billing metrics…
      </div>
    )
  }

  const volume = metrics?.monthlyVolumeCents ?? 0
  const txCount = metrics?.monthlyTxCount ?? 0
  const feeCents = metrics?.estimatedTotalMonthlyFeeCents ?? 0

  return (
    <div className="space-y-8">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-700">
          Payment fees
        </p>
        <h2 className="text-lg font-bold text-gray-900">This month</h2>
        <p className="mt-1 text-sm text-gray-500">
          {metrics
            ? `${formatCycleDay(metrics.cycleStartDate)} – ${formatCycleDay(metrics.cycleEndDate)} cycle`
            : 'Current calendar month'}
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="space-y-3 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Successful bill payments
          </p>
          <p className="text-2xl font-bold text-gray-900">{txCount}</p>
          <p className="text-[11px] text-gray-500">
            Routed volume this cycle: {formatAudCents(volume)}.
          </p>
        </div>

        <div className="space-y-3 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            H8Admin fees this month
          </p>
          <p className="text-2xl font-bold text-gray-900">{formatAudCents(feeCents)}</p>
          <p className="text-[11px] text-gray-500">
            Standard pricing is $1 per successfully completed bill payment.
          </p>
        </div>

        <div className="space-y-3 rounded-2xl bg-gradient-to-br from-emerald-900 to-emerald-950 p-5 text-white shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-300">
            Simple fee model
          </p>
          <p className="text-2xl font-bold">$1</p>
          <p className="text-[11px] text-emerald-200/80">
            Charged only when the relevant bill payment successfully completes, and disclosed before
            you authorise that payment.
          </p>
        </div>
      </div>

      <div className="flex gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/70 p-5">
        <Info className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />
        <div className="space-y-1 text-sm text-emerald-950">
          <p className="font-bold">How H8Admin fees work</p>
          <p className="text-xs text-emerald-900/80">
            {metrics?.feePlan === 'beta-free'
              ? 'This private-beta account currently routes without an H8Admin transaction fee. Standard customer pricing remains $1 per successfully completed bill payment.'
              : metrics?.feePlan === 'beta-cost'
                ? 'This private-beta account currently uses a temporary at-cost arrangement. The customer-facing standard price is a flat $1 per successfully completed bill payment.'
                : 'H8Admin charges a flat $1 fee per successfully completed bill payment. Failed or pending payments are not charged that fee. Payment-provider costs are H8Admin’s business cost, not a separate published customer surcharge.'}
          </p>
        </div>
      </div>
    </div>
  )
}
