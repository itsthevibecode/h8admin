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
    const { householdId, email } = await req.json()

    if (!householdId || typeof householdId !== 'string') {
      return NextResponse.json({ error: 'Household ID is required' }, { status: 400 })
    }

    const household = await prisma.household.findUnique({
      where: { id: householdId },
      select: { id: true },
    })
    if (!household) {
      return NextResponse.json({ error: 'Household not found' }, { status: 404 })
    }

    const member = await prisma.householdMember.findUnique({
      where: {
        userId_householdId: {
          userId: user.id,
          householdId,
        },
      },
    })

    if (!member || member.role !== 'OWNER') {
      return NextResponse.json(
        { error: 'Only household owners can generate invite links' },
        { status: 403 }
      )
    }

    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    const invite = await prisma.householdInvite.create({
      data: {
        householdId,
        createdBy: user.id,
        email: email || null,
        expiresAt,
      },
    })

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    const inviteUrl = `${baseUrl}/join/household/${invite.token}`

    return NextResponse.json({ success: true, inviteUrl, token: invite.token })
  } catch (err: unknown) {
    const error = err as Error
    console.error('Invite generation error:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}