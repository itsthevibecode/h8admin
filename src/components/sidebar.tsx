'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, CreditCard, ShieldAlert, Gift, CheckCircle2, ChevronRight } from 'lucide-react'

export function Sidebar({ email }: { email: string }) {
  const pathname = usePathname() ?? ''
  const displayEmail = email || ''
  const initials = displayEmail ? displayEmail.slice(0, 2).toUpperCase() : 'H8'
  const localPart = displayEmail.includes('@')
    ? displayEmail.split('@')[0]
    : displayEmail || 'Account'

  const navItems = [
    {
      label: 'Dashboard',
      href: '/',
      icon: LayoutDashboard,
    },
    {
      label: 'Credit Cards Hub',
      href: '/cards',
      icon: CreditCard,
    },
    {
      label: 'Cancelled & Expired Cards',
      href: '/cards#cancelled',
      icon: ShieldAlert,
    },
    {
      label: 'Referrals & Fee-Free Ledger',
      href: '/referrals',
      icon: Gift,
    },
  ]

  return (
    <aside className="w-64 bg-white border-r border-gray-100 p-6 flex flex-col justify-between min-h-screen shrink-0">
      <div className="space-y-8">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-emerald-600 rounded-xl flex items-center justify-center text-white font-bold text-sm">
            H8
          </div>
          <div>
            <h2 className="font-bold text-gray-900 text-sm tracking-tight">H8Admin</h2>
            <p className="text-[10px] text-emerald-700 font-semibold uppercase tracking-wider">
              Financial Autopilot
            </p>
          </div>
        </div>

        <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-center gap-3">
          <div className="w-8 h-8 bg-emerald-100 text-emerald-800 font-bold rounded-lg flex items-center justify-center text-xs">
            {initials}
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-bold text-gray-900 truncate">{localPart}</p>
            <p className="text-[10px] text-gray-400 truncate">{displayEmail || 'Signed in'}</p>
          </div>
        </div>

        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const pathOnly = item.href.split('#')[0]
            const isActive = !item.href.includes('#') && pathname === pathOnly
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </div>
                {isActive && <ChevronRight className="w-3.5 h-3.5" />}
              </Link>
            )
          })}
        </nav>
      </div>

      <div className="pt-6 border-t border-gray-100 text-[11px] text-gray-400 space-y-1">
        <p className="flex items-center gap-1 text-emerald-700 font-semibold">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Tokenized Vault Active
        </p>
        <p>Zero-Knowledge Routing Engine</p>
      </div>
    </aside>
  )
}