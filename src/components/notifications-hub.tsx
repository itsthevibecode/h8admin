'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  Bell,
  CheckCheck,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Loader2,
} from 'lucide-react'

type NotificationType =
  | 'BONUS_DEADLINE'
  | 'BANK_LOCKOUT'
  | 'TRANSACTION_SUCCESS'
  | 'TRANSACTION_FAILED'
  | 'SYSTEM'

type FilterTab = 'ALL' | 'UNREAD' | 'BONUS_DEADLINE' | 'BANK_LOCKOUT'

interface ConciergeNotification {
  id: string
  title: string
  message: string
  type: NotificationType
  isRead: boolean
  link: string | null
  createdAt: string
}

const TYPE_STYLES: Record<
  NotificationType,
  { wrap: string; icon: typeof Clock; label: string }
> = {
  BONUS_DEADLINE: {
    wrap: 'bg-amber-50 text-amber-700',
    icon: Clock,
    label: 'Rewards Deadline',
  },
  BANK_LOCKOUT: {
    wrap: 'bg-emerald-50 text-emerald-700',
    icon: ShieldCheck,
    label: 'Bank Lockout',
  },
  TRANSACTION_SUCCESS: {
    wrap: 'bg-emerald-50 text-emerald-700',
    icon: CheckCircle2,
    label: 'Direct Debit',
  },
  TRANSACTION_FAILED: {
    wrap: 'bg-rose-50 text-rose-700',
    icon: AlertTriangle,
    label: 'Failed Debit',
  },
  SYSTEM: {
    wrap: 'bg-slate-100 text-slate-700',
    icon: Bell,
    label: 'System',
  },
}

function formatRelativeTime(iso: string) {
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return ''
  const diffMs = Date.now() - then
  const minutes = Math.floor(diffMs / 60000)
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export function NotificationsHub() {
  const [notifications, setNotifications] = useState<ConciergeNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState<FilterTab>('ALL')
  const [markingAll, setMarkingAll] = useState(false)

  const loadNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications')
      const data = (await res.json()) as {
        notifications?: ConciergeNotification[]
        unreadCount?: number
        error?: string
      }
      if (!res.ok) {
        setError(data.error || 'Could not load notifications')
        return
      }
      setNotifications(data.notifications ?? [])
      setUnreadCount(data.unreadCount ?? 0)
      setError('')
    } catch {
      setError('Could not load notifications')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadNotifications()
  }, [loadNotifications])

  const markRead = async (notificationId: string) => {
    setNotifications((current) =>
      current.map((item) => (item.id === notificationId ? { ...item, isRead: true } : item))
    )
    setUnreadCount((count) => Math.max(0, count - 1))

    try {
      const res = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId }),
      })
      if (!res.ok) {
        await loadNotifications()
      }
    } catch {
      await loadNotifications()
    }
  }

  const markAllRead = async () => {
    if (unreadCount === 0) return
    setMarkingAll(true)
    setNotifications((current) => current.map((item) => ({ ...item, isRead: true })))
    setUnreadCount(0)
    try {
      const res = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAllRead: true }),
      })
      if (!res.ok) {
        await loadNotifications()
      }
    } catch {
      await loadNotifications()
    } finally {
      setMarkingAll(false)
    }
  }

  const visible = useMemo(() => {
    return notifications.filter((item) => {
      if (filter === 'UNREAD') return !item.isRead
      if (filter === 'BONUS_DEADLINE' || filter === 'BANK_LOCKOUT') return item.type === filter
      return true
    })
  }, [notifications, filter])

  const tabs: { id: FilterTab; label: string }[] = [
    { id: 'ALL', label: 'All Alerts' },
    { id: 'UNREAD', label: 'Unread' },
    { id: 'BONUS_DEADLINE', label: 'Rewards Deadlines' },
    { id: 'BANK_LOCKOUT', label: 'Bank Lockouts' },
  ]

  return (
    <div className="space-y-8">
      <div className="border-b border-gray-100 pb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Concierge Alerts & Notifications</h1>
          <p className="text-xs text-gray-500">
            Automated alerts for bonus deadlines, bank lockout expirations, and direct debit receipts.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-bold">
              {unreadCount} new
            </span>
          )}
          <button
            onClick={markAllRead}
            disabled={unreadCount === 0 || markingAll}
            className="px-4 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold text-xs rounded-xl transition flex items-center gap-2 disabled:opacity-50"
          >
            <CheckCheck className="w-4 h-4" />
            Mark all as read
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            className={`px-3 py-1.5 rounded-full text-[11px] font-semibold transition ${
              filter === tab.id
                ? 'bg-emerald-600 text-white'
                : 'bg-white border border-gray-200 text-gray-600'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-2">
        {loading ? (
          <div className="text-center py-10 text-xs text-gray-400 flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" /> Scanning spend windows and lockouts...
          </div>
        ) : error ? (
          <p className="text-xs text-red-600">{error}</p>
        ) : visible.length === 0 ? (
          <div className="text-center py-10 bg-gray-50/50 rounded-xl border border-dashed border-gray-200 space-y-2">
            <Bell className="w-6 h-6 text-gray-300 mx-auto" />
            <p className="text-sm font-bold text-gray-900">You are all caught up</p>
            <p className="text-[11px] text-gray-400">No alerts match this filter right now.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {visible.map((item) => {
              const meta = TYPE_STYLES[item.type]
              const Icon = meta.icon
              return (
                <div
                  key={item.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    if (!item.isRead) void markRead(item.id)
                  }}
                  onKeyDown={(event) => {
                    if ((event.key === 'Enter' || event.key === ' ') && !item.isRead) {
                      event.preventDefault()
                      void markRead(item.id)
                    }
                  }}
                  className="w-full text-left py-4 flex gap-4 hover:bg-gray-50/80 px-2 rounded-xl transition cursor-pointer"
                >
                  <div
                    className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${meta.wrap}`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {!item.isRead && (
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      )}
                      <h3 className="text-sm font-bold text-gray-900">{item.title}</h3>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                        {meta.label}
                      </span>
                      <span className="text-[10px] text-gray-400 ml-auto">
                        {formatRelativeTime(item.createdAt)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed">{item.message}</p>
                    {item.link && (
                      <Link
                        href={item.link}
                        onClick={(event) => event.stopPropagation()}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:text-emerald-800 pt-1"
                      >
                        View Details
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
