"use client"
import { useEffect, useState } from 'react'
import { Button, Card, CardContent } from '@mini/ui'
import { AddCategoryForm } from '@/components/AddCategoryForm'
import { Modal } from '@/components/Modal'
import { EditCategoryForm } from '@/components/EditCategoryForm'

type Category = { id: string; name: string; description?: string | null }

export default function CategoriesPage() {
  const [items, setItems] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [editCategory, setEditCategory] = useState<Category | null>(null)

  async function load() {
    setLoading(true)
    const res = await fetch('/api/admin/categories', { cache: 'no-store' })
    const data = await res.json()
    setItems(data)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function onDelete(id: string) {
    if (!confirm('Удалить категорию?')) return
    const res = await fetch(`/api/admin/categories/${id}`, { method: 'DELETE' })
    if (res.ok) load()
    else alert((await res.json()).error || 'Ошибка удаления')
  }

  function onEdit(cat: Category) { setEditCategory(cat) }

  return (
    <main className="space-y-6">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-semibold">Категории</h1>
        <div className="ml-auto flex items-center gap-2">
          <Button onClick={() => setShowAdd(true)}>Добавить</Button>
        </div>
      </div>
      {loading && <div className="text-sm text-muted-foreground">Загрузка…</div>}
      {(!loading && items.length === 0) && (
        <div className="text-sm text-muted-foreground">Пока что нет категорий</div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-4 max-w-4xl">
        {items.map((c) => (
          <Card key={c.id} className="rounded-xl">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="font-medium">{c.name}</div>
              <div className="ml-auto flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={() => onEdit(c)}>Редактировать</Button>
                <Button size="sm" variant="destructive" onClick={() => onDelete(c.id)}>Удалить</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Добавить категорию">
        <AddCategoryForm onCreated={() => { setShowAdd(false); load() }} />
      </Modal>
      <Modal open={!!editCategory} onClose={() => setEditCategory(null)} title="Редактировать категорию">
        {editCategory && (
          <EditCategoryForm category={editCategory} onSaved={() => { setEditCategory(null); load() }} onCancel={() => setEditCategory(null)} />
        )}
      </Modal>
    </main>
  )
}
