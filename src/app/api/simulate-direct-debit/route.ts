import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { settleInboundDebit } from '@/lib/debit-settlement'

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
    const { billerName, amountDollars } = await req.json()

    if (!billerName || typeof billerName !== 'string' || !billerName.trim()) {
      return NextResponse.json({ error: 'Biller name and amount are required' }, { status: 400 })
    }

    const amount =
      typeof amountDollars === 'number' ? amountDollars : parseFloat(String(amountDollars))
    if (!Number.isFinite(amount) || amount <= 0 || amount > 50000) {
      return NextResponse.json(
        { error: 'Amount must be between $0.01 and $50,000' },
        { status: 400 }
      )
    }

    const amountCents = Math.round(amount * 100)

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true, email: true },
    })

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const virtualAccount = await prisma.virtualAccount.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: 'asc' },
      select: { id: true },
    })

    if (!virtualAccount) {
      return NextResponse.json(
        { error: 'No active Virtual BSB or linked funding source found' },
        { status: 400 }
      )
    }

    const settlement = await settleInboundDebit({
      userId: dbUser.id,
      userEmail: dbUser.email,
      virtualAccountId: virtualAccount.id,
      billerName: billerName.trim(),
      amountCents,
      idempotencyKey: `sim-${dbUser.id}-${Date.now()}`,
    })

    return NextResponse.json({
      success: settlement.action === 'ACCEPT',
      matchedRuleType: settlement.matchedRuleType,
      feeWaived: settlement.feeWaived,
      transaction: settlement.transaction,
      action: settlement.action,
      reason: settlement.reason,
    })
  } catch (err: unknown) {
    const error = err as Error
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
