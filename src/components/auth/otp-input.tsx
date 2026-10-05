'use client'

import { useRef } from 'react'
import { cn } from '@/lib/utils'

const LENGTH = 6

export function OtpInput({
  value,
  onChange,
  invalid,
  disabled,
  labelId,
}: {
  value: string
  onChange: (value: string) => void
  invalid?: boolean
  disabled?: boolean
  labelId: string
}) {
  const inputs = useRef<Array<HTMLInputElement | null>>([])
  const digits = Array.from({ length: LENGTH }, (_, i) => value[i] ?? '')

  function focusAt(index: number) {
    inputs.current[Math.max(0, Math.min(LENGTH - 1, index))]?.focus()
  }

  function writeFrom(index: number, incoming: string) {
    const clean = incoming.replace(/\D/g, '')
    if (!clean) return
    const next = digits.slice()
    clean
      .slice(0, LENGTH - index)
      .split('')
      .forEach((digit, offset) => {
        next[index + offset] = digit
      })
    onChange(next.join(''))
    focusAt(index + clean.length)
  }

  function handleKeyDown(index: number, event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Backspace') {
      event.preventDefault()
      const next = digits.slice()
      if (next[index]) {
        next[index] = ''
      } else if (index > 0) {
        next[index - 1] = ''
        focusAt(index - 1)
      }
      onChange(next.join(''))
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault()
      focusAt(index - 1)
    } else if (event.key === 'ArrowRight') {
      event.preventDefault()
      focusAt(index + 1)
    }
  }

  return (
    <div role="group" aria-labelledby={labelId} className="flex items-center justify-between gap-2">
      {digits.map((digit, index) => (
        <div key={index} className="contents">
          {index === LENGTH / 2 && <span className="h-0.5 w-3 shrink-0 rounded-full bg-border" aria-hidden="true" />}
          <input
            ref={(node) => {
              inputs.current[index] = node
            }}
            type="text"
            inputMode="numeric"
            autoComplete={index === 0 ? 'one-time-code' : 'off'}
            maxLength={LENGTH}
            value={digit}
            disabled={disabled}
            aria-label={`Digit ${index + 1} of ${LENGTH}`}
            aria-invalid={invalid}
            onChange={(event) => {
              const typed = event.target.value
              writeFrom(index, digit && typed.length === 2 ? typed.replace(digit, '') || digit : typed)
            }}
            onKeyDown={(event) => handleKeyDown(index, event)}
            onPaste={(event) => {
              event.preventDefault()
              writeFrom(index, event.clipboardData.getData('text'))
            }}
            onFocus={(event) => event.target.select()}
            className={cn(
              'h-12 w-full min-w-0 rounded-lg border border-input bg-background text-center font-mono text-lg font-semibold tabular-nums transition-colors outline-none focus:border-primary focus:ring-3 focus:ring-primary/15 disabled:opacity-60 sm:h-14 sm:text-xl',
              digit && 'border-primary/40 bg-accent/40',
              invalid && 'border-destructive ring-3 ring-destructive/15',
            )}
          />
        </div>
      ))}
    </div>
  )
}
