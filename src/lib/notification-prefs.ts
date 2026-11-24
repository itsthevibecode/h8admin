import { prisma } from '@/lib/prisma'

export type NoticeKind = 'debits' | 'billing' | 'rewards'

export async function allowsNotification(userId: string, kind: NoticeKind) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { notifyDebits: true, notifyBilling: true, notifyRewards: true },
  })
  if (!user) return false
  if (kind === 'debits') return user.notifyDebits
  if (kind === 'billing') return user.notifyBilling
  return user.notifyRewards
}
