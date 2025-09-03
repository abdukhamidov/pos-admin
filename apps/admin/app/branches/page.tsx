"use client"
import { useEffect, useState } from 'react'
import { Button, Card, CardContent } from '@mini/ui'
import { Modal } from '@/components/Modal'
import { EditBranchForm } from '@/components/EditBranchForm'

type Branch = { id: string; name: string; users?: number; warehouses?: number }

export default function BranchesPage() {
  const [items, setItems] = useState<Branch[]>([])
  const [loading, setLoading] = useState(false)
  const [editBranch, setEditBranch] = useState<Branch | null>(null)

  async function load() {
    setLoading(true)
    const res = await fetch('/api/admin/branches', { cache: 'no-store' })
    setItems(await res.json())
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  async function addBranch() {
    const name = prompt('Название филиала:')?.trim()
    if (!name) return
    const res = await fetch('/api/admin/branches', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) })
    if (res.ok) load(); else alert((await res.json()).error || 'Ошибка')
  }
  function edit(b: Branch) { setEditBranch(b) }
  async function remove(id: string) {
    if (!confirm('Удалить филиал?')) return
    const res = await fetch(`/api/admin/branches/${id}`, { method: 'DELETE' })
    if (res.ok) load(); else alert((await res.json()).error || 'Ошибка')
  }

  return (
    <main className="space-y-6">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-semibold">Филиалы</h1>
        <div className="ml-auto"><Button onClick={addBranch}>Добавить</Button></div>
      </div>
      {loading && <div className="text-sm text-muted-foreground">Загрузка…</div>}
      <div className="space-y-3 max-w-3xl">
        {items.map((b) => (
          <Card key={b.id}>
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <div className="font-semibold">{b.name}</div>
                <div className="text-xs text-muted-foreground">Пользователи: {b.users ?? '-'} • Склады: {b.warehouses ?? '-'}</div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => edit(b)}>Редактировать</Button>
                <Button size="sm" variant="destructive" onClick={() => remove(b.id)}>Удалить</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Modal open={!!editBranch} onClose={() => setEditBranch(null)} title="Редактировать филиал">
        {editBranch && (
          <EditBranchForm branch={editBranch} onSaved={() => { setEditBranch(null); load() }} onCancel={() => setEditBranch(null)} />
        )}
      </Modal>
    </main>
  )
}

