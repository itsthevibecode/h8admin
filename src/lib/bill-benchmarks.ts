export type SavingsCategory = 'ENERGY' | 'TELCO' | 'INSURANCE'

export interface BillTransaction {
  billerName: string
  amountCents: number
  createdAt: Date | string
}

export interface CategoryBenchmark {
  category: SavingsCategory
  label: string
  matcher: RegExp
  medianMonthlyDollars: number
  saverMonthlyDollars: number
  planFeatures: string[]
  ctaHref: string
}

export interface SavingsOpportunity {
  category: SavingsCategory
  label: string
  detected: boolean
  matchedBillers: string[]
  currentMonthlyDollars: number
  medianMonthlyDollars: number
  saverMonthlyDollars: number
  monthlySavingsDollars: number
  annualSavingsDollars: number
  planFeatures: string[]
  ctaLabel: string
  ctaHref: string
}

export interface BenchmarkBaseline {
  category: SavingsCategory
  label: string
  medianMonthlyDollars: number
  saverMonthlyDollars: number
  planFeatures: string[]
  ctaHref: string
}

export interface SavingsAnalysis {
  totalAnnualSavingsDollars: number
  totalMonthlySavingsDollars: number
  monitoredCategoriesCount: number
  hasSufficientData: boolean
  opportunities: SavingsOpportunity[]
  benchmarkBaselines: BenchmarkBaseline[]
}

export const BILL_BENCHMARKS: CategoryBenchmark[] = [
  {
    category: 'ENERGY',
    label: 'Energy',
    matcher:
      /\b(synergy|agl|origin|energyaustralia|energy australia|alinta|powershop|red energy)\b/i,
    medianMonthlyDollars: 165,
    saverMonthlyDollars: 125,
    planFeatures: ['No lock-in contract', 'Single-rate metro tariff', 'Solar feed-in friendly'],
    ctaHref: 'https://www.energymadeeasy.gov.au/',
  },
  {
    category: 'TELCO',
    label: 'Telco / NBN',
    matcher:
      /\b(telstra|optus|tpg|aussie broadband|superloop|vodafone|belong|dodo)\b/i,
    medianMonthlyDollars: 95,
    saverMonthlyDollars: 70,
    planFeatures: ['Unlimited data', 'NBN 50 / 100 typical', 'No modem lock-in'],
    ctaHref: 'https://www.finder.com.au/broadband-plans',
  },
  {
    category: 'INSURANCE',
    label: 'Insurance',
    matcher: /\b(aami|nrma|rac|bupa|medibank|allianz|youi|hbf|qbe)\b/i,
    medianMonthlyDollars: 195,
    saverMonthlyDollars: 155,
    planFeatures: ['Comprehensive cover', 'No-claim bonus retained', 'Annual or monthly billing'],
    ctaHref: 'https://www.finder.com.au/car-insurance',
  },
]

const QUARTERLY_ENERGY_THRESHOLD_DOLLARS = 250
const CTA_LABEL = 'Switch & Save via Partner'

function roundDollars(value: number) {
  return Math.round(value * 100) / 100
}

function toMonthlyDollars(amountCents: number, category: SavingsCategory) {
  const dollars = amountCents / 100
  if (category === 'ENERGY' && dollars > QUARTERLY_ENERGY_THRESHOLD_DOLLARS) {
    return dollars / 3
  }
  return dollars
}

function estimateCurrentMonthly(
  transactions: BillTransaction[],
  category: SavingsCategory
) {
  const byBiller = new Map<string, number[]>()
  for (const tx of transactions) {
    const monthly = toMonthlyDollars(tx.amountCents, category)
    const existing = byBiller.get(tx.billerName) ?? []
    existing.push(monthly)
    byBiller.set(tx.billerName, existing)
  }

  let total = 0
  for (const amounts of byBiller.values()) {
    const avg = amounts.reduce((sum, value) => sum + value, 0) / amounts.length
    total += avg
  }
  return total
}

export function analyzeUserSavings(transactions: BillTransaction[]): SavingsAnalysis {
  const opportunities = BILL_BENCHMARKS.map((benchmark) => {
    const matched = transactions.filter((tx) => benchmark.matcher.test(tx.billerName))
    const detected = matched.length > 0
    const currentMonthlyDollars = detected
      ? estimateCurrentMonthly(matched, benchmark.category)
      : benchmark.medianMonthlyDollars
    const monthlySavingsDollars = Math.max(
      0,
      currentMonthlyDollars - benchmark.saverMonthlyDollars
    )

    return {
      category: benchmark.category,
      label: benchmark.label,
      detected,
      matchedBillers: [...new Set(matched.map((tx) => tx.billerName))],
      currentMonthlyDollars: roundDollars(currentMonthlyDollars),
      medianMonthlyDollars: benchmark.medianMonthlyDollars,
      saverMonthlyDollars: benchmark.saverMonthlyDollars,
      monthlySavingsDollars: roundDollars(monthlySavingsDollars),
      annualSavingsDollars: roundDollars(monthlySavingsDollars * 12),
      planFeatures: benchmark.planFeatures,
      ctaLabel: CTA_LABEL,
      ctaHref: benchmark.ctaHref,
    } satisfies SavingsOpportunity
  })

  const detected = opportunities.filter((opportunity) => opportunity.detected)
  const hasSufficientData = detected.length > 0
  const savingsSource = hasSufficientData ? detected : []

  const totalMonthlySavingsDollars = roundDollars(
    savingsSource.reduce((sum, opportunity) => sum + opportunity.monthlySavingsDollars, 0)
  )

  return {
    totalAnnualSavingsDollars: roundDollars(totalMonthlySavingsDollars * 12),
    totalMonthlySavingsDollars,
    monitoredCategoriesCount: detected.length,
    hasSufficientData,
    opportunities,
    benchmarkBaselines: BILL_BENCHMARKS.map((benchmark) => ({
      category: benchmark.category,
      label: benchmark.label,
      medianMonthlyDollars: benchmark.medianMonthlyDollars,
      saverMonthlyDollars: benchmark.saverMonthlyDollars,
      planFeatures: benchmark.planFeatures,
      ctaHref: benchmark.ctaHref,
    })),
  }
}
