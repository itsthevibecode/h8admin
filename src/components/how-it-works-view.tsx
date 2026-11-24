'use client'

import { useState } from 'react'
import {
  Landmark,
  ShieldCheck,
  Lock,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Ticket,
  Wallet,
  Route,
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
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-900 to-emerald-950 p-8 text-white shadow-xl">
        <div className="absolute right-0 top-0 p-8 opacity-10">
          <ShieldCheck className="h-48 w-48" />
        </div>
        <div className="relative z-10 max-w-2xl space-y-3">
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-300">
            <Sparkles className="h-4 w-4 text-emerald-400" /> Personal Financial Autopilot
          </p>
          <h1 className="text-3xl font-extrabold leading-tight tracking-tight">
            Your bills. One permanent payment address.
          </h1>
          <p className="text-sm leading-relaxed text-emerald-100/90">
            H8Admin sits between your billers and your money. Set up permanent payment details,
            connect the accounts and cards you already use, then let H8Admin apply your funding
            preferences when a bill arrives.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-gray-900">How it works</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="space-y-3 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <Landmark className="h-5 w-5" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                Step 1
              </span>
            </div>
            <h3 className="text-sm font-bold text-gray-900">Set up your permanent payment details</h3>
            <p className="text-xs leading-relaxed text-gray-500">
              H8Admin provides permanent payment details to use with participating billers for
              recurring bills, utilities, insurance and subscriptions.
            </p>
          </div>

          <div className="space-y-3 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <Wallet className="h-5 w-5" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                Step 2
              </span>
            </div>
            <h3 className="text-sm font-bold text-gray-900">Connect your existing money</h3>
            <p className="text-xs leading-relaxed text-gray-500">
              Connect your Australian bank accounts and eligible debit or credit cards. Card numbers
              are handled by our payment partners; H8Admin stores token references, brand and last
              four digits.
            </p>
          </div>

          <div className="space-y-3 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <Route className="h-5 w-5" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                Step 3
              </span>
            </div>
            <h3 className="text-sm font-bold text-gray-900">H8Admin manages the routing</h3>
            <p className="text-xs leading-relaxed text-gray-500">
              When a bill arrives, H8Admin applies your payment preferences and attempts to collect
              funds from your nominated funding source. If funding fails, you are notified and the
              payment stays failed or pending under your rules.
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-5">
        <p className="text-sm font-bold text-emerald-950">Simple pricing</p>
        <p className="mt-1 text-xs leading-relaxed text-emerald-900/80">
          H8Admin charges a flat <strong>$1 fee per successfully completed bill payment</strong>. The
          fee is only charged when that payment succeeds, and it is disclosed before you authorise
          the relevant payment. Payment-provider costs sit with H8Admin and are not listed as a
          separate customer fee.
        </p>
      </div>

      <div className="space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-gray-900">
          Why a permanent payment address helps
        </h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2">
              <div className="rounded-xl bg-amber-50 p-2 text-amber-700">
                <AlertTriangle className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-bold text-gray-900">Updating every biller yourself</h3>
            </div>
            <ul className="space-y-2.5 text-xs text-gray-600">
              <li>Each biller may store the bank or card details you gave them.</li>
              <li>Changing banks or cards often means updating many providers one by one.</li>
              <li>Missed updates can lead to failed payments and follow-up from the biller.</li>
            </ul>
          </div>

          <div className="space-y-4 rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm ring-1 ring-emerald-50">
            <div className="flex items-center gap-2">
              <div className="rounded-xl bg-emerald-50 p-2 text-emerald-700">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-bold text-gray-900">Using H8Admin</h3>
            </div>
            <ul className="space-y-2.5 text-xs text-gray-600">
              <li>Participating billers can use your permanent H8Admin payment details.</li>
              <li>You keep control of which connected funding source should pay.</li>
              <li className="flex items-start gap-1.5">
                <RefreshCw className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                Change underlying banks or cards in H8Admin without re-entering details at every
                biller.
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="space-y-3 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2">
          <Lock className="h-4 w-4 text-emerald-600" />
          <h3 className="text-sm font-bold text-gray-900">Important limits</h3>
        </div>
        <ul className="space-y-2 text-xs leading-relaxed text-gray-600">
          <li>H8Admin is not a lender and does not offer overdrafts or shortfall cover.</li>
          <li>H8Admin does not guarantee that every payment will succeed if a funding source declines.</li>
          <li>
            Not every biller accepts every card network. Some may only take direct debit, Mastercard
            or another method.
          </li>
          <li>
            Virtual BSB, account and card issuing arrangements depend on banking and payment partners
            and may change as those partnerships are confirmed.
          </li>
        </ul>
      </div>

      <div className="space-y-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-600">
            <Ticket className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900">Have a promo or referral code?</h3>
            <p className="text-xs text-gray-500">
              Apply an onboarding code if you have one. Credits are account benefits, not cash.
            </p>
          </div>
        </div>

        <form onSubmit={(event) => void handleRedeem(event)} className="flex flex-col gap-2 sm:flex-row">
          <input
            type="text"
            value={promoCode}
            onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
            placeholder="Enter code"
            autoComplete="off"
            spellCheck={false}
            className="flex-1 rounded-xl border border-gray-200 bg-gray-50 p-3 font-mono text-xs uppercase tracking-wider text-gray-800"
          />
          <button
            type="submit"
            disabled={submitting || !promoCode.trim()}
            className="rounded-xl bg-emerald-600 px-5 py-3 text-xs font-bold text-white transition hover:bg-emerald-700 disabled:opacity-50"
          >
            {submitting ? 'Applying…' : 'Apply Code'}
          </button>
        </form>

        {error && <p className="text-xs text-red-600">{error}</p>}

        {successMessage && (
          <div className="space-y-1 rounded-xl border border-emerald-100 bg-emerald-50 p-4">
            <p className="flex items-center gap-1.5 text-xs font-bold text-emerald-800">
              <CheckCircle2 className="h-4 w-4" />
              {successMessage}
            </p>
            {newBalanceCents !== null && (
              <p className="font-mono text-sm font-bold text-emerald-900">
                Credit balance: $
                {(newBalanceCents / 100).toLocaleString('en-AU', { minimumFractionDigits: 2 })} AUD
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
