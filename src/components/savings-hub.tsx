'use client'

import { useEffect, useState } from 'react'
import {
  TrendingDown,
  Zap,
  Wifi,
  Shield,
  ArrowUpRight,
  Loader2,
  Sparkles,
} from 'lucide-react'
import type { SavingsOpportunity } from '@/lib/bill-benchmarks'

function formatAud(amount: number) {
  return amount.toLocaleString('en-AU', {
    style: 'currency',
    currency: 'AUD',
    maximumFractionDigits: 0,
  })
}

const CARD_META: Record<
  string,
  { title: string; blurb: string; icon: typeof Zap }
> = {
  ENERGY: {
    title: 'Energy Optimization',
    blurb: 'Compare current tracked spend vs the cheapest competitive market tier.',
    icon: Zap,
  },
  BROADBAND: {
    title: 'Telco & NBN Optimization',
    blurb: 'Highlights overage on broadband and mobile versus saver-tier NBN plans.',
    icon: Wifi,
  },
  INSURANCE: {
    title: 'Insurances & Health',
    blurb: 'Identifies potential renewal savings before your next premium lands.',
    icon: Shield,
  },
}

export function SavingsHub() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [totalAnnualSavingsDollars, setTotalAnnualSavingsDollars] = useState(0)
  const [opportunities, setOpportunities] = useState<SavingsOpportunity[]>([])

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/savings')
        const data = await res.json()
        if (!res.ok) {
          setError(data.error || 'Could not load savings analysis')
          return
        }
        setTotalAnnualSavingsDollars(data.totalAnnualSavingsDollars ?? 0)
        setOpportunities(data.opportunities ?? [])
      } catch {
        setError('Could not load savings analysis')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-br from-emerald-900 to-emerald-950 text-white rounded-2xl p-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <TrendingDown className="w-48 h-48" />
        </div>
        <div className="relative z-10 max-w-2xl space-y-3">
          <p className="text-xs uppercase tracking-wider text-emerald-300 font-semibold flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-emerald-400" /> Switch & Save
          </p>
          {loading ? (
            <p className="text-sm text-emerald-100 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Benchmarking your direct debits…
            </p>
          ) : (
            <h1 className="text-3xl font-extrabold tracking-tight leading-tight">
              We found up to {formatAud(totalAnnualSavingsDollars)} in potential annual savings
              across your direct debits.
            </h1>
          )}
          <p className="text-sm text-emerald-100/90 leading-relaxed">
            H8Admin benchmarks your verified direct debit amounts against competitive market plans
            in Australia.
          </p>
        </div>
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {opportunities.map((opportunity) => {
          const meta = CARD_META[opportunity.category]
          const Icon = meta.icon
          return (
            <div
              key={opportunity.category}
              className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4 flex flex-col"
            >
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                  {opportunity.detected ? 'Detected' : 'Market benchmark'}
                </span>
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-gray-900">{meta.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{meta.blurb}</p>
              </div>
              <div className="rounded-xl bg-gray-50 border border-gray-100 p-3 space-y-2 text-xs">
                <div className="flex justify-between text-gray-600">
                  <span>{opportunity.detected ? 'Tracked spend' : 'Typical spend'}</span>
                  <span className="font-mono font-bold text-gray-900">
                    {formatAud(opportunity.currentMonthlyDollars)}/mo
                  </span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Saver-tier plan</span>
                  <span className="font-mono font-bold text-emerald-700">
                    {formatAud(opportunity.benchmarkMonthlyDollars)}/mo
                  </span>
                </div>
                <div className="flex justify-between text-gray-900 pt-1 border-t border-gray-200">
                  <span className="font-semibold">Est. annual save</span>
                  <span className="font-mono font-bold">
                    {formatAud(opportunity.annualSavingsDollars)}
                  </span>
                </div>
              </div>
              {opportunity.matchedBillers.length > 0 && (
                <p className="text-[11px] text-gray-400">
                  Matched: {opportunity.matchedBillers.join(', ')}
                </p>
              )}
              <a
                href={opportunity.ctaHref}
                target="_blank"
                rel="noreferrer"
                className="mt-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition"
              >
                {opportunity.ctaLabel}
                <ArrowUpRight className="w-3.5 h-3.5" />
              </a>
            </div>
          )
        })}
      </div>

      <p className="text-[11px] text-gray-400 leading-relaxed">
        General advice warning: Benchmarks are estimates based on standard Australian metropolitan
        rates.
      </p>
    </div>
  )
}
