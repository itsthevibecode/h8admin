import type { Metadata } from 'next'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { CardOptimiser, type HeldCard, type OptimiserLockout } from '@/components/card-optimiser'

export const metadata: Metadata = {
  title: 'Find new credit card | H8Admin',
  description: 'Compare Australian rewards credit card sign-up bonuses.',
}

export default async function ChangeCreditCardsPage() {
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

  let heldCards: HeldCard[] = []
  let lockouts: OptimiserLockout[] = []

  if (user) {
    const [cards, rawLockouts] = await Promise.all([
      prisma.fundingSource.findMany({
        where: { userId: user.id, isCancelled: false },
        select: { bankGroup: true, brand: true, cardName: true, nickname: true },
      }),
      prisma.cardLockout.findMany({
        where: { userId: user.id, eligibleAgainAt: { gt: new Date() } },
        select: { bankGroup: true, cardName: true, eligibleAgainAt: true },
      }),
    ])
    heldCards = cards
    lockouts = rawLockouts.map((lockout) => ({
      bankGroup: lockout.bankGroup,
      cardName: lockout.cardName,
      eligibleAgainAt: lockout.eligibleAgainAt.toISOString(),
    }))
  }

  return (
    <div className="mx-auto max-w-6xl p-8">
      <CardOptimiser heldCards={heldCards} lockouts={lockouts} />
    </div>
  )
}
