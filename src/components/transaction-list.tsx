import Link from 'next/link'
import { ArrowRight, CheckCircle2, Clock, CreditCard, Landmark } from 'lucide-react'
import { currencyPrecise, getAccount, routeLabel, type Transaction } from '@/lib/data'

const dateFormat = new Intl.DateTimeFormat('en-AU', { day: 'numeric', month: 'short' })

type Props = {
  title: string
  subtitle?: string
  transactions: Transaction[]
  showAccount?: boolean
  showRoute?: boolean
  emptyMessage?: string
}

export function TransactionList({ title, subtitle, transactions, showAccount, showRoute, emptyMessage }: Props) {
  const total = transactions.reduce((sum, t) => sum + t.amount, 0)

  return (
    <section aria-label={title} className="rounded-2xl bg-card p-4 shadow-sm shadow-primary/5 sm:p-5">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold tracking-tight">{title}</h2>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        <p className="text-right text-xs text-muted-foreground">
          Total <span className="font-semibold text-foreground tabular-nums">{currencyPrecise.format(total)}</span>
        </p>
      </div>

      {transactions.length === 0 ? (
        <p className="mt-4 rounded-lg bg-muted px-3 py-6 text-center text-sm text-muted-foreground">
          {emptyMessage ?? 'No transactions yet.'}
        </p>
      ) : (
        <ul className="mt-3 flex flex-col divide-y divide-border/60">
          {transactions.map((t) => {
            const account = getAccount(t.accountId)
            const route = routeLabel(t.routedTo)
            const RouteIcon = t.routedTo.kind === 'card' ? CreditCard : Landmark
            return (
              <li key={t.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-2.5 sm:flex-nowrap">
                <time dateTime={t.date} className="w-12 shrink-0 text-xs tabular-nums text-muted-foreground">
                  {dateFormat.format(new Date(`${t.date}T00:00:00`))}
                </time>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{t.payee}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {t.category}
                    {showAccount && account && (
                      <>
                        {' · '}
                        <Link href={`/direct-debits/${account.id}`} className="hover:text-primary">
                          {account.name}
                        </Link>
                      </>
                    )}
                  </p>
                </div>

                {showRoute && (
                  <Link
                    href={route.href}
                    className="order-last ml-16 inline-flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground hover:text-primary sm:order-none sm:ml-0 sm:w-56"
                  >
                    <ArrowRight className="size-3 shrink-0" aria-hidden="true" />
                    <RouteIcon className="size-3.5 shrink-0 text-primary" aria-hidden="true" />
                    <span className="truncate">{route.label}</span>
                  </Link>
                )}

                <span className="w-20 shrink-0 text-right">
                  {t.status === 'paid' ? (
                    <span className="inline-flex items-center gap-1 text-xs text-primary">
                      <CheckCircle2 className="size-3" aria-hidden="true" />
                      Paid
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs text-amber-700">
                      <Clock className="size-3" aria-hidden="true" />
                      Processing
                    </span>
                  )}
                </span>

                <span className="w-24 shrink-0 text-right text-sm font-medium tabular-nums">
                  {currencyPrecise.format(t.amount)}
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
