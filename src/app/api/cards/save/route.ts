import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
})

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
    const body = (await req.json()) as {
      paymentMethodId?: string
      nickname?: string
      bankGroup?: string
      cardName?: string
    }

    const paymentMethodId = body.paymentMethodId
    if (!paymentMethodId || typeof paymentMethodId !== 'string') {
      return NextResponse.json({ error: 'paymentMethodId is required' }, { status: 400 })
    }

    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId)
    const brand = paymentMethod.card?.brand || 'Card'
    const last4 = paymentMethod.card?.last4 || '0000'

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true, referredById: true },
    })

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    let virtualAccount = await prisma.virtualAccount.findFirst({
      where: { userId: user.id },
    })

    if (!virtualAccount) {
      virtualAccount = await prisma.virtualAccount.create({
        data: {
          userId: user.id,
          bsb: '802-985',
          accountNumber: Math.floor(10000000 + Math.random() * 90000000).toString(),
        },
      })
    }

    const existingCount = await prisma.fundingSource.count({
      where: { userId: user.id },
    })

    const card = await prisma.fundingSource.create({
      data: {
        userId: user.id,
        virtualAccountId: virtualAccount.id,
        stripePaymentId: paymentMethodId,
        brand: brand.toUpperCase(),
        last4,
        nickname: body.nickname || null,
        bankGroup: body.bankGroup || null,
        cardName: body.cardName || null,
        isDefault: existingCount === 0,
      },
    })

    if (existingCount === 0 && dbUser.referredById) {
      await prisma.user.update({
        where: { id: dbUser.referredById },
        data: { rolloverBalanceCents: { increment: 100000 } },
      })
    }

    return NextResponse.json({ success: true, card })
  } catch (err: unknown) {
    const error = err as Error
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
