import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Referrals | H8Admin',
}

export default function ReferralsPausedPage() {
  return (
    <div className="mx-auto max-w-lg space-y-2">
      <h1 className="text-2xl font-bold tracking-tight text-gray-900">Referrals</h1>
      <p className="text-sm text-gray-600">
        Referral invites are paused while H8Admin is in private beta. Existing accounts keep their codes for when invites reopen.
      </p>
    </div>
  )
}
