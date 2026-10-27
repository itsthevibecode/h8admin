'use client'

import Link from 'next/link'
import { Clock, Copy, Droplets, Mail, Wifi, Zap } from 'lucide-react'

const extracts = [
  {
    icon: Zap,
    title: 'Energy & Gas',
    body: 'Extracts kWh volumes, daily supply charges, and solar feed-in tariffs.',
  },
  {
    icon: Droplets,
    title: 'Water & Council',
    body: 'Reads quarterly kilolitres (kL) and regional infrastructure charges.',
  },
  {
    icon: Wifi,
    title: 'Telco & NBN',
    body: 'Tracks evening speed tiers and mobile data pools against wholesale rates.',
  },
]

const guides = [
  {
    label: 'Gmail',
    steps:
      'Settings > Forwarding and POP/IMAP > Add a forwarding address, then filter mail from your energy, water, and telco billers.',
  },
  {
    label: 'Apple Mail',
    steps: 'Settings > Rules > If the sender contains "bill", forward the message to your ingestion address.',
  },
  {
    label: 'Outlook',
    steps: 'Settings > Mail > Rules > Forward messages with attachments from your billers.',
  },
]

export function BillForwardingHub({
  forwardingEmail,
  userEmail,
}: {
  forwardingEmail: string
  userEmail: string
}) {
  return (
    <div className="space-y-6">
      <div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800">
          <Clock className="h-3.5 w-3.5" /> Feature in Development
        </span>
        <h1 className="mt-3 text-2xl font-bold tracking-tight text-gray-900">
          Automated Bill Ingestion & Usage Analytics
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">
          Auto-forward your recurring utility and service invoices to extract consumption units, peak
          tariff rates, and plan breakdowns.
        </p>
      </div>

      <div className="relative overflow-hidden rounded-3xl border border-gray-100 bg-white p-6 shadow-xs sm:p-8">
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-start bg-slate-900/10 p-6 pt-8 text-center backdrop-blur-[2px] sm:pt-10">
          <div className="max-w-md space-y-3 rounded-2xl border border-emerald-100 bg-white/95 p-6 shadow-xl backdrop-blur-md">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800">
              <Clock className="h-3.5 w-3.5" /> Coming Soon in Q2
            </span>
            <h2 className="text-base font-bold text-gray-900">
              Email Ingestion Pipeline Under Active Construction
            </h2>
            <p className="text-xs leading-relaxed text-gray-500">
              We are finalizing our automated PDF tariff and unit parser. Beta testers will receive an
              invitation once the inbound ingestion address is open for live forwarding.
            </p>
            <div className="pt-1">
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-emerald-700"
              >
                Return to Dashboard
              </Link>
            </div>
          </div>
        </div>

        <div className="pointer-events-none select-none space-y-8 opacity-60" aria-hidden="true">
          <section className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Ingestion address
            </p>
            <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center">
              <p className="flex-1 break-all rounded-full border border-gray-200 bg-white px-4 py-3 font-mono text-sm text-gray-900">
                {forwardingEmail}
              </p>
              <span className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-xs font-bold text-white">
                <Copy className="h-4 w-4" /> Copy Address
              </span>
            </div>
            <p className="mt-3 text-xs text-gray-600">
              Inbound PDFs for {userEmail} would be read for electricity, gas, and council rates. The
              address is not open yet.
            </p>
          </section>

          <section>
            <h2 className="text-sm font-bold text-gray-900">Line-item extraction</h2>
            <div className="mt-3 grid gap-3 md:grid-cols-3">
              {extracts.map(({ icon: Icon, title, body }) => (
                <article key={title} className="rounded-2xl border border-gray-100 bg-white p-5">
                  <Icon className="h-5 w-5 text-emerald-600" />
                  <h3 className="mt-3 text-sm font-bold text-gray-900">{title}</h3>
                  <p className="mt-2 text-xs leading-relaxed text-gray-600">{body}</p>
                </article>
              ))}
            </div>
          </section>

          <section>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-emerald-600" />
              <h2 className="text-sm font-bold text-gray-900">Auto-forwarding setup</h2>
            </div>
            <div className="mt-3 grid gap-3 md:grid-cols-3">
              {guides.map((guide) => (
                <article key={guide.label} className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                  <h3 className="text-sm font-bold text-gray-900">{guide.label}</h3>
                  <p className="mt-2 text-xs leading-relaxed text-gray-600">{guide.steps}</p>
                </article>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
