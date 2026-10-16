import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { DashboardView } from '@/components/dashboard-view'
import {
  allocateUniqueReferralCode,
  needsShortReferralCode,
} from '@/lib/referral'

export default async function DashboardPage() {
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

  let virtualAccounts: {
    id: string
    bsb: string
    accountNumber: string
    accountType: 'INDIVIDUAL' | 'HOUSEHOLD' | 'INVESTMENT'
    householdId?: string | null
  }[] = []
  let fundingSource = null
  let allFundingSources: { id: string; brand: string; last4: string }[] = []
  let transactions: {
    id: string
    billerName: string
    amountCents: number
    status: 'SUCCESS' | 'DECLINED' | 'FAILED'
    createdAt: string
    fundingSource: { brand: string; last4: string } | null
  }[] = []

  if (user) {
    try {
      const refCode = cookieStore.get('referral_code')?.value?.trim().toUpperCase()
      const existingUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { referredById: true, referralCode: true },
      })

      let referredById: string | undefined
      if (refCode && !existingUser?.referredById) {
        const referrer = await prisma.user.findUnique({
          where: { referralCode: refCode },
        })
        if (referrer && referrer.id !== user.id) {
          referredById = referrer.id
        }
      }

      const shouldAssignReferralCode = needsShortReferralCode(existingUser?.referralCode)
      const referralCode = shouldAssignReferralCode
        ? await allocateUniqueReferralCode()
        : existingUser!.referralCode

      await prisma.user.upsert({
        where: { id: user.id },
        update: {
          email: user.email!,
          ...(referredById ? { referredById } : {}),
          ...(shouldAssignReferralCode ? { referralCode } : {}),
        },
        create: {
          id: user.id,
          email: user.email!,
          name: user.email?.split('@')[0] || 'User',
          referralCode,
          ...(referredById ? { referredById } : {}),
        },
      })

      virtualAccounts = await prisma.virtualAccount.findMany({
        where: { userId: user.id },
        select: { id: true, bsb: true, accountNumber: true, accountType: true, householdId: true },
        orderBy: { createdAt: 'asc' },
      })

      if (virtualAccounts.length === 0) {
        const primary = await prisma.virtualAccount.create({
          data: {
            userId: user.id,
            bsb: '802-985',
            accountNumber: Math.floor(10000000 + Math.random() * 90000000).toString(),
            accountType: 'INDIVIDUAL',
          },
        })
        virtualAccounts = [primary]
      }

      fundingSource = await prisma.fundingSource.findFirst({
        where: { userId: user.id, isDefault: true, isCancelled: false },
      })

      allFundingSources = await prisma.fundingSource.findMany({
        where: { userId: user.id, isCancelled: false },
        select: { id: true, brand: true, last4: true },
      })

      const rawTx = await prisma.transaction.findMany({
        where: { userId: user.id },
        include: { fundingSource: { select: { brand: true, last4: true } } },
        orderBy: { createdAt: 'desc' },
        take: 10,
      })

      transactions = rawTx.map((tx) => ({
        ...tx,
        createdAt: tx.createdAt.toISOString(),
      }))
    } catch (error) {
      console.error('Database query error in DashboardPage:', error)
    }
  }

  return (
    <DashboardView
      email={user?.email || ''}
      virtualAccounts={virtualAccounts}
      fundingSource={fundingSource}
      allFundingSources={allFundingSources}
      transactions={transactions}
    />
  )
}