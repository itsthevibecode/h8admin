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
    const { token } = await req.json()

    if (!token) {
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

    await prisma.householdMember.upsert({
      where: {
        userId_householdId: {
          userId: user.id,
          householdId: invite.householdId,
        },
      },
      update: { role: 'PARTNER' },
      create: {
        userId: user.id,
        householdId: invite.householdId,
role: 'PARTNER',
      },
    })

    await prisma.householdInvite.update({
      where: { id: invite.id },
      data: { usedAt: new Date() },
    })

    return NextResponse.json({
      success: true,
      householdName: invite.household.name,
    })
  } catch (err: unknown) {
    const error = err as Error
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}