'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Bell, CreditCard, LayoutDashboard, TrendingDown, Users } from 'lucide-react'

const TABS = [
  { label: 'Overview', href: '/', icon: LayoutDashboard },
  { label: 'Cards', href: '/cards', icon: CreditCard },
  { label: 'Cheaper', href: '/savings', icon: TrendingDown },
  { label: 'Household', href: '/direct-debits/household', icon: Users },
  { label: 'Alerts', href: '/notifications', icon: Bell },
] as const

export function MobileNav() {
  const pathname = usePathname() ?? ''
  const [navReady, setNavReady] = useState(false)

  useEffect(() => {
    setNavReady(true)
  }, [])

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white/95 backdrop-blur-md md:hidden">
      <ul className="grid grid-cols-5">
        {TABS.map((tab) => {
          const Icon = tab.icon
          const isActive = navReady && pathname === tab.href
          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                className={`relative flex flex-col items-center gap-1 px-1 py-2.5 text-[10px] font-semibold ${
                  isActive ? 'text-emerald-700' : 'text-gray-500'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
                {isActive && (
                  <span className="absolute bottom-1 h-1 w-1 rounded-full bg-emerald-600" />
                )}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
