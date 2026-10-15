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

    if (!cardId || typeof cardId !== 'string') {
      return NextResponse.json({ error: 'cardId is required' }, { status: 400 })
    }

    const card = await prisma.fundingSource.findFirst({
      where: { id: cardId, userId: user.id },
    })

    if (!card) {
      return NextResponse.json({ error: 'Card not found' }, { status: 404 })
    }

    const parsedTarget =
      spendTarget === undefined || spendTarget === null || spendTarget === ''
        ? null
        : parseInt(String(spendTarget), 10)
    if (parsedTarget !== null && !Number.isFinite(parsedTarget)) {
      return NextResponse.json({ error: 'Invalid spend target' }, { status: 400 })
    }

    let bonusDeadline: Date | undefined
    if (bonusDeadlineDays) {
      const days = parseInt(String(bonusDeadlineDays), 10)
      if (!Number.isFinite(days) || days < 0 || days > 730) {
        return NextResponse.json({ error: 'Invalid bonus deadline' }, { status: 400 })
      }
      bonusDeadline = new Date()
      bonusDeadline.setDate(bonusDeadline.getDate() + days)
    }

    const updated = await prisma.fundingSource.update({
      where: { id: card.id },
      data: {
        nickname: nickname || null,
        bankGroup: bankGroup || null,
        cardName: cardName || null,
        spendTarget: parsedTarget,
        bonusDeadline,
      },
    })

    return NextResponse.json({ success: true, card: updated })
  } catch (err: unknown) {
    const error = err as Error
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}