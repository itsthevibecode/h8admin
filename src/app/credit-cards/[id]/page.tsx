import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { CardTimerHero } from '@/components/card-timer'
import { PageHeader } from '@/components/page-header'
import { TransactionList } from '@/components/transaction-list'
import { creditCards, getCard, sortByDateDesc, transactions } from '@/lib/data'

export function generateStaticParams() {
  return creditCards.map((c) => ({ id: c.id }))
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  return { title: `${getCard(id)?.name ?? 'Credit Card'} — H8Admin` }
}

export default async function CreditCardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const card = getCard(id)
  if (!card) notFound()

  const routed = sortByDateDesc(
    transactions.filter((t) => t.routedTo.kind === 'card' && t.routedTo.id === card.id),
  )

  return (
    <>
      <PageHeader eyebrow="Credit Card" title={card.name} description={`${card.issuer} ··${card.last4}`} />
      <CardTimerHero card={card} />
      <TransactionList
        title="Routed Direct Debits"
        subtitle="Only direct debits routed to this card"
        transactions={routed}
        showAccount
        emptyMessage="No direct debits have been routed to this card yet."
      />
    </>
  )
}
