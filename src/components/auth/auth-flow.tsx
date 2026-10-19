'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { getSafeCallbackUrl } from '@/lib/auth-redirect'

export function AuthFlow() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signup')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [loading, setLoading] = useState(false)
  
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = getSafeCallbackUrl(searchParams.get('callbackUrl'))
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')
    setLoading(true)

    if (mode === 'signup') {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      })

      if (error) {
        setErrorMsg(error.message)
      } else if (data.user) {
        router.push(callbackUrl)
        router.refresh()
      }
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setErrorMsg(error.message)
      } else if (data.user) {
        router.push(callbackUrl)
        router.refresh()
      }
    }

    setLoading(false)
  }

  return (
    <div className="w-full max-w-md p-8 bg-white rounded-xl shadow-md border border-gray-100">
      <div className="flex border-b mb-6">
        <button
          type="button"
          className={`flex-1 py-2 font-medium text-sm text-center ${
            mode === 'signup'
              ? 'border-b-2 border-emerald-600 text-emerald-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => {
            setMode('signup')
            setErrorMsg('')
          }}
        >
          Sign Up
        </button>
        <button
          type="button"
          className={`flex-1 py-2 font-medium text-sm text-center ${
            mode === 'signin'
              ? 'border-b-2 border-emerald-600 text-emerald-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => {
            setMode('signin')
            setErrorMsg('')
          }}
        >
          Log In
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
            Email
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
            Password
          </label>
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
            placeholder="At least 6 characters"
          />
        </div>

        {errorMsg && (
          <div className="p-3 text-xs text-red-600 bg-red-50 rounded-md border border-red-200">
            {errorMsg}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm rounded-md transition duration-150 ease-in-out disabled:opacity-50"
        >
          {loading
            ? 'Processing...'
            : mode === 'signup'
            ? 'Create Account'
            : 'Log In'}
        </button>
      </form>
    </div>
  )
}