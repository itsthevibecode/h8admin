'use client'

import { Fingerprint, Smartphone } from 'lucide-react'
import { cn } from '@/lib/utils'

export type SecondFactorMethod = 'passkey' | 'authenticator'

const METHODS = [
  { value: 'passkey', label: 'Passkey', hint: 'Recommended', icon: Fingerprint },
  { value: 'authenticator', label: 'Authenticator app', hint: '6-digit code', icon: Smartphone },
] as const

export function MethodTabs({
  value,
  onChange,
}: {
  value: SecondFactorMethod
  onChange: (value: SecondFactorMethod) => void
}) {
  return (
    <div role="tablist" aria-label="Verification method" className="grid grid-cols-2 gap-2">
      {METHODS.map((method) => {
        const selected = value === method.value
        const Icon = method.icon
        return (
          <button
            key={method.value}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(method.value)}
            className={cn(
              'flex items-center gap-3 rounded-xl border p-3 text-left transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring',
              selected
                ? 'border-primary bg-accent text-accent-foreground ring-1 ring-primary'
                : 'bg-card hover:border-primary/40 hover:bg-muted/60',
            )}
          >
            <span
              className={cn(
                'flex size-9 shrink-0 items-center justify-center rounded-lg',
                selected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground',
              )}
            >
              <Icon className="size-4.5" aria-hidden="true" />
            </span>
            <span className="flex min-w-0 flex-col">
              <span className="truncate text-sm font-semibold">{method.label}</span>
              <span className={cn('text-xs', selected ? 'text-primary' : 'text-muted-foreground')}>{method.hint}</span>
            </span>
          </button>
        )
      })}
    </div>
  )
}
