"use client"
import React from 'react'

export function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center p-4" onClick={onClose}>
      <div className="bg-background rounded-xl shadow-xl w-full max-w-lg mt-20" onClick={(e) => e.stopPropagation()}>
        <div className="p-4 border-b text-lg font-semibold">{title}</div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  )
}

