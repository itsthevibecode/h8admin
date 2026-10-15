'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { User, Home, Building2, Plus, UserPlus } from 'lucide-react'
import { PartnerInviteModal } from '@/components/partner-invite-modal'

interface VirtualAccount {
  id: string
  accountType: 'INDIVIDUAL' | 'HOUSEHOLD' | 'INVESTMENT'
  bsb: string
  accountNumber: string
  householdId?: string | null
}

interface PortfolioTabsProps {
  virtualAccounts: VirtualAccount[]
  activeAccountId: string
  onSelectAccount: (id: string) => void
}

export function PortfolioTabs({
  virtualAccounts,
  activeAccountId,
  onSelectAccount,
}: PortfolioTabsProps) {
  const [isCreating, setIsCreating] = useState(false)
  const [isInviteOpen, setIsInviteOpen] = useState(false)
  const [newType, setNewType] = useState<'HOUSEHOLD' | 'INVESTMENT'>('HOUSEHOLD')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const activeAcc = virtualAccounts.find((acc) => acc.id === activeAccountId)

  const handleCreatePortfolio = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/virtual-accounts/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountType: newType }),
      })

      if (res.ok) {
        setIsCreating(false)
        router.refresh()
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to create portfolio')
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'HOUSEHOLD':
        return <Home className="w-4 h-4" />
      case 'INVESTMENT':
        return <Building2 className="w-4 h-4" />
      default:
        return <User className="w-4 h-4" />
    }
  }

  const getLabel = (acc: VirtualAccount) => {
    switch (acc.accountType) {
      case 'HOUSEHOLD':
        return 'Joint Household'
      case 'INVESTMENT':
        return `Investment Property (••${acc.accountNumber.slice(-4)})`
      default:
        return 'Personal Account'
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 pb-3">
        <div className="flex flex-wrap gap-2">
          {virtualAccounts.map((acc) => (
            <button
              key={acc.id}
              onClick={() => onSelectAccount(acc.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
                activeAccountId === acc.id
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {getIcon(acc.accountType)}
              <span>{getLabel(acc)}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {activeAcc?.accountType === 'HOUSEHOLD' && activeAcc.householdId && (
            <button
              onClick={() => setIsInviteOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 text-white hover:bg-emerald-700 rounded-xl text-xs font-semibold transition shadow-sm"
            >
              <UserPlus className="w-4 h-4" /> Invite Partner
            </button>
          )}

          <button
            onClick={() => setIsCreating(!isCreating)}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-xl text-xs font-semibold transition"
          >
            <Plus className="w-4 h-4" /> New Portfolio BSB
          </button>
        </div>
      </div>

      {isCreating && (
        <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-100 space-y-3">
          <p className="text-xs font-bold text-gray-900">Spin Up Secondary Virtual BSB</p>
          <p className="text-xs text-gray-600">
            Provision a distinct financial address to keep household or property expenses tax-segregated.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={newType}
              onChange={(e) => setNewType(e.target.value as 'HOUSEHOLD' | 'INVESTMENT')}
              className="text-xs p-2 rounded-lg border border-gray-300 bg-white"
            >
              <option value="HOUSEHOLD">Joint Household Portfolio</option>
              <option value="INVESTMENT">Investment Property Portfolio</option>
            </select>
            <button
              onClick={handleCreatePortfolio}
              disabled={loading}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition disabled:opacity-50"
            >
              {loading ? 'Provisioning...' : 'Provision Virtual BSB'}
            </button>
          </div>
        </div>
      )}

      {activeAcc?.householdId && (
        <PartnerInviteModal
          isOpen={isInviteOpen}
          onClose={() => setIsInviteOpen(false)}
          householdId={activeAcc.householdId}
        />
      )}
    </div>
  )
}