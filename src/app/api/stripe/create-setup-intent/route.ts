import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getStripe, getOrCreateStripeCustomer } from '@/lib/stripe'

export async function POST() {
  try {
    const stripe = getStripe()

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

    const customerId = await getOrCreateStripeCustomer(stripe, user)

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