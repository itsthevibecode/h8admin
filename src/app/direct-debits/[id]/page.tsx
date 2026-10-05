import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { AccountHeroCard } from '@/components/account-details-card'
import { PageHeader } from '@/components/page-header'
import { TransactionList } from '@/components/transaction-list'
import { accounts, getAccount, sortByDateDesc, transactions } from '@/lib/data'

export function generateStaticParams() {
  return accounts.map((a) => ({ id: a.id }))
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  return { title: `${getAccount(id)?.name ?? 'Direct Debit'} — H8Admin` }
}

export default async function DirectDebitPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const account = getAccount(id)
  if (!account) notFound()

  const history = sortByDateDesc(transactions.filter((t) => t.accountId === account.id))

  return (
    <>
      <PageHeader eyebrow="Direct Debit" title={account.name} description={account.description} />
      <AccountHeroCard account={account} />
      <TransactionList
        title="History"
        subtitle="Direct debits received on this account and where they were routed"
        transactions={history}
        showRoute
        emptyMessage="No direct debits received on this account yet."
      />
    </>
  )
}
