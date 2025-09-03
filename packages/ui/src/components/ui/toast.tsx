"use client"
import * as React from 'react'
import { createPortal } from 'react-dom'
import { cn } from '../../lib/cn'

export type ToastVariant = 'default' | 'success' | 'destructive' | 'warning' | 'info'
export type ToastItem = {
  id: string
  title?: string
  description?: string
  variant?: ToastVariant
  duration?: number
}

type Listener = (t: ToastItem) => void

const listeners = new Set<Listener>()
function notify(t: ToastItem) { listeners.forEach((l) => l(t)) }

function uid() { return Math.random().toString(36).slice(2) }

export const toast = Object.assign(
  (opts: Omit<ToastItem, 'id'>) => notify({ id: uid(), ...opts }),
  {
    success: (opts: Omit<ToastItem, 'id' | 'variant'>) => notify({ id: uid(), variant: 'success', ...opts }),
    error: (opts: Omit<ToastItem, 'id' | 'variant'>) => notify({ id: uid(), variant: 'destructive', ...opts }),
    info: (opts: Omit<ToastItem, 'id' | 'variant'>) => notify({ id: uid(), variant: 'info', ...opts }),
    warning: (opts: Omit<ToastItem, 'id' | 'variant'>) => notify({ id: uid(), variant: 'warning', ...opts }),
  }
)

export function Toaster() {
  const [items, setItems] = React.useState<ToastItem[]>([])
  const [mounted, setMounted] = React.useState(false)

  // Render nothing on the server and on the first client render to avoid
  // hydration mismatches when creating a portal into document.body.
  React.useEffect(() => { setMounted(true) }, [])

  React.useEffect(() => {
    const on = (t: ToastItem) => {
      setItems((xs) => [...xs, t])
      const dur = t.duration ?? 3200
      window.setTimeout(() => dismiss(t.id), dur)
    }
    listeners.add(on)
    return () => { listeners.delete(on) }
  }, [])

  function dismiss(id: string) { setItems((xs) => xs.filter((x) => x.id !== id)) }

  const body = (
    <div className="fixed top-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2">
      {items.map((t) => (
        <div key={t.id} className={cn(
          'rounded-md border p-3 shadow-md bg-background text-foreground animate-in fade-in-0 zoom-in-95',
          t.variant === 'success' && 'border-emerald-300 bg-emerald-50 text-emerald-900',
          t.variant === 'destructive' && 'border-rose-300 bg-rose-50 text-rose-900',
          t.variant === 'warning' && 'border-amber-300 bg-amber-50 text-amber-900',
          t.variant === 'info' && 'border-sky-300 bg-sky-50 text-sky-900'
        )}>
          {t.title && <div className="text-sm font-semibold leading-tight">{t.title}</div>}
          {t.description && <div className="text-sm opacity-90 mt-0.5">{t.description}</div>}
          <button className="absolute right-2 top-2 text-xs opacity-60 hover:opacity-100" onClick={() => dismiss(t.id)}>×</button>
        </div>
      ))}
    </div>
  )

  if (typeof document === 'undefined' || !mounted) return null
  return createPortal(body, document.body)
}
