"use client"
import { useEffect, useState } from 'react'
import { Button, Card, CardContent, CardHeader, CardTitle } from '@mini/ui'
import { AddProductForm } from '@/components/AddProductForm'

type Category = { id: string; name: string }
type Product = { id: string; name: string; sku?: string | null; categoryId: string; price: number; stock: number; isActive: boolean; category?: Category }

export function ProductsManager() {
  const [items, setItems] = useState<Product[]>([])
  const [cats, setCats] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const [pr, cr] = await Promise.all([
        fetch('/api/admin/products').then((r) => r.json()),
        fetch('/api/admin/categories').then((r) => r.json()),
      ])
      setItems(pr)
      setCats(cr)
    } catch (e) {
      setError('Не удалось загрузить товары')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function onDelete(id: string) {
    if (!confirm('Удалить товар?')) return
    const res = await fetch(`/api/admin/products/${id}`, { method: 'DELETE' })
    if (res.ok) setItems((xs) => xs.filter((x) => x.id !== id))
    else alert((await res.json()).error || 'Ошибка удаления')
  }

  async function onEdit(p: Product) {
    const name = prompt('Название товара:', p.name)?.trim()
    if (name === undefined) return
    const sku = prompt('SKU (пусто = удалить/не менять):', p.sku || '')
    const priceStr = prompt('Цена (UZS):', String(p.price))
    const stockStr = prompt('Остаток:', String(p.stock))
    const activeStr = prompt('Активен? (y/n):', p.isActive ? 'y' : 'n')
    const catIndexList = cats.map((c, i) => `${i + 1}) ${c.name}`).join('\n')
    const catIdxStr = prompt(`Категория (номер, Enter = без изменений):\n${catIndexList}`, '')

    const body: any = {}
    if (name && name !== p.name) body.name = name
    if (sku !== null) body.sku = sku === '' ? null : sku
    if (priceStr) { const v = Number(priceStr); if (!Number.isNaN(v)) body.price = v }
    if (stockStr) { const v = Number(stockStr); if (!Number.isNaN(v)) body.stock = v }
    if (activeStr) body.isActive = activeStr.toLowerCase().startsWith('y')
    if (catIdxStr) {
      const idx = Number(catIdxStr)
      if (!Number.isNaN(idx) && idx >= 1 && idx <= cats.length) body.categoryId = cats[idx - 1].id
    }
    if (!Object.keys(body).length) return
    const res = await fetch(`/api/admin/products/${p.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
    })
    if (res.ok) load()
    else alert((await res.json()).error || 'Ошибка сохранения')
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card>
        <CardHeader><CardTitle>Добавить товар</CardTitle></CardHeader>
        <CardContent>
          <AddProductForm onCreated={load} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Товары</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {error && <div className="text-sm text-red-600">{error}</div>}
          {loading && <div className="text-sm text-muted-foreground">Загрузка…</div>}
          <div className="grid grid-cols-7 text-sm font-medium border-b pb-2">
            <div>Название</div>
            <div>SKU</div>
            <div>Категория</div>
            <div>Цена</div>
            <div>Остаток</div>
            <div>Статус</div>
            <div className="text-right">Действия</div>
          </div>
          {items.map((p) => (
            <div key={p.id} className="grid grid-cols-7 items-center text-sm border-b py-2 gap-2">
              <div className="truncate">{p.name}</div>
              <div className="truncate">{p.sku || '-'}</div>
              <div className="truncate">{p.category?.name || '-'}</div>
              <div>{p.price}</div>
              <div>{p.stock}</div>
              <div>{p.isActive ? 'Активен' : 'Скрыт'}</div>
              <div className="flex justify-end gap-2">
                <Button size="sm" variant="outline" onClick={() => onEdit(p)}>Редактировать</Button>
                <Button size="sm" variant="destructive" onClick={() => onDelete(p.id)}>Удалить</Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

