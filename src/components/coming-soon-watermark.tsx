import Link from 'next/link'
import { Clock } from 'lucide-react'

export function ComingSoonWatermark({
  badge,
  title,
  subtitle,
  lockTitle,
  lockBody,
  returnHref = '/',
  returnLabel = 'Return to Dashboard',
  children,
}: {
  badge: string
  title: string
  subtitle: string
  lockTitle: string
  lockBody: string
  returnHref?: string
  returnLabel?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-6">
      <div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800">
          <Clock className="h-3.5 w-3.5" /> {badge}
        </span>
        <h1 className="mt-3 text-2xl font-bold tracking-tight text-gray-900">{title}</h1>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">{subtitle}</p>
      </div>

      <div className="relative overflow-hidden rounded-3xl border border-gray-100 bg-white p-6 shadow-xs sm:p-8">
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-start bg-slate-900/10 p-6 pt-8 text-center backdrop-blur-[2px] sm:pt-10">
          <div className="max-w-md space-y-3 rounded-2xl border border-emerald-100 bg-white/95 p-6 shadow-xl backdrop-blur-md">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800">
              <Clock className="h-3.5 w-3.5" /> Coming Soon in Q2
            </span>
            <h2 className="text-base font-bold text-gray-900">{lockTitle}</h2>
            <p className="text-xs leading-relaxed text-gray-500">{lockBody}</p>
            <div className="pt-1">
              <Link
                href={returnHref}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-emerald-700"
              >
                {returnLabel}
              </Link>
            </div>
          </div>
        </div>
        <div className="pointer-events-none select-none space-y-6 opacity-60" aria-hidden="true">
          {children}
        </div>
      </div>
    </div>
  )
}
