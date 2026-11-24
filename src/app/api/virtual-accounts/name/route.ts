import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { cleanBillingName } from '@/lib/billing-name'

export async function PATCH(req: Request) {
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

  const body = (await req.json().catch(() => null)) as { id?: unknown; displayName?: unknown } | null
  if (!body || typeof body.id !== 'string' || !body.id) {
    return NextResponse.json({ error: 'Account id is required' }, { status: 400 })
  }

  const displayName = cleanBillingName(body.displayName)
  if (displayName === undefined) {
    return NextResponse.json(
      { error: 'Use a name up to 40 characters, starting with a letter or number.' },
      { status: 400 }
    )
  }

  const account = await prisma.virtualAccount.findUnique({
    where: { id: body.id },
    select: { id: true, userId: true },
  })
  if (!account || account.userId !== user.id) {
    return NextResponse.json({ error: 'Billing method not found' }, { status: 404 })
  }

  const updated = await prisma.virtualAccount.update({
    where: { id: account.id },
    data: { displayName },
    select: { id: true, displayName: true },
  })

  return NextResponse.json({ account: updated })
}
