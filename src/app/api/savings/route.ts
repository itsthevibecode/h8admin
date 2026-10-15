import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { analyzeUserSavings } from '@/lib/bill-benchmarks'

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
    const since = new Date()
    since.setFullYear(since.getFullYear() - 1)

    const transactions = await prisma.transaction.findMany({
      where: {
        userId: user.id,
        status: 'SUCCESS',
        createdAt: { gte: since },
      },
      select: {
        billerName: true,
        amountCents: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 500,
    })

    const analysis = analyzeUserSavings(transactions)

    return NextResponse.json({
      totalAnnualSavingsDollars: analysis.totalAnnualSavingsDollars,
      detectedCategories: analysis.detectedCategories,
      opportunities: analysis.opportunities,
    })
  } catch (err: unknown) {
    const error = err as Error
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
