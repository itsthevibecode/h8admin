export type SavingsCategory = 'ENERGY' | 'BROADBAND' | 'INSURANCE'

export interface BillTransaction {
  billerName: string
  amountCents: number
  createdAt: Date | string
}

export interface BillBenchmark {
  category: SavingsCategory
  label: string
  providers: string[]
  averageMonthlyDollars: number
  saverMonthlyDollars: number
  typicalCycleMonths: number
  ctaLabel: string
  ctaHref: string
}

export interface SavingsOpportunity {
  category: SavingsCategory
  label: string
  providers: string[]
  matchedBillers: string[]
  detected: boolean
  currentMonthlyDollars: number
  averageMarketMonthlyDollars: number
  benchmarkMonthlyDollars: number
  monthlySavingsDollars: number
  annualSavingsDollars: number
  ctaLabel: string
  ctaHref: string
}

export interface SavingsAnalysis {
  totalAnnualSavingsDollars: number
  detectedCategories: SavingsCategory[]
  opportunities: SavingsOpportunity[]
}

export const BILL_BENCHMARKS: BillBenchmark[] = [
  {
    category: 'ENERGY',
    label: 'Energy',
    providers: ['Synergy', 'AGL', 'Origin', 'EnergyAustralia'],
    averageMonthlyDollars: 126,
    saverMonthlyDollars: 95,
    typicalCycleMonths: 3,
    ctaLabel: 'Switch & Save',
    ctaHref: 'https://www.energymadeeasy.gov.au/',
  },
  {
    category: 'BROADBAND',
    label: 'Broadband / Telco',
    providers: ['Telstra', 'Optus', 'TPG', 'Aussie Broadband'],
    averageMonthlyDollars: 95,
    saverMonthlyDollars: 70,
    typicalCycleMonths: 1,
    ctaLabel: 'View Cheaper Providers',
    ctaHref: 'https://www.finder.com.au/broadband-plans',
  },
  {
    category: 'INSURANCE',
    label: 'Insurance',
    providers: ['AAMI', 'NRMA', 'RAC', 'Bupa', 'Medibank'],
    averageMonthlyDollars: 180,
    saverMonthlyDollars: 145,
    typicalCycleMonths: 1,
    ctaLabel: 'Compare Rates',
    ctaHref: 'https://www.finder.com.au/health-insurance',
  },
]

function normalizeName(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
}

function matchesProvider(billerName: string, provider: string) {
  const biller = ` ${normalizeName(billerName)} `
  const needle = ` ${normalizeName(provider)} `
  return biller.includes(needle)
}

function roundDollars(value: number) {
  return Math.round(value * 100) / 100
}

function estimateMonthlySpend(
  transactions: BillTransaction[],
  typicalCycleMonths: number
) {
  if (transactions.length === 0) return 0

  const totalDollars = transactions.reduce((sum, tx) => sum + tx.amountCents, 0) / 100
  const times = transactions.map((tx) => new Date(tx.createdAt).getTime())
  const earliest = Math.min(...times)
  const latest = Math.max(...times, Date.now())
  const observedMonths = Math.max(
    typicalCycleMonths,
    (latest - earliest) / (1000 * 60 * 60 * 24 * 30.44)
  )

  return totalDollars / observedMonths
}

export function analyzeUserSavings(transactions: BillTransaction[]): SavingsAnalysis {
  const opportunities = BILL_BENCHMARKS.map((benchmark) => {
    const matched = transactions.filter((tx) =>
      benchmark.providers.some((provider) => matchesProvider(tx.billerName, provider))
    )
    const detected = matched.length > 0
    const matchedBillers = [...new Set(matched.map((tx) => tx.billerName))]
    const currentMonthlyDollars = detected
      ? estimateMonthlySpend(matched, benchmark.typicalCycleMonths)
      : benchmark.averageMonthlyDollars
    const monthlySavingsDollars = Math.max(
      0,
      currentMonthlyDollars - benchmark.saverMonthlyDollars
    )

    return {
      category: benchmark.category,
      label: benchmark.label,
      providers: benchmark.providers,
      matchedBillers,
      detected,
      currentMonthlyDollars: roundDollars(currentMonthlyDollars),
      averageMarketMonthlyDollars: benchmark.averageMonthlyDollars,
      benchmarkMonthlyDollars: benchmark.saverMonthlyDollars,
      monthlySavingsDollars: roundDollars(monthlySavingsDollars),
      annualSavingsDollars: roundDollars(monthlySavingsDollars * 12),
      ctaLabel: benchmark.ctaLabel,
      ctaHref: benchmark.ctaHref,
    } satisfies SavingsOpportunity
  })

  const detectedCategories = opportunities
    .filter((opportunity) => opportunity.detected)
    .map((opportunity) => opportunity.category)

  const savingsSource =
    detectedCategories.length > 0
      ? opportunities.filter((opportunity) => opportunity.detected)
      : opportunities

  const totalAnnualSavingsDollars = roundDollars(
    savingsSource.reduce((sum, opportunity) => sum + opportunity.annualSavingsDollars, 0)
  )

  return {
    totalAnnualSavingsDollars,
    detectedCategories,
    opportunities,
  }
}
