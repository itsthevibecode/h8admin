import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import {
  allocateUniqueReferralCode,
  needsShortReferralCode,
} from '@/lib/referral'

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
    let dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        referrals: {
          select: { id: true, email: true, createdAt: true },
        },
      },
    })

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (needsShortReferralCode(dbUser.referralCode)) {
      const referralCode = await allocateUniqueReferralCode()
      dbUser = await prisma.user.update({
        where: { id: user.id },
        data: { referralCode },
        include: {
          referrals: {
            select: { id: true, email: true, createdAt: true },
          },
        },
      })
    }

    const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '')
    const referralUrl = `${baseUrl}/join/ref/${dbUser.referralCode}`

    return NextResponse.json({
      referralCode: dbUser.referralCode,
      referralUrl,
      rolloverBalanceCents: dbUser.rolloverBalanceCents,
      referralCount: dbUser.referrals.length,
      referrals: dbUser.referrals,
    })
  } catch (err: unknown) {
    const error = err as Error
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}