'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Bell,
  CheckCircle2,
  Compass,
  CreditCard,
  Banknote,
  House,
  Landmark,
  LayoutDashboard,
  Lightbulb,
  Receipt,
  Route,
  TrendingDown,
  User,
  Users,
  Building2,
  BarChart3,
  Shield,
  type LucideIcon,
} from 'lucide-react'

interface NavItem {
  label: string
  href: string
  icon: LucideIcon
  children?: NavItem[]
}

const dashboardItems: NavItem[] = [
  { label: 'How it works', href: '/how-it-works', icon: Compass },
  { label: 'Plans', href: '/billing', icon: Receipt },
]

const billingItems: NavItem[] = [
  {
    label: 'Direct debits',
    href: '/direct-debits',
    icon: Landmark,
    children: [
      { label: 'Personal', href: '/direct-debits/personal', icon: User },
      { label: 'Household', href: '/direct-debits/household', icon: Users },
      { label: 'Investment property', href: '/direct-debits/investment', icon: Building2 },
    ],
  },
  { label: 'Stats', href: '/billing/stats', icon: BarChart3 },
  { label: 'Mortgages', href: '/billing/mortgages', icon: House },
  { label: 'Switch & Save', href: '/savings', icon: TrendingDown },
]

const paymentFlowItem: NavItem = {
  label: 'Payment flow',
  href: '/payment-flow',
  icon: Route,
}

const payingItems: NavItem[] = [
  {
    label: 'Credit cards',
    href: '/cards',
    icon: CreditCard,
    children: [{ label: 'Change credit cards', href: '/cards/change', icon: CreditCard }],
  },
  { label: 'Direct debit', href: '/paying/direct-debit', icon: Banknote },
]

const suggestionItem: NavItem = {
  label: 'Suggestion board',
  href: '/feedback',
  icon: Lightbulb,
}

function isItemActive(
  pathname: string,
  href: string,
  ready: boolean,
  includeChildren = false
) {
  if (!ready || href.includes('#')) return false
  const pathOnly = href.split('#')[0]
  if (pathOnly === '/') return pathname === '/'
  if (includeChildren) {
    return pathname === pathOnly || pathname.startsWith(`${pathOnly}/`)
  }
  return pathname === pathOnly
}

export function Sidebar({
  email,
  displayName = '',
  isAdmin = false,
}: {
  email: string
  displayName?: string
  isAdmin?: boolean
}) {
  const pathname = usePathname() ?? ''
  const [navReady, setNavReady] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    setNavReady(true)
  }, [])

  useEffect(() => {
    let cancelled = false

    const loadUnread = async () => {
      try {
        const res = await fetch('/api/notifications')
        const data = (await res.json()) as { unreadCount?: number }
        if (!cancelled && res.ok && typeof data.unreadCount === 'number') {
          setUnreadCount(data.unreadCount)
        }
      } catch {
        // Badge stays at the last known count if polling fails.
      }
    }

    void loadUnread()
    const interval = window.setInterval(() => {
      void loadUnread()
    }, 60_000)

    return () => {
      cancelled = true
      window.clearInterval(interval)
    }
  }, [pathname])

  const displayEmail = email || ''
  const fullName = displayName.trim()
  const nameParts = fullName.split(/\s+/).filter(Boolean)
  const initials =
    nameParts.length >= 2
      ? `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase()
      : displayEmail
        ? displayEmail.slice(0, 2).toUpperCase()
        : 'H8'
  const localPart = displayEmail.includes('@')
    ? displayEmail.split('@')[0]
    : displayEmail || 'Account'
  const dashboardActive = isItemActive(pathname, '/', navReady)

  return (
    <aside className="sticky top-0 flex h-screen w-64 shrink-0 flex-col justify-between overflow-y-auto border-r border-gray-100 bg-white p-5">
      <div className="space-y-6">
        <div className="flex items-center gap-2.5 px-1">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-600 text-sm font-bold text-white">
            H8
          </div>
          <div>
            <h2 className="text-sm font-bold tracking-tight text-gray-900">H8Admin</h2>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-700">
              Financial Autopilot
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 p-3">
          <Link href="/settings" className="flex min-w-0 flex-1 items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-xs font-bold text-emerald-800">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-bold text-gray-900">{fullName || localPart}</p>
              <p className="truncate text-[10px] text-gray-400">{displayEmail || 'Signed in'}</p>
            </div>
          </Link>
          <Link
            href="/notifications"
            aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'}
            className="relative rounded-lg p-1.5 text-gray-500 hover:bg-white hover:text-emerald-700"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 rounded-full bg-emerald-600 px-1.5 text-[9px] font-bold text-white">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </Link>
        </div>

        <nav className="space-y-4">
          <div>
            <NavLink item={{ label: 'Dashboard', href: '/', icon: LayoutDashboard }} active={dashboardActive} />
            <div className="ml-4 mt-0.5 space-y-0.5 border-l border-gray-100 pl-2">
              {dashboardItems.map((item) => (
                <NavLink
                  key={item.href}
                  item={item}
                  active={isItemActive(pathname, item.href, navReady)}
                  nested
                />
              ))}
            </div>
          </div>

          <NavGroup label="Billing" items={billingItems} pathname={pathname} ready={navReady} />
          <NavLink item={paymentFlowItem} active={isItemActive(pathname, paymentFlowItem.href, navReady)} />
          <NavGroup label="Paying" items={payingItems} pathname={pathname} ready={navReady} />

          <div className="border-t border-gray-100 pt-3">
            <NavLink
              item={suggestionItem}
              active={isItemActive(pathname, suggestionItem.href, navReady)}
            />
            {isAdmin && (
              <NavLink
                item={{ label: 'Admin', href: '/admin', icon: Shield }}
                active={isItemActive(pathname, '/admin', navReady, true)}
              />
            )}
          </div>
        </nav>
      </div>

      <div className="space-y-1 border-t border-gray-100 pt-4 text-[11px] text-gray-400">
        <p className="flex items-center gap-1 font-semibold text-emerald-700">
          <CheckCircle2 className="h-3 w-3 text-emerald-600" /> Tokenized Vault Active
        </p>
        <p>Zero-Knowledge Routing Engine</p>
      </div>
    </aside>
  )
}

function NavGroup({
  label,
  items,
  pathname,
  ready,
}: {
  label: string
  items: NavItem[]
  pathname: string
  ready: boolean
}) {
  return (
    <div>
      <p className="px-3.5 pb-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">
        {label}
      </p>
      <div className="space-y-0.5">
        {items.map((item) => (
          <div key={item.href}>
            <NavLink
              item={item}
              active={isItemActive(pathname, item.href, ready, Boolean(item.children))}
            />
            {item.children && (
              <div className="ml-4 mt-0.5 space-y-0.5 border-l border-gray-100 pl-2">
                {item.children.map((child) => (
                  <NavLink
                    key={child.href}
                    item={child}
                    active={isItemActive(pathname, child.href, ready)}
                    nested
                  />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function NavLink({
  item,
  active,
  nested = false,
}: {
  item: NavItem
  active: boolean
  nested?: boolean
}) {
  const Icon = item.icon
  return (
    <Link
      href={item.href}
      className={`flex items-center gap-2.5 rounded-xl px-3.5 font-semibold transition ${
        nested ? 'py-2 text-[11px]' : 'py-2.5 text-xs'
      } ${active ? 'bg-emerald-50 text-emerald-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
    >
      <Icon className={nested ? 'h-3.5 w-3.5' : 'h-4 w-4'} />
      <span>{item.label}</span>
    </Link>
  )
}
