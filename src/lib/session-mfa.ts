import type { SupabaseClient, User } from '@supabase/supabase-js'

export function hasVerifiedFactor(user: User): boolean {
  return Boolean(user.factors?.some((factor) => factor.status === 'verified'))
}

export async function sessionNeedsSecondFactor(
  supabase: SupabaseClient,
  user: User
): Promise<boolean> {
  if (!hasVerifiedFactor(user)) return false
  const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
  if (error || !data) return true
  return data.currentLevel !== 'aal2'
}
