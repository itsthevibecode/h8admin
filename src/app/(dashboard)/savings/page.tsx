import type { Metadata } from 'next'
import { SavingsHub } from '@/components/savings-hub'

export const metadata: Metadata = {
  title: 'Switch & Save | H8Admin',
  description:
    'Benchmark energy, NBN and insurance direct debits against competitive Australian saver plans.',
}

export default function SavingsPage() {
  return (
    <div className="p-8 max-w-6xl mx-auto">
      <SavingsHub />
    </div>
  )
}
