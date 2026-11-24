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
  Info,
} from 'lucide-react'
import type {
  BenchmarkBaseline,
  SavingsCategory,
  SavingsOpportunity,
} from '@/lib/bill-benchmarks'

function formatAud(amount: number) {
  return amount.toLocaleString('en-AU', {
    style: 'currency',
    currency: 'AUD',
    maximumFractionDigits: 0,
  })
}

const CARD_META: Record<
  SavingsCategory,
  { title: string; blurb: string; icon: typeof Zap }
> = {
  ENERGY: {
    title: 'Energy',
    blurb: 'Electricity and gas spend versus competitive single-rate metro plans.',
    icon: Zap,
  },
  TELCO: {
    title: 'Telco / NBN',
    blurb: 'Broadband and mobile bills versus unlimited NBN saver tiers.',
    icon: Wifi,
  },
  INSURANCE: {
    title: 'Insurance',
    blurb: 'Motor, home and health premiums versus comparable renewal quotes.',
    icon: Shield,
  },
}

export function SavingsHub() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [totalAnnualSavingsDollars, setTotalAnnualSavingsDollars] = useState(0)
  const [totalMonthlySavingsDollars, setTotalMonthlySavingsDollars] = useState(0)
  const [hasSufficientData, setHasSufficientData] = useState(false)
  const [monitoredCategoriesCount, setMonitoredCategoriesCount] = useState(0)
  const [opportunities, setOpportunities] = useState<SavingsOpportunity[]>([])
  const [baselines, setBaselines] = useState<BenchmarkBaseline[]>([])

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/savings')
        const data = (await res.json()) as {
          error?: string
          totalAnnualSavingsDollars?: number
          totalMonthlySavingsDollars?: number
          hasSufficientData?: boolean
          monitoredCategoriesCount?: number
          opportunities?: SavingsOpportunity[]
          benchmarkBaselines?: BenchmarkBaseline[]
        }
        if (!res.ok) {
          setError(data.error || 'Could not load savings analysis')
          return
        }
        setTotalAnnualSavingsDollars(data.totalAnnualSavingsDollars ?? 0)
        setTotalMonthlySavingsDollars(data.totalMonthlySavingsDollars ?? 0)
        setHasSufficientData(Boolean(data.hasSufficientData))
        setMonitoredCategoriesCount(data.monitoredCategoriesCount ?? 0)
        setOpportunities(data.opportunities ?? [])
        setBaselines(data.benchmarkBaselines ?? [])
      } catch {
        setError('Could not load savings analysis')
      } finally {
        setLoading(false)
      }
    }

    void load()
  }, [])

  const showFallback = !loading && !hasSufficientData

  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-br from-emerald-950 via-emerald-900 to-emerald-800 text-white rounded-2xl p-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <TrendingDown className="w-48 h-48" />
        </div>
        <div className="relative z-10 max-w-2xl space-y-3">
          <p className="text-xs uppercase tracking-wider text-emerald-300 font-semibold flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-emerald-400" /> Find cheaper bills
          </p>
          {loading ? (
            <p className="text-sm text-emerald-100 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Auditing verified direct debits…
            </p>
          ) : (
            <>
              <p className="text-5xl font-extrabold tracking-tight font-mono">
                {formatAud(totalAnnualSavingsDollars)}{' '}
                <span className="text-lg font-sans font-semibold text-emerald-200">/ year</span>
              </p>
              <p className="text-sm text-emerald-100/90 leading-relaxed">
                {hasSufficientData
                  ? `${formatAud(totalMonthlySavingsDollars)}/mo across ${monitoredCategoriesCount} monitored ${monitoredCategoriesCount === 1 ? 'category' : 'categories'} versus competitive Australian saver plans.`
                  : 'Route your energy, NBN and insurance direct debits through H8Admin to unlock automatic bill audits.'}
              </p>
            </>
          )}
        </div>
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}

      {showFallback && (
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-xs text-emerald-900 leading-relaxed">
          No matching utility billers yet. Route Synergy, Telstra, AAMI and similar providers
          through your Virtual BSB and we will compare them against metropolitan market medians
          ($165/mo Energy, $95/mo Telco, $195/mo Insurance).
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {showFallback
          ? baselines.map((baseline) => {
              const meta = CARD_META[baseline.category]
              const Icon = meta.icon
              return (
                <div
                  key={baseline.category}
                  className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4 flex flex-col"
                >
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                      Metro median
                    </span>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-gray-900">{meta.title}</h3>
                    <p className="text-xs text-gray-500 leading-relaxed">{meta.blurb}</p>
                  </div>
                  <div className="rounded-xl bg-gray-50 border border-gray-100 p-3 space-y-2 text-xs">
                    <div className="flex justify-between text-gray-600">
                      <span>Typical spend</span>
                      <span className="font-mono font-bold text-gray-900">
                        {formatAud(baseline.medianMonthlyDollars)}/mo
                      </span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>Saver-tier plan</span>
                      <span className="font-mono font-bold text-emerald-700">
                        {formatAud(baseline.saverMonthlyDollars)}/mo
                      </span>
                    </div>
                  </div>
                  <ul className="text-[11px] text-gray-500 space-y-1">
                    {baseline.planFeatures.map((feature) => (
                      <li key={feature}>• {feature}</li>
                    ))}
                  </ul>
                  <a
                    href={baseline.ctaHref}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition"
                  >
                    Compare via partner
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              )
            })
          : opportunities
              .filter((opportunity) => opportunity.detected)
              .map((opportunity) => {
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
                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-bold">
                        Save {formatAud(opportunity.annualSavingsDollars)}/yr
                      </span>
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-sm font-bold text-gray-900">{meta.title}</h3>
                      <p className="text-xs text-gray-500 leading-relaxed">{meta.blurb}</p>
                    </div>
                    <div className="rounded-xl bg-gray-50 border border-gray-100 p-3 space-y-2 text-xs">
                      <div className="flex justify-between text-gray-600">
                        <span>Detected spend</span>
                        <span className="font-mono font-bold text-gray-900">
                          {formatAud(opportunity.currentMonthlyDollars)}/mo
                        </span>
                      </div>
                      <div className="flex justify-between text-gray-600">
                        <span>Saver-tier plan</span>
                        <span className="font-mono font-bold text-emerald-700">
                          {formatAud(opportunity.saverMonthlyDollars)}/mo
                        </span>
                      </div>
                    </div>
                    {opportunity.matchedBillers.length > 0 && (
                      <p className="text-[11px] text-gray-400">
                        Matched: {opportunity.matchedBillers.join(', ')}
                      </p>
                    )}
                    <ul className="text-[11px] text-gray-500 space-y-1">
                      {opportunity.planFeatures.map((feature) => (
                        <li key={feature}>• {feature}</li>
                      ))}
                    </ul>
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

      <div className="rounded-2xl border border-gray-100 bg-white p-5 space-y-2">
        <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5" /> General advice warning
        </p>
        <p className="text-[11px] text-gray-500 leading-relaxed">
          This information is general in nature and does not take into account your objectives,
          financial situation or needs. Benchmarks are illustrative estimates based on standard
          Australian metropolitan retail medians and do not constitute personal advice under the
          Corporations Act 2001 (Cth). Consider the Product Disclosure Statement and your own
          circumstances, or speak with a licensed adviser, before switching. Some “Compare via
          partner” links may be affiliate referrals; H8Admin may receive a commission at no extra
          cost to you.
        </p>
      </div>
    </div>
  )
}
