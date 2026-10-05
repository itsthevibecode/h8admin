import { BadgeCheck, Globe2, Lock, ShieldCheck } from 'lucide-react'
import { Logo } from './logo'

const valuePoints = [
  {
    icon: Globe2,
    title: 'One address, for life',
    description: 'Receive payments anywhere with a single identifier that never changes.',
  },
  {
    icon: ShieldCheck,
    title: 'Protected by default',
    description: 'Mandatory two-factor authentication on every account, from day one.',
  },
  {
    icon: Lock,
    title: 'Encrypted end to end',
    description: 'Your data is encrypted in transit and at rest with 256-bit keys.',
  },
]

export function BrandPanel() {
  return (
    <section
      aria-label="About H8Admin"
      className="relative hidden flex-col justify-between overflow-hidden bg-sidebar p-10 text-sidebar-foreground lg:sticky lg:top-0 lg:flex lg:h-dvh xl:p-14"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:linear-gradient(to_right,white_1px,transparent_1px),linear-gradient(to_bottom,white_1px,transparent_1px)] [background-size:44px_44px]"
      />

      <Logo inverted className="relative" />

      <div className="relative flex max-w-md flex-col gap-10">
        <div className="flex flex-col gap-5">
          <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-sidebar-border bg-sidebar-accent px-3 py-1 text-xs font-medium text-sidebar-primary">
            <BadgeCheck className="size-3.5" aria-hidden="true" />
            Trusted by modern finance teams
          </span>
          <h1 className="text-4xl leading-tight font-semibold tracking-tight text-balance xl:text-5xl">
            Your permanent financial address
          </h1>
          <p className="text-base leading-relaxed text-pretty text-sidebar-foreground/70">
            Send, receive, and manage money through one secure identity — built for people and businesses who
            move between banks, borders, and currencies.
          </p>
        </div>

        <div className="rounded-xl border border-sidebar-border bg-sidebar-accent/80 p-4 backdrop-blur">
          <p className="text-xs font-medium tracking-wide text-sidebar-foreground/60 uppercase">Your address</p>
          <div className="mt-2 flex items-center justify-between gap-3">
            <p className="font-mono text-lg text-sidebar-foreground">
              h8.to/<span className="text-sidebar-primary">yourname</span>
            </p>
            <span className="inline-flex items-center gap-1 rounded-md bg-sidebar-primary/15 px-2 py-0.5 text-xs font-medium text-sidebar-primary">
              <span className="size-1.5 rounded-full bg-sidebar-primary" aria-hidden="true" />
              Verified
            </span>
          </div>
        </div>

        <ul className="flex flex-col gap-5">
          {valuePoints.map(({ icon: Icon, title, description }) => (
            <li key={title} className="flex gap-4">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-sidebar-accent text-sidebar-primary">
                <Icon className="size-5" aria-hidden="true" />
              </span>
              <div>
                <p className="font-medium">{title}</p>
                <p className="mt-0.5 text-sm leading-relaxed text-sidebar-foreground/65">{description}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <p className="relative text-xs text-sidebar-foreground/50">
        {'© 2026 H8Admin, Inc. · Privacy · Terms'}
      </p>
    </section>
  )
}
