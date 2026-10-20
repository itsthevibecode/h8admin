import Stripe from 'stripe'
import { prisma } from '@/lib/prisma'
import { legalName } from '@/lib/legal-name'

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
  const record = await prisma.user.findUnique({
    where: { id: user.id },
    select: { firstName: true, lastName: true },
  })
  const name = record ? legalName(record) : undefined
  const existingCustomers = await stripe.customers.list({
    email: user.email || undefined,
    limit: 1,
  })

  const existing = existingCustomers.data[0]
  if (existing?.id) {
    if (name && existing.name !== name) {
      await stripe.customers.update(existing.id, { name })
    }
    return existing.id
  }

  const created = await stripe.customers.create({
    email: user.email || undefined,
    name,
    metadata: { userId: user.id },
  })

  return created.id
}

export async function syncStripeCustomerName(email: string, name: string) {
  const stripe = getStripe()
  const existing = await stripe.customers.list({ email, limit: 1 })
  const customer = existing.data[0]
  if (!customer || customer.name === name) return
  await stripe.customers.update(customer.id, { name })
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
