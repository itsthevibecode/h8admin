import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { CreditCardsDashboard } from '@/components/credit-cards-dashboard'

export default async function CardsPage() {
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

  let activeCards: {
    id: string
    brand: string
    last4: string
    nickname?: string | null
    bankGroup?: string | null
    cardName?: string | null
    spendTarget?: number | null
    bonusDeadline?: string | null
    isDefault: boolean
  }[] = []

  let lockouts: {
    id: string
    bankGroup: string
    cardName: string
    nickname?: string | null
    cancelledAt: string
    lockoutMonths: number
    eligibleAgainAt: string
  }[] = []

  if (user) {
    const rawActive = await prisma.fundingSource.findMany({
      where: { userId: user.id, isCancelled: false },
      orderBy: { createdAt: 'desc' },
    })

    activeCards = rawActive.map((c) => ({
      ...c,
      bonusDeadline: c.bonusDeadline ? c.bonusDeadline.toISOString() : null,
    }))

    const rawLockouts = await prisma.cardLockout.findMany({
      where: { userId: user.id },
      orderBy: { eligibleAgainAt: 'asc' },
    })

    lockouts = rawLockouts.map((l) => ({
      ...l,
      cancelledAt: l.cancelledAt.toISOString(),
      eligibleAgainAt: l.eligibleAgainAt.toISOString(),
    }))
  }

  return (
    <div className="p-8">
      <CreditCardsDashboard activeCards={activeCards} lockouts={lockouts} />
    </div>
  )
}
