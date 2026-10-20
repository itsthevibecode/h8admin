'use client'

import { FormEvent, useEffect, useState } from 'react'
import { Check, Copy, KeyRound, Loader2, Mail, MonitorSmartphone, ShieldCheck } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { confirmCurrentPassword } from '@/lib/confirm-password'
import { useToast } from '@/components/ui/toast'

interface Enrollment {
  factorId: string
  qr: string
  secret: string
}

interface VerifiedFactor {
  id: string
  friendlyName: string
  createdAt: string
}

export function AccountSecurity({
  email,
  pendingEmail,
  createdAt,
  lastSignInAt,
  onChanged,
}: {
  email: string
  pendingEmail: string | null
  createdAt: string
  lastSignInAt: string | null
  onChanged: () => void
}) {
  const { toast } = useToast()
  const [factor, setFactor] = useState<VerifiedFactor | null>(null)
  const [factorsReady, setFactorsReady] = useState(false)
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null)
  const [busy, setBusy] = useState('')
  const [notice, setNotice] = useState('')

  const report = (text: string, tone: 'success' | 'error' = 'error') => {
    setNotice(text)
    toast(text, tone)
  }

  const reloadFactors = async () => {
    const supabase = createClient()
    const { data, error } = await supabase.auth.mfa.listFactors()
    if (error) {
      report(error.message)
      setFactorsReady(true)
      return
    }
    const current = data?.totp[0]
    setFactor(
      current
        ? {
            id: current.id,
            friendlyName: current.friendly_name || 'Authenticator app',
            createdAt: current.created_at,
          }
        : null
    )
    setFactorsReady(true)
  }

  useEffect(() => {
    void reloadFactors()
  }, [])

  const changePassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formEl = event.currentTarget
    const form = new FormData(formEl)
    const currentPassword = String(form.get('currentPassword') ?? '')
    const nextPassword = String(form.get('nextPassword') ?? '')
    const confirmPassword = String(form.get('confirmPassword') ?? '')
    const signOutOthers = form.get('signOutOthers') === 'on'
    if (nextPassword.length < 8) {
      report('Use at least 8 characters.')
      return
    }
    if (nextPassword !== confirmPassword) {
      report('New passwords do not match.')
      return
    }
    if (nextPassword === currentPassword) {
      report('Choose a password that is different from the current one.')
      return
    }
    setBusy('password')
    const passwordError = await confirmCurrentPassword(email, currentPassword)
    if (passwordError) {
      report(passwordError)
      setBusy('')
      return
    }
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({
      password: nextPassword,
      current_password: currentPassword,
    })
    if (error) {
      report(error.message)
      setBusy('')
      return
    }
    if (signOutOthers) {
      await supabase.auth.signOut({ scope: 'others' })
    }
    formEl.reset()
    report(signOutOthers ? 'Password updated. Other devices were signed out.' : 'Password updated.', 'success')
    setBusy('')
  }

  const changeEmail = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formEl = event.currentTarget
    const form = new FormData(formEl)
    const nextEmail = String(form.get('nextEmail') ?? '').trim().toLowerCase()
    const currentPassword = String(form.get('emailPassword') ?? '')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nextEmail)) {
      report('Enter a valid email address.')
      return
    }
    if (nextEmail === email.toLowerCase()) {
      report('That is already the email on this account.')
      return
    }
    setBusy('email')
    const passwordError = await confirmCurrentPassword(email, currentPassword)
    if (passwordError) {
      report(passwordError)
      setBusy('')
      return
    }
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ email: nextEmail })
    if (error) {
      report(error.message)
      setBusy('')
      return
    }
    formEl.reset()
    report('Confirmation sent. The new email starts working after you confirm it.', 'success')
    onChanged()
    setBusy('')
  }

  const startEnrollment = async () => {
    setBusy('enroll')
    const supabase = createClient()
    const existing = await supabase.auth.mfa.listFactors()
    if (existing.error) {
      report(existing.error.message)
      setBusy('')
      return
    }
    for (const stale of existing.data?.all.filter((item) => item.status !== 'verified') ?? []) {
      await supabase.auth.mfa.unenroll({ factorId: stale.id })
    }
    const enrolled = await supabase.auth.mfa.enroll({
      factorType: 'totp',
      friendlyName: 'Authenticator app',
      issuer: 'H8Admin',
    })
    if (enrolled.error || !enrolled.data) {
      report(enrolled.error?.message || 'Could not start authenticator setup.')
      setBusy('')
      return
    }
    const qr = enrolled.data.totp.qr_code
    setEnrollment({
      factorId: enrolled.data.id,
      secret: enrolled.data.totp.secret,
      qr: qr.startsWith('data:') ? qr : `data:image/svg+xml;utf-8,${encodeURIComponent(qr)}`,
    })
    setBusy('')
  }

  const cancelEnrollment = async () => {
    if (!enrollment) return
    setBusy('enroll')
    const supabase = createClient()
    await supabase.auth.mfa.unenroll({ factorId: enrollment.factorId })
    setEnrollment(null)
    setBusy('')
  }

  const confirmEnrollment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!enrollment) return
    const code = String(new FormData(event.currentTarget).get('code') ?? '').replace(/\D/g, '')
    if (code.length !== 6) {
      report('Enter the 6-digit code from your authenticator app.')
      return
    }
    setBusy('enroll')
    const supabase = createClient()
    const verified = await supabase.auth.mfa.challengeAndVerify({
      factorId: enrollment.factorId,
      code,
    })
    if (verified.error) {
      report(verified.error.message)
      setBusy('')
      return
    }
    if (factor && factor.id !== enrollment.factorId) {
      const removed = await supabase.auth.mfa.unenroll({ factorId: factor.id })
      if (removed.error) {
        report(`New authenticator is on. The previous one could not be removed: ${removed.error.message}`)
      }
    }
    setEnrollment(null)
    await reloadFactors()
    onChanged()
    report('Authenticator app is on. The next sign-in will ask for a code.', 'success')
    setBusy('')
  }

  const turnOff = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!factor) return
    const code = String(new FormData(event.currentTarget).get('disableCode') ?? '').replace(/\D/g, '')
    if (code.length !== 6) {
      report('Enter the current 6-digit authenticator code.')
      return
    }
    setBusy('disable')
    const supabase = createClient()
    const verified = await supabase.auth.mfa.challengeAndVerify({ factorId: factor.id, code })
    if (verified.error) {
      report(verified.error.message)
      setBusy('')
      return
    }
    const removed = await supabase.auth.mfa.unenroll({ factorId: factor.id })
    if (removed.error) {
      report(removed.error.message)
      setBusy('')
      return
    }
    setFactor(null)
    onChanged()
    report('Authenticator app turned off.', 'success')
    setBusy('')
  }

  const signOutOthers = async () => {
    setBusy('sessions')
    const supabase = createClient()
    const { error } = await supabase.auth.signOut({ scope: 'others' })
    if (error) report(error.message)
    else report('Other devices were signed out.', 'success')
    setBusy('')
  }

  return (
    <div className="space-y-8">
      {notice && (
        <p role="status" className="text-sm font-semibold text-gray-800">
          {notice}
        </p>
      )}
      <section className="space-y-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <h2 className="flex items-center gap-2 text-sm font-bold text-gray-900">
          <KeyRound className="h-4 w-4 text-emerald-600" /> Password
        </h2>
        <p className="text-xs text-gray-500">
          Use at least 8 characters. Confirming the change can sign every other device out of this account.
        </p>
        <form onSubmit={(event) => void changePassword(event)} className="space-y-3">
          <Field label="Current password" name="currentPassword" autoComplete="current-password" />
          <Field label="New password" name="nextPassword" autoComplete="new-password" />
          <Field label="Confirm new password" name="confirmPassword" autoComplete="new-password" />
          <label className="flex items-center gap-2 text-xs text-gray-600">
            <input name="signOutOthers" type="checkbox" defaultChecked className="accent-emerald-600" />
            Sign out other devices
          </label>
          <Submit busy={busy === 'password'} label="Update password" />
        </form>
      </section>

      <section className="space-y-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <h2 className="flex items-center gap-2 text-sm font-bold text-gray-900">
          <Mail className="h-4 w-4 text-emerald-600" /> Email
        </h2>
        <p className="text-sm text-gray-900">{email}</p>
        {pendingEmail && (
          <p className="text-xs font-semibold text-amber-700">
            Confirmation waiting for {pendingEmail}. This address stays in use until that link is opened.
          </p>
        )}
        <form onSubmit={(event) => void changeEmail(event)} className="space-y-3">
          <label className="block text-xs font-semibold text-gray-700" htmlFor="next-email">
            New email
          </label>
          <input
            id="next-email"
            name="nextEmail"
            type="email"
            required
            autoComplete="email"
            className="w-full max-w-md rounded-xl border border-gray-200 p-3 text-sm"
          />
          <Field label="Current password" name="emailPassword" autoComplete="current-password" />
          <Submit busy={busy === 'email'} label="Send confirmation" />
        </form>
      </section>

      <section className="space-y-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <h2 className="flex items-center gap-2 text-sm font-bold text-gray-900">
          <ShieldCheck className="h-4 w-4 text-emerald-600" /> Two-factor authentication
        </h2>
        <p className="text-xs text-gray-500">
          An authenticator app such as Google Authenticator, 1Password, or Authy. Once it is on, signing in
          asks for a fresh 6-digit code. Replacing the app signs other devices out.
        </p>
        {!factorsReady ? (
          <p className="text-sm text-gray-500">Checking authenticator…</p>
        ) : enrollment ? (
          <form onSubmit={(event) => void confirmEnrollment(event)} className="space-y-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={enrollment.qr}
                alt="QR code for the H8Admin authenticator"
                className="h-36 w-36 rounded-xl border border-gray-200 bg-white p-2"
              />
              <div className="space-y-2 text-sm text-gray-600">
                <p>Scan the code, or type the setup key into the app.</p>
                <SecretKey secret={enrollment.secret} />
              </div>
            </div>
            <Field label="6-digit code" name="code" autoComplete="one-time-code" inputMode="numeric" />
            <div className="flex flex-wrap gap-2">
              <Submit busy={busy === 'enroll'} label={factor ? 'Replace authenticator' : 'Turn on authenticator'} />
              <button
                type="button"
                onClick={() => void cancelEnrollment()}
                className="rounded-xl border border-gray-200 px-4 py-2.5 text-xs font-bold text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : factor ? (
          <div className="space-y-4">
            <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-3">
              <p className="text-sm font-semibold text-emerald-900">{factor.friendlyName}</p>
              <p className="text-[11px] text-emerald-800">On since {formatWhen(factor.createdAt)}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void startEnrollment()}
                disabled={busy !== ''}
                className="rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                Replace authenticator
              </button>
            </div>
            <form onSubmit={(event) => void turnOff(event)} className="space-y-3">
              <Field label="Current authenticator code" name="disableCode" autoComplete="one-time-code" inputMode="numeric" />
              <button
                type="submit"
                disabled={busy !== ''}
                className="rounded-xl border border-red-200 px-4 py-2.5 text-xs font-bold text-red-700 hover:bg-red-50 disabled:opacity-50"
              >
                {busy === 'disable' ? 'Turning off…' : 'Turn off authenticator'}
              </button>
            </form>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => void startEnrollment()}
            disabled={busy !== ''}
            className="rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {busy === 'enroll' ? 'Starting…' : 'Set up authenticator'}
          </button>
        )}
      </section>

      <section className="space-y-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <h2 className="flex items-center gap-2 text-sm font-bold text-gray-900">
          <MonitorSmartphone className="h-4 w-4 text-emerald-600" /> Sessions
        </h2>
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs font-semibold text-gray-500">Member since</dt>
            <dd className="mt-1 text-gray-900">{formatWhen(createdAt)}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold text-gray-500">Last sign-in</dt>
            <dd className="mt-1 text-gray-900">{formatWhen(lastSignInAt)}</dd>
          </div>
        </dl>
        <button
          type="button"
          onClick={() => void signOutOthers()}
          disabled={busy === 'sessions'}
          className="rounded-xl border border-gray-200 px-4 py-2.5 text-xs font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          {busy === 'sessions' ? 'Signing out…' : 'Sign out other devices'}
        </button>
      </section>
    </div>
  )
}

