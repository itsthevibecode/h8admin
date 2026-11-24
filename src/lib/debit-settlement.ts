import { NotificationType, TransactionStatus, type FundingSource } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { getOrCreateStripeCustomer, getStripe } from '@/lib/stripe'
import { resolveFundingSource } from '@/lib/routing-engine'
import { allowsNotification } from '@/lib/notification-prefs'
import { quoteRoutingFee } from '@/lib/billing'

export type DebitSettlementResult = {
  action: 'ACCEPT' | 'REJECT'
  returnCode?: 'AM04'
  reason?: string
  transactionId: string | null
  stripeChargeId: string | null
  feeWaived: boolean
  matchedRuleType: string
  transaction: {
    id: string
    billerName: string
    amountCents: number
    status: TransactionStatus
    failureReason: string | null
    fundingSource: { brand: string; last4: string } | null
  } | null
}

async function createReceiptNotification(
  userId: string,
  type: typeof NotificationType.TRANSACTION_SUCCESS | typeof NotificationType.TRANSACTION_FAILED,
  billerName: string,
  amountCents: number,
  extra?: string
) {
  if (!(await allowsNotification(userId, 'debits'))) return
  const dollars = (amountCents / 100).toFixed(2)
  await prisma.notification.create({
    data: {
      userId,
      type,
      isRead: false,
      link: '/',
      title:
        type === NotificationType.TRANSACTION_SUCCESS
          ? 'Direct debit received'
          : 'Direct debit declined',
      message:
        type === NotificationType.TRANSACTION_SUCCESS
          ? `$${dollars} from ${billerName} was routed through your Virtual BSB.`
          : `$${dollars} from ${billerName} was declined.${extra ? ` ${extra}` : ''}`,
    },
  })
}

async function chargeFundingSource(
  fundingSource: FundingSource,
  input: {
    userId: string
    userEmail?: string | null
    billerName: string
    amountCents: number
    idempotencyKey?: string
  },
  isBackup = false
): Promise<{
  status: TransactionStatus
  stripeChargeId: string | null
  failureReason: string | null
}> {
  try {
    const stripe = getStripe()
    const paymentMethod = await stripe.paymentMethods.retrieve(fundingSource.stripePaymentId)
    let customerId =
      typeof paymentMethod.customer === 'string'
        ? paymentMethod.customer
        : paymentMethod.customer?.id

    if (!customerId) {
      customerId = await getOrCreateStripeCustomer(stripe, {
        id: input.userId,
        email: input.userEmail,
      })
      await stripe.paymentMethods.attach(fundingSource.stripePaymentId, {
        customer: customerId,
      })
    }

    const paymentIntent = await stripe.paymentIntents.create(
      {
        amount: input.amountCents,
        currency: 'aud',
        customer: customerId,
        payment_method: fundingSource.stripePaymentId,
        confirm: true,
        off_session: true,
        description: `Direct Debit Pass-Through: ${input.billerName}`,
      },
      input.idempotencyKey
        ? { idempotencyKey: `baas-${input.idempotencyKey}${isBackup ? '-backup' : ''}` }
        : undefined
    )
    return { status: TransactionStatus.SUCCESS, stripeChargeId: paymentIntent.id, failureReason: null }
  } catch (stripeErr: unknown) {
    return {
      status: TransactionStatus.DECLINED,
      stripeChargeId: null,
      failureReason: stripeErr instanceof Error ? stripeErr.message : 'Stripe charge failed',
    }
  }
}

async function logTransaction(input: {
  userId: string
  virtualAccountId: string
  fundingSourceId: string | null
  billerName: string
  amountCents: number
  status: TransactionStatus
  feeWaived: boolean
  stripeChargeId: string | null
  failureReason: string | null
}) {
  return prisma.transaction.create({
    data: input,
    include: {
      fundingSource: { select: { brand: true, last4: true } },
    },
  })
}

