"use client"
import { useEffect, useState } from 'react'
import { Button, Input, Label } from '@mini/ui'

type Category = { id: string; name: string }
type Product = { id: string; name: string; sku?: string | null; price: number; isActive: boolean; categoryId: string }

export function EditProductForm({ product, onSaved, onCancel }: { product: Product; onSaved?: () => void; onCancel?: () => void }) {
  const [categories, setCategories] = useState<Category[]>([])
  const [form, setForm] = useState({ name: product.name, sku: product.sku || '', price: product.price, isActive: product.isActive, categoryId: product.categoryId })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => { fetch('/api/admin/categories').then(r => r.json()).then(setCategories) }, [])

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) { setForm({ ...form, [k]: v }) }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const body: any = {}
    if (form.name !== product.name) body.name = form.name
    if (form.sku !== (product.sku || '')) body.sku = form.sku === '' ? null : form.sku
    if (form.price !== product.price) body.price = Number(form.price)
    if (form.isActive !== product.isActive) body.isActive = form.isActive
    if (form.categoryId !== product.categoryId) body.categoryId = form.categoryId
    const res = await fetch(`/api/admin/products/${product.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    setLoading(false)
    if (res.ok) onSaved?.()
    else setError((await res.json()).error || 'Ошибка сохранения')
  }

  return (
    <form className="space-y-2" onSubmit={submit}>
      <div className="space-y-1"><Label>Название</Label><Input value={form.name} onChange={e => set('name', e.target.value)} /></div>
      <div className="space-y-1"><Label>SKU (необязательно)</Label><Input value={form.sku} onChange={e => set('sku', e.target.value)} /></div>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1"><Label>Цена (UZS)</Label><Input type="number" value={form.price} onChange={e => set('price', Number(e.target.value))} /></div>
        <div className="space-y-1">
          <Label>Статус</Label>
          <select className="border rounded-md h-9 px-3 w-full" value={form.isActive ? 'active' : 'inactive'} onChange={e => set('isActive', e.target.value === 'active')}>
            <option value="active">Активен</option>
            <option value="inactive">Неактивен</option>
          </select>
        </div>
      </div>
      <div className="space-y-1">
        <Label>Категория</Label>
        <select className="border rounded-md h-9 px-3 w-full" value={form.categoryId} onChange={e => set('categoryId', e.target.value)}>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>
      {error && <div className="text-sm text-red-600">{error}</div>}
      <div className="flex gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>Отмена</Button>
        <Button type="submit" disabled={loading || !form.name || !form.categoryId}>{loading ? 'Сохранение…' : 'Сохранить'}</Button>
      </div>
    </form>
  )
}

