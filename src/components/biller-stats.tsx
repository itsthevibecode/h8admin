'use client'

import { useMemo, useState } from 'react'
import { BarChart3, LineChart } from 'lucide-react'
import { buildBillerStats } from '@/lib/biller-stats'
import type { UtilityCategory } from '@/lib/bill-benchmarks'

export interface StatTransaction {
  billerName: string
  amountCents: number
  createdAt: string
  accountId: string
  accountLabel: string
  category: UtilityCategory
}

const CATEGORIES: { id: 'ALL' | UtilityCategory; label: string }[] = [
  { id: 'ALL', label: 'All utilities' },
  { id: 'ENERGY', label: 'Energy' },
  { id: 'TELCO', label: 'Telco' },
  { id: 'INSURANCE', label: 'Insurance' },
  { id: 'OTHER', label: 'Other' },
]

function formatAudCents(cents: number) {
  const negative = cents < 0
  const absolute = Math.abs(cents)
  const dollars = Math.floor(absolute / 100)
  const remainder = String(absolute % 100).padStart(2, '0')
  const grouped = String(dollars).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return `${negative ? '-' : ''}$${grouped}.${remainder}`
}

export function BillerStatsView({
  transactions,
  accounts,
}: {
  transactions: StatTransaction[]
  accounts: { id: string; label: string }[]
}) {
  const [chart, setChart] = useState<'bar' | 'line'>('bar')
  const [accountId, setAccountId] = useState('ALL')
  const [category, setCategory] = useState<'ALL' | UtilityCategory>('ALL')

  const stats = useMemo(() => {
    const filtered = transactions.filter((tx) => {
      if (accountId !== 'ALL' && tx.accountId !== accountId) return false
      if (category !== 'ALL' && tx.category !== category) return false
      return true
    })
    return buildBillerStats(
      filtered.map((tx) => ({
        billerName: tx.billerName,
        amountCents: tx.amountCents,
        createdAt: new Date(tx.createdAt),
      }))
    )
  }, [transactions, accountId, category])

  const peak = Math.max(...stats.months.map((month) => month.totalCents), 1)
  const linePoints = stats.months.map((month, index) => {
    const x = stats.months.length === 1 ? 0 : (index / (stats.months.length - 1)) * 100
    const y = 100 - (month.totalCents / peak) * 100
    return `${x},${y}`
  })

  return (
    <div className="space-y-8">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-950 via-emerald-900 to-emerald-800 p-8 text-white shadow-xl">
        <BarChart3 className="absolute right-8 top-8 h-32 w-32 text-white/10" />
        <div className="relative z-10 max-w-2xl space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-300">Billing stats</p>
          <p className="font-mono text-5xl font-extrabold tracking-tight">{formatAudCents(stats.totalCents)}</p>
          <p className="text-sm text-emerald-100/90">
            Successful direct debits across {stats.billers.length}{' '}
            {stats.billers.length === 1 ? 'biller' : 'billers'} in the last six months.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <select
          value={accountId}
          onChange={(event) => setAccountId(event.target.value)}
          className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-gray-700"
          aria-label="Direct debit account"
        >
          <option value="ALL">All direct debit accounts</option>
          {accounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.label}
            </option>
          ))}
        </select>
        {CATEGORIES.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setCategory(item.id)}
            className={`rounded-xl px-3 py-2 text-xs font-bold ${
              category === item.id
                ? 'bg-emerald-600 text-white'
                : 'border border-gray-200 bg-white text-gray-600'
            }`}
          >
            {item.label}
          </button>
        ))}
        <div className="ml-auto flex rounded-xl border border-gray-200 bg-white p-1">
          <button
            type="button"
            onClick={() => setChart('bar')}
            className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-bold ${
              chart === 'bar' ? 'bg-emerald-600 text-white' : 'text-gray-600'
            }`}
          >
            <BarChart3 className="h-3.5 w-3.5" /> Bars
          </button>
          <button
            type="button"
            onClick={() => setChart('line')}
            className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-bold ${
              chart === 'line' ? 'bg-emerald-600 text-white' : 'text-gray-600'
            }`}
          >
            <LineChart className="h-3.5 w-3.5" /> Line
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-bold text-gray-900">Volume by month</h2>
        {chart === 'bar' ? (
          <div className="mt-6 flex h-48 items-end gap-3">
            {stats.months.map((month) => {
              const height = Math.max(4, Math.round((month.totalCents / peak) * 100))
              return (
                <div key={month.key} className="flex flex-1 flex-col items-center gap-2">
                  <span className="text-[10px] font-semibold text-gray-500">
                    {month.totalCents > 0 ? formatAudCents(month.totalCents) : ''}
                  </span>
                  <div className="flex h-36 w-full items-end">
                    <div className="w-full rounded-t-lg bg-emerald-600" style={{ height: `${height}%` }} />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wide text-gray-400">
                    {month.label}
                  </span>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="mt-6">
            <svg viewBox="0 0 100 100" className="h-48 w-full" role="img" aria-label="Monthly volume line chart">
              <polyline
                fill="none"
                stroke="#059669"
                strokeWidth="2"
                points={linePoints.join(' ')}
                vectorEffect="non-scaling-stroke"
              />
              {stats.months.map((month, index) => {
                const [x, y] = linePoints[index].split(',')
                return <circle key={month.key} cx={x} cy={y} r="1.6" fill="#047857" />
              })}
            </svg>
            <div className="mt-2 flex justify-between text-[10px] font-bold uppercase tracking-wide text-gray-400">
              {stats.months.map((month) => (
                <span key={month.key}>{month.label}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="space-y-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-bold text-gray-900">Billers</h2>
        {stats.billers.length === 0 ? (
          <p className="text-sm text-gray-500">No successful debits match this account and utility.</p>
        ) : (
          <ul className="space-y-4">
            {stats.billers.map((biller) => {
              const share = stats.totalCents > 0 ? (biller.totalCents / stats.totalCents) * 100 : 0
              return (
                <li key={biller.billerName} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-gray-900">{biller.billerName}</span>
                    <span className="font-mono text-gray-600">{formatAudCents(biller.totalCents)}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                    <div className="h-full rounded-full bg-emerald-600" style={{ width: `${share}%` }} />
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
