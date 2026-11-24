import type { Metadata } from 'next'
import { SettingsPanel } from '@/components/settings-panel'

export const metadata: Metadata = {
  title: 'Settings | H8Admin',
}

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-3xl p-8">
      <SettingsPanel />
    </div>
  )
}
