"use client"
import { useEffect, useState } from 'react'
import { Button, Input, Label } from '@mini/ui'

type Branch = { id: string; name: string }
type Warehouse = { id: string; name: string; branchId: string; isDefault: boolean }

export function EditWarehouseForm({ warehouse, onSaved, onCancel }: { warehouse: Warehouse; onSaved?: () => void; onCancel?: () => void }) {
  const [branches, setBranches] = useState<Branch[]>([])
  const [form, setForm] = useState({ name: warehouse.name, branchId: warehouse.branchId, isDefault: warehouse.isDefault })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => { fetch('/api/admin/branches').then(r => r.json()).then(setBranches) }, [])

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) { setForm({ ...form, [k]: v }) }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const body: any = {}
    if (form.name !== warehouse.name) body.name = form.name
    if (form.isDefault !== warehouse.isDefault) body.isDefault = form.isDefault
    if (form.branchId !== warehouse.branchId) body.branchId = form.branchId
    const res = await fetch(`/api/admin/warehouses/${warehouse.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    setLoading(false)
    if (res.ok) onSaved?.()
    else setError((await res.json()).error || 'Ошибка сохранения')
  }

  return (
    <form className="space-y-2" onSubmit={submit}>
      <div className="space-y-1"><Label>Название склада</Label><Input value={form.name} onChange={e => set('name', e.target.value)} /></div>
      <div className="space-y-1">
        <Label>Филиал</Label>
        <select className="border rounded-md h-9 px-3 w-full" value={form.branchId} onChange={e => set('branchId', e.target.value)}>
          {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
      </div>
      <div className="space-y-1">
        <Label>Статус</Label>
        <select className="border rounded-md h-9 px-3 w-full" value={form.isDefault ? 'default' : 'normal'} onChange={e => set('isDefault', e.target.value === 'default')}>
          <option value="normal">Обычный</option>
          <option value="default">По умолчанию (в филиале)</option>
        </select>
      </div>
      {error && <div className="text-sm text-red-600">{error}</div>}
      <div className="flex gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>Отмена</Button>
        <Button type="submit" disabled={loading || !form.name}>{loading ? 'Сохранение…' : 'Сохранить'}</Button>
      </div>
    </form>
  )
}
