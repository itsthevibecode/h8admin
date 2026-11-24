import { RuleType, type FundingSource, type RoutingRule } from '@prisma/client'
import { prisma } from '@/lib/prisma'

export type RoutingResolution = {
  fundingSource: FundingSource | null
  matchedRule: RoutingRule | null
  resolutionReason: string
}

export async function resolveFundingSource(
  userId: string,
  virtualAccountId: string,
  billerName: string
): Promise<RoutingResolution> {
  const now = new Date()
  const normalizedBiller = billerName.toLowerCase().trim()

  const overrides = await prisma.routingRule.findMany({
    where: {
      userId,
      isActive: true,
      ruleType: RuleType.BILLER_OVERRIDE,
      fundingSource: { isCancelled: false },
      OR: [{ virtualAccountId }, { virtualAccountId: null }],
      AND: [{ OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] }],
    },
    include: { fundingSource: true },
    orderBy: { priority: 'asc' },
  })

  const matchingOverride = overrides.find(
    (rule) => rule.billerName && rule.billerName.toLowerCase().trim() === normalizedBiller
  )

  if (matchingOverride && !matchingOverride.fundingSource.isCancelled) {
    return {
      fundingSource: matchingOverride.fundingSource,
      matchedRule: matchingOverride,
      resolutionReason: `BILLER_OVERRIDE (${matchingOverride.billerName})`,
    }
  }

  const defaultCard = await prisma.fundingSource.findFirst({
    where: {
      userId,
      isCancelled: false,
      isDefault: true,
    },
    orderBy: { createdAt: 'desc' },
  })

  if (defaultCard) {
    return {
      fundingSource: defaultCard,
      matchedRule: null,
      resolutionReason: 'DEFAULT',
    }
  }

  const churnCard = await prisma.fundingSource.findFirst({
    where: {
      userId,
      isCancelled: false,
      bonusDeadline: { gt: now },
      OR: [{ virtualAccountId }, { virtualAccountId: null }],
    },
    orderBy: { bonusDeadline: 'asc' },
  })

  if (churnCard) {
    return {
      fundingSource: churnCard,
      matchedRule: null,
      resolutionReason: 'CHURN_TIMER',
    }
  }

  const latestCard = await prisma.fundingSource.findFirst({
    where: {
      userId,
      isCancelled: false,
    },
    orderBy: { createdAt: 'desc' },
  })

  if (latestCard) {
    return {
      fundingSource: latestCard,
      matchedRule: null,
      resolutionReason: 'LATEST_ACTIVE',
    }
  }

  return {
    fundingSource: null,
    matchedRule: null,
    resolutionReason: 'NO_FUNDING_SOURCE',
  }
}
