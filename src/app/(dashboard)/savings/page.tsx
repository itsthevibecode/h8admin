import type { Metadata } from 'next'
import { SavingsHub } from '@/components/savings-hub'
import { ComingSoonWatermark } from '@/components/coming-soon-watermark'

export const metadata: Metadata = {
  title: 'Find cheaper bills | H8Admin',
  description:
    'Benchmark energy, NBN and insurance direct debits against competitive Australian saver plans.',
}

export default function SavingsPage() {
  return (
    <div className="mx-auto max-w-6xl p-8">
      <ComingSoonWatermark
        badge="Feature in Development"
        title="Find cheaper bills"
        subtitle="See where energy, broadband, and insurance direct debits sit against saver-tier plans."
        lockTitle="Bill comparison is under active construction"
        lockBody="The benchmarks are a preview. Live switching and partner referrals are not open yet."
      >
        <SavingsHub />
      </ComingSoonWatermark>
    </div>
  )
}
