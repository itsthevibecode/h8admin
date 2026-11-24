'use client'

import Link from 'next/link'
import { AccountType } from '@prisma/client'
import { Building2, Home, Plus, User, Users } from 'lucide-react'

interface VirtualAccount {
  id: string
  accountType: AccountType
  bsb: string
  accountNumber: string
  displayName?: string | null
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
    spinUpLabel: 'Activate Personal BSB',
    icon: User,
  },
  {
    type: AccountType.HOUSEHOLD,
    label: 'Household',
    spinUpLabel: 'Set up Household',
    icon: Home,
  },
  {
    type: AccountType.INVESTMENT,
    label: 'Investment Property',
    spinUpLabel: 'Set up Investment property',
    icon: Building2,
  },
]

export function PortfolioSwitcher({
  virtualAccounts,
  activeAccountId,
  onSelectAccount,
}: PortfolioSwitcherProps) {
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
              const href =
                portfolio.type === AccountType.HOUSEHOLD
                  ? '/direct-debits/household'
                  : portfolio.type === AccountType.INVESTMENT
                    ? '/direct-debits/investment'
                    : '/direct-debits/personal'
              return (
                <Link
                  key={portfolio.type}
                  href={href}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold border border-dashed border-emerald-300 text-emerald-700 bg-emerald-50/70 hover:bg-emerald-50"
                >
                  <Plus className="h-4 w-4" />
                  {portfolio.spinUpLabel}
                </Link>
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
                  {account.displayName?.trim() ||
                    (portfolio.type === AccountType.INVESTMENT && existing.length > 1
                      ? `${portfolio.label} (••${account.accountNumber.slice(-4)})`
                      : portfolio.label)}
                </span>
              </button>
            ))
          })}
        </div>

        {isHouseholdActive(virtualAccounts, activeAccountId) && (
          <Link
            href="/direct-debits/household"
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-xl text-xs font-semibold"
          >
            <Users className="w-4 h-4" /> Manage household
          </Link>
        )}
      </div>
    </div>
  )
}

function isHouseholdActive(accounts: VirtualAccount[], activeAccountId: string): boolean {
  const active = accounts.find((account) => account.id === activeAccountId)
  return active?.accountType === AccountType.HOUSEHOLD
}
