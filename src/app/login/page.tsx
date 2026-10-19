import { Suspense } from 'react'
import { BrandPanel } from '@/components/auth/brand-panel'
import { AuthFlow } from '@/components/auth/auth-flow'

export default function Page() {
  return (
    <main className="grid min-h-dvh lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <BrandPanel />
      <Suspense fallback={<div className="flex items-center justify-center text-sm text-gray-500">Loading…</div>}>
        <AuthFlow />
      </Suspense>
    </main>
  )
}
