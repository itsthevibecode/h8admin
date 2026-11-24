import { Suspense } from 'react'
import { BrandPanel } from '@/components/auth/brand-panel'
import { AuthFlow } from '@/components/auth/auth-flow'

export default function Page() {
  return (
    <main className="grid min-h-dvh lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <BrandPanel />
      <div className="flex items-center justify-center bg-gray-50 p-6">
        <Suspense fallback={<div className="text-sm text-gray-500">Loading…</div>}>
          <AuthFlow />
        </Suspense>
      </div>
    </main>
  )
}
