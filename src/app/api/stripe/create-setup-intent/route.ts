import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function POST() {
  try {
    const stripeKey = process.env.STRIPE_SECRET_KEY
    if (!stripeKey) {
      return NextResponse.json(
        { error: 'STRIPE_SECRET_KEY is missing in environment variables' },
        { status: 500 }
      )
    }

    const stripe = new Stripe(stripeKey)

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

    // 1. Find or create a Stripe Customer for off-session card reuse
    const existingCustomers = await stripe.customers.list({
      email: user.email,
      limit: 1,
    })

    let customerId = existingCustomers.data[0]?.id

    if (!customerId) {
      const newCustomer = await stripe.customers.create({
        email: user.email,
        metadata: { userId: user.id },
      })
      customerId = newCustomer.id
    }

    // 2. Pass customer ID to SetupIntent so Stripe vaults the card under this Customer
    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      automatic_payment_methods: { enabled: true },
      metadata: { userId: user.id },
    })

    return NextResponse.json({ clientSecret: setupIntent.client_secret })
  } catch (err: unknown) {
    const error = err as Error
    console.error('Stripe SetupIntent Route Error:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}