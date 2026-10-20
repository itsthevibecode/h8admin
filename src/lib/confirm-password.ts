/**
 * Checks the current password with Supabase without replacing the browser session.
 * A successful password grant opens a throwaway session, which is revoked immediately.
 */
export async function confirmCurrentPassword(email: string, password: string): Promise<string | null> {
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const apiKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!baseUrl || !apiKey) return 'Sign-in is not configured.'

  const response = await fetch(`${baseUrl}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: apiKey,
    },
    body: JSON.stringify({ email, password }),
    cache: 'no-store',
  })

  const body = (await response.json().catch(() => null)) as {
    access_token?: string
    error_description?: string
    msg?: string
    error?: string
  } | null

  if (!response.ok) {
    const message = body?.error_description || body?.msg || ''
    if (/invalid login credentials/i.test(message)) return 'Current password is incorrect.'
    return message || 'Current password is incorrect.'
  }

  if (body?.access_token) {
    await fetch(`${baseUrl}/auth/v1/logout?scope=local`, {
      method: 'POST',
      headers: {
        apikey: apiKey,
        Authorization: `Bearer ${body.access_token}`,
      },
    }).catch(() => undefined)
  }

  return null
}
