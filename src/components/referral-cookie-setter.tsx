'use client'

import { useEffect } from 'react'

export function ReferralCookieSetter({ code }: { code: string }) {
  useEffect(() => {
    if (!code) return
    const maxAge = 60 * 60 * 24 * 30
    document.cookie = `referral_code=${encodeURIComponent(code)}; path=/; max-age=${maxAge}; samesite=lax`
  }, [code])

  return null
}
