'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Play, CheckCircle2, XCircle, ArrowRight, Activity, CreditCard } from 'lucide-react'

export function DirectDebitSimulator() {
  const [billerName, setBillerName] = useState('Synergy Energy')
  const [amountDollars, setAmountDollars] = useState('145.50')
  const [simulating, setSimulating] = useState(false)
  const [lastResult, setLastResult] = useState<{
    success: boolean
    matchedRuleType: string
    transaction: {
      billerName: string
      amountCents: number
      status: string
      fundingSource: { brand: string; last4: string } | null
      failureReason?: string
    }
  } | null>(null)

  const router = useRouter()

  const handleSimulate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSimulating(true)
    setLastResult(null)

    try {
      const res = await fetch('/api/simulate-direct-debit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ billerName, amountDollars }),
      })

      const data = await res.json()
      if (res.ok) {
        setLastResult(data)
        router.refresh()
      } else {
        alert(data.error || 'Simulation failed')
      }
    } catch (err) {
      console.error('Simulation error:', err)
    } finally {
      setSimulating(false)
    }
  }

  return (
    <div id="simulator" className="scroll-mt-6 bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-6">
      <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
        <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
          <Activity className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900">Direct Debit Simulation Engine</h3>
          <p className="text-xs text-gray-500">
            Simulate incoming Biller direct debits hitting your Virtual BSB in real time
          </p>
        </div>
      </div>

      <form onSubmit={handleSimulate} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Incoming Biller Name</label>
          <input
            type="text"
            value={billerName}
            onChange={(e) => setBillerName(e.target.value)}
            placeholder="e.g. Water Corp or Gym"
            className="w-full text-xs p-2.5 rounded-lg border border-gray-300 bg-white"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Bill Amount ($ AUD)</label>
          <input
            type="number"
            step="0.01"
            value={amountDollars}
            onChange={(e) => setAmountDollars(e.target.value)}
            placeholder="150.00"
            className="w-full text-xs p-2.5 rounded-lg border border-gray-300 bg-white"
            required
          />
        </div>

        <div className="flex items-end">
          <button
            type="submit"
            disabled={simulating}
            className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
          >
            <Play className="w-4 h-4 fill-current" />
            {simulating ? 'Processing Pass-Through...' : 'Trigger Direct Debit'}
          </button>
        </div>
      </form>

      {lastResult && (
        <div
          className={`p-4 rounded-xl border space-y-3 ${
            lastResult.success
              ? 'bg-emerald-50/70 border-emerald-200'
              : 'bg-red-50/70 border-red-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {lastResult.success ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600" />
              )}
              <span className="text-xs font-bold text-gray-900">
                {lastResult.success ? 'Pass-Through Authorized' : 'Pass-Through Declined'}
              </span>
            </div>
            <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-white border border-gray-200">
              Rule Evaluated: {lastResult.matchedRuleType}
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-between text-xs pt-1 border-t border-gray-200/60 gap-2">
            <div className="flex items-center gap-2">
              <span className="font-bold text-gray-800">{lastResult.transaction.billerName}</span>
              <span className="text-gray-500 font-mono">
                (${(lastResult.transaction.amountCents / 100).toFixed(2)})
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
              <span className="flex items-center gap-1 font-semibold text-gray-900">
                <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                {lastResult.transaction.fundingSource
                  ? `${lastResult.transaction.fundingSource.brand} (••${lastResult.transaction.fundingSource.last4})`
                  : 'no linked card'}
              </span>
            </div>
          </div>

          {lastResult.transaction.failureReason && (
            <p className="text-[11px] text-red-600 font-medium">
              Reason: {lastResult.transaction.failureReason}
            </p>
          )}
        </div>
      )}
    </div>
  )
}