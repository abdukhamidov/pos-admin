"use client"
import React, { createContext, useContext, useMemo } from 'react'

type Item = { value: string; label: React.ReactNode }
const SelectCtx = createContext<{
  value?: string
  onValueChange?: (v: string) => void
  items: Item[]
} | null>(null)

export function Select({ value, onValueChange, children }: { value?: string; onValueChange?: (v: string) => void; children: React.ReactNode }) {
  const items: Item[] = []
  function walk(node: any) {
    if (!node) return
    if (Array.isArray(node)) return node.forEach(walk)
    if (node.type && node.type.displayName === 'SelectItem') {
      items.push({ value: node.props.value, label: node.props.children })
    }
    if (node.props && node.props.children) walk(node.props.children)
  }
  walk(children)
  const ctx = useMemo(() => ({ value, onValueChange, items }), [value, onValueChange, items.length])
  return <SelectCtx.Provider value={ctx}>{children}</SelectCtx.Provider>
}

export function SelectTrigger({ children, className = '' }: { children?: React.ReactNode; className?: string }) {
  const ctx = useContext(SelectCtx)!
  return (
    <select
      className={`border rounded-md h-9 px-3 w-full ${className}`}
      value={ctx.value}
      onChange={(e) => ctx.onValueChange?.(e.target.value)}
    >
      {ctx.items.map((i) => (
        <option key={i.value} value={i.value}>
          {typeof i.label === 'string' ? i.label : ''}
        </option>
      ))}
    </select>
  )
}

export function SelectValue({ placeholder }: { placeholder?: string }) {
  return <span className="text-sm text-muted-foreground">{placeholder}</span>
}

export function SelectContent({ children }: { children?: React.ReactNode }) {
  return <>{children}</>
}

export function SelectItem({ value, children }: { value: string; children: React.ReactNode }) {
  return <option value={value}>{children}</option>
}
SelectItem.displayName = 'SelectItem'

