"use client"
import { useState } from 'react'
import { Button, Input, Label } from '@mini/ui'

export function AddCategoryForm({ onCreated }: { onCreated?: () => void }) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const res = await fetch('/api/admin/categories', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, description }) })
    setLoading(false)
    if (res.ok) { setName(''); setDescription(''); onCreated?.() } else setError((await res.json()).error || 'Ошибка')
  }
  return (
    <form className="space-y-2" onSubmit={submit}>
      <div className="space-y-1">
        <Label>Название</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="space-y-1">
        <Label>Описание</Label>
        <Input value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>
      {error && <div className="text-sm text-red-600">{error}</div>}
      <Button type="submit" disabled={loading}>{loading ? 'Сохраняю…' : 'Добавить'}</Button>
    </form>
  )
}

