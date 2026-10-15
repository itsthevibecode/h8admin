import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const existing = globalForPrisma.prisma
const clientIsStale =
  existing !== undefined &&
  typeof (existing as { notification?: unknown }).notification === 'undefined'

export const prisma = !existing || clientIsStale ? new PrismaClient() : existing

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
