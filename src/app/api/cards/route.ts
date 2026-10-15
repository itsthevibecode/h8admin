import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'

export async function GET() {
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
    const activeCards = await prisma.fundingSource.findMany({
      where: { userId: user.id, isCancelled: false },
      orderBy: { createdAt: 'desc' },
    })

    const cancelledLockouts = await prisma.cardLockout.findMany({
      where: { userId: user.id },
      orderBy: { eligibleAgainAt: 'asc' },
    })

    return NextResponse.json({ activeCards, cancelledLockouts })
  } catch (err: unknown) {
    const error = err as Error
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
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
    const { cardId, nickname, bankGroup, cardName, spendTarget, bonusDeadlineDays } = await req.json()

    let bonusDeadline: Date | null = null
    if (bonusDeadlineDays) {
      bonusDeadline = new Date()
      bonusDeadline.setDate(bonusDeadline.getDate() + parseInt(bonusDeadlineDays, 10))
    }

    const updated = await prisma.fundingSource.update({
      where: { id: cardId },
      data: {
        nickname: nickname || null,
        bankGroup: bankGroup || null,
        cardName: cardName || null,
        spendTarget: spendTarget ? parseInt(spendTarget, 10) : null,
        bonusDeadline: bonusDeadline || undefined,
      },
    })

    return NextResponse.json({ success: true, card: updated })
  } catch (err: unknown) {
    const error = err as Error
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}