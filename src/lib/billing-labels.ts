export function investmentLabel(name: string | null | undefined, index: number, total: number) {
  const trimmed = name?.trim()
  if (trimmed) return trimmed
  if (total > 1) return `Investment property ${index + 1}`
  return 'Investment property'
}
