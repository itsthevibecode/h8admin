import type { Metadata } from 'next'
import { BillingHub } from '@/components/billing-hub'

export const metadata: Metadata = {
  title: 'Billing & Plans | H8Admin',
  description:
    'Track monthly routing volume, the $5 base fee, rollover ledger offsets, and Stripe invoices.',
}

export default function BillingPage() {
  return (
    <div className="p-8 max-w-6xl mx-auto">
      <BillingHub />
    </div>
  )
}
