import { Landmark, ShieldCheck, Sparkles } from 'lucide-react'
import { Logo } from './logo'

const pillars = [
  {
    icon: Landmark,
    title: 'Permanent Financial Address',
    description:
      'Issue one Virtual BSB (802-985) to your utilities, councils, and telcos once for life.',
  },
  {
    icon: ShieldCheck,
    title: 'Proxy Data Shield',
    description:
      'Keep your real bank accounts and credit cards completely invisible to biller databases. If a utility gets breached, your actual accounts remain untouched.',
  },
  {
    icon: Sparkles,
    title: 'Rewards & Offset Protection',
    description:
      'Route bills to new cards to hit sign-up bonus windows, or maintain uninterrupted offset liquidity during home loan refinancing.',
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

      <div className="relative flex max-w-lg flex-col gap-8">
        <div className="flex flex-col gap-5">
          <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-sidebar-border bg-sidebar-accent px-3 py-1 text-xs font-medium text-sidebar-primary">
            <ShieldCheck className="size-3.5" aria-hidden="true" />
            Personal Financial Autopilot
          </span>
          <h1 className="text-4xl leading-tight font-semibold tracking-tight text-balance xl:text-5xl">
            Never update direct debits with 30+ billers again.
          </h1>
          <p className="text-base leading-relaxed text-pretty text-sidebar-foreground/70">
            H8Admin acts as an intelligent proxy between your utility providers and your money. Switch
            offset accounts or churn rewards cards in one click without missed bills or dishonour fees.
          </p>
        </div>

        <ul className="flex flex-col gap-5">
          {pillars.map(({ icon: Icon, title, description }) => (
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

      <p className="relative text-xs text-sidebar-foreground/55">
        PCI-DSS Level 1 tokenization via Stripe Australia. Zero-depository pass-through.
      </p>
    </section>
  )
}
