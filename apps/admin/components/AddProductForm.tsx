"use client"
import { useEffect, useState } from 'react'
import { Button, Input, Label } from '@mini/ui'

type Category = { id: string; name: string }
type Warehouse = { id: string; name: string; branchId: string }

export function AddProductForm({ onCreated }: { onCreated?: () => void }) {
  const [categories, setCategories] = useState<Category[]>([])
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [form, setForm] = useState({ name: '', sku: '', price: 0, stock: 0, categoryId: '', warehouseId: '' })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch('/api/admin/categories').then((r) => r.json()).then(setCategories)
    fetch('/api/admin/warehouses').then((r) => r.json()).then(setWarehouses)
  }, [])

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm({ ...form, [k]: v })
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const res = await fetch('/api/admin/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, sku: form.sku || undefined, price: Number(form.price), stock: Number(form.stock) }),
    })
    setLoading(false)
    if (res.ok) {
      setForm({ name: '', sku: '', price: 0, stock: 0, categoryId: '', warehouseId: '' })
      onCreated?.()
    } else setError((await res.json()).error || 'Ошибка сохранения')
  }

  return (
    <form className="space-y-2" onSubmit={submit}>
      <div className="space-y-1">
        <Label>Название</Label>
        <Input value={form.name} onChange={(e) => set('name', e.target.value)} />
      </div>
      <div className="space-y-1">
        <Label>SKU (необязательно)</Label>
        <Input value={form.sku} onChange={(e) => set('sku', e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label>Цена (UZS)</Label>
          <Input type="number" value={form.price} onChange={(e) => set('price', Number(e.target.value))} />
        </div>
        <div className="space-y-1">
          <Label>Стартовый остаток</Label>
          <Input type="number" value={form.stock} onChange={(e) => set('stock', Number(e.target.value))} />
        </div>
      </div>
      <div className="space-y-1">
        <Label>Категория</Label>
        <select className="border rounded-md h-9 px-3 w-full" value={form.categoryId} onChange={(e) => set('categoryId', e.target.value)}>
          <option value="">— Выберите категорию —</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1">
        <Label>Склад</Label>
        <select className="border rounded-md h-9 px-3 w-full" value={form.warehouseId} onChange={(e) => set('warehouseId', e.target.value)}>
          <option value="">— Выберите склад —</option>
          {warehouses.map((w) => (
            <option key={w.id} value={w.id}>
              {w.name}
            </option>
          ))}
        </select>
      </div>
      {error && <div className="text-sm text-red-600">{error}</div>}
      <Button type="submit" disabled={loading || !form.categoryId || !form.name || !form.warehouseId}>
        {loading ? 'Сохранение…' : 'Добавить'}
      </Button>
    </form>
  )
}

