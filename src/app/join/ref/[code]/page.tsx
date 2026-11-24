import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Private beta | H8Admin',
}

export default function PausedReferralPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-gray-50 px-6">
      <div className="max-w-md rounded-xl border border-gray-100 bg-white p-8 shadow-sm">
        <h1 className="text-lg font-bold text-gray-900">Referrals are paused</h1>
        <p className="mt-2 text-sm text-gray-600">
          H8Admin is in a private beta. New accounts are opened from the tester list, so referral links are not accepting sign-ups right now.
        </p>
      </div>
    </main>
  )
}
