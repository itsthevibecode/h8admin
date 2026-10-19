'use client'

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react'
import { AlertCircle, CheckCircle2, Info } from 'lucide-react'

type ToastTone = 'success' | 'error' | 'info'

interface ToastItem {
  id: number
  message: string
  tone: ToastTone
}

interface ToastContextValue {
  toast: (message: string, tone?: ToastTone) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const ICONS = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
} as const

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const nextId = useRef(0)

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((item) => item.id !== id))
  }, [])

  const toast = useCallback(
    (message: string, tone: ToastTone = 'success') => {
      const id = nextId.current
      nextId.current += 1
      setToasts((current) => [...current, { id, message, tone }])
      window.setTimeout(() => dismiss(id), 3500)
    },
    [dismiss]
  )

  const value = useMemo(() => ({ toast }), [toast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed bottom-20 right-4 z-50 flex max-w-sm flex-col gap-2 md:bottom-6 md:right-6"
      >
        {toasts.map((item) => {
          const Icon = ICONS[item.tone]
          return (
            <div
              key={item.id}
              className="pointer-events-auto flex items-center gap-2.5 rounded-xl bg-emerald-950/90 px-4 py-3 text-sm text-white shadow-lg backdrop-blur"
            >
              <Icon className="h-4 w-4 shrink-0 text-emerald-300" />
              <span>{item.message}</span>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within ToastProvider')
  }
  return context
}
