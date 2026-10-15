'use client'

import { useState, useEffect } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js'
import { X, CreditCard, Lock, AlertCircle } from 'lucide-react'

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
)

function SetupForm({ onSuccess, onClose }: { onSuccess: () => void; onClose: () => void }) {
  const stripe = useStripe()
  const elements = useElements()
  const [errorMsg, setErrorMsg] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements) return

    setSubmitting(true)
    setErrorMsg('')

    const { setupIntent, error } = await stripe.confirmSetup({
      elements,
      redirect: 'if_required',
    })

    if (error) {
      setErrorMsg(error.message || 'Payment method verification failed')
      setSubmitting(false)
      return
    }

    if (setupIntent && setupIntent.payment_method) {
      const pmId =
        typeof setupIntent.payment_method === 'string'
          ? setupIntent.payment_method
          : setupIntent.payment_method.id

      const res = await fetch('/api/cards/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentMethodId: pmId }),
      })

      if (res.ok) {
        onSuccess()
      } else {
        const data = await res.json()
        setErrorMsg(data.error || 'Failed to save funding source')
      }
    }

    setSubmitting(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      {errorMsg && (
        <div className="p-3 text-xs text-red-600 bg-red-50 rounded-md border border-red-200">
          {errorMsg}
        </div>
      )}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium text-sm rounded-lg transition"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!stripe || submitting}
          className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm rounded-lg transition disabled:opacity-50"
        >
          {submitting ? 'Tokenizing...' : 'Link Funding Source'}
        </button>
      </div>
    </form>
  )
}

export function CardSetupModal({
  isOpen,
  onClose,
  onSuccess,
}: {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}) {
  const [clientSecret, setClientSecret] = useState('')
  const [initError, setInitError] = useState('')

  useEffect(() => {
    if (isOpen) {
      setInitError('')
      setClientSecret('')
      fetch('/api/stripe/create-setup-intent', { method: 'POST' })
        .then(async (res) => {
          const data = await res.json()
          if (!res.ok) {
            throw new Error(data.error || 'Failed to initialize payment vault')
          }
          if (data.clientSecret) {
            setClientSecret(data.clientSecret)
          } else {
            throw new Error('No client secret returned from server')
          }
        })
        .catch((err) => {
          console.error('Error fetching SetupIntent:', err)
          setInitError(err.message || 'Vault connection failed')
        })
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative space-y-4 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 z-10"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Link Funding Source</h3>
            <p className="text-xs text-gray-500">
              Zero-knowledge tokenization powered by Stripe
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 p-3 bg-emerald-50/60 rounded-lg text-xs text-emerald-800 border border-emerald-100">
          <Lock className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            Raw card numbers are vaulted by Stripe and never stored on H8Admin servers.
          </span>
        </div>

        {initError ? (
          <div className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-200 text-xs space-y-2">
            <div className="flex items-center gap-2 font-semibold text-sm">
              <AlertCircle className="w-4 h-4" /> Vault Initialization Error
            </div>
            <p>{initError}</p>
            <p className="text-gray-500">
              Check your terminal logs and ensure your Stripe keys in <code className="bg-red-100 px-1 rounded">.env</code> are valid test keys.
            </p>
          </div>
        ) : clientSecret ? (
          <Elements stripe={stripePromise} options={{ clientSecret }}>
            <SetupForm onSuccess={onSuccess} onClose={onClose} />
          </Elements>
        ) : (
          <div className="py-8 text-center text-sm text-gray-500">
            Initializing secure vault...
          </div>
        )}
      </div>
    </div>
  )
}