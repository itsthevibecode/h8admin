const NAME_PATTERN = /^[\p{L}][\p{L}\p{M}'’.\- ]{0,39}$/u

export function cleanNamePart(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim().replace(/\s+/g, ' ')
  if (!NAME_PATTERN.test(trimmed)) return null
  return trimmed
}

export function legalName(person: {
  firstName?: string | null
  lastName?: string | null
}): string | undefined {
  const first = person.firstName?.trim() ?? ''
  const last = person.lastName?.trim() ?? ''
  if (!first || !last) return undefined
  return `${first} ${last}`
}
