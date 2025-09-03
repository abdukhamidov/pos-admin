"use client"
import React, { createContext, useContext } from 'react'

const Ctx = createContext<{ open: boolean; onOpenChange: (o: boolean) => void } | null>(null)

export function Dialog({ open, onOpenChange, children }: { open: boolean; onOpenChange: (o: boolean) => void; children: React.ReactNode }) {
  return <Ctx.Provider value={{ open, onOpenChange }}>{children}</Ctx.Provider>
}

export function DialogContent({ className = '', children }: { className?: string; children: React.ReactNode }) {
  const ctx = useContext(Ctx)!
  if (!ctx?.open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={() => ctx.onOpenChange(false)} />
      <div className={`relative bg-background rounded-xl shadow-xl w-full mx-4 max-w-lg p-3 sm:p-4 ${className}`}>{children}</div>
    </div>
  )
}

export function DialogHeader({ children }: { children?: React.ReactNode }) {
  return <div className="p-4 border-b">{children}</div>
}
export function DialogTitle({ children }: { children?: React.ReactNode }) {
  return <div className="text-lg font-semibold">{children}</div>
}
export function DialogFooter({ className = '', children }: { className?: string; children?: React.ReactNode }) {
  return <div className={`p-4 border-t flex justify-end gap-2 ${className}`}>{children}</div>
}
