import type { Metadata } from 'next'
import { HouseholdManager } from '@/components/household-manager'

export const metadata: Metadata = {
  title: 'Household | H8Admin',
  description: 'Manage the household Virtual BSB, partner invites, and transactions.',
}

export default function DirectDebitHouseholdPage() {
  return <HouseholdManager />
}
