'use client'

import { useId, useState } from 'react'
import { Check, Copy, KeyRound, ShieldCheck } from 'lucide-react'
import { MockQrCode } from './mock-qr-code'
import { OtpInput } from './otp-input'
import { MethodTabs, type SecondFactorMethod } from './method-tabs'
import { PasskeyPanel } from './passkey-panel'
import { StepCard } from './step-card'

const SETUP_KEY = 'JBSW Y3DP EHPK 3PXP H8AD MIN2'

export function TwoFactorSetup({
  email,
  onBack,
  onComplete,
}: {
  email: string
  onBack: () => void
  onComplete: (method: SecondFactorMethod) => void
}) {
  const [method, setMethod] = useState<SecondFactorMethod>('passkey')

  return (
    <StepCard
      title="Secure your account"
      badge="Required"
      onBack={onBack}
      description={
        <>
          {'Every H8Admin account needs a second factor. Set one up for '}
          <span className="font-medium text-foreground">{email}</span>.
        </>
      }
    >
      <MethodTabs value={method} onChange={setMethod} />
      {method === 'passkey' ? (
        <PasskeyPanel intent="create" onSuccess={() => onComplete('passkey')} />
      ) : (
        <AuthenticatorSetup onSuccess={() => onComplete('authenticator')} />
      )}
    </StepCard>
  )
}

function AuthenticatorSetup({ onSuccess }: { onSuccess: () => void }) {
  const [code, setCode] = useState('')
  const [copied, setCopied] = useState(false)
  const labelId = useId()

  async function copyKey() {
    try {
      await navigator.clipboard.writeText(SETUP_KEY.replace(/\s/g, ''))
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
        <div className="mx-auto shrink-0 rounded-xl border bg-white p-3 shadow-sm sm:mx-0">
          <MockQrCode className="size-36" />
        </div>
        <ol className="flex flex-col gap-4 text-sm">
          <li className="flex gap-3">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
              1
            </span>
            <p className="leading-relaxed text-muted-foreground">
              Open <span className="font-medium text-foreground">Google Authenticator</span>,{' '}
              <span className="font-medium text-foreground">1Password</span>, or{' '}
              <span className="font-medium text-foreground">Authy</span>.
            </p>
          </li>
          <li className="flex gap-3">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
              2
            </span>
            <p className="leading-relaxed text-muted-foreground">Scan the QR code to add your H8Admin account.</p>
          </li>
        </ol>
      </div>

      <div className="flex flex-col gap-2">
        <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <KeyRound className="size-3.5" aria-hidden="true" />
          {"Can't scan? Enter this setup key manually"}
        </p>
        <div className="flex items-center gap-2 rounded-lg border border-dashed bg-muted/60 py-1.5 pr-1.5 pl-3">
          <code className="flex-1 truncate font-mono text-sm tracking-wider">{SETUP_KEY}</code>
          <button
            type="button"
            onClick={copyKey}
            className="flex h-8 items-center gap-1.5 rounded-md bg-card px-2.5 text-xs font-medium shadow-sm ring-1 ring-border transition-colors outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring"
          >
            {copied ? (
              <Check className="size-3.5 text-primary" aria-hidden="true" />
            ) : (
              <Copy className="size-3.5" aria-hidden="true" />
            )}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>

      <form
        className="flex flex-col gap-3"
        onSubmit={(event) => {
          event.preventDefault()
          if (code.length === 6) onSuccess()
        }}
      >
        <p id={labelId} className="text-sm font-medium">
          Enter the 6-digit code from your app
        </p>
        <OtpInput value={code} onChange={setCode} labelId={labelId} />
        <button
          type="submit"
          disabled={code.length !== 6}
          className="mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary text-sm font-semibold text-primary-foreground shadow-md shadow-primary/20 transition-all outline-none hover:bg-primary/90 focus-visible:ring-3 focus-visible:ring-primary/30 disabled:cursor-not-allowed disabled:bg-primary/40 disabled:shadow-none"
        >
          <ShieldCheck className="size-4" aria-hidden="true" />
          Verify and enable 2FA
        </button>
      </form>
    </div>
  )
}
