import { NextResponse } from 'next/server'
import { isAllowlisted, normalizeEmail } from '@/lib/beta-access'

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as { email?: string } | null
  const email = typeof body?.email === 'string' ? normalizeEmail(body.email) : ''
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 })
  }
  if (!(await isAllowlisted(email))) {
    return NextResponse.json(
      { error: 'H8Admin is in a private beta. This email is not on the tester list.' },
      { status: 403 }
    )
  }
  return NextResponse.json({ allowed: true })
}
