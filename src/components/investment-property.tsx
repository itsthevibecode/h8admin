'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Building2, Check, Copy, Landmark, UserPlus } from 'lucide-react'
import { AccountNameEditor } from '@/components/editable-name'
import { CardPayBanner } from '@/components/card-pay-banner'
import { investmentLabel } from '@/lib/billing-labels'

export interface InvestmentPartner {
  id: string
  role: string
  name: string | null
  email: string
}

export interface InvestmentAccount {
  id: string
  bsb: string
  accountNumber: string
  displayName: string | null
  isOwner: boolean
  partners: InvestmentPartner[]
}

export interface InvestmentDebit {
  id: string
  virtualAccountId: string
  billerName: string
  amountCents: number
  status: string
  createdAt: string
}

function Hook({
  creating,
  error,
  another,
  onCreate,
}: {
  creating: boolean
  error: string
  another: boolean
  onCreate: () => void
}) {
  return (
    <div className="space-y-4 rounded-2xl border border-emerald-100 bg-white p-8 shadow-sm">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
        <Building2 className="h-6 w-6" />
      </div>
      <h2 className="text-lg font-bold text-gray-900">
        {another ? 'A separate address for the next property' : 'Keep property bills on their own address'}
      </h2>
      <p className="text-sm text-gray-600">
        Rates, insurance, strata and other property costs stay off your personal and household
        accounts. Each property gets a Virtual BSB only after you create it. You can then invite a
        business partner or equity owner. Their permission to see those bills is separate from
        yours, and is set in Settings.
      </p>
      {error && <p className="text-xs font-semibold text-red-700">{error}</p>}
      <button
        type="button"
        onClick={onCreate}
        disabled={creating}
        className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
      >
        {creating ? 'Creating account…' : another ? 'Create this property account' : 'Create investment account'}
      </button>
    </div>
  )
}

