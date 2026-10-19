export interface MonthBucket {
  key: string
  label: string
  totalCents: number
}

export interface BillerStat {
  billerName: string
  totalCents: number
  months: { key: string; amountCents: number }[]
}

export interface BillerStats {
  months: MonthBucket[]
  billers: BillerStat[]
  totalCents: number
}

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function sydneyYearMonth(date: Date) {
  const parts = new Intl.DateTimeFormat('en-AU', {
    timeZone: 'Australia/Sydney',
    year: 'numeric',
    month: 'numeric',
  }).formatToParts(date)
  const year = Number(parts.find((part) => part.type === 'year')?.value)
  const month = Number(parts.find((part) => part.type === 'month')?.value)
  return { year, month }
}

function shiftMonth(year: number, month: number, delta: number) {
  const index = year * 12 + (month - 1) + delta
  return { year: Math.floor(index / 12), month: (index % 12) + 1 }
}

function monthKey(year: number, month: number) {
  return `${year}-${String(month).padStart(2, '0')}`
}

export function buildBillerStats(
  transactions: { billerName: string; amountCents: number; createdAt: Date }[],
  now = new Date()
): BillerStats {
  const current = sydneyYearMonth(now)
  const months: MonthBucket[] = []
  for (let offset = 5; offset >= 0; offset -= 1) {
    const { year, month } = shiftMonth(current.year, current.month, -offset)
    months.push({ key: monthKey(year, month), label: MONTH_LABELS[month - 1], totalCents: 0 })
  }
  const monthIndex = new Map(months.map((month, index) => [month.key, index]))
  const byBiller = new Map<string, BillerStat>()

  for (const tx of transactions) {
    const created = sydneyYearMonth(tx.createdAt)
    const key = monthKey(created.year, created.month)
    const index = monthIndex.get(key)
    if (index === undefined) continue
    months[index].totalCents += tx.amountCents
    const existing = byBiller.get(tx.billerName) ?? {
      billerName: tx.billerName,
      totalCents: 0,
      months: months.map((month) => ({ key: month.key, amountCents: 0 })),
    }
    existing.totalCents += tx.amountCents
    existing.months[index].amountCents += tx.amountCents
    byBiller.set(tx.billerName, existing)
  }

  const billers = Array.from(byBiller.values()).sort((a, b) => b.totalCents - a.totalCents)
  const totalCents = months.reduce((sum, month) => sum + month.totalCents, 0)
  return { months, billers, totalCents }
}
