import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Role } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { allocateUniqueReferralCode, needsShortReferralCode } from '@/lib/referral'
import { isAllowlisted } from '@/lib/beta-access'

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
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = (await req.json()) as { token?: string }
    if (!body.token) {
      return NextResponse.json({ error: 'Invite token is required' }, { status: 400 })
    }

    const invite = await prisma.propertyInvite.findUnique({
      where: { token: body.token },
      include: { virtualAccount: true },
    })
    if (!invite) return NextResponse.json({ error: 'Invalid invite link' }, { status: 404 })
    if (invite.usedAt) {
      return NextResponse.json({ error: 'This invite link has already been used' }, { status: 400 })
    }
    if (new Date() > invite.expiresAt) {
      return NextResponse.json({ error: 'This invite link has expired' }, { status: 400 })
    }
    if (invite.virtualAccount.userId === user.id) {
      return NextResponse.json({ error: 'You already own this property' }, { status: 400 })
    }

    const existingUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { referralCode: true },
    })
    if (!existingUser && (!user.email || !(await isAllowlisted(user.email)))) {
      return NextResponse.json(
        { error: 'This email is not on the private beta list.' },
        { status: 403 }
      )
    }
    const referralCode = needsShortReferralCode(existingUser?.referralCode)
      ? await allocateUniqueReferralCode()
      : existingUser!.referralCode

    await prisma.user.upsert({
      where: { id: user.id },
      update: { ...(user.email ? { email: user.email } : {}) },
      create: {
        id: user.id,
        email: user.email || `${user.id}@h8admin.local`,
        referralCode,
      },
    })

    const existing = await prisma.propertyMember.findUnique({
      where: {
        virtualAccountId_userId: {
          virtualAccountId: invite.virtualAccountId,
          userId: user.id,
        },
      },
    })

    if (!existing) {
      await prisma.$transaction([
        prisma.propertyMember.create({
          data: {
            virtualAccountId: invite.virtualAccountId,
            userId: user.id,
            role: Role.PARTNER,
          },
        }),
        prisma.propertyVisibility.create({
          data: {
            userId: user.id,
            virtualAccountId: invite.virtualAccountId,
            shareBills: false,
          },
        }),
        prisma.propertyInvite.update({
          where: { id: invite.id },
          data: { usedAt: new Date() },
        }),
      ])
    }

    return NextResponse.json({
      success: true,
      accountNumber: invite.virtualAccount.accountNumber,
    })
  } catch (err: unknown) {
    const error = err as Error
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
