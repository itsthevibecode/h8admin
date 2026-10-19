import { TransactionStatus } from '@prisma/client'
import { prisma } from '@/lib/prisma'

export const MONTHLY_VOLUME_CAP_CENTS = 300_000
export const OVERAGE_RATE = 0.005
export const MAX_BASE_FEE_CENTS = 500
export const PER_TRANSACTION_BASE_CENTS = 100

export interface UserBillingMetrics {
  monthlyVolumeCents: number
  monthlyVolumeCapCents: number
  monthlyTxCount: number
  baseFeeCents: number
  rolloverBalanceCents: number
  overageVolumeCents: number
  overageFeeCents: number
  estimatedTotalMonthlyFeeCents: number
  cycleStartDate: string
  cycleEndDate: string
}

export function getBillingCycleBounds(now = new Date()) {
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
  return { startOfMonth, endOfMonth }
}

export async function calculateUserBillingMetrics(
  userId: string
): Promise<UserBillingMetrics> {
  const { startOfMonth, endOfMonth } = getBillingCycleBounds()

  const [user, volume] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { rolloverBalanceCents: true },
    }),
    prisma.transaction.aggregate({
      where: {
        userId,
        status: TransactionStatus.SUCCESS,
        createdAt: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
      _sum: { amountCents: true },
      _count: { _all: true },
    }),
  ])

  const rolloverBalanceCents = user?.rolloverBalanceCents ?? 0
  const monthlyVolumeCents = volume._sum.amountCents ?? 0
  const monthlyTxCount = volume._count._all
  const baseFeeCents = Math.min(
    MAX_BASE_FEE_CENTS,
    monthlyTxCount * PER_TRANSACTION_BASE_CENTS
  )
  const overageVolumeCents = Math.max(0, monthlyVolumeCents - MONTHLY_VOLUME_CAP_CENTS)
  const overageFeeCents =
    monthlyVolumeCents > MONTHLY_VOLUME_CAP_CENTS && rolloverBalanceCents <= 0
      ? Math.round(overageVolumeCents * OVERAGE_RATE)
      : 0

  return {
    monthlyVolumeCents,
    monthlyVolumeCapCents: MONTHLY_VOLUME_CAP_CENTS,
    monthlyTxCount,
    baseFeeCents,
    rolloverBalanceCents,
    overageVolumeCents,
    overageFeeCents,
    estimatedTotalMonthlyFeeCents: baseFeeCents + overageFeeCents,
    cycleStartDate: startOfMonth.toISOString(),
    cycleEndDate: endOfMonth.toISOString(),
  }
}
