import { notFound, redirect } from 'next/navigation'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import { AdminConsole } from '@/components/admin-console'

export const metadata: Metadata = {
  title: 'Admin | H8Admin',
}

export default async function AdminPage() {
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
    select: { isAdmin: true },
  })
  if (!profile?.isAdmin) notFound()
  return <AdminConsole />
}
