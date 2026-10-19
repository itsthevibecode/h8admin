'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { AccountType } from '@prisma/client'
import { Building2, Home, Plus, User, Users } from 'lucide-react'

interface VirtualAccount {
  id: string
  accountType: AccountType
  bsb: string
  accountNumber: string
  householdId?: string | null
}

interface PortfolioSwitcherProps {
  virtualAccounts: VirtualAccount[]
  activeAccountId: string
  onSelectAccount: (id: string) => void
}

const PORTFOLIOS: {
  type: AccountType
  label: string
  spinUpLabel: string
  icon: typeof User
}[] = [
  {
    type: AccountType.INDIVIDUAL,
    label: 'Personal',
    spinUpLabel: 'Spin up Personal BSB',
    icon: User,
  },
  {
    type: AccountType.HOUSEHOLD,
    label: 'Joint Household',
    spinUpLabel: 'Spin up Household BSB',
    icon: Home,
  },
  {
    type: AccountType.INVESTMENT,
    label: 'Investment Property',
    spinUpLabel: 'Spin up Investment BSB',
    icon: Building2,
  },
]

export function PortfolioSwitcher({
  virtualAccounts,
  activeAccountId,
  onSelectAccount,
}: PortfolioSwitcherProps) {
  const [creatingType, setCreatingType] = useState<AccountType | null>(null)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleCreate = async (accountType: AccountType) => {
    setCreatingType(accountType)
    setError('')
    try {
      const res = await fetch('/api/virtual-accounts/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountType }),
      })
      const data = (await res.json()) as {
        virtualAccount?: { id: string }
        error?: string
      }
      if (!res.ok) {
        throw new Error(data.error || 'Failed to provision BSB')
      }
      if (data.virtualAccount?.id) {
        onSelectAccount(data.virtualAccount.id)
      }
      router.refresh()
    } catch (err: unknown) {
      setError((err as Error).message)
    } finally {
      setCreatingType(null)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 pb-3">
        <div className="flex flex-wrap gap-2">
          {PORTFOLIOS.map((portfolio) => {
            const existing = virtualAccounts.filter(
              (account) => account.accountType === portfolio.type
            )
            const Icon = portfolio.icon
            if (existing.length === 0) {
              return (
                <button
                  key={portfolio.type}
                  onClick={() => void handleCreate(portfolio.type)}
                  disabled={creatingType !== null}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold border border-dashed border-emerald-300 text-emerald-700 bg-emerald-50/70 hover:bg-emerald-50 disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                  {creatingType === portfolio.type ? 'Provisioning…' : portfolio.spinUpLabel}
                </button>
              )
            }

            return existing.map((account) => (
              <button
                key={account.id}
                onClick={() => onSelectAccount(account.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
                  activeAccountId === account.id
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>
                  {portfolio.label}
                  {portfolio.type === AccountType.INVESTMENT && existing.length > 1
                    ? ` (••${account.accountNumber.slice(-4)})`
                    : ''}
                </span>
              </button>
            ))
          })}
        </div>

        {isHouseholdActive(virtualAccounts, activeAccountId) && (
          <Link
            href="/household"
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-xl text-xs font-semibold"
          >
            <Users className="w-4 h-4" /> Manage household
          </Link>
        )}
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}

function isHouseholdActive(accounts: VirtualAccount[], activeAccountId: string): boolean {
  const active = accounts.find((account) => account.id === activeAccountId)
  return active?.accountType === AccountType.HOUSEHOLD
}
