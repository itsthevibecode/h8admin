import Link from 'next/link'
import { ShieldCheck } from 'lucide-react'
import { LEGAL_DOCUMENTS } from '@/lib/legal-content'

export function LegalFooter() {
  return (
    <footer className="border-t border-slate-200 bg-slate-50 text-slate-700">
      <div className="mx-auto max-w-6xl space-y-5 px-6 py-8">
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-950">
          <p className="font-bold uppercase tracking-wide text-[10px] text-amber-800">
            ASIC general advice warning
          </p>
          <p className="mt-1">
            H8Admin Pty Ltd is not an Australian financial services licence holder. Benchmarks,
            savings figures, and product comparisons are general information and illustrative
            only. They do not take account of your objectives, financial situation, or needs.
          </p>
        </div>

        <nav className="flex flex-wrap gap-x-4 gap-y-2 text-xs font-semibold">
          {LEGAL_DOCUMENTS.map((document) => (
            <Link
              key={document.slug}
              href={`/legal/${document.slug}`}
              className="text-emerald-800 hover:text-emerald-950 hover:underline"
            >
              {document.navLabel}
            </Link>
          ))}
        </nav>

        <div className="flex flex-col gap-2 border-t border-slate-200 pt-4 text-[11px] text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 H8Admin Pty Ltd. Registered in Western Australia.</p>
          <p className="inline-flex items-center gap-1.5 text-emerald-800">
            <ShieldCheck className="h-3.5 w-3.5" />
            Bank data vaulted via PCI-DSS Level 1 tokenization infrastructure.
          </p>
        </div>
      </div>
    </footer>
  )
}
