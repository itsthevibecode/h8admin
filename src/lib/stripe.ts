import Stripe from 'stripe'

export function getStripe() {
  const stripeKey = process.env.STRIPE_SECRET_KEY
  if (!stripeKey) {
    throw new Error('STRIPE_SECRET_KEY is missing in environment variables')
  }
  return new Stripe(stripeKey)
}

export async function getOrCreateStripeCustomer(
  stripe: Stripe,
  user: { id: string; email?: string | null }
) {
  const existingCustomers = await stripe.customers.list({
    email: user.email || undefined,
    limit: 1,
  })

  if (existingCustomers.data[0]?.id) {
    return existingCustomers.data[0].id
  }

  const created = await stripe.customers.create({
    email: user.email || undefined,
    metadata: { userId: user.id },
  })

  return created.id
}

export async function retrieveOwnedPaymentMethod(
  stripe: Stripe,
  paymentMethodId: string,
  user: { id: string; email?: string | null }
) {
  const customerId = await getOrCreateStripeCustomer(stripe, user)
  const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId)
  const attachedCustomerId =
    typeof paymentMethod.customer === 'string'
      ? paymentMethod.customer
      : paymentMethod.customer?.id

  if (attachedCustomerId && attachedCustomerId !== customerId) {
    const error = new Error('Payment method does not belong to this account') as Error & {
      status: number
    }
    error.status = 403
    throw error
  }

  if (!attachedCustomerId) {
    await stripe.paymentMethods.attach(paymentMethodId, { customer: customerId })
  }

  return paymentMethod
}
