import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'

async function getUser() {
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
  return user
}

export async function POST(req: Request) {
  const user = await getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = (await req.json()) as {
      preferredId?: string
      backupId?: string | null
      virtualAccountId?: string
    }
    const preferredId = body.preferredId
    const virtualAccountId = body.virtualAccountId
    if (!preferredId) {
      return NextResponse.json({ error: 'Choose a preferred payment method' }, { status: 400 })
    }
    if (!virtualAccountId) {
      return NextResponse.json({ error: 'Choose which direct debit this flow pays' }, { status: 400 })
    }

    const account = await prisma.virtualAccount.findFirst({
      where: { id: virtualAccountId, userId: user.id },
      select: { id: true, accountType: true },
    })
    if (!account) {
      return NextResponse.json({ error: 'That direct debit was not found' }, { status: 404 })
    }

    const sources = await prisma.fundingSource.findMany({
      where: { userId: user.id, isCancelled: false },
      select: { id: true },
    })
    const ids = new Set(sources.map((source) => source.id))
    if (!ids.has(preferredId)) {
      return NextResponse.json({ error: 'Preferred payment method was not found' }, { status: 404 })
    }
    const backupId = body.backupId || null
    if (backupId && !ids.has(backupId)) {
      return NextResponse.json({ error: 'Backup payment method was not found' }, { status: 404 })
    }
    if (backupId && backupId === preferredId) {
      return NextResponse.json(
        { error: 'The backup has to be a different card or direct debit' },
        { status: 400 }
      )
    }

    await prisma.$transaction(async (tx) => {
      if (account.accountType === 'INDIVIDUAL') {
        await tx.fundingSource.updateMany({
          where: { userId: user.id, isCancelled: false },
          data: { isDefault: false },
        })
        await tx.fundingSource.update({
          where: { id: preferredId },
          data: { isDefault: true },
        })
      }
      await tx.routingRule.deleteMany({
        where: {
          userId: user.id,
          virtualAccountId: account.id,
          ruleType: 'DEFAULT',
          billerName: { in: ['PREFERRED', 'BACKUP'] },
        },
      })
      if (account.accountType === 'INDIVIDUAL') {
        await tx.routingRule.deleteMany({
          where: {
            userId: user.id,
            virtualAccountId: null,
            ruleType: 'DEFAULT',
            billerName: { in: ['PREFERRED', 'BACKUP'] },
          },
        })
      }
      await tx.routingRule.create({
        data: {
          userId: user.id,
          virtualAccountId: account.id,
          fundingSourceId: preferredId,
          ruleType: 'DEFAULT',
          billerName: 'PREFERRED',
          priority: 1,
          isActive: true,
        },
      })
      if (backupId) {
        await tx.routingRule.create({
          data: {
            userId: user.id,
            virtualAccountId: account.id,
            fundingSourceId: backupId,
            ruleType: 'DEFAULT',
            billerName: 'BACKUP',
            priority: 99,
            isActive: true,
          },
        })
      }
    })

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    const error = err as Error
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
