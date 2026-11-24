import type { Metadata } from 'next'
import Link from 'next/link'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Building2, Landmark, User, Users } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { investmentLabel } from '@/lib/billing-labels'

export const metadata: Metadata = {
  title: 'Billing | H8Admin',
  description: 'Personal, household, and investment Virtual BSBs that billers debit.',
}

export default async function DirectDebitsPage() {
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

  let personal: { bsb: string; accountNumber: string; displayName: string | null } | null = null
  let householdName: string | null = null
  let investments: { id: string; displayName: string | null }[] = []

  if (user) {
    personal = await prisma.virtualAccount.findFirst({
      where: { userId: user.id, accountType: 'INDIVIDUAL' },
      orderBy: { createdAt: 'asc' },
      select: { bsb: true, accountNumber: true, displayName: true },
    })
    const membership = await prisma.householdMember.findFirst({
      where: { userId: user.id },
      select: { household: { select: { name: true } } },
    })
    householdName = membership?.household.name ?? null
    investments = await prisma.virtualAccount.findMany({
      where: { userId: user.id, accountType: 'INVESTMENT' },
      orderBy: { createdAt: 'asc' },
      select: { id: true, displayName: true },
    })
  }

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-700">Step 1</p>
        <h1 className="text-2xl font-bold text-gray-900">Billing</h1>
        <p className="mt-1 text-sm text-gray-500">
          The Virtual BSBs you give to billers. Open a method below, or rename it from its page.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Link
          href="/direct-debits/personal"
          className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm hover:border-emerald-200"
        >
          <User className="h-5 w-5 text-emerald-600" />
          <h2 className="mt-3 text-sm font-bold text-gray-900">
            {personal?.displayName?.trim() || 'Personal'}
          </h2>
          <p className="mt-1 text-xs text-gray-500">Your first direct debit address.</p>
          <p className="mt-3 font-mono text-sm font-bold text-gray-900">
            {personal ? `${personal.bsb} · ${personal.accountNumber}` : 'Not provisioned yet'}
          </p>
        </Link>
        <Link
          href="/direct-debits/household"
          className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm hover:border-emerald-200"
        >
          <Users className="h-5 w-5 text-emerald-600" />
          <h2 className="mt-3 text-sm font-bold text-gray-900">{householdName || 'Household'}</h2>
          <p className="mt-1 text-xs text-gray-500">Shared bills, private funding cards.</p>
          <p className="mt-3 flex items-center gap-1.5 text-sm font-bold text-gray-900">
            <Landmark className="h-4 w-4 text-emerald-600" />
            {householdName || 'No household yet'}
          </p>
        </Link>
        <Link
          href="/direct-debits/investment"
          className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm hover:border-emerald-200"
        >
          <Building2 className="h-5 w-5 text-emerald-600" />
          <h2 className="mt-3 text-sm font-bold text-gray-900">
            {investments.length === 1
              ? investmentLabel(investments[0].displayName, 0, 1)
              : 'Investment property'}
          </h2>
          <p className="mt-1 text-xs text-gray-500">A separate address for a rental or investment.</p>
          <p className="mt-3 text-sm font-bold text-gray-900">
            {investments.length === 0
              ? 'Not provisioned yet'
              : investments.length === 1
                ? investmentLabel(investments[0].displayName, 0, 1)
                : investments
                    .map((account, index) =>
                      investmentLabel(account.displayName, index, investments.length)
                    )
                    .join(', ')}
          </p>
        </Link>
      </div>
    </div>
  )
}
