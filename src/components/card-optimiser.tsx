'use client'

import { useMemo, useState } from 'react'
import { ArrowUpRight, CheckCircle2, Clock, Info, Plane } from 'lucide-react'
import {
  REWARDS_CATEGORY_META,
  REWARDS_OFFERS,
  REWARDS_SNAPSHOT,
  type RewardsCategory,
  type RewardsOffer,
} from '@/lib/rewards-market'

export interface HeldCard {
  bankGroup: string | null
  brand: string
  cardName: string | null
  nickname: string | null
}

export interface OptimiserLockout {
  bankGroup: string
  cardName: string
  eligibleAgainAt: string
}

function formatAud(amount: number) {
  return amount.toLocaleString('en-AU', {
    style: 'currency',
    currency: 'AUD',
    maximumFractionDigits: 0,
  })
}

function compact(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '')
}

function sameIssuer(groups: string[], candidate: string | null | undefined) {
  if (!candidate) return false
  const value = compact(candidate)
  return groups.some((group) => {
    const key = compact(group)
    return value.includes(key) || key.includes(value)
  })
}

function sameProduct(offer: RewardsOffer, names: Array<string | null | undefined>) {
  const needles = offer.matchNames.map(compact)
  return names.some((name) => {
    if (!name) return false
    const value = compact(name)
    if (value.length < 8) return false
    return needles.some(
      (needle) => needle.length >= 8 && (value.includes(needle) || needle.includes(value))
    )
  })
}

const FILTERS: { id: 'ALL' | RewardsCategory; label: string }[] = [
  { id: 'ALL', label: 'All programs' },
  { id: 'QANTAS', label: 'Qantas' },
  { id: 'VELOCITY', label: 'Velocity' },
  { id: 'FLEXIBLE', label: 'Flexible' },
]

export function CardOptimiser({
  heldCards,
  lockouts,
}: {
  heldCards: HeldCard[]
  lockouts: OptimiserLockout[]
}) {
  const [filter, setFilter] = useState<'ALL' | RewardsCategory>('ALL')
  const [bank, setBank] = useState('ALL')
  const banks = useMemo(
    () => Array.from(new Set(REWARDS_OFFERS.map((offer) => offer.issuer))).sort(),
    []
  )
  const visible = useMemo(
    () =>
      REWARDS_OFFERS.filter((offer) => {
        if (filter !== 'ALL' && offer.category !== filter) return false
        if (bank !== 'ALL' && offer.issuer !== bank) return false
        return true
      }).sort((a, b) => b.signupBonusPoints - a.signupBonusPoints),
    [filter, bank]
  )

  return (
    <div className="space-y-8">
      <div className="border-b border-gray-100 pb-4">
        <h1 className="text-2xl font-bold text-gray-900">Change credit cards</h1>
        <p className="mt-1 max-w-3xl text-sm text-gray-500">
          A rewards-card comparison for a new sign-up. Figures are a {REWARDS_SNAPSHOT} snapshot
          from Point Hacks, Finder, Pointrs, Canstar and BankMate. Confirm the live offer on the
          issuer site before you apply.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <select
          value={bank}
          onChange={(event) => setBank(event.target.value)}
          aria-label="Bank"
          className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-gray-700"
        >
          <option value="ALL">All banks</option>
          {banks.map((issuer) => (
            <option key={issuer} value={issuer}>
              {issuer}
            </option>
          ))}
        </select>
        {FILTERS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setFilter(item.id)}
            className={`rounded-xl px-3 py-2 text-xs font-bold ${
              filter === item.id
                ? 'bg-emerald-600 text-white'
                : 'border border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {visible.map((offer) => {
          const meta = REWARDS_CATEGORY_META[offer.category]
          const productActive = heldCards.some((card) =>
            sameProduct(offer, [card.cardName, card.nickname])
          )
          const issuerActive = heldCards.some(
            (card) =>
              sameIssuer(offer.lockoutGroups, card.bankGroup) ||
              sameIssuer(offer.lockoutGroups, card.brand)
          )
          const lockout = lockouts.find(
            (item) =>
              sameProduct(offer, [item.cardName]) ||
              sameIssuer(offer.lockoutGroups, item.bankGroup)
          )
          const eligibleAgain = lockout ? new Date(lockout.eligibleAgainAt) : null

          return (
            <article
              key={offer.id}
              className="flex flex-col space-y-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <Plane className="h-5 w-5" />
                </div>
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-700">
                  {offer.signupBonusPoints > 0
                    ? `${offer.signupBonusPoints.toLocaleString('en-AU')} pts`
                    : 'No published bonus'}
                </span>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  {meta.title} · {offer.issuer}
                </p>
                <h3 className="text-sm font-bold text-gray-900">{offer.name}</h3>
                <p className="text-xs leading-relaxed text-gray-500">{offer.blurb}</p>
              </div>

              {productActive ? (
                <p className="inline-flex items-center gap-1.5 self-start rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-bold text-emerald-800">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Active on your account
                </p>
              ) : lockout && eligibleAgain ? (
                <p className="inline-flex items-center gap-1.5 self-start rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-bold text-amber-900">
                  <Clock className="h-3.5 w-3.5" /> Cancellation window until{' '}
                  {eligibleAgain.toLocaleDateString('en-AU', { timeZone: 'Australia/Sydney' })}
                </p>
              ) : issuerActive ? (
                <p className="inline-flex items-center gap-1.5 self-start rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-bold text-emerald-800">
                  <CheckCircle2 className="h-3.5 w-3.5" /> You already hold this issuer
                </p>
              ) : null}

              <div className="space-y-2 rounded-xl border border-gray-100 bg-gray-50 p-3 text-xs">
                <div className="flex justify-between text-gray-600">
                  <span>Annual fee</span>
                  <span className="font-mono font-bold text-gray-900">
                    {offer.annualFeeDollars === null ? 'Check issuer' : formatAud(offer.annualFeeDollars)}
                  </span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Earn</span>
                  <span className="font-mono font-bold text-emerald-700">
                    {offer.pointsPerDollar === null
                      ? 'Check issuer'
                      : `${offer.pointsPerDollar} pts / $1`}
                  </span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Min. spend</span>
                  <span className="font-mono font-bold text-gray-900">
                    {offer.minSpendDollars > 0
                      ? `${formatAud(offer.minSpendDollars)} / ${offer.windowDays}d`
                      : 'See listing'}
                  </span>
                </div>
              </div>
              <ul className="space-y-1 text-[11px] text-gray-500">
                {offer.features.map((feature) => (
                  <li key={feature}>• {feature}</li>
                ))}
              </ul>
              <a
                href={offer.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-auto inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-emerald-700"
              >
                View on {offer.sourceName}
                <ArrowUpRight className="h-3.5 w-3.5" />
              </a>
            </article>
          )
        })}
      </div>

      <div className="space-y-2 rounded-2xl border border-gray-100 bg-white p-5">
        <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-gray-500">
          <Info className="h-3.5 w-3.5" /> General advice warning
        </p>
        <p className="text-[11px] leading-relaxed text-gray-500">
          Bonus points, fees and earn rates are a market snapshot, not a live quote or a
          recommendation. H8Admin does not hold an Australian financial services licence. Read the
          issuer&apos;s offer and{' '}
          <a
            href="https://www.moneysmart.gov.au/credit-cards"
            target="_blank"
            rel="noreferrer"
            className="font-semibold text-emerald-800 underline"
          >
            MoneySmart
          </a>{' '}
          before you apply.
        </p>
      </div>
    </div>
  )
}
