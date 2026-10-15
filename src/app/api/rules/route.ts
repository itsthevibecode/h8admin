import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'

export async function GET() {
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

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const rules = await prisma.routingRule.findMany({
      where: { userId: user.id },
      include: {
        fundingSource: true,
      },
      orderBy: { priority: 'asc' },
    })

    return NextResponse.json({ rules })
  } catch (err: unknown) {
    const error = err as Error
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(req: Request) {
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

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { ruleType, billerName, fundingSourceId, daysActive, priority } = body

    if (!fundingSourceId || typeof fundingSourceId !== 'string') {
      return NextResponse.json({ error: 'Funding source required' }, { status: 400 })
    }

    const allowedTypes = ['CHURN_TIMER', 'BILLER_OVERRIDE', 'DEFAULT'] as const
    const resolvedType = allowedTypes.find((type) => type === ruleType) ?? 'BILLER_OVERRIDE'

    const fundingSource = await prisma.fundingSource.findFirst({
      where: { id: fundingSourceId, userId: user.id, isCancelled: false },
      select: { id: true },
    })
    if (!fundingSource) {
      return NextResponse.json({ error: 'Funding source not found' }, { status: 404 })
    }

    let expiresAt: Date | null = null
    if (resolvedType === 'CHURN_TIMER' && daysActive) {
      const days = parseInt(String(daysActive), 10)
      if (!Number.isFinite(days) || days < 1 || days > 730) {
        return NextResponse.json({ error: 'Invalid churn timer duration' }, { status: 400 })
      }
      expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + days)
    }

    const rule = await prisma.routingRule.create({
      data: {
        userId: user.id,
        fundingSourceId: fundingSource.id,
        ruleType: resolvedType,
        billerName: billerName || null,
        priority: priority ? parseInt(priority, 10) : 1,
        expiresAt,
      },
      include: {
        fundingSource: true,
      },
    })

    return NextResponse.json({ success: true, rule })
  } catch (err: unknown) {
    const error = err as Error
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}