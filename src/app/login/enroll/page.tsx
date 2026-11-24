import { Suspense } from 'react'
import type { Metadata } from 'next'
import { BrandPanel, MobileBrandIntro } from '@/components/auth/brand-panel'
import { EnrollMfaGate } from '@/components/auth/enroll-mfa-gate'

export const metadata: Metadata = {
  title: 'Set up authenticator | H8Admin',
}

export default function EnrollPage() {
  return (
    <main className="grid min-h-dvh lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <BrandPanel />
      <Suspense fallback={<div className="flex items-center justify-center text-sm text-gray-500">Loading…</div>}>
        <div className="flex items-center justify-center p-6">
          <div className="w-full max-w-md">
            <MobileBrandIntro />
            <EnrollMfaGate />
          </div>
        </div>
      </Suspense>
    </main>
  )
}
