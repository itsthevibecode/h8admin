import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { calculateUserBillingMetrics } from '@/lib/billing'
import { getOrCreateStripeCustomer, getStripe } from '@/lib/stripe'

async function getAuthenticatedUser() {
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

export async function GET() {
  const user = await getAuthenticatedUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const [metrics, recentTransactions] = await Promise.all([
      calculateUserBillingMetrics(user.id),
      prisma.transaction.findMany({
        where: { userId: user.id },
        select: {
          id: true,
          billerName: true,
          amountCents: true,
          feeWaived: true,
          status: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
    ])

    return NextResponse.json({
      metrics,
      recentTransactions: recentTransactions.map((tx) => ({
        ...tx,
        createdAt: tx.createdAt.toISOString(),
      })),
    })
  } catch (err: unknown) {
    const error = err as Error
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const user = await getAuthenticatedUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!user.email) {
    return NextResponse.json({ error: 'Account email is required for billing' }, { status: 400 })
  }

  try {
    const stripe = getStripe()
    const customerId = await getOrCreateStripeCustomer(stripe, {
      id: user.id,
      email: user.email,
    })

    const origin =
      req.headers.get('origin') ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      'http://localhost:3000'

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${origin.replace(/\/$/, '')}/billing`,
    })

    if (!portalSession.url) {
      return NextResponse.json(
        { error: 'Stripe portal session did not return a URL' },
        { status: 502 }
      )
    }

    return NextResponse.json({ url: portalSession.url })
  } catch (err: unknown) {
    const error = err as Error
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
