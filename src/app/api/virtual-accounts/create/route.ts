import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'

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
    const { accountType, portfolioName } = await req.json()

    const allowedTypes = ['INDIVIDUAL', 'HOUSEHOLD', 'INVESTMENT'] as const
    const resolvedType = allowedTypes.find((type) => type === accountType)
    if (!resolvedType) {
      return NextResponse.json({ error: 'Account type is required' }, { status: 400 })
    }

    // Generate unique 8-digit account number
    const accountNumber = Math.floor(10000000 + Math.random() * 90000000).toString()

    // Create Household entity if account type is HOUSEHOLD
    let householdId = null
    if (resolvedType === 'HOUSEHOLD') {
      const household = await prisma.household.create({
        data: {
          name: portfolioName || `${user.email?.split('@')[0]}'s Household`,
          members: {
            create: {
              userId: user.id,
              role: 'OWNER',
            },
          },
        },
      })
      householdId = household.id
    }

    // Provision new Virtual Account
    const virtualAccount = await prisma.virtualAccount.create({
      data: {
        userId: user.id,
        householdId,
        bsb: '802-985',
        accountNumber,
        accountType: resolvedType,
      },
    })

    return NextResponse.json({ success: true, virtualAccount })
  } catch (err: unknown) {
    const error = err as Error
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}