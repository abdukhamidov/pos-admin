"use client"
import { useState } from 'react'
import { Button, Input, Label } from '@mini/ui'

type Category = { id: string; name: string; description?: string | null }

export function EditCategoryForm({ category, onSaved, onCancel }: { category: Category; onSaved?: () => void; onCancel?: () => void }) {
  const [form, setForm] = useState({ name: category.name, description: category.description || '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) { setForm({ ...form, [k]: v }) }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const body: any = {}
    if (form.name !== category.name) body.name = form.name
    if ((form.description || '') !== (category.description || '')) body.description = form.description === '' ? null : form.description
    const res = await fetch(`/api/admin/categories/${category.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    setLoading(false)
    if (res.ok) onSaved?.()
    else setError((await res.json()).error || 'Ошибка сохранения')
  }

  return (
    <form className="space-y-2" onSubmit={submit}>
      <div className="space-y-1"><Label>Название</Label><Input value={form.name} onChange={e => set('name', e.target.value)} /></div>
      <div className="space-y-1"><Label>Описание (необязательно)</Label><Input value={form.description} onChange={e => set('description', e.target.value)} /></div>
      {error && <div className="text-sm text-red-600">{error}</div>}
      <div className="flex gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>Отмена</Button>
        <Button type="submit" disabled={loading || !form.name}>{loading ? 'Сохранение…' : 'Сохранить'}</Button>
      </div>
    </form>
  )
}

