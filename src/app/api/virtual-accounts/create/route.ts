import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { AccountType, Role } from '@prisma/client'

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

  if (!user || !user.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json().catch(() => ({}))
    const { accountType, portfolioName } = body

    // 1. Strict Enum Validation
    const validAccountTypes: AccountType[] = [
      AccountType.INDIVIDUAL,
      AccountType.HOUSEHOLD,
      AccountType.INVESTMENT,
    ]

    const resolvedType = validAccountTypes.find((type) => type === accountType)
    if (!resolvedType) {
      return NextResponse.json(
        {
          error:
            'Invalid account type. Must be INDIVIDUAL, HOUSEHOLD, or INVESTMENT.',
        },
        { status: 400 }
      )
    }

    // 2. Atomic Provisioning Transaction
    const virtualAccount = await prisma.$transaction(async (tx) => {
      // Ensure user record exists in PostgreSQL to satisfy foreign key constraints
      const dbUser = await tx.user.findUnique({
        where: { id: user.id },
      })

      if (!dbUser) {
        throw new Error('User profile record not found in database.')
      }

      // Generate a collision-resistant 8-digit Australian account number
      let accountNumber = ''
      let isUnique = false
      let attempts = 0

      while (!isUnique && attempts < 10) {
        attempts++
        accountNumber = Math.floor(
          10000000 + Math.random() * 90000000
        ).toString()

        const existing = await tx.virtualAccount.findUnique({
          where: { accountNumber },
          select: { id: true },
        })

        if (!existing) {
          isUnique = true
        }
      }

      if (!isUnique) {
        throw new Error(
          'Failed to generate a unique account number. Please try again.'
        )
      }

      // Provision Household entity and assign OWNER role if creating a HOUSEHOLD portfolio
      let householdId: string | null = null
      if (resolvedType === AccountType.HOUSEHOLD) {
        const sanitizedName =
          typeof portfolioName === 'string' && portfolioName.trim()
            ? portfolioName.trim()
            : `${user.email.split('@')[0]}'s Household`

        const household = await tx.household.create({
          data: {
            name: sanitizedName,
            members: {
              create: {
                userId: user.id,
                role: Role.OWNER,
              },
            },
          },
        })
        householdId = household.id
      }

      // Provision the new Virtual Account
      return tx.virtualAccount.create({
        data: {
          userId: user.id,
          householdId,
          bsb: '802-985',
          accountNumber,
          accountType: resolvedType,
        },
      })
    })

    return NextResponse.json({ success: true, virtualAccount })
  } catch (err: unknown) {
    const error = err as Error
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}