import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { NotificationType } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { getStripe } from '@/lib/stripe'

function formatInvoiceAmount(invoice: Stripe.Invoice) {
  const cents = invoice.amount_paid || invoice.amount_due || 0
  return (cents / 100).toLocaleString('en-AU', {
    style: 'currency',
    currency: (invoice.currency || 'aud').toUpperCase(),
  })
}

async function resolveUserFromInvoice(stripe: Stripe, invoice: Stripe.Invoice) {
  const customerId =
    typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id

  let email = invoice.customer_email
  let metadataUserId: string | undefined

  if (customerId) {
    const customer = await stripe.customers.retrieve(customerId)
    if (!customer.deleted) {
      email = customer.email || email
      metadataUserId = customer.metadata?.userId
    }
  }

  if (metadataUserId) {
    const byId = await prisma.user.findUnique({
      where: { id: metadataUserId },
      select: { id: true },
    })
    if (byId) return byId
  }

  if (email) {
    return prisma.user.findUnique({
      where: { email },
      select: { id: true },
    })
  }

  return null
}

export async function POST(req: Request) {
  const rawBody = await req.text()
  const signature = req.headers.get('stripe-signature')
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  let event: Stripe.Event
  try {
    const stripe = getStripe()
    if (!webhookSecret) {
      if (process.env.NODE_ENV === 'development') {
        event = JSON.parse(rawBody) as Stripe.Event
      } else {
        return NextResponse.json({ error: 'Webhook secret missing' }, { status: 500 })
      }
    } else {
      if (!signature) {
        return NextResponse.json({ error: 'Missing Stripe signature' }, { status: 400 })
      }
      event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret)
    }

    if (
      event.type !== 'invoice.payment_succeeded' &&
      event.type !== 'invoice.payment_failed'
    ) {
      return NextResponse.json({ received: true, ignored: event.type })
    }

    const invoice = event.data.object as Stripe.Invoice
    const user = await resolveUserFromInvoice(stripe, invoice)
    if (!user) {
      return NextResponse.json({ received: true, unmatched: true })
    }

    const amountLabel = formatInvoiceAmount(invoice)
    const invoiceRef = invoice.number || invoice.id

    if (event.type === 'invoice.payment_succeeded') {
      await prisma.notification.create({
        data: {
          userId: user.id,
          type: NotificationType.SYSTEM,
          isRead: false,
          link: '/billing',
          title: 'Invoice settled',
          message: `H8Admin billed ${amountLabel} (${invoiceRef}). Your monthly routing subscription is current.`,
        },
      })
    } else {
      await prisma.notification.create({
        data: {
          userId: user.id,
          type: NotificationType.TRANSACTION_FAILED,
          isRead: false,
          link: '/billing',
          title: 'Invoice payment failed',
          message: `We could not collect ${amountLabel} for invoice ${invoiceRef}. Update your payment method in Billing to keep routing active.`,
        },
      })
    }

    return NextResponse.json({ received: true })
  } catch (err: unknown) {
    const error = err as Error
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
