'use client'

import { useCallback, useEffect, useState } from 'react'
import { AccountType, Role } from '@prisma/client'
import {
  AlertCircle,
  Check,
  Copy,
  EyeOff,
  Home,
  Landmark,
  ShieldCheck,
  UserPlus,
  Users,
} from 'lucide-react'

interface HouseholdMemberRow {
  id: string
  role: Role
  user: {
    id: string
    email: string
    name: string | null
  }
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
  const [savingPrivacy, setSavingPrivacy] = useState(false)
  const [error, setError] = useState('')
  const [household, setHousehold] = useState<HouseholdPayload | null>(null)
  const [role, setRole] = useState<Role | null>(null)
  const [sharePersonalBills, setSharePersonalBills] = useState(false)
  const [inviteUrl, setInviteUrl] = useState('')
  const [copied, setCopied] = useState(false)

  const loadHousehold = useCallback(async () => {
    setError('')
    const res = await fetch('/api/households')
    const data = (await res.json()) as {
      household?: HouseholdPayload | null
      role?: Role | null
      sharePersonalBills?: boolean
      error?: string
    }
    if (!res.ok) {
      throw new Error(data.error || 'Failed to load household')
    }
    setHousehold(data.household ?? null)
    setRole(data.role ?? null)
    setSharePersonalBills(Boolean(data.sharePersonalBills))
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

  const handlePrivacyToggle = async () => {
    if (!household) return
    const next = !sharePersonalBills
    setSharePersonalBills(next)
    setSavingPrivacy(true)
    setError('')
    try {
      const res = await fetch('/api/households', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          householdId: household.id,
          sharePersonalBills: next,
        }),
      })
      const data = (await res.json()) as { error?: string }
      if (!res.ok) {
        setSharePersonalBills(!next)
        throw new Error(data.error || 'Failed to update privacy setting')
      }
    } catch (err: unknown) {
      setError((err as Error).message)
    } finally {
      setSavingPrivacy(false)
    }
  }

  if (loading) {
    return (
      <div className="p-8 max-w-4xl mx-auto text-sm text-gray-500">Loading household…</div>
    )
  }

  if (!household) {
    return (
      <div className="p-8 max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Joint Household</h1>
          <p className="text-sm text-gray-500 mt-1">
            Provision a shared Virtual BSB for household bills, then invite a partner.
          </p>
        </div>
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
          <h2 className="text-lg font-bold text-gray-900">No household yet</h2>
          <p className="text-sm text-gray-600">
            Spin up a Joint Household BSB. You remain OWNER. Your partner joins through a
            7-day single-use invite.
          </p>
          <button
            onClick={() => void handleCreateHousehold()}
            disabled={provisioning}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold disabled:opacity-50"
          >
            {provisioning ? 'Provisioning…' : 'Create Joint Household BSB'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-700">
            Multi-portfolio
          </p>
          <h1 className="text-2xl font-bold text-gray-900">{household.name}</h1>
          <p className="text-sm text-gray-500 mt-1">
            Joint household management with zero-knowledge funding cards.
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
            <Landmark className="w-4 h-4" /> Joint Virtual BSB
          </span>
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-emerald-200/70 uppercase tracking-wider mb-1">BSB</p>
            <p className="text-2xl font-mono font-bold tracking-widest">
              {jointAccount?.bsb || '802-985'}
            </p>
          </div>
          <div>
            <p className="text-xs text-emerald-200/70 uppercase tracking-wider mb-1">Account</p>
            <p className="text-2xl font-mono font-bold tracking-widest">
              {jointAccount?.accountNumber || 'Pending'}
            </p>
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

      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <p className="text-sm font-bold text-gray-900">Privacy boundary</p>
            <p className="text-xs text-gray-600">
              Share personal bill metadata with household members. Underlying funding
              accounts remain zero-knowledge either way — partners never see card numbers
              or bank logins.
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={sharePersonalBills}
            disabled={savingPrivacy}
            onClick={() => void handlePrivacyToggle()}
            className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition ${
              sharePersonalBills ? 'bg-emerald-600' : 'bg-gray-200'
            } disabled:opacity-50`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
                sharePersonalBills ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
        <p className="text-[11px] text-emerald-800 flex items-center gap-1.5">
          <EyeOff className="w-3.5 h-3.5" />
          {sharePersonalBills
            ? 'Personal bill labels are visible to household members.'
            : 'Personal bills stay private to you.'}
        </p>
      </div>
    </div>
  )
}
