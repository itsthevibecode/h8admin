import type { Metadata } from 'next'
import { HouseholdManager } from '@/components/household-manager'

export const metadata: Metadata = {
  title: 'Joint Household | H8Admin',
  description:
    'Manage your joint household Virtual BSB, partner invites, and privacy boundaries.',
}

export default function HouseholdPage() {
  return <HouseholdManager />
}
