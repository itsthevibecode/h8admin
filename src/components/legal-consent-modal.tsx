'use client'

import { ShieldCheck } from 'lucide-react'

export function LegalConsentCheckbox({
  agreed,
  onChange,
}: {
  agreed: boolean
  onChange: (agreed: boolean) => void
}) {
  return (
    <label className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
      <input
        type="checkbox"
        checked={agreed}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-0.5 h-4 w-4 shrink-0 accent-emerald-600"
      />
      <span className="leading-relaxed">
        <span className="inline-flex items-center gap-1 font-semibold text-slate-900">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-700" />
          Direct debit authority
        </span>
        <span className="mt-1 block">
          I agree to the{' '}
          <a
            href="/legal/direct-debit-request-agreement"
            target="_blank"
            rel="noreferrer"
            className="font-semibold text-emerald-800 underline"
          >
            DDR Service Agreement
          </a>{' '}
          and the{' '}
          <a
            href="/legal/terms-and-conditions"
            target="_blank"
            rel="noreferrer"
            className="font-semibold text-emerald-800 underline"
          >
            Terms and Conditions
          </a>{' '}
          before this payment method is linked.
        </span>
      </span>
    </label>
  )
}
