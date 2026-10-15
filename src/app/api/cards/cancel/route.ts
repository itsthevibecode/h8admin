import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { AUSTRALIAN_BANK_POLICIES } from '@/lib/bank-policies'

export async function POST(req: Request) {
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

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { fundingSourceId, cancelledAtDate } = await req.json()

    if (!fundingSourceId) {
      return NextResponse.json({ error: 'Funding source ID is required' }, { status: 400 })
    }

    const card = await prisma.fundingSource.findFirst({
      where: { id: fundingSourceId, userId: user.id },
    })

    if (!card) {
      return NextResponse.json({ error: 'Card not found' }, { status: 404 })
    }

    const bankGroup = card.bankGroup || 'American Express'
    const policy = AUSTRALIAN_BANK_POLICIES.find((b) => b.bankGroup === bankGroup)
    const lockoutMonths = policy?.lockoutMonths || 12

    const cancelledAt = cancelledAtDate ? new Date(cancelledAtDate) : new Date()
    const eligibleAgainAt = new Date(cancelledAt)
    eligibleAgainAt.setMonth(eligibleAgainAt.getMonth() + lockoutMonths)

    // Mark active card as cancelled
    await prisma.fundingSource.update({
      where: { id: fundingSourceId },
      data: { isCancelled: true },
    })

    // Create entry in CardLockout tracker
    const lockout = await prisma.cardLockout.create({
      data: {
        userId: user.id,
        bankGroup,
        cardName: card.cardName || `${card.brand} ••${card.last4}`,
        nickname: card.nickname || null,
        cancelledAt,
        lockoutMonths,
        eligibleAgainAt,
      },
    })

    return NextResponse.json({ success: true, lockout })
  } catch (err: unknown) {
    const error = err as Error
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}