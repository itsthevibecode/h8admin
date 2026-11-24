'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CardSetupModal } from '@/components/card-setup-modal'
import { DirectDebitSimulator } from '@/components/direct-debit-simulator'
import { TransactionsList } from '@/components/transactions-list'
import { PortfolioSwitcher } from '@/components/portfolio-switcher'
import { PointsChurnerTracker } from '@/components/points-churner-tracker'
import { OnboardingStepper } from '@/components/onboarding-stepper'
import { useToast } from '@/components/ui/toast'
import { BillingHub } from '@/components/billing-hub'
import { ShieldCheck, ArrowUpRight, Plus, CreditCard, Landmark, CheckCircle2, Copy } from 'lucide-react'

interface VirtualAccount {
  id: string
  bsb: string
  accountNumber: string
  displayName?: string | null
  accountType: 'INDIVIDUAL' | 'HOUSEHOLD' | 'INVESTMENT'
  householdId?: string | null
}

interface DashboardViewProps {
  email: string
  virtualAccounts: VirtualAccount[]
  fundingSource: { id: string; brand: string; last4: string } | null
  allFundingSources?: { id: string; brand: string; last4: string }[]
  hasBillerRule?: boolean
  transactions?: {
    id: string
    billerName: string
    amountCents: number
    status: 'SUCCESS' | 'DECLINED' | 'FAILED'
    createdAt: string
    fundingSource: { brand: string; last4: string } | null
  }[]
}

export function DashboardView({
  email,
  virtualAccounts = [],
  fundingSource,
  allFundingSources = [],
  hasBillerRule = false,
  transactions = [],
}: DashboardViewProps) {
  const { toast } = useToast()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [activeAccountId, setActiveAccountId] = useState(
    virtualAccounts[0]?.id || ''
  )

  const router = useRouter()

  const activeAccount =
    virtualAccounts.find((acc) => acc.id === activeAccountId) ||
    virtualAccounts[0] ||
    null

  const handleSuccess = () => {
    setIsModalOpen(false)
    router.refresh()
  }

  const availableSources =
    allFundingSources.length > 0
      ? allFundingSources
      : fundingSource
      ? [fundingSource]
      : []

  const copyText = async (value: string, message: string) => {
    try {
      await navigator.clipboard.writeText(value)
      toast(message, 'success')
    } catch {
      toast('Could not copy to clipboard', 'error')
    }
  }

  const bsb = activeAccount?.bsb || '802-985'
  const accountNumber = activeAccount?.accountNumber || ''

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Financial Autopilot</h1>
          <p className="text-sm text-gray-500">
            Logged in as <span className="font-medium text-emerald-700">{email}</span>
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition shadow-sm"
        >
          <Plus className="w-4 h-4" /> Add Virtual BSB / Card
        </button>
      </div>

      <OnboardingStepper
        hasCard={availableSources.length > 0}
        hasBillerRule={hasBillerRule}
        hasSimulated={transactions.length > 0}
      />

      {/* Portfolio Workspace Tabs */}
      <PortfolioSwitcher
        virtualAccounts={virtualAccounts}
        activeAccountId={activeAccountId}
        onSelectAccount={(id) => setActiveAccountId(id)}
      />

      {/* Main Virtual BSB / Permanent Address Card */}
      <div
        id="permanent-address"
        className="scroll-mt-6 bg-gradient-to-br from-emerald-900 to-emerald-950 text-white rounded-2xl p-6 shadow-xl relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <ShieldCheck className="w-48 h-48" />
        </div>
        <div className="relative z-10 space-y-6">
          <div className="flex justify-between items-center">
            <span className="text-xs uppercase tracking-wider text-emerald-300 font-semibold flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> Permanent Financial Address
            </span>
            <span
              className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                fundingSource
                  ? 'bg-emerald-500/20 border-emerald-400/30 text-emerald-300'
                  : 'bg-amber-500/20 border-amber-400/30 text-amber-300'
              }`}
            >
              {fundingSource ? 'Active Intermediary' : 'Setup Required'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <div>
              <p className="text-xs text-emerald-200/70 uppercase tracking-wider mb-1">BSB Number</p>
              <button
                type="button"
                onClick={() => void copyText(bsb, 'BSB copied to clipboard!')}
                className="flex items-center gap-2 text-2xl font-mono font-bold tracking-widest text-white hover:text-emerald-100"
              >
                {bsb}
                <Copy className="h-4 w-4 text-emerald-300" />
              </button>
            </div>
            <div>
              <p className="text-xs text-emerald-200/70 uppercase tracking-wider mb-1">
                Virtual Account Number ({activeAccount?.accountType || 'INDIVIDUAL'})
              </p>
              <button
                type="button"
                onClick={() =>
                  void copyText(
                    `BSB: ${bsb}\nAccount: ${accountNumber}`,
                    'Account details copied!'
                  )
                }
                className="flex items-center gap-2 text-2xl font-mono font-bold tracking-widest text-white hover:text-emerald-100"
              >
                {accountNumber || 'Pending Setup'}
                <Copy className="h-4 w-4 text-emerald-300" />
              </button>
            </div>
          </div>

          <div className="pt-4 border-t border-emerald-800/60 flex flex-wrap justify-between items-center text-xs text-emerald-200/80 gap-2">
            <span>
              Primary Funding Source:{' '}
              <strong className="text-white">
                {fundingSource ? `${fundingSource.brand} (••${fundingSource.last4})` : 'Not Linked'}
              </strong>
            </span>
            {fundingSource ? (
              <span className="flex items-center gap-1 text-emerald-400 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" /> Pass-Through Active
              </span>
            ) : (
              <button
                onClick={() => setIsModalOpen(true)}
                className="text-emerald-300 underline hover:text-white"
              >
                Link Card to Activate
              </button>
            )}
          </div>
        </div>
      </div>

      <BillingHub />

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-2">
          <div className="flex justify-between items-center text-gray-500 text-xs font-medium">
            <span>Active Portfolios</span>
            <Landmark className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{virtualAccounts.length} BSBs Active</p>
          <p className="text-xs text-gray-500">Personal, Household, Investments</p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-2">
          <div className="flex justify-between items-center text-gray-500 text-xs font-medium">
            <span>Linked Cards & Funding</span>
            <CreditCard className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {availableSources.length} Source{availableSources.length === 1 ? '' : 's'}
          </p>
          <p className="text-xs text-gray-500">Tokenized via Stripe Vault</p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-2">
          <div className="flex justify-between items-center text-gray-500 text-xs font-medium">
            <span>Points Churn Timer</span>
            <ArrowUpRight className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">42 Days Left</p>
          <p className="text-xs text-emerald-600 font-medium">Minimum Spend Window</p>
        </div>
      </div>

      {/* Bank Exclusion & Lockout Tracker */}
      <PointsChurnerTracker />

      {/* Direct Debit Simulator */}
      <DirectDebitSimulator />

      {/* Transactions Feed */}
      <TransactionsList transactions={transactions} />

      <CardSetupModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleSuccess}
      />
    </div>
  )
}