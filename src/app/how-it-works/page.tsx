import type { Metadata } from 'next'
import { CalendarClock, CreditCard, Landmark, Route, ShieldCheck, type LucideIcon } from 'lucide-react'
import { PageHeader } from '@/components/page-header'

export const metadata: Metadata = {
  title: 'How it works — H8Admin',
  description: 'How H8Admin receives, routes and tracks your direct debits.',
}

const steps: { icon: LucideIcon; title: string; body: string }[] = [
  {
    icon: Landmark,
    title: 'Get a permanent direct debit address',
    body: 'Each direct debit account (Personal, Joint Household, Investment Property) has its own virtual BSB and account number. It never changes, even when your cards do.',
  },
  {
    icon: ShieldCheck,
    title: 'Give it to your billers once',
    body: 'Hand these details to Water Corp, Synergy, your insurer or anyone else that collects by direct debit. You only set it up once.',
  },
  {
    icon: Route,
    title: 'H8Admin routes every payment',
    body: 'When a biller pulls a payment, H8Admin forwards it to the credit card or bank account you choose. Switch the destination any time without telling the biller.',
  },
  {
    icon: CreditCard,
    title: 'Point bills at a new card',
    body: 'Opened a new card with a points bonus? Route your bills to it. Each card page shows only the direct debits routed to that card.',
  },
  {
    icon: CalendarClock,
    title: 'Watch the bonus clock',
    body: 'H8Admin counts the days until each card’s points bonus expires, so you know when to move your bills to the next card.',
  },
]

export default function HowItWorksPage() {
  return (
    <>
      <PageHeader title="How it works" description="One permanent address for your bills. You choose where each payment goes." />

      <ol className="flex flex-col gap-2">
        {steps.map(({ icon: Icon, title, body }, i) => (
          <li key={title} className="flex gap-4 rounded-xl bg-card p-4 shadow-sm shadow-primary/5">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Icon className="size-4" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium tabular-nums text-muted-foreground">Step {i + 1}</p>
              <h2 className="text-sm font-semibold">{title}</h2>
              <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">{body}</p>
            </div>
          </li>
        ))}
      </ol>
    </>
  )
}
