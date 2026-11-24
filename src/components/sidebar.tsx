'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  Bell,
  CheckCircle2,
  ChevronDown,
  Compass,
  CreditCard,
  Banknote,
  House,
  LayoutDashboard,
  Lightbulb,
  Inbox,
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
}

export interface InvestmentNavItem {
  id: string
  label: string
}

function isPathActive(pathname: string, href: string, ready: boolean, includeChildren = false) {
  if (!ready || href.includes('#')) return false
  const pathOnly = href.split('#')[0]
  if (pathOnly === '/') return pathname === '/'
  if (includeChildren) {
    return pathname === pathOnly || pathname.startsWith(`${pathOnly}/`)
  }
  return pathname === pathOnly
}

const stepShell =
  'flex w-full items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-left text-[10px] font-bold uppercase tracking-widest text-emerald-800 shadow-xs transition hover:bg-emerald-100'

export function Sidebar({
  email,
  displayName = '',
  isAdmin = false,
  personalLabel = 'Personal',
  householdLabel = 'Household',
  investments = [],
}: {
  email: string
  displayName?: string
  isAdmin?: boolean
  personalLabel?: string
  householdLabel?: string
  investments?: InvestmentNavItem[]
}) {
  const pathname = usePathname() ?? ''
  const router = useRouter()
  const [navReady, setNavReady] = useState(false)
  const [hash, setHash] = useState('')
  const [unreadCount, setUnreadCount] = useState(0)
  const [opened, setOpened] = useState<Record<string, boolean>>({})

  useEffect(() => {
    setNavReady(true)
  }, [])

  useEffect(() => {
    const read = () => setHash(window.location.hash.replace('#', ''))
    read()
    window.addEventListener('hashchange', read)
    return () => window.removeEventListener('hashchange', read)
  }, [pathname])

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

  const billingChildren: NavItem[] = [
    { label: personalLabel, href: '/direct-debits/personal', icon: User },
    { label: householdLabel, href: '/direct-debits/household', icon: Users },
    ...(investments.length > 0
      ? investments.map((item) => ({
          label: item.label,
          href: `/direct-debits/investment#${item.id}`,
          icon: Building2,
        }))
      : [{ label: 'Investment property', href: '/direct-debits/investment', icon: Building2 }]),
    { label: 'Bill forwarding', href: '/billing/forwarding', icon: Inbox },
  ]

  const childActive = (href: string, indexAmongInvestments: number) => {
    if (!navReady) return false
    const [path, fragment] = href.split('#')
    if (pathname !== path) return false
    if (!fragment) return true
    if (hash) return hash === fragment
    return indexAmongInvestments === 0
  }

  const dashboardActive = pathname === '/'
  const dashboardSection =
    dashboardActive || pathname === '/how-it-works' || pathname === '/feedback'
  const billingSection =
    pathname === '/direct-debits' ||
    pathname.startsWith('/direct-debits/') ||
    pathname === '/billing/forwarding'
  const payingSection = pathname === '/cards' || pathname === '/paying/direct-debit'
  const optimisingSection =
    pathname === '/billing/mortgages' || pathname === '/savings' || pathname === '/cards/change'

  const reveal = (id: string, active: boolean) => active || opened[id] === true

  const toggle = (id: string, active: boolean) => {
    if (active) return
    setOpened((current) => ({ ...current, [id]: !current[id] }))
  }

  const openBilling = () => {
    setOpened((current) => ({ ...current, billing: true }))
    if (pathname !== '/direct-debits') {
      router.push('/direct-debits')
    }
  }

  const dashboardItems: NavItem[] = [
    { label: 'How it works', href: '/how-it-works', icon: Compass },
    { label: 'Suggestion board', href: '/feedback', icon: Lightbulb },
  ]
  const payingItems: NavItem[] = [
    { label: 'Credit cards', href: '/cards', icon: CreditCard },
    { label: 'Direct debit', href: '/paying/direct-debit', icon: Banknote },
  ]
  const optimisingItems: NavItem[] = [
    { label: 'Find new mortgage', href: '/billing/mortgages', icon: House },
    { label: 'Find cheaper bills', href: '/savings', icon: TrendingDown },
    { label: 'Find new credit card', href: '/cards/change', icon: CreditCard },
  ]

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
            <SectionLink
              item={{ label: 'Dashboard', href: '/', icon: LayoutDashboard }}
              active={dashboardActive}
              open={reveal('dashboard', dashboardSection)}
              onOpen={() => toggle('dashboard', dashboardSection)}
            />
            {reveal('dashboard', dashboardSection) && (
              <Submenu>
                {dashboardItems.map((item) => (
                  <NavLink
                    key={item.href}
                    item={item}
                    active={isPathActive(pathname, item.href, navReady)}
                    nested
                  />
                ))}
              </Submenu>
            )}
          </div>

          <ol className="relative space-y-3">
            <li className="relative pl-8">
              <StepMark n="1" />
              <span className="absolute bottom-[-12px] left-[9px] top-5 w-px bg-emerald-200" />
              <StepControl
                label="Billing"
                open={reveal('billing', billingSection)}
                expandable
                active={billingSection}
                onClick={openBilling}
              />
              {reveal('billing', billingSection) && (
                <Submenu>
                  {billingChildren.map((child) => {
                    const fragment = child.href.split('#')[1] ?? ''
                    const investmentIndex = fragment
                      ? investments.findIndex((item) => item.id === fragment)
                      : -1
                    return (
                      <NavLink
                        key={child.href}
                        item={child}
                        active={childActive(child.href, investmentIndex)}
                        nested
                      />
                    )
                  })}
                </Submenu>
              )}
            </li>

            <li className="relative pl-8">
              <StepMark n="2" />
              <span className="absolute bottom-[-12px] left-[9px] top-5 w-px bg-emerald-200" />
              <StepControl
                label="Payment flow"
                href="/payment-flow"
                active={isPathActive(pathname, '/payment-flow', navReady)}
              />
            </li>

            <li className="relative pl-8">
              <StepMark n="3" />
              <span className="absolute bottom-[-12px] left-[9px] top-5 w-px bg-emerald-200" />
              <StepControl
                label="Paying"
                open={reveal('paying', payingSection)}
                expandable
                active={payingSection}
                onClick={() => toggle('paying', payingSection)}
              />
              {reveal('paying', payingSection) && (
                <Submenu>
                  {payingItems.map((item) => (
                    <NavLink
                      key={item.href}
                      item={item}
                      active={isPathActive(pathname, item.href, navReady)}
                      nested
                    />
                  ))}
                </Submenu>
              )}
            </li>

            <li className="relative pl-8">
              <StepMark n="4" />
              <span className="absolute bottom-[-12px] left-[9px] top-5 w-px bg-emerald-200" />
              <StepControl
                label="Transaction History"
                href="/billing/stats"
                active={isPathActive(pathname, '/billing/stats', navReady)}
              />
            </li>

            <li className="relative pl-8">
              <StepMark n="5" />
              <StepControl
                label="Optimising"
                open={reveal('optimising', optimisingSection)}
                expandable
                active={optimisingSection}
                onClick={() => toggle('optimising', optimisingSection)}
              />
              {reveal('optimising', optimisingSection) && (
                <Submenu>
                  {optimisingItems.map((item) => (
                    <NavLink
                      key={item.href}
                      item={item}
                      active={isPathActive(pathname, item.href, navReady)}
                      nested
                    />
                  ))}
                </Submenu>
              )}
            </li>
          </ol>

          {isAdmin && (
            <div className="border-t border-gray-100 pt-3">
              <NavLink
                item={{ label: 'Admin', href: '/admin', icon: Shield }}
                active={isPathActive(pathname, '/admin', navReady, true)}
              />
            </div>
          )}
        </nav>
      </div>

      <div className="space-y-1 border-t border-gray-100 pt-4 text-[11px] text-gray-400">
        <p className="flex items-center gap-1 font-semibold text-emerald-700">
          <CheckCircle2 className="h-3 w-3 text-emerald-600" /> Personal Financial Autopilot
        </p>
        <p>Funding sources tokenized via payment partners</p>
      </div>
    </aside>
  )
}

