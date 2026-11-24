import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Role } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { cleanBillingName } from '@/lib/billing-name'

async function getAuthenticatedUser() {
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

export async function GET() {
  const user = await getAuthenticatedUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const membership = await prisma.householdMember.findFirst({
      where: { userId: user.id },
      include: {
        household: {
          include: {
            members: {
              include: {
                user: { select: { id: true, email: true, name: true } },
              },
            },
            virtualAccounts: {
              select: {
                id: true,
                bsb: true,
                accountNumber: true,
                accountType: true,
              },
            },
            invites: {
              where: {
                usedAt: null,
                expiresAt: { gt: new Date() },
              },
              orderBy: { createdAt: 'desc' },
            },
          },
        },
      },
    })

    if (!membership) {
      return NextResponse.json({
        household: null,
        role: null,
        sharePersonalBills: false,
        transactions: [],
      })
    }

    const visibility = await prisma.householdVisibility.findUnique({
      where: {
        userId_householdId: {
          userId: user.id,
          householdId: membership.householdId,
        },
      },
    })

    const accountIds = membership.household.virtualAccounts.map((account) => account.id)
    const transactions =
      accountIds.length === 0
        ? []
        : await prisma.transaction.findMany({
            where: { virtualAccountId: { in: accountIds } },
            orderBy: { createdAt: 'desc' },
            take: 24,
            select: {
              id: true,
              billerName: true,
              amountCents: true,
              status: true,
              createdAt: true,
            },
          })

    return NextResponse.json({
      household: membership.household,
      role: membership.role,
      sharePersonalBills: visibility?.sharePersonalBills ?? false,
      transactions,
    })
  } catch (err: unknown) {
    const error = err as Error
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  const user = await getAuthenticatedUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = (await req.json()) as {
      householdId?: string
      sharePersonalBills?: boolean
      name?: string
    }

    if (!body.householdId || typeof body.householdId !== 'string') {
      return NextResponse.json({ error: 'householdId is required' }, { status: 400 })
    }

    const member = await prisma.householdMember.findUnique({
      where: {
        userId_householdId: {
          userId: user.id,
          householdId: body.householdId,
        },
      },
    })

    if (!member) {
      return NextResponse.json({ error: 'Not a household member' }, { status: 403 })
    }

    if (typeof body.name === 'string' && body.name.trim()) {
      if (member.role !== Role.OWNER) {
        return NextResponse.json(
          { error: 'Only household owners can rename the household' },
          { status: 403 }
        )
      }
      const name = cleanBillingName(body.name)
      if (!name) {
        return NextResponse.json(
          { error: 'Use a name up to 40 characters. Symbols such as / ? ! @ # $ % & * ( ) are allowed.' },
          { status: 400 }
        )
      }
      await prisma.household.update({
        where: { id: body.householdId },
        data: { name },
      })
    }

    if (typeof body.sharePersonalBills === 'boolean') {
      await prisma.householdVisibility.upsert({
        where: {
          userId_householdId: {
            userId: user.id,
            householdId: body.householdId,
          },
        },
        update: { sharePersonalBills: body.sharePersonalBills },
        create: {
          userId: user.id,
          householdId: body.householdId,
          sharePersonalBills: body.sharePersonalBills,
        },
      })
    }

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    const error = err as Error
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
