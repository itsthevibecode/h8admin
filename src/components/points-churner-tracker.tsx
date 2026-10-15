'use client'

import { useState, useEffect } from 'react'
import { Clock, Plus, ShieldAlert, CheckCircle2, AlertTriangle, Building } from 'lucide-react'

interface Lockout {
  id: string
  bankGroup: string
  cardName: string
  cancelledAt: string
  lockoutMonths: number
  eligibleAgainAt: string
  notes?: string
}

const AUSTRALIAN_BANKS = [
  'American Express',
  'NAB',
  'Westpac',
  'ANZ',
  'Commonwealth Bank',
  'Citi / NAB Group',
  'Bankwest',
  'HSBC',
  'Other',
]

export function PointsChurnerTracker() {
  const [lockouts, setLockouts] = useState<Lockout[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdding, setIsAdding] = useState(false)

  // Form State
  const [bankGroup, setBankGroup] = useState(AUSTRALIAN_BANKS[0])
  const [cardName, setCardName] = useState('')
  const [cancelledAtDate, setCancelledAtDate] = useState(
    new Date().toISOString().split('T')[0]
  )
  const [submitting, setSubmitting] = useState(false)

  const fetchLockouts = async () => {
    try {
      const res = await fetch('/api/cards/lockout')
      const data = await res.json()
      if (res.ok) {
        setLockouts(data.lockouts)
      }
    } catch (err) {
      console.error('Failed to fetch lockouts:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLockouts()
  }, [])

  const handleAddLockout = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const res = await fetch('/api/cards/lockout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bankGroup, cardName, cancelledAtDate }),
      })

      if (res.ok) {
        setCardName('')
        setIsAdding(false)
        fetchLockouts()
      }
    } catch (err) {
      console.error('Error logging cancelled card:', err)
    } finally {
      setSubmitting(false)
    }
  }

  const getDaysRemaining = (eligibleDateStr: string) => {
    const eligibleDate = new Date(eligibleDateStr)
    const now = new Date()
    const diffTime = eligibleDate.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-6">
      <div className="flex justify-between items-center border-b border-gray-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">
              Bank Exclusion & Lockout Tracker
            </h3>
            <p className="text-xs text-gray-500">
              Track 12–24 month sign-up bonus exclusion clocks across Australian banks
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-1.5 px-3 py-2 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-lg text-xs font-semibold transition"
        >
          <Plus className="w-4 h-4" /> {isAdding ? 'Close' : 'Log Cancelled Card'}
        </button>
      </div>

      {isAdding && (
        <form
          onSubmit={handleAddLockout}
          className="p-4 bg-amber-50/50 rounded-xl border border-amber-100 space-y-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Banking Group
              </label>
              <select
                value={bankGroup}
                onChange={(e) => setBankGroup(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-gray-300 bg-white"
              >
                {AUSTRALIAN_BANKS.map((bank) => (
                  <option key={bank} value={bank}>
                    {bank}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Card Name / Product
              </label>
              <input
                type="text"
                placeholder="e.g. Qantas Ultimate or Altitude Black"
                value={cardName}
                onChange={(e) => setCardName(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-gray-300 bg-white"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Cancellation Date
              </label>
              <input
                type="date"
                value={cancelledAtDate}
                onChange={(e) => setCancelledAtDate(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-gray-300 bg-white"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition disabled:opacity-50"
          >
            {submitting ? 'Starting Countdown Clock...' : 'Start Lockout Countdown'}
          </button>
        </form>
      )}

      {loading ? (
        <div className="text-center py-4 text-xs text-gray-400">
          Loading exclusion clocks...
        </div>
      ) : lockouts.length === 0 ? (
        <div className="text-center py-5 bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
          <p className="text-xs text-gray-500 font-medium">
            No bank lockouts currently active.
          </p>
          <p className="text-[11px] text-gray-400">
            Log a cancelled credit card to start the countdown clock for your next sign-up bonus.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {lockouts.map((item) => {
            const daysLeft = getDaysRemaining(item.eligibleAgainAt)
            const isEligible = daysLeft <= 0

            return (
              <div
                key={item.id}
                className={`p-3.5 border rounded-xl flex flex-wrap items-center justify-between text-xs gap-3 ${
                  isEligible
                    ? 'bg-emerald-50/60 border-emerald-200'
                    : 'bg-gray-50/80 border-gray-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-lg ${
                      isEligible
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    <Building className="w-4 h-4" />
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-900">{item.bankGroup}</span>
                      <span className="text-[10px] text-gray-500 font-mono">
                        ({item.cardName})
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-500">
                      Cancelled on {new Date(item.cancelledAt).toLocaleDateString()} •{' '}
                      {item.lockoutMonths}-Month Exclusion Policy
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  {isEligible ? (
                    <span className="flex items-center gap-1 text-emerald-700 font-bold bg-emerald-100/80 px-2.5 py-1 rounded-full text-[11px]">
                      <CheckCircle2 className="w-3.5 h-3.5" /> RE-ELIGIBLE NOW
                    </span>
                  ) : (
                    <div className="space-y-0.5">
                      <p className="font-mono font-bold text-amber-700 text-xs">
                        {daysLeft} Days Remaining
                      </p>
                      <p className="text-[10px] text-gray-400">
                        Eligible on{' '}
                        {new Date(item.eligibleAgainAt).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}