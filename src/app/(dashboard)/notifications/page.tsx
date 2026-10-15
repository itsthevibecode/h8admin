import type { Metadata } from 'next'
import { NotificationsHub } from '@/components/notifications-hub'

export const metadata: Metadata = {
  title: 'Concierge & Notifications | H8Admin',
  description: 'Proactive spend deadlines, bank exclusion alerts, and direct debit tracking.',
}

export default function NotificationsPage() {
  return (
    <div className="p-8 max-w-6xl mx-auto">
      <NotificationsHub />
    </div>
  )
}
