'use client'

import { useState } from 'react'
import {
  Landmark,
  ShieldCheck,
  Timer,
  Lock,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Ticket,
} from 'lucide-react'

export function HowItWorksView() {
  const [promoCode, setPromoCode] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [newBalanceCents, setNewBalanceCents] = useState<number | null>(null)

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    setSuccessMessage('')

    try {
      const res = await fetch('/api/promo/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ promoCode }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Could not apply this code')
        if (typeof data.newBalanceCents === 'number') {
          setNewBalanceCents(data.newBalanceCents)
        }
        return
      }

      setSuccessMessage(data.message)
      setNewBalanceCents(data.newBalanceCents)
      setPromoCode('')
    } catch {
      setError('Could not apply this code')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-br from-emerald-900 to-emerald-950 text-white rounded-2xl p-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <ShieldCheck className="w-48 h-48" />
        </div>
        <div className="relative z-10 max-w-2xl space-y-3">
          <p className="text-xs uppercase tracking-wider text-emerald-300 font-semibold flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-emerald-400" /> Set-and-forget proxy architecture
          </p>
          <h1 className="text-3xl font-extrabold tracking-tight leading-tight">
            How Financial Autopilot Protects & Optimizes Your Money
          </h1>
          <p className="text-sm text-emerald-100/90 leading-relaxed">
            Hand billers a permanent virtual BSB once. H8Admin sits in front as a tokenized proxy:
            real cards and offset accounts stay vaulted off-site, while inbound direct debits route
            automatically to the funding source that hits your rewards targets.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
          3-Step Setup Guide
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                <Landmark className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                Step 1
              </span>
            </div>
            <h3 className="text-sm font-bold text-gray-900">Provision Your Permanent Virtual BSB</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              One address for life. Give billers a virtual BSB and account number that never changes,
              even when you refinance, churn cards, or switch banks.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                <Lock className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                Step 2
              </span>
            </div>
            <h3 className="text-sm font-bold text-gray-900">Tokenize Real Cards Off-Site</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Zero-knowledge Stripe vault. Raw PANs never sit in H8Admin. If a utility or biller is
              breached, they only ever held a virtual address.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                <Timer className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                Step 3
              </span>
            </div>
            <h3 className="text-sm font-bold text-gray-900">Set Churn Timers & IFTTT Rules</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Bills automatically hit minimum spend targets. Point inbound direct debits at a new
              card for 90 days, then fall back to your default offset.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
          The Proxy Shield vs Traditional Direct Debits
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-amber-50 text-amber-700 rounded-xl">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-gray-900">Traditional Direct Debit</h3>
            </div>
            <ul className="space-y-2.5 text-xs text-gray-600">
              <li>Biller stores your real BSB and account number on their servers.</li>
              <li>If that biller is hacked, your actual bank account is exposed.</li>
              <li>Refinancing or changing cards means manual updates across 30+ sites.</li>
            </ul>
          </div>

          <div className="bg-white rounded-2xl border border-emerald-100 p-6 shadow-sm space-y-4 ring-1 ring-emerald-50">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-gray-900">H8Admin Proxy</h3>
            </div>
            <ul className="space-y-2.5 text-xs text-gray-600">
              <li>Biller only ever sees your Virtual BSB and account number.</li>
              <li>Raw credentials stay vaulted in PCI-DSS Level 1 infrastructure.</li>
              <li className="flex items-start gap-1.5">
                <RefreshCw className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                Swap offset accounts in 1 click without updating billers.
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
            <Ticket className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900">Have a Promo or Referral Code?</h3>
            <p className="text-xs text-gray-500">
              Apply an onboarding code to credit fee-free pass-through volume to your ledger.
            </p>
          </div>
        </div>

        <form onSubmit={handleRedeem} className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={promoCode}
            onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
            placeholder="CHURN10K or VIP0FEE"
            autoComplete="off"
            spellCheck={false}
            className="flex-1 text-xs p-3 rounded-xl border border-gray-200 bg-gray-50 font-mono text-gray-800 uppercase tracking-wider"
          />
          <button
            type="submit"
            disabled={submitting || !promoCode.trim()}
            className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition disabled:opacity-50"
          >
            {submitting ? 'Applying…' : 'Apply Code'}
          </button>
        </form>

        {error && <p className="text-xs text-red-600">{error}</p>}

        {successMessage && (
          <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4 space-y-1">
            <p className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              {successMessage}
            </p>
            {newBalanceCents !== null && (
              <p className="text-sm font-mono font-bold text-emerald-900">
                Ledger balance: ${(newBalanceCents / 100).toLocaleString('en-AU', { minimumFractionDigits: 2 })} AUD
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
