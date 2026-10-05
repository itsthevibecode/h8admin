'use client'

import { useState } from 'react'
import { Fingerprint, Loader2, ScanFace, Usb } from 'lucide-react'

type Status = 'idle' | 'pending'

export function PasskeyPanel({
  intent,
  onSuccess,
}: {
  intent: 'create' | 'use'
  onSuccess: () => void
}) {
  const [status, setStatus] = useState<Status>('idle')

  function handlePasskey() {
    setStatus('pending')
    setTimeout(onSuccess, 1400)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed bg-muted/50 px-6 py-8 text-center">
        <span className="relative flex size-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/25">
          {status === 'pending' && (
            <span className="absolute inset-0 animate-ping rounded-2xl bg-primary/40" aria-hidden="true" />
          )}
          <Fingerprint className="relative size-8" aria-hidden="true" />
        </span>
        <div className="flex flex-col gap-1">
          <p className="font-semibold">
            {intent === 'create' ? 'Create a passkey for H8Admin' : 'Confirm with your passkey'}
          </p>
          <p className="text-sm leading-relaxed text-pretty text-muted-foreground">
            {intent === 'create'
              ? 'Use Face ID, Touch ID, Windows Hello or a security key. Nothing to type, and it can’t be phished.'
              : 'Use the device or security key you registered with H8Admin.'}
          </p>
        </div>
        <ul className="flex flex-wrap justify-center gap-2 text-xs text-muted-foreground">
          <li className="flex items-center gap-1.5 rounded-full bg-card px-2.5 py-1 ring-1 ring-border">
            <ScanFace className="size-3.5 text-primary" aria-hidden="true" />
            Face / fingerprint
          </li>
          <li className="flex items-center gap-1.5 rounded-full bg-card px-2.5 py-1 ring-1 ring-border">
            <Usb className="size-3.5 text-primary" aria-hidden="true" />
            Security key
          </li>
        </ul>
      </div>

      <button
        type="button"
        onClick={handlePasskey}
        disabled={status === 'pending'}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary text-sm font-semibold text-primary-foreground shadow-md shadow-primary/25 transition-all outline-none hover:bg-primary/90 focus-visible:ring-3 focus-visible:ring-primary/30 disabled:cursor-wait disabled:opacity-80"
      >
        {status === 'pending' ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            Waiting for your device…
          </>
        ) : (
          <>
            <Fingerprint className="size-4" aria-hidden="true" />
            {intent === 'create' ? 'Create passkey' : 'Use passkey'}
          </>
        )}
      </button>
      <p className="sr-only" role="status" aria-live="polite">
        {status === 'pending' ? 'Waiting for your device to confirm the passkey.' : ''}
      </p>
    </div>
  )
}
