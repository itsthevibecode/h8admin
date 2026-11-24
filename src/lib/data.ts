export type AccountId = 'personal' | 'joint' | 'property'

export type Account = {
  id: AccountId
  name: string
  description: string
  accountName: string
  bsb: string
  accountNumber: string
}

export type CreditCard = {
  id: string
  name: string
  issuer: string
  last4: string
  bonus: string
  daysLeft: number
  totalDays: number
}

export type Route = { kind: 'card'; id: string } | { kind: 'account'; id: AccountId }

export type Transaction = {
  id: string
  accountId: AccountId
  payee: string
  category: string
  date: string
  amount: number
  status: 'paid' | 'processing'
  routedTo: Route
}

export const accounts: Account[] = [
  {
    id: 'personal',
    name: 'Personal',
    description: 'Everyday bills',
    accountName: 'Alex Morgan',
    bsb: '802-985',
    accountNumber: '4417 2093',
  },
  {
    id: 'joint',
    name: 'Household',
    description: 'Shared expenses & mortgage',
    accountName: 'A & J Morgan',
    bsb: '802-985',
    accountNumber: '4417 5521',
  },
  {
    id: 'property',
    name: 'Investment Property',
    description: '12 Marine Pde, Cottesloe',
    accountName: 'Morgan Property Trust',
    bsb: '802-985',
    accountNumber: '4418 0076',
  },
]

export const creditCards: CreditCard[] = [
  {
    id: 'qantas-amex-ultimate',
    name: 'Qantas Amex Ultimate',
    issuer: 'American Express',
    last4: '1007',
    bonus: '90,000 Qantas Points',
    daysLeft: 45,
    totalDays: 90,
  },
  {
    id: 'velocity-platinum',
    name: 'Velocity Platinum',
    issuer: 'Westpac',
    last4: '4821',
    bonus: '60,000 Velocity Points',
    daysLeft: 22,
    totalDays: 90,
  },
  {
    id: 'qantas-amex-business',
    name: 'Qantas Amex Business',
    issuer: 'American Express',
    last4: '3310',
    bonus: '150,000 Qantas Points',
    daysLeft: 61,
    totalDays: 120,
  },
  {
    id: 'altitude-black',
    name: 'Altitude Black',
    issuer: 'Westpac',
    last4: '9054',
    bonus: '120,000 Altitude Points',
    daysLeft: 74,
    totalDays: 90,
  },
]

export const transactions: Transaction[] = [
  { id: 't1', accountId: 'joint', payee: 'Commonwealth Home Loan', category: 'Mortgage', date: '2026-05-09', amount: 3420, status: 'processing', routedTo: { kind: 'account', id: 'joint' } },
  { id: 't2', accountId: 'personal', payee: 'Water Corp', category: 'Utilities', date: '2026-05-08', amount: 182.4, status: 'processing', routedTo: { kind: 'card', id: 'qantas-amex-ultimate' } },
  { id: 't3', accountId: 'property', payee: 'Water Corp', category: 'Utilities', date: '2026-05-07', amount: 156.3, status: 'paid', routedTo: { kind: 'card', id: 'altitude-black' } },
  { id: 't4', accountId: 'personal', payee: 'Synergy Energy', category: 'Electricity', date: '2026-05-04', amount: 246.9, status: 'paid', routedTo: { kind: 'card', id: 'velocity-platinum' } },
  { id: 't5', accountId: 'joint', payee: 'Synergy Energy', category: 'Electricity', date: '2026-05-04', amount: 312.55, status: 'paid', routedTo: { kind: 'card', id: 'qantas-amex-business' } },
  { id: 't6', accountId: 'property', payee: 'Strata Plus WA', category: 'Strata Levy', date: '2026-05-01', amount: 890, status: 'paid', routedTo: { kind: 'card', id: 'altitude-black' } },
  { id: 't7', accountId: 'joint', payee: 'Water Corp', category: 'Utilities', date: '2026-04-30', amount: 204.1, status: 'paid', routedTo: { kind: 'card', id: 'qantas-amex-business' } },
  { id: 't8', accountId: 'personal', payee: 'Telstra', category: 'Internet & Mobile', date: '2026-04-28', amount: 95, status: 'paid', routedTo: { kind: 'card', id: 'qantas-amex-ultimate' } },
  { id: 't9', accountId: 'property', payee: 'Landlord Insurance Co.', category: 'Insurance', date: '2026-04-25', amount: 74.2, status: 'paid', routedTo: { kind: 'account', id: 'property' } },
  { id: 't10', accountId: 'joint', payee: 'City of Perth', category: 'Council Rates', date: '2026-04-24', amount: 588, status: 'paid', routedTo: { kind: 'card', id: 'qantas-amex-business' } },
  { id: 't11', accountId: 'personal', payee: 'RAC Insurance', category: 'Car Insurance', date: '2026-04-22', amount: 138.75, status: 'paid', routedTo: { kind: 'card', id: 'velocity-platinum' } },
  { id: 't12', accountId: 'personal', payee: 'Synergy Energy', category: 'Electricity', date: '2026-04-04', amount: 231.1, status: 'paid', routedTo: { kind: 'card', id: 'qantas-amex-ultimate' } },
]

export function getAccount(id: string) {
  return accounts.find((a) => a.id === id)
}

export function getCard(id: string) {
  return creditCards.find((c) => c.id === id)
}

export function routeLabel(route: Route) {
  if (route.kind === 'card') {
    const card = getCard(route.id)
    return { label: card ? `${card.name} ··${card.last4}` : 'Card', href: `/credit-cards/${route.id}` }
  }
  return { label: `${getAccount(route.id)?.name ?? 'Account'} (direct)`, href: `/direct-debits/${route.id}` }
}

export function sortByDateDesc(list: Transaction[]) {
  return [...list].sort((a, b) => b.date.localeCompare(a.date))
}

export const currencyPrecise = new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' })
