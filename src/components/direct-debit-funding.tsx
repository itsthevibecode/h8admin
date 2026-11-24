'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Banknote, Trash2 } from 'lucide-react'
import { LegalConsentCheckbox } from '@/components/legal-consent-modal'

export interface SavedDirectDebit {
  id: string
  nickname: string | null
  last4: string
  isDefault: boolean
}

export function DirectDebitFunding({ accounts }: { accounts: SavedDirectDebit[] }) {
  const router = useRouter()
  const [accountName, setAccountName] = useState('')
  const [bsb, setBsb] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [setAsDefault, setSetAsDefault] = useState(accounts.length === 0)
  const [agreed, setAgreed] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/funding/direct-debit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountName, bsb, accountNumber, setAsDefault, agreed }),
      })
      const data = (await res.json()) as { error?: string }
      if (!res.ok) {
        setError(data.error || 'Could not save this bank account')
        return
      }
      setAccountName('')
      setBsb('')
      setAccountNumber('')
      setAgreed(false)
      router.refresh()
    } catch {
      setError('Could not save this bank account')
    } finally {
      setSubmitting(false)
    }
  }

  const removeAccount = async (id: string) => {
    setError('')
    const res = await fetch('/api/funding/direct-debit', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    if (!res.ok) {
      const data = (await res.json()) as { error?: string }
      setError(data.error || 'Could not remove this account')
      return
    }
    router.refresh()
  }

  return (
    <div className="space-y-8">
      <div className="border-b border-gray-100 pb-4">
        <h1 className="text-2xl font-bold text-gray-900">Direct debit</h1>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">
          Add a bank account H8Admin can debit when you would rather pay a bill from a transaction
          account than a rewards card. Account details are handled by our payment partners and are
          not stored here in full.
        </p>
      </div>

      <div className="space-y-3">
        {accounts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-6 text-center text-xs text-gray-500">
            No bank account linked yet.
          </div>
        ) : (
          accounts.map((account) => (
            <div
              key={account.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-700">
                  <Banknote className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">
                    {account.nickname || 'Bank account'} ••{account.last4}
                  </p>
                  <p className="text-xs text-gray-500">BECS direct debit</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {account.isDefault && (
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                    DEFAULT
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => void removeAccount(account.id)}
                  className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600"
                  aria-label="Remove bank account"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-bold text-gray-900">Add a bank account</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-semibold text-gray-700">Account name</label>
            <input
              value={accountName}
              onChange={(event) => setAccountName(event.target.value)}
              required
              autoComplete="name"
              className="w-full rounded-lg border border-gray-300 p-2.5 text-xs"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-700">BSB</label>
            <input
              value={bsb}
              onChange={(event) => setBsb(event.target.value)}
              inputMode="numeric"
              placeholder="000-000"
              required
              className="w-full rounded-lg border border-gray-300 p-2.5 font-mono text-xs"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-700">Account number</label>
            <input
              value={accountNumber}
              onChange={(event) => setAccountNumber(event.target.value)}
              inputMode="numeric"
              required
              className="w-full rounded-lg border border-gray-300 p-2.5 font-mono text-xs"
            />
          </div>
        </div>
        <label className="flex items-center gap-2 text-xs text-gray-700">
          <input
            type="checkbox"
            checked={setAsDefault}
            onChange={(event) => setSetAsDefault(event.target.checked)}
            className="h-4 w-4 accent-emerald-600"
          />
          Use this account as the default funding source
        </label>
        <LegalConsentCheckbox agreed={agreed} onChange={setAgreed} />
        {error && <p className="text-xs font-semibold text-red-700">{error}</p>}
        <button
          type="submit"
          disabled={submitting || !agreed}
          className="rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {submitting ? 'Saving…' : 'Save bank account'}
        </button>
      </form>
    </div>
  )
}
