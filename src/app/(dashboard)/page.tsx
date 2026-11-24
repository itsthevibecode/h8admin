import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { isAllowlisted } from '@/lib/beta-access'
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
    displayName: string | null
    accountType: 'INDIVIDUAL' | 'HOUSEHOLD' | 'INVESTMENT'
    householdId?: string | null
  }[] = []
  let fundingSource = null
  let allFundingSources: { id: string; brand: string; last4: string }[] = []
  let hasBillerRule = false
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

      if (!existingUser && (!user.email || !(await isAllowlisted(user.email)))) {
        await supabase.auth.signOut()
        redirect('/login?error=closed-beta')
      }

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
          referralCode,
          ...(referredById ? { referredById } : {}),
        },
      })

      const ownedAccounts = await prisma.virtualAccount.findMany({
        where: { userId: user.id },
        select: {
          id: true,
          bsb: true,
          accountNumber: true,
          displayName: true,
          accountType: true,
          householdId: true,
        },
        orderBy: { createdAt: 'asc' },
      })

      const memberships = await prisma.householdMember.findMany({
        where: { userId: user.id },
        select: {
          household: {
            select: {
              virtualAccounts: {
                select: {
                  id: true,
                  bsb: true,
                  accountNumber: true,
                  displayName: true,
                  accountType: true,
                  householdId: true,
                },
              },
            },
          },
        },
      })

      const householdAccounts = memberships.flatMap(
        (membership) => membership.household.virtualAccounts
      )
      const byId = new Map(ownedAccounts.map((account) => [account.id, account]))
      for (const account of householdAccounts) {
        byId.set(account.id, account)
      }
      virtualAccounts = Array.from(byId.values())

      fundingSource = await prisma.fundingSource.findFirst({
        where: { userId: user.id, isDefault: true, isCancelled: false },
      })

      allFundingSources = await prisma.fundingSource.findMany({
        where: { userId: user.id, isCancelled: false },
        select: { id: true, brand: true, last4: true },
      })

      const billerRuleCount = await prisma.routingRule.count({
        where: {
          userId: user.id,
          isActive: true,
          ruleType: 'BILLER_OVERRIDE',
        },
      })
      hasBillerRule = billerRuleCount > 0

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
      hasBillerRule={hasBillerRule}
      transactions={transactions}
    />
  )
}