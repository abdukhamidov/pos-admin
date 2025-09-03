"use client"
import React from 'react'

export function Separator({ orientation = 'horizontal', className = '' }: { orientation?: 'horizontal' | 'vertical'; className?: string }) {
  return (
    <div
      className={
        (orientation === 'vertical'
          ? 'w-px h-full bg-border mx-1 '
          : 'h-px w-full bg-border my-2 ') + className
      }
      aria-hidden
    />
  )
}

