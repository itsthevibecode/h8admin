import { CreditCard } from 'lucide-react'

export function CardPayBanner() {
  return (
    <div className="flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
      <CreditCard className="mt-0.5 h-5 w-5 shrink-0 text-amber-800" />
      <div className="space-y-1">
        <span className="inline-flex rounded-full border border-amber-200 bg-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-800">
          Coming soon
        </span>
        <p className="text-sm font-bold text-gray-900">One card for these bills</p>
        <p className="text-xs leading-relaxed text-gray-600">
          A permanent virtual card number is on the way for card-accepting billers. Not every biller
          accepts every card network — some may only take direct debit or another method.
        </p>
      </div>
    </div>
  )
}
