'use client'

import { useState, useEffect } from 'react'
import { CreditCard, CheckCircle2, XCircle } from 'lucide-react'

interface Transaction {
  id: string
  billerName: string
  amountCents: number
  status: 'SUCCESS' | 'DECLINED' | 'FAILED'
  createdAt: string
  fundingSource: {
    brand: string
    last4: string
  } | null
}

function FormattedTime({ dateString }: { dateString: string }) {
  const [formatted, setFormatted] = useState('')

  useEffect(() => {
    setFormatted(
      new Date(dateString).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })
    )
  }, [dateString])

  return <span suppressHydrationWarning>{formatted || '...'}</span>
}

export function TransactionsList({ transactions }: { transactions: Transaction[] }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4">
      <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
        Recent Pass-Through Activity
      </h3>

      {transactions.length === 0 ? (
        <div className="text-center py-6 bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
          <p className="text-xs text-gray-500 font-medium">No direct debit activity recorded yet.</p>
          <p className="text-[11px] text-gray-400">
            Use the simulator above to trigger a test bill pass-through.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {transactions.map((tx) => (
            <div key={tx.id} className="py-3 flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                {tx.status === 'SUCCESS' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-600 shrink-0" />
                )}
                <div>
                  <p className="font-bold text-gray-900">{tx.billerName}</p>
                  <p className="text-[11px] text-gray-500 flex items-center gap-1">
                    Charged to <CreditCard className="w-3 h-3 text-emerald-600 inline" />{' '}
                    {tx.fundingSource
                      ? `${tx.fundingSource.brand} (••${tx.fundingSource.last4})`
                      : 'no linked card'}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <p className="font-mono font-bold text-gray-900">
                  ${(tx.amountCents / 100).toFixed(2)}
                </p>
                <p className="text-[10px] text-gray-400">
                  <FormattedTime dateString={tx.createdAt} />
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}