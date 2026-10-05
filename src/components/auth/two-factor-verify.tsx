'use client'

import { useId, useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { OtpInput } from './otp-input'
import { MethodTabs, type SecondFactorMethod } from './method-tabs'
import { PasskeyPanel } from './passkey-panel'
import { StepCard } from './step-card'

export function TwoFactorVerify({
  email,
  onBack,
  onComplete,
}: {
  email: string
  onBack: () => void
  onComplete: (method: SecondFactorMethod) => void
}) {
  const [method, setMethod] = useState<SecondFactorMethod>('passkey')
  const [code, setCode] = useState('')
  const labelId = useId()

  return (
    <StepCard
      title="Two-factor verification"
      onBack={onBack}
      description={
        <>
          {'Confirm it’s you to finish signing in as '}
          <span className="font-medium text-foreground">{email}</span>.
        </>
      }
    >
      <MethodTabs value={method} onChange={setMethod} />
      {method === 'passkey' ? (
        <PasskeyPanel intent="use" onSuccess={() => onComplete('passkey')} />
      ) : (
        <form
          className="flex flex-col gap-3"
          onSubmit={(event) => {
            event.preventDefault()
            if (code.length === 6) onComplete('authenticator')
          }}
        >
          <p id={labelId} className="text-sm font-medium">
            Enter the 6-digit code from your authenticator app
          </p>
          <OtpInput value={code} onChange={setCode} labelId={labelId} />
          <button
            type="submit"
            disabled={code.length !== 6}
            className="group mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary text-sm font-semibold text-primary-foreground shadow-md shadow-primary/20 transition-all outline-none hover:bg-primary/90 focus-visible:ring-3 focus-visible:ring-primary/30 disabled:cursor-not-allowed disabled:bg-primary/40 disabled:shadow-none"
          >
            Verify and sign in
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
          </button>
          <p className="text-center text-xs text-muted-foreground">
            {'Lost access to your device? '}
            <a href="#" className="font-medium text-primary hover:underline">
              Use a recovery code
            </a>
          </p>
        </form>
      )}
    </StepCard>
  )
}
