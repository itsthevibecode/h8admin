import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import Stripe from 'stripe'

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
    const { billerName, amountDollars } = await req.json()

    if (!billerName || !amountDollars) {
      return NextResponse.json({ error: 'Biller name and amount are required' }, { status: 400 })
    }

    const amountCents = Math.round(parseFloat(amountDollars) * 100)

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
    })

    const virtualAccount = await prisma.virtualAccount.findFirst({
      where: { userId: user.id },
      include: {
        fundingSources: { where: { isCancelled: false } },
        routingRules: {
          where: { isActive: true },
          include: { fundingSource: true },
          orderBy: { priority: 'asc' },
        },
      },
    })

    if (!virtualAccount || virtualAccount.fundingSources.length === 0) {
      return NextResponse.json(
        { error: 'No active Virtual BSB or linked funding source found' },
        { status: 400 }
      )
    }

    let selectedFundingSource =
      virtualAccount.fundingSources.find((fs) => fs.isDefault) ||
      virtualAccount.fundingSources[0]
    let matchedRuleType = 'DEFAULT'

    const billerOverride = virtualAccount.routingRules.find(
      (r) =>
        r.ruleType === 'BILLER_OVERRIDE' &&
        r.billerName &&
        r.billerName.toLowerCase().trim() === billerName.toLowerCase().trim()
    )

    if (billerOverride) {
      selectedFundingSource = billerOverride.fundingSource
      matchedRuleType = `BILLER_OVERRIDE (${billerOverride.billerName})`
    } else {
      const now = new Date()
      const churnTimer = virtualAccount.routingRules.find(
        (r) =>
          r.ruleType === 'CHURN_TIMER' &&
          r.expiresAt &&
          new Date(r.expiresAt) > now
      )

      if (churnTimer) {
        selectedFundingSource = churnTimer.fundingSource
        matchedRuleType = 'CHURN_TIMER'
      }
    }

    const stripeKey = process.env.STRIPE_SECRET_KEY!
    const stripe = new Stripe(stripeKey)

    let stripeChargeId = null
    let status: 'SUCCESS' | 'DECLINED' | 'FAILED' = 'SUCCESS'
    let failureReason = null

    try {
      const paymentMethod = await stripe.paymentMethods.retrieve(selectedFundingSource.stripePaymentId)

      let customerId =
        typeof paymentMethod.customer === 'string'
          ? paymentMethod.customer
          : paymentMethod.customer?.id

      if (!customerId) {
        const existingCustomers = await stripe.customers.list({
          email: user.email!,
          limit: 1,
        })

        if (existingCustomers.data.length > 0) {
          customerId = existingCustomers.data[0].id
        } else {
          const newCustomer = await stripe.customers.create({
            email: user.email!,
            metadata: { userId: user.id },
          })
          customerId = newCustomer.id
        }

        await stripe.paymentMethods.attach(selectedFundingSource.stripePaymentId, {
          customer: customerId,
        })
      }

      const paymentIntent = await stripe.paymentIntents.create({
        amount: amountCents,
        currency: 'aud',
        customer: customerId,
        payment_method: selectedFundingSource.stripePaymentId,
        confirm: true,
        off_session: true,
        description: `Direct Debit Pass-Through: ${billerName}`,
      })

      stripeChargeId = paymentIntent.id
    } catch (stripeErr: unknown) {
      const err = stripeErr as Error
      status = 'DECLINED'
      failureReason = err.message
    }

    // Deduct from Rollover Ledger if balance exists
    let feeWaived = false
    if (status === 'SUCCESS' && dbUser) {
      if (dbUser.rolloverBalanceCents > 0) {
        feeWaived = true
        const newBalance = Math.max(0, dbUser.rolloverBalanceCents - amountCents)
        await prisma.user.update({
          where: { id: user.id },
          data: { rolloverBalanceCents: newBalance },
        })
      }
    }

    const transaction = await prisma.transaction.create({
      data: {
        userId: user.id,
        virtualAccountId: virtualAccount.id,
        fundingSourceId: selectedFundingSource.id,
        billerName,
        amountCents,
        status,
        feeWaived,
        stripeChargeId,
        failureReason,
      },
      include: {
        fundingSource: true,
      },
    })

    return NextResponse.json({
      success: status === 'SUCCESS',
      matchedRuleType,
      feeWaived,
      transaction,
    })
  } catch (err: unknown) {
    const error = err as Error
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}