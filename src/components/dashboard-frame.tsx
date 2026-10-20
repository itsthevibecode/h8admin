import { Sidebar } from '@/components/sidebar'
import { MobileNav } from '@/components/mobile-nav'
import { ToastProvider } from '@/components/ui/toast'
import { LegalFooter } from '@/components/legal-footer'

export function DashboardFrame({
  email,
  displayName = '',
  isAdmin = false,
  children,
}: {
  email: string
  displayName?: string
  isAdmin?: boolean
  children: React.ReactNode
}) {
  return (
    <ToastProvider>
      <div className="flex min-h-screen bg-gray-50/50">
        <div className="hidden md:block">
          <Sidebar email={email} displayName={displayName} isAdmin={isAdmin} />
        </div>
        <main className="flex min-h-screen flex-1 flex-col overflow-y-auto pb-16 md:pb-0">
          <div className="flex-1">{children}</div>
          <LegalFooter />
        </main>
        <MobileNav />
      </div>
    </ToastProvider>
  )
}
