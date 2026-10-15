'use client'

import { useState } from 'react'
import { X, Users, Copy, Check, Send, AlertCircle } from 'lucide-react'

export function PartnerInviteModal({
  isOpen,
  onClose,
  householdId,
}: {
  isOpen: boolean
  onClose: () => void
  householdId: string
}) {
  const [email, setEmail] = useState('')
  const [inviteUrl, setInviteUrl] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleGenerateInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg('')
    try {
      const res = await fetch('/api/households/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ householdId, email }),
      })

      if (!res.ok) {
        const text = await res.text()
        try {
          const parsed = JSON.parse(text)
          throw new Error(parsed.error || `Server error (${res.status})`)
        } catch {
          throw new Error(
            `Route 404: Restart 'npm run dev' to register new API routes in Next.js.`
          )
        }
      }

      const data = await res.json()
      if (data.inviteUrl) {
        setInviteUrl(data.inviteUrl)
      } else {
        setErrorMsg('Failed to generate invite link')
      }
    } catch (err: unknown) {
      const error = err as Error
      setErrorMsg(error.message || 'An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative space-y-4">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Invite Partner to Household</h3>
            <p className="text-xs text-gray-500">Grant shared access to manage this BSB portfolio</p>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {errorMsg}
          </div>
        )}

        {inviteUrl ? (
          <div className="space-y-3 p-4 bg-emerald-50/60 rounded-xl border border-emerald-100">
            <p className="text-xs font-semibold text-emerald-900">Invite Link Generated!</p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={inviteUrl}
                className="flex-1 text-xs p-2 rounded border border-emerald-200 bg-white font-mono"
              />
              <button
                onClick={handleCopy}
                className="p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded transition"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[11px] text-emerald-700">
              Send this link to your partner. Once opened, they gain full read/write management over this Household BSB.
            </p>
          </div>
        ) : (
          <form onSubmit={handleGenerateInvite} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Partner Email (Optional)
              </label>
              <input
                type="email"
                placeholder="partner@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-gray-300"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              {loading ? 'Generating Link...' : 'Generate Invite Link'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}