'use client'

import { useState, useEffect } from 'react'
import { Gift, Copy, Check, Users, ShieldCheck, Sparkles, TrendingUp } from 'lucide-react'

export function ReferralHub() {
  const [referralUrl, setReferralUrl] = useState('')
  const [referralCode, setReferralCode] = useState('')
  const [rolloverBalanceCents, setRolloverBalanceCents] = useState(100000)
  const [referralCount, setReferralCount] = useState(0)
  const [referrals, setReferrals] = useState<{ id: string; email: string; createdAt: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  const fetchReferralData = async () => {
    try {
      const res = await fetch('/api/referral')
      const data = await res.json()
      if (res.ok) {
        setReferralUrl(data.referralUrl)
        setReferralCode(data.referralCode)
        setRolloverBalanceCents(data.rolloverBalanceCents)
        setReferralCount(data.referralCount)
        setReferrals(data.referrals)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReferralData()
  }, [])

  const handleCopy = () => {
    navigator.clipboard.writeText(referralUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const balanceDollars = (rolloverBalanceCents / 100).toFixed(2)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-gray-100 pb-4">
        <h1 className="text-2xl font-bold text-gray-900">Rollover Volume Ledger & Referrals</h1>
        <p className="text-xs text-gray-500">
          Earn $1,000 in fee-free pass-through routing volume for every friend who activates an account
        </p>
      </div>

      {/* Main Ledger Metric Banner */}
      <div className="bg-gradient-to-br from-emerald-900 to-emerald-950 text-white rounded-2xl p-6 shadow-xl relative overflow-hidden space-y-6">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Gift className="w-48 h-48" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-1">
            <span className="text-xs uppercase tracking-wider text-emerald-300 font-semibold flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-emerald-400" /> Active Rollover Balance
            </span>
            <p className="text-4xl font-mono font-bold tracking-tight text-white">
              ${balanceDollars}{' '}
              <span className="text-sm font-sans text-emerald-300 font-normal">AUD</span>
            </p>
            <p className="text-xs text-emerald-200/80">
              Fee-free direct debit volume remaining • Never expires
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10 text-xs space-y-1">
            <p className="text-emerald-300 font-semibold flex items-center gap-1">
              <Users className="w-4 h-4" /> {referralCount} Successful Referrals
            </p>
            <p className="text-white font-bold">
              ${(referralCount * 1000).toLocaleString()} Total Volume Earned
            </p>
          </div>
        </div>
      </div>

      {/* Shareable Link Box */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900">Your Unique Referral Link</h3>
            <p className="text-xs text-gray-500">
              Short code {referralCode || '------'} • Share this link with friends, family, or points-hacking communities
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            readOnly
            value={referralUrl || 'Loading referral link...'}
            className="flex-1 text-xs p-3 rounded-xl border border-gray-200 bg-gray-50 font-mono text-gray-800"
          />
          <button
            onClick={handleCopy}
            disabled={!referralUrl}
            className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition flex items-center gap-2 shadow-sm disabled:opacity-50"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied!' : 'Copy Link'}
          </button>
        </div>
      </div>

      {/* Referred Users List */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4">
        <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
          Referred Network ({referrals.length})
        </h3>

        {loading ? (
          <div className="text-center py-4 text-xs text-gray-400">Loading referral activity...</div>
        ) : referrals.length === 0 ? (
          <div className="text-center py-6 bg-gray-50/50 rounded-xl border border-dashed border-gray-200 space-y-1">
            <p className="text-xs text-gray-500 font-medium">No referrals logged yet.</p>
            <p className="text-[11px] text-gray-400">
              Copy your referral link above and share it to instantly earn $1,000 fee-free volume.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {referrals.map((ref) => (
              <div key={ref.id} className="py-3 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">{ref.email}</p>
                    <p className="text-[10px] text-gray-400">
                      Joined {new Date(ref.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full">
                  +$1,000 Credited
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}