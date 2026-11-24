import type { Metadata } from 'next'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { type AccountType } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { PaymentFlowBoard, type FlowLane } from '@/components/payment-flow-board'

export const metadata: Metadata = {
  title: 'Payment flow | H8Admin',
}

const LANE_ORDER: AccountType[] = ['INDIVIDUAL', 'HOUSEHOLD', 'INVESTMENT']

const LANE_LABEL: Record<AccountType, string> = {
  INDIVIDUAL: 'Personal direct debit',
  HOUSEHOLD: 'Household',
  INVESTMENT: 'Investment property',
}

export default async function PaymentFlowPage() {
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

  const [accounts, sources, rules] = user
    ? await Promise.all([
        prisma.virtualAccount.findMany({
          where: { userId: user.id },
          select: { id: true, bsb: true, accountNumber: true, accountType: true, createdAt: true },
        }),
        prisma.fundingSource.findMany({
          where: { userId: user.id, isCancelled: false },
          select: { id: true, brand: true, last4: true, nickname: true, isDefault: true },
          orderBy: { createdAt: 'asc' },
        }),
        prisma.routingRule.findMany({
          where: {
            userId: user.id,
            isActive: true,
            ruleType: 'DEFAULT',
            billerName: { in: ['PREFERRED', 'BACKUP'] },
          },
          select: { virtualAccountId: true, fundingSourceId: true, billerName: true },
        }),
      ])
    : [[], [], []]

  const investmentCount = accounts.filter((account) => account.accountType === 'INVESTMENT').length
  const lanes: FlowLane[] = [...accounts]
    .sort((a, b) => {
      const typeDelta = LANE_ORDER.indexOf(a.accountType) - LANE_ORDER.indexOf(b.accountType)
      if (typeDelta !== 0) return typeDelta
      return a.createdAt.getTime() - b.createdAt.getTime()
    })
    .map((account) => {
      const sameType = accounts.filter((item) => item.accountType === account.accountType)
      const index = sameType.findIndex((item) => item.id === account.id)
      const suffix = account.accountType === 'INVESTMENT' && investmentCount > 1 ? ` ${index + 1}` : ''
      const preferred = rules.find(
        (rule) => rule.virtualAccountId === account.id && rule.billerName === 'PREFERRED'
      )
      const backup =
        rules.find((rule) => rule.virtualAccountId === account.id && rule.billerName === 'BACKUP') ||
        (account.accountType === 'INDIVIDUAL'
          ? rules.find((rule) => rule.virtualAccountId === null && rule.billerName === 'BACKUP')
          : undefined)
      return {
        id: account.id,
        label: `${LANE_LABEL[account.accountType]}${suffix}`,
        bsb: account.bsb,
        accountNumber: account.accountNumber,
        preferredId: preferred?.fundingSourceId ?? null,
        backupId: backup?.fundingSourceId ?? null,
      }
    })

  return (
    <div className="mx-auto max-w-6xl p-8">
      <PaymentFlowBoard lanes={lanes} sources={sources} />
    </div>
  )
}
