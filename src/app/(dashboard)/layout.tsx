import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/sidebar'
import { MobileNav } from '@/components/mobile-nav'
import { ToastProvider } from '@/components/ui/toast'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // setAll from a Server Component can throw; middleware refreshes the session.
          }
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <ToastProvider>
      <div className="flex min-h-screen bg-gray-50/50">
        <div className="hidden md:block">
          <Sidebar email={user?.email || ''} />
        </div>
        <main className="flex-1 min-h-screen overflow-y-auto pb-16 md:pb-0">{children}</main>
        <MobileNav />
      </div>
    </ToastProvider>
  )
}
