import { randomInt } from 'crypto'
import { prisma } from '@/lib/prisma'

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