export function InvestmentProperty({
  accounts,
  debits,
}: {
  accounts: InvestmentAccount[]
  debits: InvestmentDebit[]
}) {
  const router = useRouter()
  const [creating, setCreating] = useState(false)
  const [askingForAnother, setAskingForAnother] = useState(false)
  const [error, setError] = useState('')
  const [inviteUrl, setInviteUrl] = useState('')
  const [invitingId, setInvitingId] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const createProperty = async () => {
    setCreating(true)
    setError('')
    try {
      const res = await fetch('/api/virtual-accounts/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountType: 'INVESTMENT' }),
      })
      const data = (await res.json()) as { error?: string }
      if (!res.ok) {
        setError(data.error || 'Could not create this investment property')
        return
      }
      setAskingForAnother(false)
      router.refresh()
    } catch {
      setError('Could not create this investment property')
    } finally {
      setCreating(false)
    }
  }

  const invitePartner = async (virtualAccountId: string) => {
    setInvitingId(virtualAccountId)
    setError('')
    setInviteUrl('')
    try {
      const res = await fetch('/api/properties/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ virtualAccountId }),
      })
      const data = (await res.json()) as { inviteUrl?: string; error?: string }
      if (!res.ok || !data.inviteUrl) {
        setError(data.error || 'Could not create an invite')
        return
      }
      setInviteUrl(data.inviteUrl)
    } catch {
      setError('Could not create an invite')
    } finally {
      setInvitingId(null)
    }
  }

  const copyInvite = async () => {
    if (!inviteUrl) return
    await navigator.clipboard.writeText(inviteUrl)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-8">
      <CardPayBanner />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-700">
            Billing methods
          </p>
          {accounts.length === 1 && accounts[0].isOwner ? (
            <AccountNameEditor
              accountId={accounts[0].id}
              name={accounts[0].displayName}
              fallback="Investment property"
            />
          ) : (
            <h1 className="text-2xl font-bold text-gray-900">
              {accounts.length === 1
                ? investmentLabel(accounts[0].displayName, 0, 1)
                : 'Investment properties'}
            </h1>
          )}
          <p className="mt-1 text-sm text-gray-500">
            A Virtual BSB for a rental or investment, kept apart from the household. Rename each one
            to match the property.
          </p>
        </div>
        {accounts.length > 0 && (
          <button
            type="button"
            onClick={() => {
              setError('')
              setAskingForAnother(true)
            }}
            className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-bold text-emerald-800 hover:bg-emerald-100"
          >
            Add another property
          </button>
        )}
      </div>

      {accounts.length === 0 && (
        <Hook creating={creating} error={error} another={false} onCreate={() => void createProperty()} />
      )}

      {askingForAnother && (
        <Hook creating={creating} error={error} another onCreate={() => void createProperty()} />
      )}

      {accounts.length > 0 && error && !askingForAnother && (
        <p className="text-xs font-semibold text-red-700">{error}</p>
      )}

      {inviteUrl && (
        <div className="space-y-2 rounded-xl border border-emerald-100 bg-emerald-50 p-4">
          <p className="text-xs font-bold text-emerald-900">7-day single-use partner invite</p>
          <div className="flex items-center gap-2">
            <input
              readOnly
              value={inviteUrl}
              className="flex-1 rounded-lg border border-emerald-200 bg-white p-2 font-mono text-xs"
            />
            <button
              type="button"
              onClick={() => void copyInvite()}
              className="rounded-lg bg-emerald-600 p-2 text-white hover:bg-emerald-700"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>
        </div>
      )}

      {accounts.map((account, index) => {
        const rows = debits.filter((debit) => debit.virtualAccountId === account.id)
        return (
          <section key={account.id} id={account.id} className="scroll-mt-6 space-y-4">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-900 to-emerald-950 p-6 text-white shadow-xl">
              <Landmark className="pointer-events-none absolute right-6 top-6 h-12 w-12 text-white/10" />
              <div className="relative z-10 flex items-start justify-between gap-3">
                <div>
                  {accounts.length > 1 && account.isOwner ? (
                    <AccountNameEditor
                      accountId={account.id}
                      name={account.displayName}
                      fallback={investmentLabel(null, index, accounts.length)}
                      className="text-lg font-bold text-white"
                      level="h2"
                    />
                  ) : (
                    <h2 className="text-lg font-bold text-white">
                      {investmentLabel(account.displayName, index, accounts.length)}
                    </h2>
                  )}
                </div>
                {account.isOwner && (
                  <button
                    type="button"
                    onClick={() => void invitePartner(account.id)}
                    disabled={invitingId === account.id}
                    className="flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-bold hover:bg-white/20 disabled:opacity-50"
                  >
                    <UserPlus className="h-3.5 w-3.5" />
                    {invitingId === account.id ? 'Creating invite…' : 'Invite partner'}
                  </button>
                )}
              </div>
              <div className="mt-6 grid gap-6 sm:grid-cols-2">
                <div>
                  <p className="text-xs uppercase tracking-wider text-emerald-200/70">BSB</p>
                  <p className="font-mono text-2xl font-bold tracking-widest">{account.bsb}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-emerald-200/70">Account</p>
                  <p className="font-mono text-2xl font-bold tracking-widest">{account.accountNumber}</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <h2 className="text-sm font-bold text-gray-900">Partners</h2>
              <p className="mt-1 text-xs text-gray-500">
                Business partners and equity owners. Each person chooses what bills they share in
                Settings.
              </p>
              <ul className="mt-3 space-y-2">
                {account.partners.map((partner) => (
                  <li
                    key={partner.id}
                    className="flex items-center justify-between rounded-xl border border-gray-100 px-3 py-2.5"
                  >
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{partner.name || partner.email}</p>
                      <p className="text-[11px] text-gray-500">{partner.email}</p>
                    </div>
                    <span className="rounded-full bg-gray-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-gray-600">
                      {partner.role}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
              <h2 className="border-b border-gray-100 px-5 py-4 text-sm font-bold text-gray-900">
                Debits on this address
              </h2>
              {rows.length === 0 ? (
                <p className="px-5 py-8 text-sm text-gray-500">No billers have debited this property yet.</p>
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
                    {rows.map((row) => (
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
          </section>
        )
      })}
    </div>
  )
}
