'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Building2, CreditCard, HelpCircle, Home, LayoutDashboard, ShieldCheck, User, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { accounts, creditCards, type AccountId } from '@/lib/data'

const accountIcons: Record<AccountId, LucideIcon> = {
  personal: User,
  joint: Home,
  property: Building2,
}

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2">
      <div className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <ShieldCheck className="size-4" aria-hidden="true" />
      </div>
      <span className="text-base font-semibold tracking-tight">H8Admin</span>
    </Link>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="px-3 pb-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{children}</p>
}

function NavLink({
  href,
  icon: Icon,
  label,
  sub,
  active,
}: {
  href: string
  icon: LucideIcon
  label: string
  sub?: string
  active: boolean
}) {
  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
        active ? 'bg-sidebar-accent font-medium text-sidebar-accent-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
      )}
    >
      <Icon className={cn('size-4 shrink-0', active && 'text-primary')} aria-hidden="true" />
      <span className="flex min-w-0 flex-col">
        <span className="truncate">{label}</span>
        {sub && <span className="truncate text-xs font-normal text-muted-foreground">{sub}</span>}
      </span>
    </Link>
  )
}

function useNavItems() {
  const pathname = usePathname()
  return {
    pathname,
    accountLinks: accounts.map((a) => ({
      href: `/direct-debits/${a.id}`,
      icon: accountIcons[a.id],
      label: a.name,
      sub: `${a.bsb} · ${a.accountNumber}`,
    })),
    cardLinks: creditCards.map((c) => ({
      href: `/credit-cards/${c.id}`,
      icon: CreditCard,
      label: c.name,
      sub: `${c.issuer} ··${c.last4}`,
    })),
  }
}

function Sidebar() {
  const { pathname, accountLinks, cardLinks } = useNavItems()

  return (
    <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col gap-5 overflow-y-auto bg-sidebar px-3 py-5 lg:flex">
      <div className="px-3">
        <Logo />
      </div>

      <div className="flex items-center gap-3 rounded-xl bg-muted px-3 py-2.5">
        <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
          AM
        </div>
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-sm font-medium">Alex Morgan</span>
          <span className="truncate text-xs text-muted-foreground">alex.morgan@h8admin.au</span>
        </div>
      </div>

      <nav aria-label="Main" className="flex flex-col gap-5">
        <div className="flex flex-col gap-0.5">
          <NavLink href="/" icon={LayoutDashboard} label="Dashboard" active={pathname === '/'} />
          <NavLink href="/how-it-works" icon={HelpCircle} label="How it works" active={pathname === '/how-it-works'} />
        </div>

        <div className="flex flex-col gap-0.5">
          <SectionLabel>Direct Debits</SectionLabel>
          {accountLinks.map((l) => (
            <NavLink key={l.href} {...l} active={pathname === l.href} />
          ))}
        </div>

        <div className="flex flex-col gap-0.5">
          <SectionLabel>Credit Cards</SectionLabel>
          {cardLinks.map((l) => (
            <NavLink key={l.href} {...l} active={pathname === l.href} />
          ))}
        </div>
      </nav>
    </aside>
  )
}

function MobileNav() {
  const { pathname, accountLinks, cardLinks } = useNavItems()
  const items = [
    { href: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/how-it-works', icon: HelpCircle, label: 'How it works' },
    ...accountLinks,
    ...cardLinks,
  ]

  return (
    <div className="flex flex-col gap-3 px-4 pt-4 lg:hidden">
      <div className="flex items-center justify-between">
        <Logo />
        <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
          AM
        </div>
      </div>
      <nav aria-label="Main" className="-mx-4 overflow-x-auto px-4">
        <div className="flex w-max gap-2 pb-1">
          {items.map(({ href, icon: Icon, label }) => {
            const active = pathname === href
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition-colors',
                  active ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground hover:text-foreground',
                )}
              >
                <Icon className="size-3.5" aria-hidden="true" />
                {label}
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh bg-background">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <MobileNav />
        <main className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 py-5 sm:px-6 lg:px-8 lg:py-6">{children}</main>
      </div>
    </div>
  )
}
