'use client'

import { useState, useEffect } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js'
import { X, CreditCard, Lock, AlertCircle, Loader2 } from 'lucide-react'
import { LegalConsentCheckbox } from '@/components/legal-consent-modal'
import { useToast } from '@/components/ui/toast'

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
)

function SetupForm({ onSuccess, onClose }: { onSuccess: () => void; onClose: () => void }) {
  const stripe = useStripe()
  const elements = useElements()
  const [errorMsg, setErrorMsg] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [agreed, setAgreed] = useState(false)
  const [ready, setReady] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (ready) return
    const timer = window.setTimeout(() => {
      setErrorMsg(
        'The secure card form did not finish loading. Refresh this page, or open H8Admin in Chrome or Safari if the boxes stay empty.'
      )
    }, 8000)
    return () => window.clearTimeout(timer)
  }, [ready])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements || !agreed) return

    setSubmitting(true)
    setErrorMsg('')

    const { setupIntent, error } = await stripe.confirmSetup({
      elements,
      redirect: 'if_required',
      confirmParams: {
        return_url: `${window.location.origin}/cards`,
      },
    })

    if (error) {
      setErrorMsg(error.message || 'Payment method verification failed')
      toast(error.message || 'Payment method verification failed', 'error')
      setSubmitting(false)
      return
    }

    if (!setupIntent || setupIntent.status !== 'succeeded' || !setupIntent.payment_method) {
      setErrorMsg('The card was not confirmed. Try again, or complete the bank check if one opens.')
      setSubmitting(false)
      return
    }

    const paymentMethodId =
      typeof setupIntent.payment_method === 'string'
        ? setupIntent.payment_method
        : setupIntent.payment_method.id

    try {
      const res = await fetch('/api/stripe/save-payment-method', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentMethodId }),
      })
      const data = (await res.json()) as { error?: string }
      if (!res.ok) {
        setErrorMsg(data.error || 'Failed to save funding source')
        toast(data.error || 'Failed to save funding source', 'error')
        setSubmitting(false)
        return
      }
      toast('Card linked', 'success')
      onSuccess()
    } catch {
      setErrorMsg('Failed to save funding source')
      toast('Failed to save funding source', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement
        onReady={() => {
          setReady(true)
          setErrorMsg('')
        }}
        onLoadError={(event) => {
          const message = event.error?.message || 'The card form did not load.'
          setErrorMsg(message)
        }}
      />
      <LegalConsentCheckbox agreed={agreed} onChange={setAgreed} />
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
          disabled={!stripe || submitting || !agreed}
          className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm rounded-lg transition disabled:opacity-50"
        >
          {submitting ? (
            <span className="inline-flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Linking card…
            </span>
          ) : (
            'Link Funding Source'
          )}
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
    if (!isOpen) return
    let cancelled = false
    setInitError('')
    setClientSecret('')
    fetch('/api/stripe/create-setup-intent', { method: 'POST' })
      .then(async (res) => {
        const data = await res.json()
        if (!res.ok) {
          throw new Error(data.error || 'Failed to initialize payment vault')
        }
        if (!data.clientSecret) {
          throw new Error('No client secret returned from server')
        }
        return data.clientSecret as string
      })
      .then((secret) => {
        if (!cancelled) setClientSecret(secret)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        const message = err instanceof Error ? err.message : 'Vault connection failed'
        console.error('Error fetching SetupIntent:', message)
        setInitError(message)
      })
    return () => {
      cancelled = true
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
              Card details tokenized by our payment partner
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
          <Elements key={clientSecret} stripe={stripePromise} options={{ clientSecret }}>
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