import { AccountRowCard } from '@/components/account-details-card'
import { CardTimerTile } from '@/components/card-timer'
import { PageHeader, SectionHeading } from '@/components/page-header'
import { TransactionList } from '@/components/transaction-list'
import { accounts, creditCards, sortByDateDesc, transactions } from '@/lib/data'

export default function DashboardPage() {
  const recent = sortByDateDesc(transactions).slice(0, 3)
  const cards = [...creditCards].sort((a, b) => a.daysLeft - b.daysLeft)

  return (
    <>
      <PageHeader title="Dashboard" description="All direct debit accounts and active card bonuses at a glance." />

      <section aria-label="Direct debit accounts" className="flex flex-col gap-2">
        <SectionHeading>Direct Debits</SectionHeading>
        <div className="flex flex-col gap-2">
          {accounts.map((a) => (
            <AccountRowCard key={a.id} account={a} />
          ))}
        </div>
      </section>

      <TransactionList
        title="Recent Bills"
        subtitle="Across all direct debit accounts"
        transactions={recent}
        showAccount
        showRoute
      />

      <section aria-label="Credit card bonus timers" className="flex flex-col gap-2">
        <SectionHeading>Credit Cards</SectionHeading>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {cards.map((c) => (
            <CardTimerTile key={c.id} card={c} />
          ))}
        </div>
      </section>
    </>
  )
}
