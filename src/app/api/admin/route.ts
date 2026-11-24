import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { TransactionStatus } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { betaCohortStatus, BETA_GRADUATION_TARGET } from '@/lib/billing'
import { normalizeEmail } from '@/lib/beta-access'

async function requireAdmin() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
      },
    }
  )
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null
  const row = await prisma.user.findUnique({
    where: { id: user.id },
    select: { isAdmin: true },
  })
  return row?.isAdmin ? user : null
}

function monthRange() {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
  return { start, end }
}

export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  const { start, end } = monthRange()
  const [users, betaTesters, cohort, allowlist, volume, successCount, declinedCount, feed] =
    await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isBetaTester: true } }),
      betaCohortStatus(),
      prisma.betaAllowlist.findMany({ orderBy: { createdAt: 'desc' } }),
      prisma.transaction.aggregate({
        where: { status: TransactionStatus.SUCCESS, createdAt: { gte: start, lte: end } },
        _sum: { amountCents: true },
      }),
      prisma.transaction.count({
        where: { status: TransactionStatus.SUCCESS, createdAt: { gte: start, lte: end } },
      }),
      prisma.transaction.count({
        where: {
          status: { in: [TransactionStatus.DECLINED, TransactionStatus.FAILED] },
          createdAt: { gte: start, lte: end },
        },
      }),
      prisma.transaction.findMany({
        orderBy: { createdAt: 'desc' },
        take: 40,
        include: { user: { select: { email: true } } },
      }),
    ])

  return NextResponse.json({
    users,
    betaTesters,
    nonBetaCount: cohort.nonBetaCount,
    betaGraduationTarget: BETA_GRADUATION_TARGET,
    betaFreeUnlocked: cohort.unlocked,
    betaFreeUnlockedAt: cohort.unlockedAt,
    monthVolumeCents: volume._sum.amountCents ?? 0,
    successCount,
    declinedCount,
    allowlist,
    feed: feed.map((row) => ({
      id: row.id,
      email: row.user.email,
      billerName: row.billerName,
      amountCents: row.amountCents,
      status: row.status,
      feeWaived: row.feeWaived,
      createdAt: row.createdAt,
    })),
  })
}

export async function POST(req: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  const body = (await req.json().catch(() => null)) as { email?: string; notes?: string } | null
  const email = typeof body?.email === 'string' ? normalizeEmail(body.email) : ''
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 })
  }
  const notes = typeof body?.notes === 'string' ? body.notes.trim().slice(0, 200) : ''
  await prisma.betaAllowlist.upsert({
    where: { email },
    update: { notes: notes || null },
    create: { email, notes: notes || null },
  })
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  const body = (await req.json().catch(() => null)) as { email?: string } | null
  const email = typeof body?.email === 'string' ? normalizeEmail(body.email) : ''
  if (!email) {
    return NextResponse.json({ error: 'Email is required.' }, { status: 400 })
  }
  await prisma.betaAllowlist.deleteMany({ where: { email } })
  return NextResponse.json({ ok: true })
}
