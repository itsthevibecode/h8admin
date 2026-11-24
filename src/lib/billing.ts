import { TransactionStatus } from '@prisma/client'
import { prisma } from '@/lib/prisma'

export const MONTHLY_VOLUME_CAP_CENTS = 300_000
export const OVERAGE_RATE = 0.005
export const MAX_BASE_FEE_CENTS = 500
export const PER_TRANSACTION_BASE_CENTS = 100
export const BETA_COST_RATE = 0.003
export const BETA_GRADUATION_TARGET = 100

export type FeePlan = 'retail' | 'beta-cost' | 'beta-free'

const PLATFORM_STATE_ID = 'platform'

export async function betaCohortStatus() {
  const state = await prisma.platformState.upsert({
    where: { id: PLATFORM_STATE_ID },
    update: {},
    create: { id: PLATFORM_STATE_ID },
  })
  const nonBetaCount = await prisma.user.count({ where: { isBetaTester: false } })
  if (state.betaFreeUnlockedAt) {
    return { unlocked: true, nonBetaCount, unlockedAt: state.betaFreeUnlockedAt }
  }
  if (nonBetaCount >= BETA_GRADUATION_TARGET) {
    const unlocked = await prisma.platformState.update({
      where: { id: PLATFORM_STATE_ID },
      data: { betaFreeUnlockedAt: new Date() },
    })
    return { unlocked: true, nonBetaCount, unlockedAt: unlocked.betaFreeUnlockedAt }
  }
  return { unlocked: false, nonBetaCount, unlockedAt: null }
}

export async function quoteRoutingFee(userId: string, amountCents: number) {
  const [user, cohort] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { isBetaTester: true },
    }),
    betaCohortStatus(),
  ])
  if (user?.isBetaTester && cohort.unlocked) {
    return { feeCents: 0, basis: 'beta-free' as const }
  }
  if (user?.isBetaTester) {
    return { feeCents: Math.round(amountCents * BETA_COST_RATE), basis: 'beta-cost' as const }
  }
  return { feeCents: PER_TRANSACTION_BASE_CENTS, basis: 'retail' as const }
}

export interface UserBillingMetrics {
  monthlyVolumeCents: number
  monthlyVolumeCapCents: number
  monthlyTxCount: number
  baseFeeCents: number
  rolloverBalanceCents: number
  overageVolumeCents: number
  overageFeeCents: number
  estimatedTotalMonthlyFeeCents: number
  feePlan: FeePlan
  nonBetaCount: number
  betaGraduationTarget: number
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

  const [user, volume, cohort] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { rolloverBalanceCents: true, isBetaTester: true },
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
    betaCohortStatus(),
  ])

  const rolloverBalanceCents = user?.rolloverBalanceCents ?? 0
  const monthlyVolumeCents = volume._sum.amountCents ?? 0
  const monthlyTxCount = volume._count._all
  const betaTester = user?.isBetaTester ?? true
  const feePlan: FeePlan = !betaTester ? 'retail' : cohort.unlocked ? 'beta-free' : 'beta-cost'

  const baseFeeCents =
    feePlan === 'retail'
      ? Math.min(MAX_BASE_FEE_CENTS, monthlyTxCount * PER_TRANSACTION_BASE_CENTS)
      : 0
  const overageVolumeCents =
    feePlan === 'retail' ? Math.max(0, monthlyVolumeCents - MONTHLY_VOLUME_CAP_CENTS) : monthlyVolumeCents
  const overageFeeCents =
    feePlan === 'beta-free'
      ? 0
      : feePlan === 'beta-cost'
        ? Math.round(monthlyVolumeCents * BETA_COST_RATE)
        : monthlyVolumeCents > MONTHLY_VOLUME_CAP_CENTS && rolloverBalanceCents <= 0
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
    feePlan,
    nonBetaCount: cohort.nonBetaCount,
    betaGraduationTarget: BETA_GRADUATION_TARGET,
    cycleStartDate: startOfMonth.toISOString(),
    cycleEndDate: endOfMonth.toISOString(),
  }
}
