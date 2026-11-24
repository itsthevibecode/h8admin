'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Bell, EyeOff, LogOut, User } from 'lucide-react'
import { AccountSecurity } from '@/components/account-security'

interface PrivacySettings {
  household: { id: string; name: string; sharePersonalBills: boolean } | null
  properties: { id: string; label: string; shareBills: boolean }[]
}

interface Profile {
  firstName: string | null
  lastName: string | null
  name: string | null
  email: string
  referralCode: string
  notifyDebits: boolean
  notifyBilling: boolean
  notifyRewards: boolean
  privacy: PrivacySettings
}

interface AccountMeta {
  pendingEmail: string | null
  createdAt: string
  lastSignInAt: string | null
}

export function SettingsPanel() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [account, setAccount] = useState<AccountMeta | null>(null)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [error, setError] = useState('')
  const [saved, setSaved] = useState('')
  const [loading, setLoading] = useState(true)

  const reload = useCallback(async () => {
    const res = await fetch('/api/settings')
    const data = (await res.json()) as { profile?: Profile; account?: AccountMeta; error?: string }
    if (!res.ok || !data.profile || !data.account) {
      setError(data.error || 'Could not load settings')
      return
    }
    setProfile(data.profile)
    setAccount(data.account)
    setFirstName(data.profile.firstName || '')
    setLastName(data.profile.lastName || '')
    router.refresh()
  }, [router])

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const res = await fetch('/api/settings')
        const data = (await res.json()) as { profile?: Profile; account?: AccountMeta; error?: string }
        if (!res.ok || !data.profile || !data.account) throw new Error(data.error || 'Could not load settings')
        if (!cancelled) {
          setProfile(data.profile)
          setAccount(data.account)
          setFirstName(data.profile.firstName || '')
          setLastName(data.profile.lastName || '')
        }
      } catch (err: unknown) {
        if (!cancelled) setError((err as Error).message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const save = async (
    patch: Partial<Profile> & {
      firstName?: string
      lastName?: string
      householdPrivacy?: { householdId: string; sharePersonalBills: boolean }
      propertyPrivacy?: { virtualAccountId: string; shareBills: boolean }
    }
  ) => {
    setError('')
    setSaved('')
    const res = await fetch('/api/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    })
    const data = (await res.json()) as { profile?: Profile; account?: AccountMeta; error?: string }
    if (!res.ok || !data.profile || !data.account) {
      setError(data.error || 'Could not save settings')
      return
    }
    setProfile(data.profile)
    setAccount(data.account)
    setFirstName(data.profile.firstName || '')
    setLastName(data.profile.lastName || '')
    setSaved('Saved')
    router.refresh()
  }

  const signOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  if (loading) {
    return <p className="text-sm text-gray-500">Loading settings…</p>
  }

  if (!profile) {
    return <p className="text-sm text-red-700">{error || 'Settings are unavailable.'}</p>
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="mt-1 text-sm text-gray-500">
          Profile, sign-in, authenticator, alerts, and who can see bill names.
        </p>
      </div>

      <section className="space-y-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <h2 className="flex items-center gap-2 text-sm font-bold text-gray-900">
          <User className="h-4 w-4 text-emerald-600" /> Profile
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-700" htmlFor="first-name">
              First name
            </label>
            <input
              id="first-name"
              value={firstName}
              autoComplete="given-name"
              onChange={(event) => setFirstName(event.target.value)}
              className="w-full rounded-xl border border-gray-200 p-3 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-700" htmlFor="last-name">
              Last name
            </label>
            <input
              id="last-name"
              value={lastName}
              autoComplete="family-name"
              onChange={(event) => setLastName(event.target.value)}
              className="w-full rounded-xl border border-gray-200 p-3 text-sm"
            />
          </div>
        </div>
        <p className="text-[11px] text-gray-500">
          Invoices use this name. The name on a bank account is still the one you enter when you add that account.
        </p>
        <div>
          <p className="text-xs font-semibold text-gray-700">Email</p>
          <p className="mt-1 text-sm text-gray-900">{profile.email}</p>
          {account?.pendingEmail && (
            <p className="mt-1 text-[11px] font-semibold text-amber-700">
              Confirmation waiting for {account.pendingEmail}.
            </p>
          )}
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-700">Referral code</p>
          <p className="mt-1 text-[11px] text-gray-500">
            Referral invites are paused for the private beta.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void save({ firstName, lastName })}
          className="rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-700"
        >
          Save profile
        </button>
      </section>

      {account && (
        <AccountSecurity
          email={profile.email}
          pendingEmail={account.pendingEmail}
          createdAt={account.createdAt}
          lastSignInAt={account.lastSignInAt}
          onChanged={() => void reload()}
        />
      )}

      <section className="space-y-3 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <h2 className="flex items-center gap-2 text-sm font-bold text-gray-900">
          <Bell className="h-4 w-4 text-emerald-600" /> Notifications
        </h2>
        <Toggle
          label="Direct debit receipts"
          detail="Settled and declined debits on your Virtual BSBs."
          checked={profile.notifyDebits}
          onChange={(notifyDebits) => void save({ notifyDebits })}
        />
        <Toggle
          label="Billing and invoices"
          detail="Subscription invoices and failed collections."
          checked={profile.notifyBilling}
          onChange={(notifyBilling) => void save({ notifyBilling })}
        />
        <Toggle
          label="Rewards and exclusion clocks"
          detail="Bonus windows closing and banks you can apply with again."
          checked={profile.notifyRewards}
          onChange={(notifyRewards) => void save({ notifyRewards })}
        />
      </section>

      <section className="space-y-3 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <h2 className="flex items-center gap-2 text-sm font-bold text-gray-900">
          <EyeOff className="h-4 w-4 text-emerald-600" /> Privacy
        </h2>
        <p className="text-xs text-gray-500">
          Funding cards stay hidden either way. These switches only control whether other people on
          the same address can see bill names.
        </p>
        {profile.privacy.household ? (
          <Toggle
            label={`Share personal bills with ${profile.privacy.household.name}`}
            detail="Household members can see your personal bill labels. Their setting does not change yours."
            checked={profile.privacy.household.sharePersonalBills}
            onChange={(sharePersonalBills) =>
              void save({
                householdPrivacy: {
                  householdId: profile.privacy.household!.id,
                  sharePersonalBills,
                },
              })
            }
          />
        ) : (
          <p className="text-xs text-gray-500">Create a household account before sharing bills with a partner.</p>
        )}
        {profile.privacy.properties.map((property) => (
          <Toggle
            key={property.id}
            label={`Share bills for ${property.label}`}
            detail="Separate from the household. Each partner and equity owner chooses this for themselves."
            checked={property.shareBills}
            onChange={(shareBills) =>
              void save({
                propertyPrivacy: { virtualAccountId: property.id, shareBills },
              })
            }
          />
        ))}
      </section>

      {error && <p className="text-xs font-semibold text-red-700">{error}</p>}
      {saved && <p className="text-xs font-semibold text-emerald-700">{saved}</p>}

      <button
        type="button"
        onClick={() => void signOut()}
        className="flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-xs font-bold text-gray-700 hover:bg-gray-50"
      >
        <LogOut className="h-4 w-4" /> Sign out
      </button>
    </div>
  )
}

function Toggle({
  label,
  detail,
  checked,
  onChange,
}: {
  label: string
  detail: string
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-gray-100 px-3 py-3">
      <div>
        <p className="text-sm font-semibold text-gray-900">{label}</p>
        <p className="text-[11px] text-gray-500">{detail}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition ${
          checked ? 'bg-emerald-600' : 'bg-gray-200'
        }`}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  )
}
