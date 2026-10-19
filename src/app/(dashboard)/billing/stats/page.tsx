import type { Metadata } from 'next'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { TransactionStatus, type AccountType } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { classifyUtility } from '@/lib/bill-benchmarks'
import { BillerStatsView, type StatTransaction } from '@/components/biller-stats'

export const metadata: Metadata = {
  title: 'Billing Stats | H8Admin',
  description: 'Biller volume over the last six months.',
}

const ACCOUNT_LABEL: Record<AccountType, string> = {
  INDIVIDUAL: 'Personal',
  HOUSEHOLD: 'Household',
  INVESTMENT: 'Investment property',
}

export default async function BillingStatsPage() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
      },
    }
  )
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const start = new Date()
  start.setMonth(start.getMonth() - 5)
  start.setDate(1)
  start.setHours(0, 0, 0, 0)

  const virtualAccounts = user
    ? await prisma.virtualAccount.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'asc' },
        select: { id: true, accountType: true, accountNumber: true },
      })
    : []

  const transactions = user
    ? await prisma.transaction.findMany({
        where: {
          userId: user.id,
          status: TransactionStatus.SUCCESS,
          createdAt: { gte: start },
        },
        select: {
          billerName: true,
          amountCents: true,
          createdAt: true,
          virtualAccountId: true,
          virtualAccount: { select: { accountType: true, accountNumber: true } },
        },
      })
    : []

  const points: StatTransaction[] = transactions.map((tx) => ({
    billerName: tx.billerName,
    amountCents: tx.amountCents,
    createdAt: tx.createdAt.toISOString(),
    accountId: tx.virtualAccountId,
    accountLabel: `${ACCOUNT_LABEL[tx.virtualAccount.accountType]} ••${tx.virtualAccount.accountNumber.slice(-4)}`,
    category: classifyUtility(tx.billerName),
  }))

  return (
    <div className="mx-auto max-w-6xl p-8">
      <BillerStatsView
        transactions={points}
        accounts={virtualAccounts.map((account) => {
          const investmentIndex =
            account.accountType === 'INVESTMENT'
              ? virtualAccounts.filter((item) => item.accountType === 'INVESTMENT').findIndex((item) => item.id === account.id)
              : -1
          const investmentCount = virtualAccounts.filter((item) => item.accountType === 'INVESTMENT').length
          const suffix = investmentIndex >= 0 && investmentCount > 1 ? ` ${investmentIndex + 1}` : ''
          return {
            id: account.id,
            label: `${ACCOUNT_LABEL[account.accountType]}${suffix} ••${account.accountNumber.slice(-4)}`,
          }
        })}
      />
    </div>
  )
}
