'use client'

import { useCallback, useEffect, useState } from 'react'
import { AccountType, Role } from '@prisma/client'
import {
  AlertCircle,
  Check,
  Copy,
  Home,
  Landmark,
  ShieldCheck,
  UserPlus,
  Users,
} from 'lucide-react'
import { CardPayBanner } from '@/components/card-pay-banner'
import { HouseholdNameEditor } from '@/components/editable-name'

interface HouseholdMemberRow {
  id: string
  role: Role
  user: {
    id: string
    email: string
    name: string | null
  }
}

interface HouseholdTransaction {
  id: string
  billerName: string
  amountCents: number
  status: string
  createdAt: string
}

interface HouseholdPayload {
  id: string
  name: string
  members: HouseholdMemberRow[]
  virtualAccounts: {
    id: string
    bsb: string
    accountNumber: string
    accountType: AccountType
  }[]
}

export function HouseholdManager() {
  const [loading, setLoading] = useState(true)
  const [provisioning, setProvisioning] = useState(false)
  const [inviting, setInviting] = useState(false)
  const [error, setError] = useState('')
  const [household, setHousehold] = useState<HouseholdPayload | null>(null)
  const [role, setRole] = useState<Role | null>(null)
  const [transactions, setTransactions] = useState<HouseholdTransaction[]>([])
  const [inviteUrl, setInviteUrl] = useState('')
  const [copied, setCopied] = useState(false)

  const loadHousehold = useCallback(async () => {
    setError('')
    const res = await fetch('/api/households')
    const data = (await res.json()) as {
      household?: HouseholdPayload | null
      role?: Role | null
      transactions?: HouseholdTransaction[]
      error?: string
    }
    if (!res.ok) {
      throw new Error(data.error || 'Failed to load household')
    }
    setHousehold(data.household ?? null)
    setRole(data.role ?? null)
    setTransactions(data.transactions ?? [])
  }, [])

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        await loadHousehold()
      } catch (err: unknown) {
        if (!cancelled) setError((err as Error).message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [loadHousehold])

  const jointAccount = household?.virtualAccounts.find(
    (account) => account.accountType === AccountType.HOUSEHOLD
  )

  const handleCreateHousehold = async () => {
    setProvisioning(true)
    setError('')
    try {
      const res = await fetch('/api/virtual-accounts/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountType: AccountType.HOUSEHOLD }),
      })
      const data = (await res.json()) as { error?: string }
      if (!res.ok) {
        throw new Error(data.error || 'Failed to provision household BSB')
      }
      await loadHousehold()
    } catch (err: unknown) {
      setError((err as Error).message)
    } finally {
      setProvisioning(false)
    }
  }

  const handleInvite = async () => {
    if (!household) return
    setInviting(true)
    setError('')
    try {
      const res = await fetch('/api/households/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ householdId: household.id }),
      })
      const data = (await res.json()) as { inviteUrl?: string; error?: string }
      if (!res.ok || !data.inviteUrl) {
        throw new Error(data.error || 'Failed to generate invite')
      }
      setInviteUrl(data.inviteUrl)
    } catch (err: unknown) {
      setError((err as Error).message)
    } finally {
      setInviting(false)
    }
  }

  const handleCopy = async () => {
    if (!inviteUrl) return
    await navigator.clipboard.writeText(inviteUrl)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className="p-8 max-w-4xl mx-auto text-sm text-gray-500">Loading household…</div>
    )
  }

  if (!household || !jointAccount) {
    return (
      <div className="p-8 max-w-4xl mx-auto space-y-6">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-700">Billing methods</p>
          <h1 className="text-2xl font-bold text-gray-900">Household</h1>
          <p className="text-sm text-gray-500 mt-1">
            A shared address for bills you split, created only when you ask for it.
          </p>
        </div>
        <CardPayBanner />
        {error && (
          <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}
        <div className="bg-white rounded-2xl border border-emerald-100 p-8 space-y-4 shadow-sm">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
            <Home className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-gray-900">Keep shared bills off your personal account</h2>
          <p className="text-sm text-gray-600">
            A household Virtual BSB is the number you give billers for rent, power, internet and
            other costs you share. Your partner can be invited afterwards. Their cards stay
            private, and bill sharing is a separate choice in Settings. No BSB is issued until
            you create the account.
          </p>
          <button
            onClick={() => void handleCreateHousehold()}
            disabled={provisioning}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold disabled:opacity-50"
          >
            {provisioning ? 'Creating account…' : 'Create household account'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <CardPayBanner />
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-700">
            Billing methods
          </p>
          {role === 'OWNER' ? (
            <HouseholdNameEditor householdId={household.id} name={household.name} />
          ) : (
            <h1 className="text-2xl font-bold text-gray-900">{household.name}</h1>
          )}
          <p className="text-sm text-gray-500 mt-1">
            Household bills on one Virtual BSB. Funding cards stay private to each person.
          </p>
        </div>
        {role === Role.OWNER && (
          <button
            onClick={() => void handleInvite()}
            disabled={inviting}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold disabled:opacity-50"
          >
            <UserPlus className="w-4 h-4" />
            {inviting ? 'Generating…' : 'Invite Partner'}
          </button>
        )}
      </div>

      {error && (
        <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {inviteUrl && (
        <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 space-y-2">
          <p className="text-xs font-bold text-emerald-900">7-day single-use invite</p>
          <div className="flex items-center gap-2">
            <input
              readOnly
              value={inviteUrl}
              className="flex-1 text-xs p-2 rounded-lg border border-emerald-200 bg-white font-mono"
            />
            <button
              onClick={() => void handleCopy()}
              className="p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>
      )}

      <div className="bg-gradient-to-br from-emerald-900 to-emerald-950 text-white rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs uppercase tracking-wider text-emerald-300 font-semibold flex items-center gap-1.5">
            <Landmark className="w-4 h-4" /> Household Virtual BSB
          </span>
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-emerald-200/70 uppercase tracking-wider mb-1">BSB</p>
            <p className="text-2xl font-mono font-bold tracking-widest">{jointAccount.bsb}</p>
          </div>
          <div>
            <p className="text-xs text-emerald-200/70 uppercase tracking-wider mb-1">Account</p>
            <p className="text-2xl font-mono font-bold tracking-widest">{jointAccount.accountNumber}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-emerald-600" />
          <h2 className="text-sm font-bold text-gray-900">Members</h2>
        </div>
        <ul className="space-y-2">
          {household.members.map((member) => (
            <li
              key={member.id}
              className="flex items-center justify-between rounded-xl border border-gray-100 px-3 py-2.5"
            >
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  {member.user.name || member.user.email}
                </p>
                <p className="text-[11px] text-gray-500">{member.user.email}</p>
              </div>
              <span
                className={`text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-full ${
                  member.role === Role.OWNER
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {member.role}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <h2 className="border-b border-gray-100 px-5 py-4 text-sm font-bold text-gray-900">Transactions</h2>
        {transactions.length === 0 ? (
          <p className="px-5 py-8 text-sm text-gray-500">No billers have debited this household yet.</p>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-5 py-2.5 font-semibold">Biller</th>
                <th className="px-5 py-2.5 font-semibold">Amount</th>
                <th className="px-5 py-2.5 font-semibold">Status</th>
                <th className="px-5 py-2.5 font-semibold">When</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((row) => (
                <tr key={row.id} className="border-t border-gray-50">
                  <td className="px-5 py-3 font-semibold text-gray-900">{row.billerName}</td>
                  <td className="px-5 py-3 font-mono">
                    {(row.amountCents / 100).toLocaleString('en-AU', {
                      style: 'currency',
                      currency: 'AUD',
                    })}
                  </td>
                  <td className="px-5 py-3">{row.status}</td>
                  <td className="px-5 py-3 text-gray-500">
                    {new Date(row.createdAt).toLocaleDateString('en-AU', {
                      timeZone: 'Australia/Sydney',
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
