"use client"
import { useEffect, useState } from 'react'
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label } from '@mini/ui'
import { AddCategoryForm } from '@/components/AddCategoryForm'

type Category = { id: string; name: string; description?: string | null; productCount?: number }

export function CategoriesManager() {
  const [items, setItems] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/categories', { cache: 'no-store' })
      const data = await res.json()
      setItems(data)
    } catch (e) {
      setError('Не удалось загрузить категории')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function onDelete(id: string) {
    if (!confirm('Удалить категорию?')) return
    const res = await fetch(`/api/admin/categories/${id}`, { method: 'DELETE' })
    if (res.ok) setItems((xs) => xs.filter((x) => x.id !== id))
    else alert((await res.json()).error || 'Ошибка удаления')
  }

  async function onEdit(cat: Category) {
    const name = prompt('Название категории:', cat.name)?.trim()
    if (name === undefined) return
    const description = prompt('Описание (пусто = удалить):', cat.description || '')
    const body: any = {}
    if (name && name !== cat.name) body.name = name
    if (description !== null) body.description = description === '' ? null : description
    if (!Object.keys(body).length) return
    const res = await fetch(`/api/admin/categories/${cat.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
    })
    if (res.ok) load()
    else alert((await res.json()).error || 'Ошибка сохранения')
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card>
        <CardHeader><CardTitle>Добавить категорию</CardTitle></CardHeader>
        <CardContent>
          <AddCategoryForm onCreated={load} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Категории</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {error && <div className="text-sm text-red-600">{error}</div>}
          {loading && <div className="text-sm text-muted-foreground">Загрузка…</div>}
          <div className="grid grid-cols-4 text-sm font-medium border-b pb-2">
            <div>Название</div>
            <div>Описание</div>
            <div>Товаров</div>
            <div className="text-right">Действия</div>
          </div>
          {items.map((c) => (
            <div key={c.id} className="grid grid-cols-4 items-center text-sm border-b py-2 gap-2">
              <div className="truncate">{c.name}</div>
              <div className="truncate">{c.description || '-'}</div>
              <div>{c.productCount ?? '-'}</div>
              <div className="flex justify-end gap-2">
                <Button size="sm" variant="outline" onClick={() => onEdit(c)}>Редактировать</Button>
                <Button size="sm" variant="destructive" onClick={() => onDelete(c.id)}>Удалить</Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

