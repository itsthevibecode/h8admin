import { Landmark, ShieldCheck, Sparkles } from 'lucide-react'
import { Logo } from './logo'

const pillars = [
  {
    icon: Landmark,
    title: 'Permanent Financial Address',
    description:
      'Give participating utilities, insurers, telcos, councils and subscriptions one permanent set of payment details, then change how you fund those bills without updating every biller.',
  },
  {
    icon: ShieldCheck,
    title: 'Fewer details shared with billers',
    description:
      'Connect your Australian bank accounts and cards to H8Admin so billers can use your permanent payment details instead of your everyday account numbers wherever the product supports that flow.',
  },
  {
    icon: Sparkles,
    title: 'You stay in control',
    description:
      'Choose preferred funding sources and fallback rules. If a payment cannot be funded, you are notified and the payment is handled according to your rules — H8Admin does not lend money or cover shortfalls.',
  },
]

export function MobileBrandIntro() {
  return (
    <div className="mb-6 space-y-2 lg:hidden">
      <Logo />
      <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
        Personal Financial Autopilot
      </p>
      <h1 className="text-xl font-semibold tracking-tight text-gray-900">
        Your bills. One permanent payment address.
      </h1>
      <p className="text-sm leading-relaxed text-gray-600">
        One permanent set of payment details while you stay in control of where payments come from.
      </p>
    </div>
  )
}

export function BrandPanel() {
  return (
    <section
      aria-label="About H8Admin"
      className="relative hidden flex-col justify-between overflow-y-auto bg-sidebar p-10 text-sidebar-foreground lg:flex lg:h-full xl:p-14"
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
            Your bills. One permanent payment address.
          </h1>
          <p className="text-base leading-relaxed text-pretty text-sidebar-foreground/70">
            H8Admin sits between your billers and your money, giving you one permanent set of payment
            details while you stay in control of where your payments come from.
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
        Card details are tokenized by our payment partners. H8Admin is not a bank, lender or
        overdraft provider.
      </p>
    </section>
  )
}
