import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  digitsOnly,
  isHandledBaasEvent,
  parseBaasDebitPayload,
  verifyBaasSignature,
} from '@/lib/baas'
import { settleInboundDebit } from '@/lib/debit-settlement'

const MIN_CENTS = 1
const MAX_CENTS = 5_000_000

export async function POST(req: Request) {
  const rawBody = await req.text()
  const signature =
    req.headers.get('x-baas-signature') || req.headers.get('x-zepto-signature')

  const verified = verifyBaasSignature(
    rawBody,
    signature,
    process.env.BAAS_WEBHOOK_SECRET
  )

  if (!verified) {
    return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 })
  }

  let parsedJson: unknown
  try {
    parsedJson = JSON.parse(rawBody) as unknown
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 })
  }

  const payload = parseBaasDebitPayload(parsedJson)
  if (!payload) {
    return NextResponse.json({ error: 'Invalid debit payload' }, { status: 400 })
  }

  if (!isHandledBaasEvent(payload.eventType)) {
    return NextResponse.json({ ignored: true, eventType: payload.eventType })
  }

  const amountCents = Math.round(payload.amountCents)
  if (!Number.isFinite(amountCents) || amountCents < MIN_CENTS || amountCents > MAX_CENTS) {
    return NextResponse.json(
      { action: 'REJECT', returnCode: 'AM04', reason: 'Amount must be between $0.01 and $50,000' },
      { status: 200 }
    )
  }

  const accountDigits = digitsOnly(payload.accountNumber)
  const bsbDigits = digitsOnly(payload.bsb)
  if (!bsbDigits.startsWith('802') || !accountDigits) {
    return NextResponse.json(
      { action: 'REJECT', returnCode: 'AM04', reason: 'Unknown BSB or account' },
      { status: 200 }
    )
  }

  try {
    const virtualAccounts = await prisma.virtualAccount.findMany({
      where: {
        OR: [{ accountNumber: payload.accountNumber }, { accountNumber: accountDigits }],
      },
      include: {
        user: { select: { id: true, email: true } },
        household: {
          include: {
            members: {
              where: { role: 'OWNER' },
              include: { user: { select: { id: true, email: true } } },
              take: 1,
            },
          },
        },
      },
    })

    const virtualAccount = virtualAccounts.find((account) => {
      const storedBsb = digitsOnly(account.bsb)
      const storedNumber = digitsOnly(account.accountNumber)
      return storedBsb.startsWith('802') && storedNumber === accountDigits
    })

    if (!virtualAccount) {
      return NextResponse.json(
        { action: 'REJECT', returnCode: 'AM04', reason: 'Virtual account not found' },
        { status: 200 }
      )
    }

    const owner =
      virtualAccount.user ||
      virtualAccount.household?.members[0]?.user ||
      null

    if (!owner) {
      return NextResponse.json(
        { action: 'REJECT', returnCode: 'AM04', reason: 'Account has no owner' },
        { status: 200 }
      )
    }

    const settlement = await settleInboundDebit({
      userId: owner.id,
      userEmail: owner.email,
      virtualAccountId: virtualAccount.id,
      billerName: payload.billerName,
      amountCents,
      idempotencyKey: payload.eventId,
    })

    if (settlement.action === 'ACCEPT') {
      return NextResponse.json({
        action: 'ACCEPT',
        transactionId: settlement.transactionId,
        stripeChargeId: settlement.stripeChargeId,
      })
    }

    return NextResponse.json({
      action: 'REJECT',
      reason: settlement.reason,
      returnCode: 'AM04',
    })
  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error('Webhook processing failed')
    console.error('[baas] webhook error:', error.message)
    return NextResponse.json(
      { action: 'REJECT', reason: error.message, returnCode: 'AM04' },
      { status: 200 }
    )
  }
}
