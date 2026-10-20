import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const CLIENT_REVISION = 'closed-beta-v1'
const revisionStore = globalThis as unknown as { __h8PrismaRevision?: string }
const existing = globalForPrisma.prisma
const clientIsStale =
  existing !== undefined &&
  (revisionStore.__h8PrismaRevision !== CLIENT_REVISION ||
    typeof (existing as { notification?: unknown }).notification === 'undefined')

if (existing && clientIsStale) {
  void existing.$disconnect()
}

export const prisma = !existing || clientIsStale ? new PrismaClient() : existing
revisionStore.__h8PrismaRevision = CLIENT_REVISION

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
