import { Suspense } from 'react'
import type { Metadata } from 'next'
import { BrandPanel, MobileBrandIntro } from '@/components/auth/brand-panel'
import { SecondFactorForm } from '@/components/auth/second-factor-form'

export const metadata: Metadata = {
  title: 'Verify sign-in | H8Admin',
}

export default function VerifySignInPage() {
  return (
    <main className="grid min-h-dvh lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <BrandPanel />
      <Suspense fallback={<div className="flex items-center justify-center text-sm text-gray-500">Loading…</div>}>
        <div className="flex items-center justify-center p-6">
          <div className="w-full max-w-md">
            <MobileBrandIntro />
            <SecondFactorForm />
          </div>
        </div>
      </Suspense>
    </main>
  )
}
