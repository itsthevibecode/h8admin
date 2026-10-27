import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'

const fundingSourceSelect = {
  id: true,
  brand: true,
  last4: true,
  nickname: true,
} as const

async function requireUser() {
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

function cleanBillerName(value: unknown) {
  if (typeof value !== 'string') return ''
  return value
    .replace(/[^\p{L}\p{N}&'’.\- ]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 80)
}

export async function GET() {
  const user = await requireUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const rules = await prisma.routingRule.findMany({
    where: { userId: user.id, ruleType: 'BILLER_OVERRIDE' },
    include: { fundingSource: { select: fundingSourceSelect } },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ rules })
}

export async function POST(req: Request) {
  const user = await requireUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = (await req.json().catch(() => null)) as {
    billerName?: unknown
    fundingSourceId?: unknown
    virtualAccountId?: unknown
  } | null

  const billerName = cleanBillerName(body?.billerName)
  const fundingSourceId = typeof body?.fundingSourceId === 'string' ? body.fundingSourceId : ''
  if (!billerName || !fundingSourceId) {
    return NextResponse.json({ error: 'Biller name and card are required.' }, { status: 400 })
  }

  const fundingSource = await prisma.fundingSource.findFirst({
    where: { id: fundingSourceId, userId: user.id, isCancelled: false },
    select: { id: true },
  })
  if (!fundingSource) {
    return NextResponse.json({ error: 'That card is not on this account.' }, { status: 404 })
  }

  let virtualAccountId: string | null = null
  if (typeof body?.virtualAccountId === 'string' && body.virtualAccountId) {
    const account = await prisma.virtualAccount.findFirst({
      where: { id: body.virtualAccountId, userId: user.id },
      select: { id: true },
    })
    if (!account) {
      return NextResponse.json({ error: 'That account is not on this profile.' }, { status: 404 })
    }
    virtualAccountId = account.id
  }

  const rule = await prisma.routingRule.create({
    data: {
      userId: user.id,
      fundingSourceId: fundingSource.id,
      virtualAccountId,
      billerName,
      ruleType: 'BILLER_OVERRIDE',
      priority: 1,
      isActive: true,
    },
    include: { fundingSource: { select: fundingSourceSelect } },
  })

  return NextResponse.json({ success: true, rule })
}

export async function PATCH(req: Request) {
  const user = await requireUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = (await req.json().catch(() => null)) as {
    ruleId?: unknown
    isActive?: unknown
  } | null
  const ruleId = typeof body?.ruleId === 'string' ? body.ruleId : ''
  if (!ruleId || typeof body?.isActive !== 'boolean') {
    return NextResponse.json({ error: 'Rule and active state are required.' }, { status: 400 })
  }

  const updated = await prisma.routingRule.updateMany({
    where: { id: ruleId, userId: user.id, ruleType: 'BILLER_OVERRIDE' },
    data: { isActive: body.isActive },
  })
  if (updated.count !== 1) {
    return NextResponse.json({ error: 'Override not found.' }, { status: 404 })
  }

  return NextResponse.json({ success: true })
}

export async function DELETE(req: Request) {
  const user = await requireUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url = new URL(req.url)
  const body = (await req.json().catch(() => null)) as { ruleId?: unknown } | null
  const ruleId =
    url.searchParams.get('ruleId') || (typeof body?.ruleId === 'string' ? body.ruleId : '')
  if (!ruleId) {
    return NextResponse.json({ error: 'Rule is required.' }, { status: 400 })
  }

  const deleted = await prisma.routingRule.deleteMany({
    where: { id: ruleId, userId: user.id, ruleType: 'BILLER_OVERRIDE' },
  })
  if (deleted.count !== 1) {
    return NextResponse.json({ error: 'Override not found.' }, { status: 404 })
  }

  return NextResponse.json({ success: true })
}
