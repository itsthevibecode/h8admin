'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AUSTRALIAN_BANK_POLICIES } from '@/lib/bank-policies'
import { CardSetupModal } from '@/components/card-setup-modal'
import {
  CreditCard,
  Clock,
  Trash2,
  Plus,
  Building,
  Target,
  CheckCircle2,
  AlertTriangle,
  Edit2,
  X,
} from 'lucide-react'

interface ActiveCard {
  id: string
  brand: string
  last4: string
  nickname?: string | null
  bankGroup?: string | null
  cardName?: string | null
  spendTarget?: number | null
  bonusDeadline?: string | null
  isDefault: boolean
}

interface Lockout {
  id: string
  bankGroup: string
  cardName: string
  nickname?: string | null
  cancelledAt: string
  lockoutMonths: number
  eligibleAgainAt: string
}

export function CreditCardsDashboard({
  activeCards = [],
  lockouts = [],
  onOpenAddModal,
}: {
  activeCards: ActiveCard[]
  lockouts: Lockout[]
  onOpenAddModal?: () => void
}) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [cancellingCardId, setCancellingCardId] = useState<string | null>(null)
  const [editingCard, setEditingCard] = useState<ActiveCard | null>(null)
  const [cancelledDate, setCancelledDate] = useState(
    new Date().toISOString().split('T')[0]
  )
  const [submitting, setSubmitting] = useState(false)

  const [editNickname, setEditNickname] = useState('')
  const [editBankGroup, setEditBankGroup] = useState(AUSTRALIAN_BANK_POLICIES[0].bankGroup)
  const [editCardName, setEditCardName] = useState(AUSTRALIAN_BANK_POLICIES[0].cards[0])
  const [editTarget, setEditTarget] = useState('3000')
  const [editDeadlineDays, setEditDeadlineDays] = useState('90')

  const router = useRouter()

  const handleOpenAddModal = () => {
    if (onOpenAddModal) {
      onOpenAddModal()
      return
    }
    setIsAddModalOpen(true)
  }

  const selectedPolicy = AUSTRALIAN_BANK_POLICIES.find(
    (b) => b.bankGroup === editBankGroup
  )

  const handleCancelCard = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!cancellingCardId) return

    setSubmitting(true)
    try {
      const res = await fetch('/api/cards/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fundingSourceId: cancellingCardId,
          cancelledAtDate: cancelledDate,
        }),
      })

      if (res.ok) {
        setCancellingCardId(null)
        router.refresh()
      } else {
        alert('Failed to cancel card')
      }
    } catch (err) {
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingCard) return

    setSubmitting(true)
    try {
      const res = await fetch('/api/cards', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cardId: editingCard.id,
          nickname: editNickname,
          bankGroup: editBankGroup,
          cardName: editCardName,
          spendTarget: editTarget,
          bonusDeadlineDays: editDeadlineDays,
        }),
      })

      if (res.ok) {
        setEditingCard(null)
        router.refresh()
      }
    } catch (err) {
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  const openEditModal = (card: ActiveCard) => {
    setEditingCard(card)
    setEditNickname(card.nickname || '')
    setEditBankGroup(card.bankGroup || AUSTRALIAN_BANK_POLICIES[0].bankGroup)
    setEditCardName(card.cardName || AUSTRALIAN_BANK_POLICIES[0].cards[0])
    setEditTarget(card.spendTarget ? card.spendTarget.toString() : '3000')
    setEditDeadlineDays('90')
  }

  const getDaysRemaining = (dateStr?: string | null) => {
    if (!dateStr) return null
    const targetDate = new Date(dateStr)
    const now = new Date()
    const diff = Math.ceil((targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    return diff
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center border-b border-gray-100 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Credit Cards & Rewards Hub</h1>
          <p className="text-xs text-gray-500">
            Track active card spend targets and monitor bank exclusion clocks
          </p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
        >
          <Plus className="w-4 h-4" /> Link New Card
        </button>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-emerald-600" />
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
            Active Credit Cards ({activeCards.length})
          </h2>
        </div>

        {activeCards.length === 0 ? (
          <div className="p-8 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200 space-y-2">
            <p className="text-xs font-medium text-gray-600">No active cards linked.</p>
            <button
              onClick={handleOpenAddModal}
              className="text-xs text-emerald-700 underline font-semibold"
            >
              Link a credit card to activate points routing
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeCards.map((card) => {
              const daysLeft = getDaysRemaining(card.bonusDeadline)

              return (
                <div
                  key={card.id}
                  className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-4 relative"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900 text-sm">
                          {card.nickname || card.cardName || `${card.brand} (••${card.last4})`}
                        </span>
                        {card.isDefault && (
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full">
                            DEFAULT
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {card.bankGroup || 'Tokenized Card'} • {card.brand} ••{card.last4}
                      </p>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditModal(card)}
                        className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50 transition"
                        title="Edit Card Details"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setCancellingCardId(card.id)}
                        className="p-1.5 text-red-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition"
                        title="Cancel Card & Start Lockout Timer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 p-3 bg-gray-50 rounded-xl text-xs">
                    <div>
                      <span className="text-[10px] text-gray-400 uppercase font-semibold flex items-center gap-1">
                        <Target className="w-3 h-3 text-emerald-600" /> Target Spend
                      </span>
                      <p className="font-bold text-gray-900 mt-0.5">
                        ${card.spendTarget ? card.spendTarget.toLocaleString() : '3,000'} Goal
                      </p>
                      <p className="text-[10px] text-gray-400">Tracked by user</p>
                    </div>

                    <div>
                      <span className="text-[10px] text-gray-400 uppercase font-semibold flex items-center gap-1">
                        <Clock className="w-3 h-3 text-amber-500" /> Rewards Period
                      </span>
                      {daysLeft !== null ? (
                        <p className="font-bold text-amber-700 mt-0.5">{daysLeft} Days Left</p>
                      ) : (
                        <p className="font-bold text-gray-700 mt-0.5">90 Days Target</p>
                      )}
                      <p className="text-[10px] text-gray-400">Minimum spend window</p>
                    </div>
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      onClick={() => setCancellingCardId(card.id)}
                      className="px-3 py-1.5 bg-red-50 text-red-700 hover:bg-red-100 rounded-lg text-xs font-semibold transition flex items-center gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Cancel Card
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div id="cancelled" className="space-y-4 pt-4 border-t border-gray-100">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-amber-600" />
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
            Cancelled & Expired Cards ({lockouts.length})
          </h2>
        </div>

        {lockouts.length === 0 ? (
          <div className="p-6 text-center bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
            <p className="text-xs text-gray-500 font-medium">No cancelled cards logged yet.</p>
            <p className="text-[11px] text-gray-400">
              When you cancel an active credit card, click &quot;Cancel Card&quot; above to automatically initiate the 12-24 month bank exclusion clock.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {lockouts.map((item) => {
              const eligibleDate = new Date(item.eligibleAgainAt)
              const now = new Date()
              const diffDays = Math.ceil(
                (eligibleDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
              )
              const isEligible = diffDays <= 0

              return (
                <div
                  key={item.id}
                  className={`p-4 border rounded-2xl flex flex-wrap items-center justify-between text-xs gap-3 ${
                    isEligible
                      ? 'bg-emerald-50/60 border-emerald-200'
                      : 'bg-white border-gray-100 shadow-sm'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2.5 rounded-xl ${
                        isEligible
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      <Building className="w-5 h-5" />
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900 text-sm">
                          {item.nickname ? `${item.nickname} (${item.cardName})` : item.cardName}
                        </span>
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-[10px] font-mono rounded">
                          {item.bankGroup}
                        </span>
                      </div>
                      <p className="text-gray-500 text-xs mt-0.5">
                        Cancelled on {new Date(item.cancelledAt).toLocaleDateString()} • Policy:{' '}
                        {item.lockoutMonths} Months
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    {isEligible ? (
                      <span className="flex items-center gap-1 text-emerald-800 font-bold bg-emerald-100 px-3 py-1 rounded-full text-xs">
                        <CheckCircle2 className="w-4 h-4" /> RE-ELIGIBLE NOW
                      </span>
                    ) : (
                      <div>
                        <p className="font-mono font-bold text-amber-700 text-sm">
                          {diffDays} Days Remaining
                        </p>
                        <p className="text-[10px] text-gray-400">
                          Re-eligible on {eligibleDate.toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {editingCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative space-y-4">
            <button
              onClick={() => setEditingCard(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-gray-900">Configure Card Details</h3>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Card Nickname (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Joint Qantas Card"
                  value={editNickname}
                  onChange={(e) => setEditNickname(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-gray-300"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Bank Issuer
                </label>
                <select
                  value={editBankGroup}
                  onChange={(e) => {
                    setEditBankGroup(e.target.value)
                    const pol = AUSTRALIAN_BANK_POLICIES.find((p) => p.bankGroup === e.target.value)
                    if (pol) setEditCardName(pol.cards[0])
                  }}
                  className="w-full text-xs p-2.5 rounded-lg border border-gray-300 bg-white"
                >
                  {AUSTRALIAN_BANK_POLICIES.map((p) => (
                    <option key={p.bankGroup} value={p.bankGroup}>
                      {p.bankGroup} ({p.lockoutMonths}m exclusion)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Select Card Product
                </label>
                <select
                  value={editCardName}
                  onChange={(e) => setEditCardName(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-gray-300 bg-white"
                >
                  {selectedPolicy?.cards.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Spend Target ($ AUD)
                  </label>
                  <input
                    type="number"
                    value={editTarget}
                    onChange={(e) => setEditTarget(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-lg border border-gray-300"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Rewards Period (Days)
                  </label>
                  <input
                    type="number"
                    value={editDeadlineDays}
                    onChange={(e) => setEditDeadlineDays(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-lg border border-gray-300"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition"
              >
                {submitting ? 'Saving...' : 'Save Card Settings'}
              </button>
            </form>
          </div>
        </div>
      )}

      {cancellingCardId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative space-y-4">
            <button
              onClick={() => setCancellingCardId(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 text-red-600">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-base font-bold text-gray-900">Cancel & Lock Out Card</h3>
            </div>

            <p className="text-xs text-gray-600">
              Cancelling this card will move it to your **Cancelled & Expired Cards** section and initiate the exact exclusion clock for future sign-up bonus eligibility.
            </p>

            <form onSubmit={handleCancelCard} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Cancellation Date
                </label>
                <input
                  type="date"
                  value={cancelledDate}
                  onChange={(e) => setCancelledDate(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-gray-300"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-lg transition disabled:opacity-50"
              >
                {submitting ? 'Transferring...' : 'Confirm Cancellation & Start Clock'}
              </button>
            </form>
          </div>
        </div>
      )}

      {!onOpenAddModal && (
        <CardSetupModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSuccess={() => {
            setIsAddModalOpen(false)
            router.refresh()
          }}
        />
      )}
    </div>
  )
}