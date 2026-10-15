'use client'

import { useState, useEffect } from 'react'
import { Sliders, Plus, Clock, Zap, Shield, CheckCircle2, Info, ArrowRight } from 'lucide-react'

interface FundingSource {
  id: string
  brand: string
  last4: string
  isDefault?: boolean
}

interface RoutingRule {
  id: string
  ruleType: 'CHURN_TIMER' | 'BILLER_OVERRIDE' | 'DEFAULT'
  billerName: string | null
  expiresAt: string | null
  priority: number
  fundingSource: FundingSource
}

export function RoutingRulesManager({ fundingSources }: { fundingSources: FundingSource[] }) {
  const [rules, setRules] = useState<RoutingRule[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdding, setIsAdding] = useState(false)

  // Form State
  const [ruleType, setRuleType] = useState<'BILLER_OVERRIDE' | 'CHURN_TIMER'>('BILLER_OVERRIDE')
  const [billerName, setBillerName] = useState('')
  const [fundingSourceId, setFundingSourceId] = useState(fundingSources[0]?.id || '')
  const [daysActive, setDaysActive] = useState('90')
  const [submitting, setSubmitting] = useState(false)

  const defaultSource = fundingSources[0]

  const fetchRules = async () => {
    try {
      const res = await fetch('/api/rules')
      const data = await res.json()
      if (res.ok) {
        setRules(data.rules)
      }
    } catch (err) {
      console.error('Failed to fetch rules:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRules()
  }, [])

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fundingSourceId) return

    setSubmitting(true)
    try {
      const res = await fetch('/api/rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ruleType,
          billerName: ruleType === 'BILLER_OVERRIDE' ? billerName : null,
          fundingSourceId,
          daysActive: ruleType === 'CHURN_TIMER' ? daysActive : null,
          priority: ruleType === 'BILLER_OVERRIDE' ? 1 : 2,
        }),
      })

      if (res.ok) {
        setBillerName('')
        setIsAdding(false)
        fetchRules()
      }
    } catch (err) {
      console.error('Error creating rule:', err)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Payment Routing Architecture</h3>
            <p className="text-xs text-gray-500">
              How money flows from your Virtual BSB to your tokenized cards
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-xs font-semibold transition"
        >
          <Plus className="w-4 h-4" /> {isAdding ? 'Close' : 'Add Custom Rule'}
        </button>
      </div>

      {/* Prominent Default Route Banner */}
      <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-100/80 space-y-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-900">
              Default Pass-Through Route
            </span>
          </div>
          <span className="px-2.5 py-0.5 bg-emerald-600 text-white rounded-full text-[10px] font-bold tracking-wide">
            AUTOMATIC FALLBACK
          </span>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-2 text-xs font-medium text-gray-800">
            <span className="px-2 py-1 bg-white rounded border border-emerald-200 text-emerald-800 font-mono text-[11px]">
              Inbound Direct Debit
            </span>
            <ArrowRight className="w-4 h-4 text-emerald-500 shrink-0" />
            <span className="px-2.5 py-1 bg-white rounded border border-emerald-300 font-bold text-gray-900">
              {defaultSource ? `${defaultSource.brand} (••${defaultSource.last4})` : 'Primary Linked Card'}
            </span>
          </div>
        </div>

        <div className="flex items-start gap-1.5 pt-1 text-[11px] text-emerald-800/80">
          <Info className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
          <span>
            <strong>Zero setup required:</strong> All incoming direct debits automatically pay via your default card above. Custom rules below are completely optional and only needed for specific biller overrides or points churn timers.
          </span>
        </div>
      </div>

      {/* Add Custom Rule Form */}
      {isAdding && (
        <form onSubmit={handleCreateRule} className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Rule Type</label>
              <select
                value={ruleType}
                onChange={(e) => setRuleType(e.target.value as 'BILLER_OVERRIDE' | 'CHURN_TIMER')}
                className="w-full text-xs p-2.5 rounded-lg border border-gray-300 bg-white"
              >
                <option value="BILLER_OVERRIDE">Biller Override (If Direct Debit from X)</option>
                <option value="CHURN_TIMER">Points Churner Timer (Active Window)</option>
              </select>
            </div>

            {ruleType === 'BILLER_OVERRIDE' ? (
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Biller Name</label>
                <input
                  type="text"
                  placeholder="e.g. Synergy Energy or Water Corp"
                  value={billerName}
                  onChange={(e) => setBillerName(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-gray-300 bg-white"
                  required
                />
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Timer Window (Days)</label>
                <input
                  type="number"
                  value={daysActive}
                  onChange={(e) => setDaysActive(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-gray-300 bg-white"
                  required
                />
              </div>
            )}

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-700 mb-1">Target Funding Source</label>
              <select
                value={fundingSourceId}
                onChange={(e) => setFundingSourceId(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-gray-300 bg-white"
              >
                {fundingSources.map((source) => (
                  <option key={source.id} value={source.id}>
                    {source.brand} (••{source.last4})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition disabled:opacity-50"
          >
            {submitting ? 'Saving Rule...' : 'Save Routing Rule'}
          </button>
        </form>
      )}

      {/* Custom Overrides List */}
      <div className="space-y-3 pt-2">
        <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
          Custom Overrides & Timers (Optional)
        </h4>

        {loading ? (
          <div className="text-center py-4 text-xs text-gray-400">Loading active routing rules...</div>
        ) : rules.length === 0 ? (
          <div className="text-center py-5 bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
            <p className="text-xs text-gray-500 font-medium">No custom override rules active.</p>
            <p className="text-[11px] text-gray-400">
              100% of direct debits will route directly to your Default Pass-Through card above.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {rules.map((rule) => (
              <div
                key={rule.id}
                className="flex items-center justify-between p-3.5 bg-gray-50/70 border border-gray-100 rounded-xl text-xs"
              >
                <div className="flex items-center gap-3">
                  {rule.ruleType === 'BILLER_OVERRIDE' && <Zap className="w-4 h-4 text-amber-500" />}
                  {rule.ruleType === 'CHURN_TIMER' && <Clock className="w-4 h-4 text-emerald-600" />}
                  {rule.ruleType === 'DEFAULT' && <Shield className="w-4 h-4 text-blue-500" />}

                  <div>
                    <p className="font-bold text-gray-900">
                      {rule.ruleType === 'BILLER_OVERRIDE' && `IF Biller = "${rule.billerName}"`}
                      {rule.ruleType === 'CHURN_TIMER' && 'Points Churn Active Window'}
                      {rule.ruleType === 'DEFAULT' && 'Default Fallback Protocol'}
                    </p>
                    <p className="text-[11px] text-gray-500">
                      THEN route charge to{' '}
                      <strong className="text-gray-700">
                        {rule.fundingSource.brand} (••{rule.fundingSource.last4})
                      </strong>
                    </p>
                  </div>
                </div>

                {rule.expiresAt && (
                  <span className="flex items-center gap-1 text-[11px] text-emerald-700 font-mono bg-emerald-100/70 px-2.5 py-1 rounded-full">
                    <CheckCircle2 className="w-3 h-3" />
                    Expires {new Date(rule.expiresAt).toLocaleDateString()}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}