'use client'

import { use, useEffect } from 'react'
import Link from 'next/link'
import { ShieldCheck, ArrowRight, Zap, Clock, Gift, Lock } from 'lucide-react'

export default function ReferralLandingPage({
  params,
}: {
  params: Promise<{ code: string }> | { code: string }
}) {
  const resolvedParams = params instanceof Promise ? use(params) : params
  const referralCode = resolvedParams?.code

  useEffect(() => {
    if (referralCode) {
      // Store referral code in cookie for 30 days
      const maxAge = 60 * 60 * 24 * 30
      document.cookie = `referral_code=${referralCode.trim().toUpperCase()}; path=/; max-age=${maxAge}; SameSite=Lax`
    }
  }, [referralCode])

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white text-gray-900 flex flex-col justify-between selection:bg-emerald-100">
      {/* Top Banner */}
      <header className="border-b border-gray-100 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-emerald-600 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-sm">
              H8
            </div>
            <span className="font-bold text-gray-900 tracking-tight text-sm">Financial Autopilot</span>
          </div>

          <Link
            href="/"
            className="text-xs font-semibold px-4 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-xl transition"
          >
            Sign In
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-4xl mx-auto px-6 py-16 text-center space-y-8">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold shadow-sm">
          <Gift className="w-4 h-4 text-emerald-600" /> Exclusive Invitation: $1,000 Fee-Free Routing Volume
        </div>

        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-gray-900 leading-tight">
          Never Update Direct Debits <br />
          <span className="text-emerald-700">On Your Bills Again.</span>
        </h1>

        <p className="text-sm sm:text-base text-gray-600 max-w-2xl mx-auto leading-relaxed">
          You have been invited to activate your permanent financial address. Route your utility bills,
          rates, and memberships through tokenized credit cards to hit rewards targets on autopilot.
        </p>

        {/* CTA Box */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/"
            className="w-full sm:w-auto px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20"
          >
            <span>Claim $1,000 Free Volume & Get Started</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Value Proposition Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-12 text-left">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-3">
            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-gray-900 text-sm">Permanent BSB</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Hand out your Virtual BSB once. Switch credit cards, debit cards, or offset accounts on your dashboard without updating 30+ billers.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-3">
            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-gray-900 text-sm">Points Churner Timers</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Open a new credit card and set a bonus spend window. Inbound direct debits automatically route to your new card to hit sign-up targets.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-3">
            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-gray-900 text-sm">Zero-Knowledge Security</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Your real cards and offset bank accounts are vaulted off-site by Stripe. If utility companies or billers get hacked, your real numbers remain safe.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-6 text-center text-xs text-gray-400">
        H8Admin Financial Autopilot • Built for Savvy Australian Optimizers
      </footer>
    </div>
  )
}
