'use client'

import { useEffect, useState } from 'react'
import { ChevronUp, Plus, X, Loader2, CheckCircle2, Search } from 'lucide-react'

type SuggestionCategory =
  | 'BILLING'
  | 'REFINANCING'
  | 'POINTS_CHURNING'
  | 'SUBSCRIPTIONS'
  | 'UTILITIES'
  | 'OTHER'

type SuggestionStatus = 'UNDER_REVIEW' | 'IN_FEASIBILITY' | 'PLANNED' | 'COMPLETED'

interface Suggestion {
  id: string
  title: string
  description: string
  category: SuggestionCategory
  status: SuggestionStatus
  createdAt: string
  authorName: string
  upvoteCount: number
  hasUpvoted: boolean
  isOwner: boolean
}

const CATEGORY_OPTIONS: { value: SuggestionCategory; label: string }[] = [
  { value: 'BILLING', label: 'Billing' },
  { value: 'REFINANCING', label: 'Refinancing' },
  { value: 'POINTS_CHURNING', label: 'Points Churning' },
  { value: 'SUBSCRIPTIONS', label: 'Subscriptions' },
  { value: 'UTILITIES', label: 'Utilities' },
  { value: 'OTHER', label: 'Other' },
]

const STATUS_STYLES: Record<SuggestionStatus, string> = {
  UNDER_REVIEW: 'bg-amber-50 text-amber-800',
  IN_FEASIBILITY: 'bg-sky-50 text-sky-800',
  PLANNED: 'bg-violet-50 text-violet-800',
  COMPLETED: 'bg-emerald-50 text-emerald-800',
}

const STATUS_LABELS: Record<SuggestionStatus, string> = {
  UNDER_REVIEW: 'Under Review',
  IN_FEASIBILITY: 'In Feasibility',
  PLANNED: 'Planned',
  COMPLETED: 'Completed',
}

export function FeedbackBoard() {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdding, setIsAdding] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [votingId, setVotingId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState<SuggestionCategory | 'ALL'>('ALL')

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<SuggestionCategory>('BILLING')

  const fetchSuggestions = async () => {
    try {
      const res = await fetch('/api/feedback')
      const data = await res.json()
      if (res.ok) {
        setSuggestions(data.suggestions)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSuggestions()
  }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, category }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Could not submit suggestion')
        return
      }
      setTitle('')
      setDescription('')
      setCategory('BILLING')
      setIsAdding(false)
      await fetchSuggestions()
    } catch (err) {
      console.error(err)
      setError('Could not submit suggestion')
    } finally {
      setSubmitting(false)
    }
  }

  const handleVote = async (suggestionId: string) => {
    setVotingId(suggestionId)
    try {
      const res = await fetch('/api/feedback/upvote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ suggestionId }),
      })
      if (res.ok) {
        await fetchSuggestions()
      }
    } catch (err) {
      console.error(err)
    } finally {
      setVotingId(null)
    }
  }

  const visible =
    filter === 'ALL' ? suggestions : suggestions.filter((item) => item.category === filter)

  return (
    <div className="space-y-8">
      <div className="border-b border-gray-100 pb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Kill My Admin</h1>
          <p className="text-xs text-gray-500">
            Suggest the admin tasks you want autopilot to take over. The community votes on what we
            build next.
          </p>
        </div>
        <button
          onClick={() => setIsAdding((open) => !open)}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition flex items-center gap-2 shadow-sm"
        >
          {isAdding ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {isAdding ? 'Close' : 'New Suggestion'}
        </button>
      </div>

      {isAdding && (
        <form
          onSubmit={handleCreate}
          className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4"
        >
          <h3 className="text-sm font-bold text-gray-900">What admin should we kill?</h3>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Auto-switch electricity when a better plan appears"
            className="w-full text-xs p-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-800"
            required
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the pain, the current workaround, and what a perfect autopilot would do."
            rows={4}
            className="w-full text-xs p-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-800 resize-none"
            required
          />
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as SuggestionCategory)}
              className="text-xs p-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-800"
            >
              {CATEGORY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition disabled:opacity-50"
            >
              {submitting ? 'Submitting…' : 'Submit Suggestion'}
            </button>
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
        </form>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilter('ALL')}
          className={`px-3 py-1.5 rounded-full text-[11px] font-semibold transition ${
            filter === 'ALL' ? 'bg-emerald-600 text-white' : 'bg-white border border-gray-200 text-gray-600'
          }`}
        >
          All
        </button>
        {CATEGORY_OPTIONS.map((option) => (
          <button
            key={option.value}
            onClick={() => setFilter(option.value)}
            className={`px-3 py-1.5 rounded-full text-[11px] font-semibold transition ${
              filter === option.value
                ? 'bg-emerald-600 text-white'
                : 'bg-white border border-gray-200 text-gray-600'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4">
        <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
          Community Roadmap ({visible.length})
        </h3>

        {loading ? (
          <div className="text-center py-8 text-xs text-gray-400 flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading suggestions...
          </div>
        ) : visible.length === 0 ? (
          <div className="text-center py-8 bg-gray-50/50 rounded-xl border border-dashed border-gray-200 space-y-1">
            <Search className="w-5 h-5 text-gray-300 mx-auto" />
            <p className="text-xs text-gray-500 font-medium">No suggestions in this category yet.</p>
            <p className="text-[11px] text-gray-400">Be the first to nominate an admin task to kill.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {visible.map((suggestion) => (
              <div key={suggestion.id} className="py-4 flex gap-4">
                <button
                  onClick={() => handleVote(suggestion.id)}
                  disabled={votingId === suggestion.id}
                  className={`shrink-0 w-14 rounded-xl border flex flex-col items-center justify-center py-2 transition ${
                    suggestion.hasUpvoted
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                      : 'bg-gray-50 border-gray-200 text-gray-500 hover:border-emerald-200'
                  }`}
                >
                  <ChevronUp className="w-4 h-4" />
                  <span className="text-sm font-bold">{suggestion.upvoteCount}</span>
                </button>
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="text-sm font-bold text-gray-900">{suggestion.title}</h4>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${STATUS_STYLES[suggestion.status]}`}
                    >
                      {STATUS_LABELS[suggestion.status]}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-600">
                      {CATEGORY_OPTIONS.find((option) => option.value === suggestion.category)?.label}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed">{suggestion.description}</p>
                  <p className="text-[10px] text-gray-400 flex items-center gap-1">
                    {suggestion.status === 'COMPLETED' && (
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    )}
                    Suggested by {suggestion.authorName} ·{' '}
                    {new Date(suggestion.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