export async function settleInboundDebit(input: {
  userId: string
  userEmail?: string | null
  virtualAccountId: string
  billerName: string
  amountCents: number
  idempotencyKey?: string
}): Promise<DebitSettlementResult> {
  const routing = await resolveFundingSource(
    input.userId,
    input.virtualAccountId,
    input.billerName
  )

  if (!routing.fundingSource) {
    const declined = await logTransaction({
      userId: input.userId,
      virtualAccountId: input.virtualAccountId,
      fundingSourceId: null,
      billerName: input.billerName,
      amountCents: input.amountCents,
      status: TransactionStatus.DECLINED,
      feeWaived: false,
      stripeChargeId: null,
      failureReason: 'No active funding source',
    })
    await createReceiptNotification(
      input.userId,
      NotificationType.TRANSACTION_FAILED,
      input.billerName,
      input.amountCents,
      'No active funding source.'
    )
    return {
      action: 'REJECT',
      returnCode: 'AM04',
      reason: 'No active funding source',
      transactionId: declined.id,
      stripeChargeId: null,
      feeWaived: false,
      matchedRuleType: routing.resolutionReason,
      transaction: declined,
    }
  }

  const [preferredRule, accountBackup, sharedBackup] = await Promise.all([
    prisma.routingRule.findFirst({
      where: {
        userId: input.userId,
        virtualAccountId: input.virtualAccountId,
        isActive: true,
        ruleType: 'DEFAULT',
        billerName: 'PREFERRED',
        fundingSource: { isCancelled: false },
      },
      include: { fundingSource: true },
    }),
    prisma.routingRule.findFirst({
      where: {
        userId: input.userId,
        virtualAccountId: input.virtualAccountId,
        isActive: true,
        ruleType: 'DEFAULT',
        billerName: 'BACKUP',
        fundingSource: { isCancelled: false },
      },
      include: { fundingSource: true },
    }),
    prisma.routingRule.findFirst({
      where: {
        userId: input.userId,
        virtualAccountId: null,
        isActive: true,
        ruleType: 'DEFAULT',
        billerName: 'BACKUP',
        fundingSource: { isCancelled: false },
      },
      include: { fundingSource: true },
    }),
  ])
  const backupRule = accountBackup ?? sharedBackup

  let fundingSource: FundingSource = preferredRule?.fundingSource ?? routing.fundingSource
  let charge = await chargeFundingSource(fundingSource, input)
  if (charge.status !== TransactionStatus.SUCCESS && backupRule && backupRule.fundingSourceId !== fundingSource.id) {
    const backupCharge = await chargeFundingSource(backupRule.fundingSource, input, true)
    if (backupCharge.status === TransactionStatus.SUCCESS) {
      fundingSource = backupRule.fundingSource
      charge = backupCharge
    } else {
      charge = {
        status: TransactionStatus.DECLINED,
        stripeChargeId: null,
        failureReason: `Preferred declined (${charge.failureReason}). Backup declined (${backupCharge.failureReason}).`,
      }
    }
  }
  const { status, stripeChargeId, failureReason } = charge

  let feeWaived = false
  if (status === TransactionStatus.SUCCESS) {
    const quote = await quoteRoutingFee(input.userId, input.amountCents)
    if (quote.basis === 'beta-free') {
      feeWaived = true
    } else if (quote.basis === 'beta-cost') {
      feeWaived = false
    } else {
      const deducted = await prisma.user.updateMany({
        where: {
          id: input.userId,
          rolloverBalanceCents: { gte: input.amountCents },
        },
        data: {
          rolloverBalanceCents: { decrement: input.amountCents },
        },
      })
      feeWaived = deducted.count === 1
    }
  }

  const transaction = await logTransaction({
    userId: input.userId,
    virtualAccountId: input.virtualAccountId,
    fundingSourceId: fundingSource.id,
    billerName: input.billerName,
    amountCents: input.amountCents,
    status,
    feeWaived,
    stripeChargeId,
    failureReason,
  })

  if (status === TransactionStatus.SUCCESS) {
    await createReceiptNotification(
      input.userId,
      NotificationType.TRANSACTION_SUCCESS,
      input.billerName,
      input.amountCents
    )
    return {
      action: 'ACCEPT',
      transactionId: transaction.id,
      stripeChargeId,
      feeWaived,
      matchedRuleType: routing.resolutionReason,
      transaction,
    }
  }

  await createReceiptNotification(
    input.userId,
    NotificationType.TRANSACTION_FAILED,
    input.billerName,
    input.amountCents,
    failureReason || undefined
  )

  return {
    action: 'REJECT',
    returnCode: 'AM04',
    reason: failureReason || 'Charge declined',
    transactionId: transaction.id,
    stripeChargeId: null,
    feeWaived: false,
    matchedRuleType: routing.resolutionReason,
    transaction,
  }
}
