import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createServerClient } from '@supabase/ssr'
import { prisma } from '@/lib/prisma'
import { BillForwardingHub } from '@/components/bill-forwarding-hub'

export const metadata: Metadata = {
  title: 'Bill forwarding | H8Admin',
}

export default async function BillForwardingPage() {
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
  if (!user) redirect('/login')

  const profile = await prisma.user.findUnique({
    where: { id: user.id },
    select: { id: true, email: true, referralCode: true },
  })
  if (!profile) redirect('/')

  const forwardingEmail = `bills+${profile.referralCode?.toLowerCase() || 'preview'}@inbound.h8admin.com`

  return (
    <div className="mx-auto max-w-6xl p-8">
      <BillForwardingHub forwardingEmail={forwardingEmail} userEmail={profile.email} />
    </div>
  )
}
