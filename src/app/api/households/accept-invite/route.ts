import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Role } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import {
  allocateUniqueReferralCode,
  needsShortReferralCode,
} from '@/lib/referral'

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
    const { token } = await req.json()

    if (!token || typeof token !== 'string') {
      return NextResponse.json({ error: 'Invite token is required' }, { status: 400 })
    }

    const invite = await prisma.householdInvite.findUnique({
      where: { token },
      include: { household: true },
    })

    if (!invite) {
      return NextResponse.json({ error: 'Invalid invite link' }, { status: 404 })
    }

    if (invite.usedAt) {
      return NextResponse.json({ error: 'This invite link has already been used' }, { status: 400 })
    }

    if (new Date() > invite.expiresAt) {
      return NextResponse.json({ error: 'This invite link has expired' }, { status: 400 })
    }

    const existingUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true, referralCode: true },
    })
    const referralCode = needsShortReferralCode(existingUser?.referralCode)
      ? await allocateUniqueReferralCode()
      : existingUser!.referralCode

    await prisma.user.upsert({
      where: { id: user.id },
      update: {
        ...(user.email ? { email: user.email } : {}),
      },
      create: {
        id: user.id,
        email: user.email || `${user.id}@h8admin.local`,
        name: user.email?.split('@')[0] || 'Partner',
        referralCode,
      },
    })

    const existingMember = await prisma.householdMember.findUnique({
      where: {
        userId_householdId: {
          userId: user.id,
          householdId: invite.householdId,
        },
      },
    })

    if (existingMember) {
      return NextResponse.json({
        success: true,
        householdId: invite.householdId,
        householdName: invite.household.name,
      })
    }

    await prisma.$transaction([
      prisma.householdMember.create({
        data: {
          userId: user.id,
          householdId: invite.householdId,
          role: Role.PARTNER,
        },
      }),
      prisma.householdVisibility.create({
        data: {
          userId: user.id,
          householdId: invite.householdId,
          sharePersonalBills: false,
        },
      }),
      prisma.householdInvite.update({
        where: { id: invite.id },
        data: { usedAt: new Date() },
      }),
    ])

    return NextResponse.json({
      success: true,
      householdId: invite.householdId,
      householdName: invite.household.name,
    })
  } catch (err: unknown) {
    const error = err as Error
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
