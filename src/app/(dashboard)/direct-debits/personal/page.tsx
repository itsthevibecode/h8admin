import type { Metadata } from 'next'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { ShieldCheck } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { AccountNameEditor } from '@/components/editable-name'
import { CardPayBanner } from '@/components/card-pay-banner'
import { ActivatePersonal } from '@/components/activate-personal'

export const metadata: Metadata = {
  title: 'Personal billing method | H8Admin',
  description: 'Activate a Virtual BSB for your personal bills.',
}

export default async function PersonalDirectDebitPage() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
      },
    }
  )
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const account = user
    ? await prisma.virtualAccount.findFirst({
        where: { userId: user.id, accountType: 'INDIVIDUAL' },
        orderBy: { createdAt: 'asc' },
      })
    : null

  const transactions = account
    ? await prisma.transaction.findMany({
        where: { virtualAccountId: account.id },
        orderBy: { createdAt: 'desc' },
        take: 12,
        select: {
          id: true,
          billerName: true,
          amountCents: true,
          status: true,
          createdAt: true,
        },
      })
    : []

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-8">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-700">Billing</p>
        {account ? (
          <AccountNameEditor accountId={account.id} name={account.displayName} fallback="Personal" />
        ) : (
          <h1 className="text-2xl font-bold text-gray-900">Personal</h1>
        )}
        <p className="mt-1 text-sm text-gray-500">
          {account
            ? 'Give this BSB to billers that should stay in your name.'
            : 'Activate this method when you are ready to issue a personal Virtual BSB.'}
        </p>
      </div>

      <CardPayBanner />

      {!account ? (
        <ActivatePersonal />
      ) : (
        <>
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-900 to-emerald-950 p-6 text-white shadow-xl">
            <ShieldCheck className="absolute right-6 top-6 h-16 w-16 text-white/10" />
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-300">
              Personal Virtual BSB
            </p>
            <div className="mt-6 grid gap-6 sm:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-wider text-emerald-200/70">BSB</p>
                <p className="font-mono text-2xl font-bold tracking-widest">{account.bsb}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-emerald-200/70">Account</p>
                <p className="font-mono text-2xl font-bold tracking-widest">{account.accountNumber}</p>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
            <h2 className="border-b border-gray-100 px-5 py-4 text-sm font-bold text-gray-900">
              Debits on this address
            </h2>
            {transactions.length === 0 ? (
              <p className="px-5 py-8 text-sm text-gray-500">No billers have debited this address yet.</p>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="px-5 py-2.5 font-semibold">Biller</th>
                    <th className="px-5 py-2.5 font-semibold">Amount</th>
                    <th className="px-5 py-2.5 font-semibold">Status</th>
                    <th className="px-5 py-2.5 font-semibold">When</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="border-t border-gray-50">
                      <td className="px-5 py-3 font-semibold text-gray-900">{tx.billerName}</td>
                      <td className="px-5 py-3 font-mono">
                        {(tx.amountCents / 100).toLocaleString('en-AU', {
                          style: 'currency',
                          currency: 'AUD',
                        })}
                      </td>
                      <td className="px-5 py-3">{tx.status}</td>
                      <td className="px-5 py-3 text-gray-500">
                        {tx.createdAt.toLocaleDateString('en-AU', { timeZone: 'Australia/Sydney' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  )
}
