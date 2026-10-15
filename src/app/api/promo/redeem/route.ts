import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'

const PROMO_CODES: Record<string, { creditCents: number; label: string }> = {
  CHURN10K: {
    creditCents: 1_000_000,
    label: '$10,000 in fee-free volume',
  },
  VIP0FEE: {
    creditCents: 10_000_000,
    label: '$100,000 in fee-free volume',
  },
}

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
    const body = await req.json()
    const promoCode =
      typeof body.promoCode === 'string' ? body.promoCode.trim().toUpperCase() : ''

    if (!promoCode) {
      return NextResponse.json({ error: 'Promo code is required' }, { status: 400 })
    }

    const offer = PROMO_CODES[promoCode]
    if (!offer) {
      return NextResponse.json({ error: 'Invalid promo code' }, { status: 400 })
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true, rolloverBalanceCents: true },
    })

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const alreadyRedeemed = await prisma.promoRedemption.findUnique({
      where: {
        userId_promoCode: {
          userId: user.id,
          promoCode,
        },
      },
    })

    if (alreadyRedeemed) {
      return NextResponse.json(
        {
          error: `${promoCode} has already been redeemed on this account`,
          newBalanceCents: dbUser.rolloverBalanceCents,
        },
        { status: 409 }
      )
    }

    const updated = await prisma.$transaction(async (tx) => {
      await tx.promoRedemption.create({
        data: {
          userId: user.id,
          promoCode,
        },
      })

      return tx.user.update({
        where: { id: user.id },
        data: {
          rolloverBalanceCents: { increment: offer.creditCents },
        },
        select: { rolloverBalanceCents: true },
      })
    })

    return NextResponse.json({
      success: true,
      message: `${promoCode} applied. ${offer.label} credited to your fee-free ledger.`,
      newBalanceCents: updated.rolloverBalanceCents,
    })
  } catch (err: unknown) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { rolloverBalanceCents: true },
      })
      return NextResponse.json(
        {
          error: 'This promo code has already been redeemed on this account',
          newBalanceCents: dbUser?.rolloverBalanceCents ?? 0,
        },
        { status: 409 }
      )
    }

    const error = err as Error
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
