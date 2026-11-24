import { randomBytes } from 'crypto'
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
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = (await req.json()) as { virtualAccountId?: string }
    if (!body.virtualAccountId) {
      return NextResponse.json({ error: 'Property is required' }, { status: 400 })
    }

    const account = await prisma.virtualAccount.findFirst({
      where: { id: body.virtualAccountId, userId: user.id, accountType: 'INVESTMENT' },
      select: { id: true },
    })
    if (!account) {
      return NextResponse.json({ error: 'Only the property owner can invite a partner' }, { status: 403 })
    }

    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)
    const invite = await prisma.propertyInvite.create({
      data: {
        virtualAccountId: account.id,
        createdBy: user.id,
        token: randomBytes(24).toString('hex'),
        expiresAt,
      },
    })

    const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '')
    return NextResponse.json({
      success: true,
      inviteUrl: `${baseUrl}/join/property/${invite.token}`,
    })
  } catch (err: unknown) {
    const error = err as Error
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
