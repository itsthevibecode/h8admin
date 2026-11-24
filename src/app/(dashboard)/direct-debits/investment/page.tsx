import type { Metadata } from 'next'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { InvestmentProperty } from '@/components/investment-property'

export const metadata: Metadata = {
  title: 'Investment Property | H8Admin',
}

export default async function InvestmentPropertyPage() {
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

  const accounts = user
    ? await prisma.virtualAccount.findMany({
        where: {
          accountType: 'INVESTMENT',
          OR: [{ userId: user.id }, { propertyMembers: { some: { userId: user.id } } }],
        },
        orderBy: { createdAt: 'asc' },
        include: {
          user: { select: { id: true, email: true, name: true } },
          propertyMembers: {
            include: { user: { select: { id: true, email: true, name: true } } },
          },
        },
      })
    : []

  const debits =
    accounts.length > 0
      ? await prisma.transaction.findMany({
          where: { virtualAccountId: { in: accounts.map((account) => account.id) } },
          orderBy: { createdAt: 'desc' },
          take: 24,
          select: {
            id: true,
            virtualAccountId: true,
            billerName: true,
            amountCents: true,
            status: true,
            createdAt: true,
          },
        })
      : []

  return (
    <InvestmentProperty
      accounts={accounts.map((account) => ({
        id: account.id,
        bsb: account.bsb,
        accountNumber: account.accountNumber,
        displayName: account.displayName,
        isOwner: account.userId === user?.id,
        partners: [
          ...(account.user
            ? [
                {
                  id: account.user.id,
                  role: 'OWNER',
                  name: account.user.name,
                  email: account.user.email,
                },
              ]
            : []),
          ...account.propertyMembers.map((member) => ({
            id: member.id,
            role: member.role,
            name: member.user.name,
            email: member.user.email,
          })),
        ],
      }))}
      debits={debits.map((debit) => ({
        ...debit,
        createdAt: debit.createdAt.toISOString(),
      }))}
    />
  )
}
