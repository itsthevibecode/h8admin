import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'

// Default bank lockout policies in Australia
const BANK_LOCKOUT_MONTHS: Record<string, number> = {
  'American Express': 18,
  'NAB': 18,
  'Westpac': 12,
  'ANZ': 12,
  'Commonwealth Bank': 12,
  'Citi / NAB Group': 12,
  'Bankwest': 24,
  'HSBC': 12,
  'Other': 12,
}

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
    const lockouts = await prisma.cardLockout.findMany({
      where: { userId: user.id },
      orderBy: { eligibleAgainAt: 'asc' },
    })

    return NextResponse.json({ lockouts })
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
    const { bankGroup, cardName, cancelledAtDate, notes, nickname } = await req.json()

    if (!bankGroup || !cardName) {
      return NextResponse.json(
        { error: 'Bank group and card name are required' },
        { status: 400 }
      )
    }

    const lockoutMonths = BANK_LOCKOUT_MONTHS[bankGroup] || 12
    const cancelledAt = cancelledAtDate ? new Date(cancelledAtDate) : new Date()
    if (Number.isNaN(cancelledAt.getTime())) {
      return NextResponse.json({ error: 'Invalid cancellation date' }, { status: 400 })
    }

    const eligibleAgainAt = new Date(cancelledAt)
    eligibleAgainAt.setMonth(eligibleAgainAt.getMonth() + lockoutMonths)

    const lockout = await prisma.cardLockout.create({
      data: {
        userId: user.id,
        bankGroup,
        cardName,
        nickname: typeof nickname === 'string' && nickname.trim() ? nickname.trim() : null,
        cancelledAt,
        lockoutMonths,
        eligibleAgainAt,
        notes: notes || null,
      },
    })

    return NextResponse.json({ success: true, lockout })
  } catch (err: unknown) {
    const error = err as Error
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}