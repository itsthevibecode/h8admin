import { NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { getOrCreateStripeCustomer, getStripe } from '@/lib/stripe'
import { creditReferrerOnce } from '@/lib/referral'

const DIRECT_DEBIT_BRAND = 'DIRECT DEBIT'

async function getUser() {
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
  return user
}

function clientIp(req: Request) {
  const forwarded = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  const realIp = req.headers.get('x-real-ip')?.trim()
  const candidate = forwarded || realIp
  if (candidate && candidate !== '::1') return candidate
  return '127.0.0.1'
}

export async function POST(req: Request) {
  const user = await getUser()
  if (!user || !user.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = (await req.json()) as {
      accountName?: string
      bsb?: string
      accountNumber?: string
      setAsDefault?: boolean
      agreed?: boolean
    }

    if (!body.agreed) {
      return NextResponse.json({ error: 'Direct debit authority is required' }, { status: 400 })
    }

    const accountName = body.accountName?.trim() ?? ''
    const bsb = (body.bsb ?? '').replace(/\D/g, '')
    const accountNumber = (body.accountNumber ?? '').replace(/\D/g, '')

    if (accountName.length < 2 || accountName.length > 80) {
      return NextResponse.json({ error: 'Enter the account name' }, { status: 400 })
    }
    if (!/^\d{6}$/.test(bsb)) {
      return NextResponse.json({ error: 'BSB must be 6 digits' }, { status: 400 })
    }
    if (!/^\d{5,10}$/.test(accountNumber)) {
      return NextResponse.json({ error: 'Account number looks invalid' }, { status: 400 })
    }

    const stripe = getStripe()
    const customerId = await getOrCreateStripeCustomer(stripe, user)
    const paymentMethod = await stripe.paymentMethods.create({
      type: 'au_becs_debit',
      au_becs_debit: {
        bsb_number: bsb,
        account_number: accountNumber,
      },
      billing_details: {
        name: accountName,
        email: user.email,
      },
    })

    const setupIntent = await stripe.setupIntents.create(
      {
        customer: customerId,
        payment_method: paymentMethod.id,
        payment_method_types: ['au_becs_debit'],
        confirm: true,
        usage: 'off_session',
        mandate_data: {
          customer_acceptance: {
            type: 'online',
            online: {
              ip_address: clientIp(req),
              user_agent: req.headers.get('user-agent') || 'H8Admin',
            },
          },
        },
      } as Stripe.SetupIntentCreateParams,
      { apiVersion: '2024-06-20' }
    )

    if (setupIntent.status !== 'succeeded' && setupIntent.status !== 'processing') {
      return NextResponse.json(
        {
          error:
            'The bank account was not accepted for future debits. Check the BSB and account number, or use a credit card.',
        },
        { status: 400 }
      )
    }

    const last4 = paymentMethod.au_becs_debit?.last4 || accountNumber.slice(-4)
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

    const activeCount = await prisma.fundingSource.count({
      where: { userId: user.id, isCancelled: false },
    })
    const lifetimeCount = await prisma.fundingSource.count({
      where: { userId: user.id },
    })
    const makeDefault = body.setAsDefault === true || activeCount === 0
    if (makeDefault) {
      await prisma.fundingSource.updateMany({
        where: { userId: user.id, isCancelled: false },
        data: { isDefault: false },
      })
    }

    const source = await prisma.fundingSource.create({
      data: {
        userId: user.id,
        virtualAccountId: virtualAccount.id,
        stripePaymentId: paymentMethod.id,
        brand: DIRECT_DEBIT_BRAND,
        last4,
        nickname: accountName,
        bankGroup: 'Bank account',
        cardName: 'Direct debit',
        isDefault: makeDefault,
      },
    })

    if (lifetimeCount === 0) {
      await creditReferrerOnce(prisma, user.id)
    }

    return NextResponse.json({ success: true, id: source.id, last4 })
  } catch (err: unknown) {
    const error = err as Error
    return NextResponse.json(
      { error: error.message || 'Could not save this bank account' },
      { status: 500 }
    )
  }
}

export async function DELETE(req: Request) {
  const user = await getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = (await req.json()) as { id?: string }
    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    const source = await prisma.fundingSource.findFirst({
      where: { id, userId: user.id, brand: DIRECT_DEBIT_BRAND, isCancelled: false },
    })
    if (!source) {
      return NextResponse.json({ error: 'Direct debit not found' }, { status: 404 })
    }

    await prisma.fundingSource.update({
      where: { id: source.id },
      data: { isCancelled: true, isDefault: false },
    })

    if (source.isDefault) {
      const next = await prisma.fundingSource.findFirst({
        where: { userId: user.id, isCancelled: false },
        orderBy: { createdAt: 'asc' },
      })
      if (next) {
        await prisma.fundingSource.update({
          where: { id: next.id },
          data: { isDefault: true },
        })
      }
    }

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    const error = err as Error
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
