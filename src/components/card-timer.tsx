import Link from 'next/link'
import { CalendarClock, CreditCard as CardIcon, Plane } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { CreditCard } from '@/lib/data'

function DaysBadge({ daysLeft }: { daysLeft: number }) {
  const urgent = daysLeft <= 30
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
        urgent ? 'bg-amber-50 text-amber-700' : 'bg-secondary text-secondary-foreground',
      )}
    >
      <CalendarClock className="size-3.5" aria-hidden="true" />
      {daysLeft} days until bonus expiry
    </span>
  )
}

function TimeBar({ card }: { card: CreditCard }) {
  const elapsed = card.totalDays - card.daysLeft
  const pct = Math.min(Math.round((elapsed / card.totalDays) * 100), 100)
  return (
    <div>
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={card.totalDays}
        aria-valuenow={elapsed}
        aria-label={`${card.name} points bonus window elapsed`}
        className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
      >
        <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-1.5 text-xs text-muted-foreground">
        Day {elapsed} of {card.totalDays} in the points bonus window
      </p>
    </div>
  )
}

export function CardTimerTile({ card }: { card: CreditCard }) {
  return (
    <Link
      href={`/credit-cards/${card.id}`}
      className="flex flex-col gap-3 rounded-2xl bg-card p-4 shadow-sm shadow-primary/5 transition-shadow hover:shadow-md hover:shadow-primary/10"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <CardIcon className="size-4 shrink-0 text-primary" aria-hidden="true" />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{card.name}</p>
            <p className="truncate text-xs text-muted-foreground">{card.bonus}</p>
          </div>
        </div>
      </div>
      <DaysBadge daysLeft={card.daysLeft} />
      <TimeBar card={card} />
    </Link>
  )
}

export function CardTimerHero({ card }: { card: CreditCard }) {
  return (
    <section aria-label={`${card.name} bonus timer`} className="flex flex-col gap-4 rounded-2xl bg-card p-5 shadow-sm shadow-primary/5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Sign-up bonus</p>
          <p className="mt-0.5 inline-flex items-center gap-1.5 font-medium">
            <Plane className="size-4 text-primary" aria-hidden="true" />
            {card.bonus}
          </p>
        </div>
        <DaysBadge daysLeft={card.daysLeft} />
      </div>
      <TimeBar card={card} />
    </section>
  )
}
