import type { Metadata } from 'next'
import { House, Percent, RefreshCw } from 'lucide-react'
import { ComingSoonWatermark } from '@/components/coming-soon-watermark'

export const metadata: Metadata = {
  title: 'Find new mortgage | H8Admin',
}

const previews = [
  {
    icon: Percent,
    title: 'Rate watch',
    body: 'Compare the variable and fixed rates on the home loan that this offset is tied to.',
  },
  {
    icon: RefreshCw,
    title: 'Refinance window',
    body: 'See when a switch would keep offset liquidity in place without a missed repayment.',
  },
  {
    icon: House,
    title: 'Offset link',
    body: 'Keep the mortgage repayment on its own billing method, separate from everyday bills.',
  },
]

export default function MortgagesPage() {
  return (
    <div className="mx-auto max-w-6xl p-8">
      <ComingSoonWatermark
        badge="Feature in Development"
        title="Find new mortgage"
        subtitle="Home loan comparison and refinance tracking will live here."
        lockTitle="Mortgage tools are under active construction"
        lockBody="Beta testers can preview rate, refinance, and offset tracking. Live home-loan switching is not open yet."
      >
        <div className="grid gap-3 md:grid-cols-3">
          {previews.map(({ icon: Icon, title, body }) => (
            <article key={title} className="rounded-2xl border border-gray-100 bg-gray-50 p-5">
              <Icon className="h-5 w-5 text-emerald-600" />
              <h3 className="mt-3 text-sm font-bold text-gray-900">{title}</h3>
              <p className="mt-2 text-xs leading-relaxed text-gray-600">{body}</p>
            </article>
          ))}
        </div>
      </ComingSoonWatermark>
    </div>
  )
}
