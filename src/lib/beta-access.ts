import { prisma } from '@/lib/prisma'

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

export async function isAllowlisted(email: string) {
  const row = await prisma.betaAllowlist.findUnique({
    where: { email: normalizeEmail(email) },
    select: { id: true },
  })
  return Boolean(row)
}