function StepMark({ n }: { n: string }) {
  return (
    <span className="absolute left-0 top-0 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-bold text-white">
      {n}
    </span>
  )
}

function StepControl({
  label,
  href,
  open = false,
  expandable = false,
  active = false,
  onClick,
}: {
  label: string
  href?: string
  open?: boolean
  expandable?: boolean
  active?: boolean
  onClick?: () => void
}) {
  const className = `${stepShell} ${active ? 'ring-1 ring-emerald-300' : ''}`

  if (href) {
    return (
      <Link href={href} className={className} aria-current={active ? 'page' : undefined}>
        <span>{label}</span>
        {expandable && (
          <ChevronDown className={`h-3.5 w-3.5 shrink-0 transition ${open ? 'rotate-180' : ''}`} />
        )}
      </Link>
    )
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={expandable ? open : undefined}
      className={className}
    >
      <span>{label}</span>
      {expandable && (
        <ChevronDown className={`h-3.5 w-3.5 shrink-0 transition ${open ? 'rotate-180' : ''}`} />
      )}
    </button>
  )
}

function SectionLink({
  item,
  active,
  open,
  onOpen,
}: {
  item: NavItem
  active: boolean
  open: boolean
  onOpen: () => void
}) {
  const Icon = item.icon
  return (
    <Link
      href={item.href}
      aria-expanded={open}
      onClick={(event) => {
        if (!open) {
          event.preventDefault()
          onOpen()
        }
      }}
      className={`flex items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-xs font-semibold transition ${
        active
          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
          : 'border-gray-200 bg-white text-gray-700 hover:border-emerald-200 hover:bg-emerald-50'
      }`}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="min-w-0 flex-1 truncate">{item.label}</span>
      <ChevronDown className={`h-3.5 w-3.5 shrink-0 transition ${open ? 'rotate-180' : ''}`} />
    </Link>
  )
}

function Submenu({ children }: { children: React.ReactNode }) {
  return <div className="ml-4 mt-0.5 space-y-0.5 border-l border-emerald-100 pl-2">{children}</div>
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
      <Icon className={nested ? 'h-3.5 w-3.5 shrink-0' : 'h-4 w-4 shrink-0'} />
      <span className="truncate">{item.label}</span>
    </Link>
  )
}