function formatWhen(value: string | null) {
  if (!value) return 'Not recorded'
  return new Date(value).toLocaleString('en-AU', {
    timeZone: 'Australia/Sydney',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function Field({
  label,
  name,
  autoComplete,
  inputMode,
}: {
  label: string
  name: string
  autoComplete: string
  inputMode?: 'numeric' | 'text'
}) {
  const id = `security-${name}`
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold text-gray-700" htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        name={name}
        type={inputMode === 'numeric' ? 'text' : 'password'}
        required
        autoComplete={autoComplete}
        inputMode={inputMode}
        className="w-full max-w-md rounded-xl border border-gray-200 p-3 text-sm"
      />
    </div>
  )
}

function Submit({ busy, label }: { busy: boolean; label: string }) {
  return (
    <button
      type="submit"
      disabled={busy}
      className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
    >
      {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
      {busy ? 'Saving…' : label}
    </button>
  )
}

function SecretKey({ secret }: { secret: string }) {
  const [copied, setCopied] = useState(false)
  const grouped = secret.replace(/(.{4})/g, '$1 ').trim()

  return (
    <div className="flex items-center gap-2 rounded-xl border border-dashed border-gray-300 bg-gray-50 px-3 py-2">
      <code className="font-mono text-xs tracking-wider text-gray-900">{grouped}</code>
      <button
        type="button"
        onClick={() => {
          void navigator.clipboard.writeText(secret).then(
            () => {
              setCopied(true)
              window.setTimeout(() => setCopied(false), 2000)
            },
            () => undefined
          )
        }}
        className="ml-auto inline-flex items-center gap-1 text-xs font-semibold text-emerald-800"
      >
        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        {copied ? 'Copied' : 'Copy'}
      </button>
    </div>
  )
}
