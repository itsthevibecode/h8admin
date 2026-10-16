import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

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

  if (!user || !user.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { paymentMethodId, setAsDefault } = await req.json()

    if (!paymentMethodId || typeof paymentMethodId !== 'string') {
      return NextResponse.json(
        { error: 'Valid paymentMethodId is required' },
        { status: 400 }
      )
    }

    // 1. Resolve or create user's Stripe Customer
    const customerList = await stripe.customers.list({
      email: user.email,
      limit: 1,
    })

    let customerId = customerList.data[0]?.id

    if (!customerId) {
      const newCustomer = await stripe.customers.create({
        email: user.email,
        metadata: { userId: user.id },
      })
      customerId = newCustomer.id
    }

    // 2. Fetch PaymentMethod from Stripe
    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId)

    // 3. Prevent IDOR: Verify customer attachment or attach safely
    if (paymentMethod.customer && paymentMethod.customer !== customerId) {
      return NextResponse.json(
        { error: 'Payment method belongs to a different customer.' },
        { status: 403 }
      )
    }

    if (!paymentMethod.customer) {
      await stripe.paymentMethods.attach(paymentMethodId, {
        customer: customerId,
      })
    }

    const brand = (paymentMethod.card?.brand || 'CARD').toUpperCase()
    const last4 = paymentMethod.card?.last4 || '0000'

    // 4. Determine default status: First card MUST be default
    const existingCardsCount = await prisma.fundingSource.count({
      where: { userId: user.id, isCancelled: false },
    })

    const shouldBeDefault = existingCardsCount === 0 || Boolean(setAsDefault)

    // 5. Ensure primary Virtual Account exists
    let virtualAccount = await prisma.virtualAccount.findFirst({
      where: { userId: user.id, accountType: 'INDIVIDUAL' },
    })

    if (!virtualAccount) {
      virtualAccount = await prisma.virtualAccount.create({
        data: {
          userId: user.id,
          accountType: 'INDIVIDUAL',
          bsb: '802-985',
          accountNumber: Math.floor(10000000 + Math.random() * 90000000).toString(),
        },
      })
    }

    // 6. Persist card and handle referral ledger activation in a transaction
    const result = await prisma.$transaction(async (tx) => {
      if (shouldBeDefault && existingCardsCount > 0) {
        await tx.fundingSource.updateMany({
          where: { userId: user.id },
          data: { isDefault: false },
        })
      }

      const fundingSource = await tx.fundingSource.create({
        data: {
          userId: user.id,
          virtualAccountId: virtualAccount.id,
          stripePaymentId: paymentMethodId,
          brand,
          last4,
          isDefault: shouldBeDefault,
        },
      })

      // Attribution Handshake: If first card, credit referrer with +$1,000 volume
      if (existingCardsCount === 0) {
        const currentUser = await tx.user.findUnique({
          where: { id: user.id },
          select: { referredById: true },
        })

        if (currentUser?.referredById) {
          await tx.user.update({
            where: { id: currentUser.referredById },
            data: {
              rolloverBalanceCents: { increment: 100000 },
            },
          })
        }
      }

      return fundingSource
    })

    return NextResponse.json({
      success: true,
      fundingSource: result,
      virtualAccount,
    })
  } catch (err: unknown) {
    const error = err as Error
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}