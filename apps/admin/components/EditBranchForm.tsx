"use client"
import { useState } from 'react'
import { Button, Input, Label } from '@mini/ui'

type Branch = { id: string; name: string }

export function EditBranchForm({ branch, onSaved, onCancel }: { branch: Branch; onSaved?: () => void; onCancel?: () => void }) {
  const [name, setName] = useState(branch.name)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const res = await fetch(`/api/admin/branches/${branch.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) })
    setLoading(false)
    if (res.ok) onSaved?.()
    else setError((await res.json()).error || 'Ошибка сохранения')
  }

  return (
    <form className="space-y-2" onSubmit={submit}>
      <div className="space-y-1"><Label>Название филиала</Label><Input value={name} onChange={e => setName(e.target.value)} /></div>
      {error && <div className="text-sm text-red-600">{error}</div>}
      <div className="flex gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>Отмена</Button>
        <Button type="submit" disabled={loading || !name}>{loading ? 'Сохранение…' : 'Сохранить'}</Button>
      </div>
    </form>
  )
}

