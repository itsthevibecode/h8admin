import { randomInt } from 'crypto'
import type { Prisma, PrismaClient } from '@prisma/client'
import { prisma } from '@/lib/prisma'

const REFERRAL_ACTIVATION_CODE = 'REFERRAL_ACTIVATION'
export const REFERRAL_CREDIT_CENTS = 100_000

type ReferralDb = PrismaClient | Prisma.TransactionClient

export async function creditReferrerOnce(db: ReferralDb, referredUserId: string) {
  const referred = await db.user.findUnique({
    where: { id: referredUserId },
    select: { referredById: true },
  })
  if (!referred?.referredById) return false

  const already = await db.promoRedemption.findUnique({
    where: {
      userId_promoCode: {
        userId: referredUserId,
        promoCode: REFERRAL_ACTIVATION_CODE,
      },
    },
    select: { id: true },
  })
  if (already) return false

  await db.promoRedemption.create({
    data: {
      userId: referredUserId,
      promoCode: REFERRAL_ACTIVATION_CODE,
    },
  })
  await db.user.update({
    where: { id: referred.referredById },
    data: { rolloverBalanceCents: { increment: REFERRAL_CREDIT_CENTS } },
  })
  return true
}

const REFERRAL_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const SHORT_REFERRAL_CODE_LENGTH = 6

export function generateShortReferralCode(): string {
  let code = ''
  for (let i = 0; i < SHORT_REFERRAL_CODE_LENGTH; i++) {
    code += REFERRAL_CODE_ALPHABET[randomInt(REFERRAL_CODE_ALPHABET.length)]
  }
  return code
}

export function needsShortReferralCode(code?: string | null): boolean {
  return !code || code.length > 10
}

export async function allocateUniqueReferralCode(): Promise<string> {
  for (let attempt = 0; attempt < 20; attempt++) {
    const code = generateShortReferralCode()
    const clash = await prisma.user.findUnique({
      where: { referralCode: code },
      select: { id: true },
    })
    if (!clash) return code
  }
  throw new Error('Unable to generate a unique referral code')
}
