import type { Metadata } from 'next'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { DirectDebitFunding } from '@/components/direct-debit-funding'

export const metadata: Metadata = {
  title: 'Direct Debit | H8Admin',
}

export default async function PayingDirectDebitPage() {
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
    ? await prisma.fundingSource.findMany({
        where: { userId: user.id, isCancelled: false, brand: 'DIRECT DEBIT' },
        select: { id: true, nickname: true, last4: true, isDefault: true },
        orderBy: { createdAt: 'desc' },
      })
    : []

  return (
    <div className="mx-auto max-w-6xl p-8">
      <DirectDebitFunding accounts={accounts} />
    </div>
  )
}
