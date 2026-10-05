'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowUpRight, Check, Copy } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Account } from '@/lib/data'

function CopyButton({ account, inverted }: { account: Account; inverted?: boolean }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    const details = `Account name: ${account.accountName}\nBSB: ${account.bsb}\nAccount number: ${account.accountNumber.replace(/\s/g, '')}`
    try {
      await navigator.clipboard.writeText(details)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
        inverted
          ? 'bg-primary-foreground text-primary hover:bg-primary-foreground/90'
          : 'bg-secondary text-secondary-foreground hover:bg-secondary/70',
      )}
    >
      {copied ? <Check className="size-3.5" aria-hidden="true" /> : <Copy className="size-3.5" aria-hidden="true" />}
      {copied ? 'Copied' : 'Copy Details'}
      <span className="sr-only" aria-live="polite">
        {copied ? `${account.name} details copied` : ''}
      </span>
    </button>
  )
}

function ActiveBadge({ inverted }: { inverted?: boolean }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium',
        inverted ? 'bg-primary-foreground/15 text-primary-foreground' : 'bg-secondary text-secondary-foreground',
      )}
    >
      <span className={cn('size-1.5 rounded-full', inverted ? 'bg-primary-foreground' : 'bg-primary')} aria-hidden="true" />
      Active
    </span>
  )
}

export function AccountRowCard({ account }: { account: Account }) {
  return (
    <article className="flex flex-col gap-3 rounded-xl bg-primary px-4 py-3 text-primary-foreground sm:flex-row sm:items-center sm:gap-6">
      <div className="flex min-w-0 items-center justify-between gap-3 sm:w-56 sm:shrink-0 sm:justify-start">
        <div className="min-w-0">
          <Link
            href={`/direct-debits/${account.id}`}
            className="group inline-flex items-center gap-1 text-sm font-medium hover:underline hover:underline-offset-4"
          >
            {account.name}
            <ArrowUpRight className="size-3.5 opacity-70 transition-opacity group-hover:opacity-100" aria-hidden="true" />
          </Link>
          <p className="truncate text-xs text-primary-foreground/70">{account.accountName}</p>
        </div>
        <span className="sm:hidden">
          <ActiveBadge inverted />
        </span>
      </div>

      <dl className="flex flex-1 gap-8">
        <div>
          <dt className="text-[10px] uppercase tracking-wider text-primary-foreground/70">Virtual BSB</dt>
          <dd className="font-mono text-sm font-medium tracking-wide">{account.bsb}</dd>
        </div>
        <div>
          <dt className="text-[10px] uppercase tracking-wider text-primary-foreground/70">Account number</dt>
          <dd className="font-mono text-sm font-medium tracking-wide">{account.accountNumber}</dd>
        </div>
      </dl>

      <div className="flex items-center gap-3">
        <span className="hidden sm:inline-flex">
          <ActiveBadge inverted />
        </span>
        <CopyButton account={account} inverted />
      </div>
    </article>
  )
}

export function AccountHeroCard({ account }: { account: Account }) {
  return (
    <section aria-label={`${account.name} account details`} className="rounded-2xl bg-primary p-5 text-primary-foreground sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-wider text-primary-foreground/70">Account name</p>
          <p className="font-medium">{account.accountName}</p>
        </div>
        <ActiveBadge inverted />
      </div>
      <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
        <dl className="flex gap-8">
          <div>
            <dt className="text-[11px] uppercase tracking-wider text-primary-foreground/70">Virtual BSB</dt>
            <dd className="mt-0.5 font-mono text-lg font-medium tracking-wide">{account.bsb}</dd>
          </div>
          <div>
            <dt className="text-[11px] uppercase tracking-wider text-primary-foreground/70">Account number</dt>
            <dd className="mt-0.5 font-mono text-lg font-medium tracking-wide">{account.accountNumber}</dd>
          </div>
        </dl>
        <CopyButton account={account} inverted />
      </div>
    </section>
  )
}
