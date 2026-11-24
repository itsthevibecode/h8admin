const BILLING_NAME = /^[\p{L}\p{N} '&.,/?!@#$%^*()_+=:;|[\]{}~`\\"\-]+$/u

export function cleanBillingName(value: unknown) {
  if (value === null) return null
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim().replace(/\s+/g, ' ')
  if (!trimmed) return null
  if (trimmed.length > 40 || !BILLING_NAME.test(trimmed)) return undefined
  return trimmed
}
